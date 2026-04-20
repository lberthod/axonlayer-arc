const env = process.env;

/**
 * Pricing profiles. `nano` is tuned for Circle Arc, where gas is paid in USDC
 * and settlement is sub-second, making sub-cent agent payments viable.
 */
const PRICING_PROFILES = {
  standard: {
    clientPayment: 0.005,
    workerPayment: 0.002,
    validatorPayment: 0.001,
    orchestratorMargin: 0.002,
    dynamic: { basePerChar: 0.00001, minClientPayment: 0.003, maxClientPayment: 0.05 }
  },
  nano: {
    clientPayment: 0.0005,
    workerPayment: 0.0002,
    validatorPayment: 0.0001,
    orchestratorMargin: 0.0002,
    dynamic: { basePerChar: 0.000001, minClientPayment: 0.0001, maxClientPayment: 0.005 }
  },
  micro: {
    clientPayment: 0.00005,
    workerPayment: 0.00002,
    validatorPayment: 0.00001,
    orchestratorMargin: 0.00002,
    dynamic: { basePerChar: 0.0000001, minClientPayment: 0.00001, maxClientPayment: 0.0005 }
  }
};

/**
 * Network presets. Chain IDs / RPC / USDC addresses for EVM-compatible
 * networks. `arc` / `arc-testnet` are the Circle Arc presets — fill in the
 * final values from https://arc.network once public, or override via env.
 */
const NETWORK_PRESETS = {
  'arc-testnet': {
    label: 'Arc Testnet',
    rpcUrl: 'https://rpc.testnet.arc.network',
    chainId: 5042002,
    usdcAddress: '0x3600000000000000000000000000000000000000',
    nativeGasAsset: 'USDC',
    nativeUsdc: true,
    nativeDecimals: 18,
    faucet: 'https://faucet.circle.com',
    explorer: 'https://testnet.arcscan.app'
  },
  'arc': {
    label: 'Circle Arc Mainnet',
    rpcUrl: 'https://rpc.arc.network',
    chainId: 6700,
    usdcAddress: '0x3600000000000000000000000000000000000000',
    nativeGasAsset: 'USDC',
    nativeUsdc: true,
    nativeDecimals: 18,
    faucet: null,
    explorer: 'https://arcscan.app'
  },
  'base-sepolia': {
    label: 'Base Sepolia',
    rpcUrl: 'https://base-sepolia.public.blastapi.io',
    chainId: 84532,
    usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    explorer: 'https://sepolia.basescan.org',
    nativeGasAsset: 'ETH',
    faucet: 'https://faucet.circle.com'
  },
  'base': {
    label: 'Base Mainnet',
    rpcUrl: 'https://mainnet.base.org',
    chainId: 8453,
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    explorer: 'https://basescan.org',
    nativeGasAsset: 'ETH',
    faucet: null
  }
};

const pricingProfileKey = env.PRICING_PROFILE || 'standard';
const pricingProfile = PRICING_PROFILES[pricingProfileKey] || PRICING_PROFILES.standard;

const networkKey = env.ONCHAIN_NETWORK || 'arc-testnet';
const networkPreset = NETWORK_PRESETS[networkKey] || NETWORK_PRESETS['arc-testnet'];

