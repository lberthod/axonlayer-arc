import { config } from '../config.js';

const TASK_TYPES = ['summarize', 'keywords', 'rewrite', 'translate', 'classify', 'sentiment'];

class SimulationEngine {
  constructor(orchestrator) {
    this.orchestrator = orchestrator;
  }

  normalizeAmount(value) {
    return Number(Number(value).toFixed(6));
  }

  async runSimulation(count = 50, options = {}) {
    const sampleTexts = [
      'Artificial intelligence is transforming industries across the globe, from healthcare to finance.',
      'Blockchain technology enables decentralized transactions without intermediaries.',
      'Climate change requires immediate global cooperation and sustainable solutions.',
      'The future of work involves remote collaboration and digital transformation.',
      'Machine learning algorithms can process vast amounts of data efficiently.',
      'Renewable energy sources are becoming increasingly cost-effective.',
      'Cybersecurity is essential for protecting digital infrastructure and data.',
      'Quantum computing promises to solve complex problems beyond classical computers.',
      'Biotechnology advances are revolutionizing medicine and agriculture.',
      'Smart cities integrate technology to improve urban living standards.'
    ];

    const results = {
      executed: 0,
      failed: 0,
      transactionsCreated: 0,
      summary: {
        grossVolume: 0,
        workerRevenue: 0,
        validatorRevenue: 0,
        orchestratorMargin: 0
      },
      perTaskType: {},
      missions: []
    };

    for (let i = 0; i < count; i++) {
      const text = sampleTexts[i % sampleTexts.length];
      const taskType = options.taskType || TASK_TYPES[i % TASK_TYPES.length];
      const executionStart = Date.now();

      const task = await this.orchestrator.executeTask(text, taskType, {
        selectionStrategy: options.selectionStrategy
      });

      const executionTime = Date.now() - executionStart;
      let missionData;

      if (task?.status === 'completed') {
        results.executed += 1;
        results.transactionsCreated += Array.isArray(task.transactions) ? task.transactions.length : 0;

        const pricing = task.pricing || {
          clientPayment: config.pricing.clientPayment,
          workerPayment: config.pricing.workerPayment,
          validatorPayment: config.pricing.validatorPayment,
          orchestratorMargin: config.pricing.orchestratorMargin
        };

        results.summary.grossVolume = this.normalizeAmount(
          results.summary.grossVolume + pricing.clientPayment
        );
        results.summary.workerRevenue = this.normalizeAmount(
          results.summary.workerRevenue + pricing.workerPayment
        );
        results.summary.validatorRevenue = this.normalizeAmount(
          results.summary.validatorRevenue + pricing.validatorPayment
        );
        results.summary.orchestratorMargin = this.normalizeAmount(
          results.summary.orchestratorMargin + pricing.orchestratorMargin
        );

        const bucket = results.perTaskType[taskType] || { count: 0, volume: 0 };
        bucket.count += 1;
        bucket.volume = this.normalizeAmount(bucket.volume + pricing.clientPayment);
        results.perTaskType[taskType] = bucket;

        missionData = {
          id: task.id,
          index: i + 1,
          status: task.status,
          taskType,
          input: text,
          transactions: task.transactions || [],
          pricing,
          executionTime,
          agents: {
            worker: task.selectedWorker || task.workerUid || 'unknown',
            validator: task.selectedValidator || task.validatorUid || 'unknown'
          }
        };
      } else {
        results.failed += 1;
        missionData = {
          id: task?.id || `failed_${i}`,
          index: i + 1,
          status: 'failed',
          taskType,
          input: text,
          transactions: [],
          pricing: { clientPayment: 0, workerPayment: 0, validatorPayment: 0, orchestratorMargin: 0 },
          executionTime,
          agents: { worker: 'none', validator: 'none' },
          error: task?.error || 'Unknown error'
        };
      }

      results.missions.push(missionData);

      // Call progress callback if provided
      if (options.onMissionComplete) {
        options.onMissionComplete(missionData, results);
      }
    }

    return results;
  }
}

export default SimulationEngine;
