// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TaskManager
 * @dev Pure on-chain task execution protocol for Arc Agent Hub
 * @notice All task interactions are immutable and transparent on the blockchain
 */
contract TaskManager is ReentrancyGuard, Ownable {
    // ============ ENUM & STRUCTS ============

    enum TaskStatus {
        Pending,      // 0: Task created, awaiting worker
        Processing,   // 1: Worker processing task
        Validated,    // 2: Validator has reviewed result
        Completed,    // 3: Task fully settled, funds distributed
        Failed        // 4: Task failed or cancelled
    }

    struct Task {
        bytes32 id;                    // Unique task identifier
        address creator;               // User who created the task
        string input;                  // Task input/prompt
        uint256 budget;                // Total USDC budget
        uint256 totalSpent;            // Total USDC spent (worker + validator)
        string result;                 // Final result from worker
        uint8 validationScore;         // Validation score (0-100)
        TaskStatus status;             // Current task status
        uint256 createdAt;             // Block timestamp when created
        uint256 completedAt;           // Block timestamp when completed
        string taskType;               // Type: summarize, keywords, rewrite, etc.
        string metadata;               // Additional metadata (JSON)
    }

    // ============ STATE VARIABLES ============

    IERC20 public usdcToken;
    address public orchestrator;
    uint256 public orchestratorMargin = 5; // 5% of spent amount

    uint256 private taskCounter = 0;

    // Mappings for task storage
    mapping(bytes32 => Task) public tasks;
    mapping(address => bytes32[]) public userTasks;
    mapping(bytes32 => address) public taskWorkers;
    mapping(bytes32 => address) public taskValidators;

    // Earnings tracking
    mapping(address => uint256) public workerEarnings;
    mapping(address => uint256) public validatorEarnings;
    mapping(address => uint256) public orchestratorEarnings;

    // ============ EVENTS ============

    event TaskCreated(
        bytes32 indexed taskId,
        address indexed creator,
        uint256 budget,
        string taskType
    );

    event WorkerResultSubmitted(
        bytes32 indexed taskId,
        address indexed worker,
        uint256 workerPayment
    );

    event ValidationSubmitted(
        bytes32 indexed taskId,
        address indexed validator,
        uint8 score,
        uint256 validatorPayment
    );

    event TaskSettled(
        bytes32 indexed taskId,
        uint256 orchestratorEarning,
        uint256 refundedToCreator
    );

    event EarningsWithdrawn(
        address indexed agent,
        uint256 amount
    );

    // ============ CONSTRUCTOR ============

    constructor(address _usdcToken, address _orchestrator) Ownable(msg.sender) {
        usdcToken = IERC20(_usdcToken);
        orchestrator = _orchestrator;
    }

    // ============ TASK CREATION ============

    /**
     * @dev Create a new task and transfer USDC from user to contract escrow
     * @param _input Task input/prompt
     * @param _budget Budget in USDC (6 decimals)
     * @param _taskType Type of task (summarize, keywords, rewrite, etc.)
     * @param _metadata Additional metadata as JSON string
     * @return taskId The unique identifier of the created task
     */
    function createTask(
        string memory _input,
        uint256 _budget,
        string memory _taskType,
        string memory _metadata
    ) external nonReentrant returns (bytes32) {
        require(_budget > 0, "Budget must be greater than zero");
        require(bytes(_input).length > 0, "Input cannot be empty");
        require(bytes(_taskType).length > 0, "Task type cannot be empty");

        // Transfer USDC from user to contract (escrow)
        require(
            usdcToken.transferFrom(msg.sender, address(this), _budget),
            "USDC transfer failed"
        );

        // Generate unique task ID
        bytes32 taskId = keccak256(
            abi.encodePacked(msg.sender, block.timestamp, taskCounter)
        );
        taskCounter++;

        // Create task struct
        Task storage newTask = tasks[taskId];
        newTask.id = taskId;
        newTask.creator = msg.sender;
        newTask.input = _input;
        newTask.budget = _budget;
        newTask.totalSpent = 0;
        newTask.result = "";
        newTask.validationScore = 0;
        newTask.status = TaskStatus.Pending;
        newTask.createdAt = block.timestamp;
        newTask.completedAt = 0;
        newTask.taskType = _taskType;
        newTask.metadata = _metadata;

        // Track user's tasks
        userTasks[msg.sender].push(taskId);

        emit TaskCreated(taskId, msg.sender, _budget, _taskType);
        return taskId;
    }

    // ============ WORKER EXECUTION ============

    /**
     * @dev Worker submits result for a task
     * @param _taskId Task identifier
     * @param _result The result/output from worker processing
     * @param _workerPayment Payment for worker in USDC
     */
    function submitWorkerResult(
        bytes32 _taskId,
        string memory _result,
        uint256 _workerPayment
    ) external nonReentrant {
        Task storage task = tasks[_taskId];
        require(task.creator != address(0), "Task does not exist");
        require(task.status == TaskStatus.Pending, "Task not in pending state");
        require(bytes(_result).length > 0, "Result cannot be empty");
        require(_workerPayment > 0, "Payment must be greater than zero");
        require(
            task.totalSpent + _workerPayment <= task.budget,
            "Payment exceeds budget"
        );

        // Record worker and result
        taskWorkers[_taskId] = msg.sender;
        task.result = _result;
        task.status = TaskStatus.Processing;
        task.totalSpent += _workerPayment;

        // Track worker earnings (paid upon settlement)
        workerEarnings[msg.sender] += _workerPayment;

        emit WorkerResultSubmitted(_taskId, msg.sender, _workerPayment);
    }

    // ============ VALIDATION ============

    /**
     * @dev Validator submits validation score and payment
     * @param _taskId Task identifier
     * @param _score Validation score (0-100)
     * @param _validatorPayment Payment for validator in USDC
     */
    function submitValidation(
        bytes32 _taskId,
        uint8 _score,
        uint256 _validatorPayment
    ) external nonReentrant {
        Task storage task = tasks[_taskId];
        require(task.creator != address(0), "Task does not exist");
        require(task.status == TaskStatus.Processing, "Task not in processing state");
        require(_score <= 100, "Score must be between 0 and 100");
        require(_validatorPayment > 0, "Payment must be greater than zero");
        require(
            task.totalSpent + _validatorPayment <= task.budget,
            "Payment exceeds budget"
        );

        // Record validation
        taskValidators[_taskId] = msg.sender;
        task.validationScore = _score;
        task.status = TaskStatus.Validated;
        task.totalSpent += _validatorPayment;

        // Track validator earnings (paid upon settlement)
        validatorEarnings[msg.sender] += _validatorPayment;

        emit ValidationSubmitted(_taskId, msg.sender, _score, _validatorPayment);
    }

    // ============ SETTLEMENT ============

    /**
     * @dev Settle task: pay orchestrator margin and refund remaining budget
     * @param _taskId Task identifier
     */
    function settleTask(bytes32 _taskId) external nonReentrant {
        Task storage task = tasks[_taskId];
        require(task.creator != address(0), "Task does not exist");
        require(task.status == TaskStatus.Validated, "Task not validated");
        require(task.completedAt == 0, "Task already settled");

        task.status = TaskStatus.Completed;
        task.completedAt = block.timestamp;

        // Calculate orchestrator earnings (margin on spent amount)
        uint256 orchestratorEarning = (task.totalSpent * orchestratorMargin) / 100;
        orchestratorEarnings[orchestrator] += orchestratorEarning;

        // Calculate refund to user
        uint256 refund = task.budget - task.totalSpent;

        // Transfer refund back to task creator if any
        if (refund > 0) {
            require(
                usdcToken.transfer(task.creator, refund),
                "Refund transfer failed"
            );
        }

        emit TaskSettled(_taskId, orchestratorEarning, refund);
    }

    // ============ WITHDRAWALS ============

    /**
     * @dev Worker/Validator/Orchestrator withdraw their earnings
     */
    function withdrawEarnings() external nonReentrant {
        uint256 amount = 0;

        // Determine which role the caller is and get their earnings
        if (workerEarnings[msg.sender] > 0) {
            amount = workerEarnings[msg.sender];
            workerEarnings[msg.sender] = 0;
        } else if (validatorEarnings[msg.sender] > 0) {
            amount = validatorEarnings[msg.sender];
            validatorEarnings[msg.sender] = 0;
        } else if (msg.sender == orchestrator && orchestratorEarnings[orchestrator] > 0) {
            amount = orchestratorEarnings[orchestrator];
            orchestratorEarnings[orchestrator] = 0;
        }

        require(amount > 0, "No earnings to withdraw");

        // Transfer USDC to recipient
        require(
            usdcToken.transfer(msg.sender, amount),
            "Withdrawal transfer failed"
        );

        emit EarningsWithdrawn(msg.sender, amount);
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @dev Get task details
     */
    function getTask(bytes32 _taskId) external view returns (Task memory) {
        require(tasks[_taskId].creator != address(0), "Task does not exist");
        return tasks[_taskId];
    }

    /**
     * @dev Get all tasks for a user
     */
    function getUserTasks(address _user) external view returns (bytes32[] memory) {
        return userTasks[_user];
    }

    /**
     * @dev Get total task count
     */
    function getTaskCount() external view returns (uint256) {
        return taskCounter;
    }

    /**
     * @dev Get agent earnings (worker/validator/orchestrator)
     */
    function getAgentEarnings(address _agent) external view returns (
        uint256 worker,
        uint256 validator,
        uint256 orchestratorAmount
    ) {
        worker = workerEarnings[_agent];
        validator = validatorEarnings[_agent];
        orchestratorAmount = (_agent == orchestrator) ? orchestratorEarnings[orchestrator] : 0;
    }

    /**
     * @dev Get contract USDC balance (total in escrow)
     */
    function getContractBalance() external view returns (uint256) {
        return usdcToken.balanceOf(address(this));
    }

    /**
     * @dev Get task worker address
     */
    function getTaskWorker(bytes32 _taskId) external view returns (address) {
        return taskWorkers[_taskId];
    }

    /**
     * @dev Get task validator address
     */
    function getTaskValidator(bytes32 _taskId) external view returns (address) {
        return taskValidators[_taskId];
    }

    // ============ ADMIN FUNCTIONS ============

    /**
     * @dev Update orchestrator margin percentage (owner only)
     */
    function setOrchestratorMargin(uint256 _newMargin) external onlyOwner {
        require(_newMargin <= 10, "Margin cannot exceed 10%");
        orchestratorMargin = _newMargin;
    }

    /**
     * @dev Update orchestrator address (owner only)
     */
    function setOrchestrator(address _newOrchestrator) external onlyOwner {
        require(_newOrchestrator != address(0), "Invalid orchestrator address");
        orchestrator = _newOrchestrator;
    }

    /**
     * @dev Emergency withdrawal of stuck funds (owner only)
     */
    function emergencyWithdraw(uint256 _amount) external onlyOwner nonReentrant {
        require(_amount > 0, "Amount must be greater than zero");
        require(
            usdcToken.transfer(owner(), _amount),
            "Emergency withdrawal failed"
        );
    }
}