export const config = {
  asset: 'USDC',

  wallets: {
    client: 'client_wallet',
    orchestrator: 'orchestrator_wallet',
    worker: 'worker_wallet',
    validator: 'validator_wallet'
  },

  treasury: {
    // DEPRECATED: Use treasuryStore instead
    address: 'arc_treasury_wallet',
    balance: 0,
    feeRate: 0.2
  },

  initialBalances: {
    client_wallet: 10.0,
    orchestrator_wallet: 5.0,
    worker_wallet: 1.0,
    validator_wallet: 1.0,
    worker_fast_wallet: 1.0,
    worker_premium_wallet: 1.0,
    validator_strict_wallet: 1.0,
    translator_wallet: 1.0,
    classifier_wallet: 1.0,
    sentiment_wallet: 1.0
  },

  pricing: {
    profile: pricingProfileKey,
    clientPayment: pricingProfile.clientPayment,
    workerPayment: pricingProfile.workerPayment,
    validatorPayment: pricingProfile.validatorPayment,
    orchestratorMargin: pricingProfile.orchestratorMargin,
    dynamic: {
      enabled: env.DYNAMIC_PRICING !== 'false',
      basePerChar: pricingProfile.dynamic.basePerChar,
      minClientPayment: pricingProfile.dynamic.minClientPayment,
      maxClientPayment: pricingProfile.dynamic.maxClientPayment,
      taskTypeMultiplier: {
        summarize: 1.0,
        keywords: 0.8,
        rewrite: 1.2,
        translate: 1.5,
        classify: 0.9,
        sentiment: 0.7
      },
      marginRatio: 0.3,
      workerShare: 0.45,
      validatorShare: 0.25
    }
  },

  validation: {
    minScore: 0.5,
    maxSummaryWords: 100
  },

  simulation: {
    enabled: true
  },

  walletProvider: {
    mode: env.WALLET_PROVIDER || 'simulated',
    onChain: {
      network: networkKey,
      label: networkPreset.label,
      rpcUrl: env.ONCHAIN_RPC_URL || networkPreset.rpcUrl,
      chainId: Number(env.ONCHAIN_CHAIN_ID || networkPreset.chainId),
      usdcAddress: env.ONCHAIN_USDC_ADDRESS || networkPreset.usdcAddress,
      nativeGasAsset: networkPreset.nativeGasAsset,
      nativeUsdc: Boolean(networkPreset.nativeUsdc),
      nativeDecimals: networkPreset.nativeDecimals || 18,
      faucet: networkPreset.faucet,
      explorer: networkPreset.explorer || null,
      walletsFile: env.ONCHAIN_WALLETS_FILE || 'src/data/wallets.json',
      dryRun: env.ONCHAIN_DRY_RUN !== 'false'
    }
  },

  networkPresets: NETWORK_PRESETS,
  pricingProfiles: PRICING_PROFILES,

  registry: {
    selectionStrategy: env.AGENT_SELECTION || 'score_price',
    scoreWeight: 0.7,
    priceWeight: 0.3,
    defaultScore: 0.75
  },

  auth: {
    enabled: env.AUTH_ENABLED !== 'false',
    firebaseProjectId: env.FIREBASE_PROJECT_ID || '',
    serviceAccountPath: env.FIREBASE_SERVICE_ACCOUNT || '',
    adminEmails: (env.ADMIN_EMAILS || '').split(',').map((s) => s.trim()).filter(Boolean),
    usersFile: 'src/data/users.json',
    providersFile: 'src/data/providers.json'
  },

  clients: {
    defaultDailyQuota: Number(env.CLIENT_DAILY_QUOTA || 1000),
    defaultMonthlyBudget: Number(env.CLIENT_MONTHLY_BUDGET || 10)
  },

  marketplace: {
    minStake: Number(env.PROVIDER_MIN_STAKE || 0.1),
    slashPenalty: Number(env.PROVIDER_SLASH_PENALTY || 0.05)
  },

  security: {
    // Comma-separated list of allowed origins. '*' allows anything (dev only).
    corsOrigins: (env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    rateLimit: {
      // Global: 300 req / 15 min / IP
      globalMax: Number(env.RATE_LIMIT_GLOBAL || 300),
      globalWindowMs: Number(env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
      // Tasks: 30 / min / IP (protects paid pipeline)
      tasksMax: Number(env.RATE_LIMIT_TASKS || 30),
      tasksWindowMs: Number(env.RATE_LIMIT_TASKS_WINDOW_MS || 60 * 1000),
      // Simulation: 3 / min / IP (generates lots of tx)
      simulationMax: Number(env.RATE_LIMIT_SIM || 3),
      simulationWindowMs: Number(env.RATE_LIMIT_SIM_WINDOW_MS || 60 * 1000),
      // Auth: 10 / min / IP
      authMax: Number(env.RATE_LIMIT_AUTH || 10),
      authWindowMs: Number(env.RATE_LIMIT_AUTH_WINDOW_MS || 60 * 1000)
    },
    idempotencyTtlMs: Number(env.IDEMPOTENCY_TTL_MS || 10 * 60 * 1000),
    logLevel: env.LOG_LEVEL || 'info'
  },

  llm: (() => {
    // node --env-file does NOT strip inline `# comment` from .env values, so a
    // line like `OPENAI_REASONING_EFFORT=low   # foo` becomes the literal
    // string `low   # foo`. We defensively sanitize every textual env var the
    // OpenAI Responses API will validate.
    const sanitize = (v, fallback) => {
      if (typeof v !== 'string') return fallback;
      // Strip surrounding quotes, trailing inline comment, and whitespace.
      const cleaned = v
        .replace(/^['"]|['"]$/g, '')
        .replace(/\s+#.*$/, '')
        .trim();
      return cleaned || fallback;
    };

    const allowedEfforts = ['none', 'minimal', 'low', 'medium', 'high', 'xhigh'];
    let effort = sanitize(env.OPENAI_REASONING_EFFORT, 'low');
    if (!allowedEfforts.includes(effort)) {
      console.warn(
        `[config] OPENAI_REASONING_EFFORT="${effort}" is not one of ${allowedEfforts.join(',')}, ` +
          `falling back to "low".`
      );
      effort = 'low';
    }

    const apiKey = sanitize(env.OPENAI_API_KEY, '');

    return {
      enabled: Boolean(apiKey),
      apiKey,
      baseUrl: sanitize(env.OPENAI_BASE_URL, 'https://api.openai.com/v1'),
      model: sanitize(env.OPENAI_MODEL, 'gpt-5-nano-2025-08-07'),
      maxOutputTokens: Number(sanitize(env.OPENAI_MAX_OUTPUT_TOKENS, '512')) || 512,
      reasoningEffort: effort
    };
  })()
};
