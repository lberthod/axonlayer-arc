const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TaskManager Contract", function () {
  let taskManager;
  let mockUSDC;
  let owner, orchestrator, user, worker, validator;
  let usdcAddress;

  const INITIAL_BALANCE = ethers.utils.parseUnits("1000", 6); // 1000 USDC (6 decimals)
  const TASK_BUDGET = ethers.utils.parseUnits("10", 6); // 10 USDC
  const WORKER_PAYMENT = ethers.utils.parseUnits("6", 6); // 6 USDC
  const VALIDATOR_PAYMENT = ethers.utils.parseUnits("2", 6); // 2 USDC

  before(async function () {
    [owner, orchestrator, user, worker, validator] = await ethers.getSigners();

    // Deploy mock USDC token (simplified ERC20)
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    mockUSDC = await MockUSDC.deploy();
    await mockUSDC.deployed();
    usdcAddress = mockUSDC.address;

    // Mint tokens to user
    await mockUSDC.mint(user.address, INITIAL_BALANCE);

    // Deploy TaskManager
    const TaskManager = await ethers.getContractFactory("TaskManager");
    taskManager = await TaskManager.deploy(usdcAddress, orchestrator.address);
    await taskManager.deployed();

    // Approve TaskManager to spend USDC
    await mockUSDC.connect(user).approve(taskManager.address, INITIAL_BALANCE);
  });

  describe("Task Creation", function () {
    it("Should create a task and transfer USDC to contract", async function () {
      const input = "Summarize this text";
      const taskType = "summarize";
      const metadata = '{"version":"1.0"}';

      const tx = await taskManager.connect(user).createTask(
        input,
        TASK_BUDGET,
        taskType,
        metadata
      );

      const receipt = await tx.wait();
      const event = receipt.events.find((e) => e.event === "TaskCreated");
      const taskId = event.args.taskId;

      // Verify task was created
      const task = await taskManager.getTask(taskId);
      expect(task.creator).to.equal(user.address);
      expect(task.input).to.equal(input);
      expect(task.budget).to.equal(TASK_BUDGET);
      expect(task.taskType).to.equal(taskType);
      expect(task.status).to.equal(0); // Pending

      // Verify USDC transferred
      const contractBalance = await mockUSDC.balanceOf(taskManager.address);
      expect(contractBalance).to.equal(TASK_BUDGET);
    });

    it("Should reject task creation with zero budget", async function () {
      await expect(
        taskManager.connect(user).createTask(
          "test",
          0,
          "summarize",
          ""
        )
      ).to.be.revertedWith("Budget must be greater than zero");
    });

    it("Should reject task creation with empty input", async function () {
      await expect(
        taskManager.connect(user).createTask(
          "",
          TASK_BUDGET,
          "summarize",
          ""
        )
      ).to.be.revertedWith("Input cannot be empty");
    });
  });

  describe("Worker Result Submission", function () {
    let taskId;

    beforeEach(async function () {
      const tx = await taskManager.connect(user).createTask(
        "Test input",
        TASK_BUDGET,
        "summarize",
        "{}"
      );
      const receipt = await tx.wait();
      const event = receipt.events.find((e) => e.event === "TaskCreated");
      taskId = event.args.taskId;
    });

    it("Should submit worker result and update task status", async function () {
      const result = "Test result";

      const tx = await taskManager.connect(worker).submitWorkerResult(
        taskId,
        result,
        WORKER_PAYMENT
      );

      const receipt = await tx.wait();
      const event = receipt.events.find((e) => e.event === "WorkerResultSubmitted");
      expect(event.args.worker).to.equal(worker.address);

      // Verify task was updated
      const task = await taskManager.getTask(taskId);
      expect(task.result).to.equal(result);
      expect(task.status).to.equal(1); // Processing
      expect(task.totalSpent).to.equal(WORKER_PAYMENT);

      // Verify worker earnings tracked
      const earnings = await taskManager.getAgentEarnings(worker.address);
      expect(earnings.worker).to.equal(WORKER_PAYMENT);
    });

    it("Should reject result submission with payment exceeding budget", async function () {
      const excessPayment = TASK_BUDGET.add(1);
      await expect(
        taskManager.connect(worker).submitWorkerResult(
          taskId,
          "result",
          excessPayment
        )
      ).to.be.revertedWith("Payment exceeds budget");
    });
  });

  describe("Validation", function () {
    let taskId;

    beforeEach(async function () {
      // Create task
      let tx = await taskManager.connect(user).createTask(
        "Test input",
        TASK_BUDGET,
        "summarize",
        "{}"
      );
      let receipt = await tx.wait();
      let event = receipt.events.find((e) => e.event === "TaskCreated");
      taskId = event.args.taskId;

      // Submit worker result
      await taskManager.connect(worker).submitWorkerResult(
        taskId,
        "Worker result",
        WORKER_PAYMENT
      );
    });

    it("Should submit validation and update task status", async function () {
      const score = 85;

      const tx = await taskManager.connect(validator).submitValidation(
        taskId,
        score,
        VALIDATOR_PAYMENT
      );

      const receipt = await tx.wait();
      const event = receipt.events.find((e) => e.event === "ValidationSubmitted");
      expect(event.args.score).to.equal(score);

      // Verify task was updated
      const task = await taskManager.getTask(taskId);
      expect(task.validationScore).to.equal(score);
      expect(task.status).to.equal(2); // Validated
      expect(task.totalSpent).to.equal(WORKER_PAYMENT.add(VALIDATOR_PAYMENT));

      // Verify validator earnings tracked
      const earnings = await taskManager.getAgentEarnings(validator.address);
      expect(earnings.validator).to.equal(VALIDATOR_PAYMENT);
    });

    it("Should reject validation with score > 100", async function () {
      await expect(
        taskManager.connect(validator).submitValidation(
          taskId,
          101,
          VALIDATOR_PAYMENT
        )
      ).to.be.revertedWith("Score must be between 0 and 100");
    });
  });

  describe("Task Settlement", function () {
    let taskId;

    beforeEach(async function () {
      // Create, process, and validate task
      let tx = await taskManager.connect(user).createTask(
        "Test input",
        TASK_BUDGET,
        "summarize",
        "{}"
      );
      let receipt = await tx.wait();
      let event = receipt.events.find((e) => e.event === "TaskCreated");
      taskId = event.args.taskId;

      await taskManager.connect(worker).submitWorkerResult(
        taskId,
        "Worker result",
        WORKER_PAYMENT
      );

      await taskManager.connect(validator).submitValidation(
        taskId,
        85,
        VALIDATOR_PAYMENT
      );
    });

    it("Should settle task and distribute earnings", async function () {
      const userUsdcBefore = await mockUSDC.balanceOf(user.address);

      const tx = await taskManager.connect(owner).settleTask(taskId);
      const receipt = await tx.wait();
      const event = receipt.events.find((e) => e.event === "TaskSettled");

      // Verify refund was issued
      const refund = TASK_BUDGET.sub(WORKER_PAYMENT).sub(VALIDATOR_PAYMENT);
      expect(event.args.refundedToCreator).to.equal(refund);

      // Verify task status
      const task = await taskManager.getTask(taskId);
      expect(task.status).to.equal(3); // Completed

      // Verify refund transferred to user
      const userUsdcAfter = await mockUSDC.balanceOf(user.address);
      expect(userUsdcAfter).to.equal(userUsdcBefore.add(refund));
    });
  });

  describe("Earnings Withdrawal", function () {
    it("Should allow worker to withdraw earnings", async function () {
      // Create and process task
      let tx = await taskManager.connect(user).createTask(
        "Test input",
        TASK_BUDGET,
        "summarize",
        "{}"
      );
      let receipt = await tx.wait();
      let event = receipt.events.find((e) => e.event === "TaskCreated");
      const taskId = event.args.taskId;

      await taskManager.connect(worker).submitWorkerResult(
        taskId,
        "Result",
        WORKER_PAYMENT
      );

      await taskManager.connect(validator).submitValidation(
        taskId,
        90,
        VALIDATOR_PAYMENT
      );

      await taskManager.connect(owner).settleTask(taskId);

      // Worker withdraws
      const workerUsdcBefore = await mockUSDC.balanceOf(worker.address);
      await taskManager.connect(worker).withdrawEarnings();
      const workerUsdcAfter = await mockUSDC.balanceOf(worker.address);

      expect(workerUsdcAfter).to.equal(workerUsdcBefore.add(WORKER_PAYMENT));

      // Verify earnings reset
      const earnings = await taskManager.getAgentEarnings(worker.address);
      expect(earnings.worker).to.equal(0);
    });
  });

  describe("View Functions", function () {
    it("Should retrieve user tasks", async function () {
      // Create multiple tasks
      await taskManager.connect(user).createTask("Input 1", TASK_BUDGET, "summarize", "{}");
      await taskManager.connect(user).createTask("Input 2", TASK_BUDGET, "keywords", "{}");

      const userTasks = await taskManager.getUserTasks(user.address);
      expect(userTasks.length).to.be.greaterThanOrEqual(2);
    });

    it("Should return task count", async function () {
      const count = await taskManager.getTaskCount();
      expect(count).to.be.greaterThan(0);
    });
  });
});

// Mock USDC contract for testing
describe("MockUSDC", function () {
  it("should allow minting", async function () {
    const [owner] = await ethers.getSigners();
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    const mockUSDC = await MockUSDC.deploy();
    await mockUSDC.deployed();

    const amount = ethers.utils.parseUnits("100", 6);
    await mockUSDC.mint(owner.address, amount);

    const balance = await mockUSDC.balanceOf(owner.address);
    expect(balance).to.equal(amount);
  });
});
