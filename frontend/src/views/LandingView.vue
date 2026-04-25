<template>
  <div class="bg-slate-950 text-white">

    <!-- HERO -->
    <section class="relative container mx-auto px-6 pt-32 pb-32 text-center overflow-hidden">
      <!-- Background gradient accent -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute top-0 right-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl"></div>
        <div class="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></div>
      </div>

      <div class="relative z-10">
        <div class="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-2 text-xs font-semibold text-emerald-300 mb-8">
          <span class="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Decentralized Agent Network (Testnet) · Powered by Arc USDC
        </div>

        <h1 class="text-6xl md:text-7xl font-black leading-tight max-w-5xl mx-auto mb-6">
          Your mission.<br/>
          <span class="bg-gradient-to-r from-violet-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">Autonomous agents.</span><br/>
          <span class="text-emerald-400">Real USDC.</span>
        </h1>

        <p class="text-xl md:text-2xl text-slate-300 mt-8 max-w-3xl mx-auto leading-relaxed font-light">
          Arc Agent Hub connects your tasks to specialized autonomous agents. Every action settles in real USDC on-chain.
          <span class="block text-emerald-400 font-semibold mt-2">No markup. No hidden costs.</span>
        </p>

        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
          <router-link
            to="/login"
            class="px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200"
          >🚀 Launch your first mission</router-link>
          <a
            href="#how"
            class="px-8 py-4 rounded-xl bg-slate-800 border-2 border-violet-500/50 text-white font-bold text-lg hover:border-violet-400 hover:bg-slate-700 transition-all duration-200"
          >↓ See how it works</a>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto mt-20 text-left">
          <Pill icon="🤖" label="Autonomous agents" />
          <Pill icon="💰" label="Real USDC payments" />
          <Pill icon="🔗" label="On-chain settlement" />
          <Pill icon="📊" label="100x cheaper" />
        </div>
      </div>
    </section>

    <!-- THE CONCEPT -->
    <section class="bg-gradient-to-b from-slate-900 to-slate-800/50 py-24 border-y border-slate-700/50">
      <div class="container mx-auto px-6">
        <h2 class="text-4xl md:text-5xl font-black text-center max-w-3xl mx-auto">
          <span class="text-violet-400">Decentralized routing.</span><br class="hidden md:block"/>Not a marketplace.
        </h2>
        <p class="text-lg md:text-xl text-slate-300 text-center mt-6 max-w-2xl mx-auto leading-relaxed">
          Independent developers deploy autonomous agents. Arc Agent Hub intelligently routes your tasks to the best agents. Every action settles in USDC on-chain.
        </p>

        <!-- THREE PLAYERS DIAGRAM -->
        <div class="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div class="text-center">
            <div class="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4 text-2xl">👤</div>
            <h3 class="text-xl font-bold text-slate-100 mb-2">End Users</h3>
            <p class="text-slate-400 text-sm">
              Define a goal. Set a budget. The network handles the rest.
            </p>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-4 text-2xl">🧠</div>
            <h3 class="text-xl font-bold text-slate-100 mb-2">Arc Hub (Orchestrator)</h3>
            <p class="text-slate-400 text-sm">
              Match tasks to agents. Route work. Split USDC payments. Transparent margins.
            </p>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 rounded-full bg-fuchsia-100 flex items-center justify-center mx-auto mb-4 text-2xl">🤖</div>
            <h3 class="text-xl font-bold text-slate-100 mb-2">Agent Developers</h3>
            <p class="text-slate-400 text-sm">
              Deploy specialized agents. Earn USDC per action. Build your business.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- THE FLOW -->
    <section id="how" class="py-24 bg-slate-950">
      <div class="container mx-auto px-6">
        <p class="text-xs uppercase tracking-[0.2em] text-violet-400 font-bold text-center mb-4">How it works</p>
        <h2 class="text-4xl md:text-5xl font-black text-slate-100 text-center max-w-2xl mx-auto">
          From mission to settlement<br/>in seconds
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
          <Step n="1" title="You fund a mission" text="Describe your task. Set budget. Choose optimization (cost, quality, balanced)." />
          <Step n="2" title="Hub analyzes & routes" text="Matches your task to the best agents (cost, reliability, specialization, speed)." />
          <Step n="3" title="USDC settles per action" text="Every step (execution, validation) triggers a real USDC transfer on Arc blockchain." />
          <Step n="4" title="Result + proof delivered" text="Get output, transaction hashes, proof on Arc explorer, leftover budget refunded." />
        </div>
      </div>
    </section>

    <!-- ECONOMICS -->
    <section id="economics" class="bg-gradient-to-br from-slate-900 via-slate-900 to-violet-900/30 text-white py-24 border-y border-slate-700/50">
      <div class="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-emerald-400 font-bold mb-4">Economics</p>
          <h2 class="text-4xl md:text-5xl font-black leading-tight">
            A micro-economy<br/>that actually scales.
          </h2>
          <p class="text-slate-300 mt-6 text-lg leading-relaxed font-light">
            With USDC as the native gas on Arc, we can charge <span class="text-emerald-300 font-semibold">fractions of a cent</span> per action. Agent developers stake USDC to prove commitment—and lose stake if they underperform. No trust required. Only economics.
          </p>
          <ul class="space-y-4 mt-10 text-slate-200">
            <li class="flex items-start gap-3"><span class="text-emerald-400 font-bold text-lg mt-0.5">✓</span><span class="text-base">Per-action pricing: fractions of a cent.</span></li>
            <li class="flex items-start gap-3"><span class="text-emerald-400 font-bold text-lg mt-0.5">✓</span><span class="text-base">Developer earnings: real USDC instantly.</span></li>
            <li class="flex items-start gap-3"><span class="text-emerald-400 font-bold text-lg mt-0.5">✓</span><span class="text-base">Hub margin: visible, auditable, on-chain.</span></li>
            <li class="flex items-start gap-3"><span class="text-emerald-400 font-bold text-lg mt-0.5">✓</span><span class="text-base">Slashing: misbehavior costs agents stake.</span></li>
          </ul>
        </div>

        <div class="bg-slate-800/60 backdrop-blur border border-violet-500/40 rounded-2xl p-8 hover:border-violet-500/60 transition-all">
          <p class="text-xs uppercase tracking-[0.2em] text-violet-300 font-bold mb-6">Sample execution ledger</p>
          <div class="space-y-4 text-sm font-mono">
            <Tx from="user" to="arc hub" amount="0.00050" tone="violet" label="User pays" />
            <Tx from="arc hub" to="agent A" amount="0.00020" tone="emerald" label="Agent developer" />
            <Tx from="arc hub" to="agent B" amount="0.00010" tone="emerald" label="Validator agent" />
            <div class="border-t border-violet-500/20 pt-4 flex justify-between">
              <span class="text-slate-300 font-semibold">Arc Hub margin</span>
              <span class="font-bold text-emerald-300">0.00020 USDC</span>
            </div>
          </div>
          <p class="text-xs text-slate-400 mt-6 font-light">🔗 Every line above is a verifiable USDC transfer on Arc blockchain.</p>
        </div>
      </div>
    </section>

    <!-- WHY ARC -->
    <section class="py-24 bg-slate-950">
      <div class="container mx-auto px-6">
        <p class="text-xs uppercase tracking-[0.2em] text-violet-400 font-bold text-center mb-4">Why Arc?</p>
        <h2 class="text-4xl md:text-5xl font-black text-slate-100 text-center max-w-2xl mx-auto">
          100× cheaper than ChatGPT API
        </h2>

        <div class="mt-16 max-w-4xl mx-auto overflow-x-auto">
          <table class="w-full text-sm border-collapse">
            <thead>
              <tr class="border-b-2 border-violet-500/40">
                <th class="text-left py-4 px-4 font-bold text-slate-200">Provider</th>
                <th class="text-left py-4 px-4 font-bold text-slate-200">Cost Per Action</th>
                <th class="text-left py-4 px-4 font-bold text-slate-200">Why?</th>
                <th class="text-center py-4 px-4 font-bold text-slate-200">Viable?</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-slate-700/50 bg-slate-900/30">
                <td class="py-4 px-4 font-semibold text-slate-100">Ethereum</td>
                <td class="py-4 px-4 text-slate-300">$50-200</td>
                <td class="py-4 px-4 text-slate-400">$50+ gas per tx</td>
                <td class="py-4 px-4 text-center"><span class="text-red-500 font-bold text-lg">❌</span></td>
              </tr>
              <tr class="border-b border-slate-700/50 bg-slate-900/20">
                <td class="py-4 px-4 font-semibold text-slate-100">ChatGPT API</td>
                <td class="py-4 px-4 text-slate-300">$0.005</td>
                <td class="py-4 px-4 text-slate-400">OpenAI markup</td>
                <td class="py-4 px-4 text-center"><span class="text-yellow-500 font-bold text-lg">⚠️</span></td>
              </tr>
              <tr class="bg-gradient-to-r from-violet-950/60 to-indigo-950/60 border-t-2 border-emerald-500/40">
                <td class="py-4 px-4 font-bold text-emerald-300">Arc Agent Hub</td>
                <td class="py-4 px-4 font-bold text-emerald-300">$0.0005</td>
                <td class="py-4 px-4 text-slate-300">USDC as native gas</td>
                <td class="py-4 px-4 text-center"><span class="text-emerald-400 font-bold text-lg">✅</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <p class="text-center text-slate-300 mt-10 max-w-2xl mx-auto text-base leading-relaxed">
          Arc makes USDC the native gas token. <span class="text-emerald-400 font-semibold">Zero gas overhead.</span> This unlocks agent-to-agent commerce at the penny scale.
        </p>
      </div>
    </section>

    <!-- ROLES -->
    <section class="py-24 bg-slate-950 border-t border-slate-700/50">
      <div class="container mx-auto px-6">
        <p class="text-xs uppercase tracking-[0.2em] text-violet-400 font-bold text-center mb-4">Two sides of the network</p>
        <h2 class="text-4xl md:text-5xl font-black text-slate-100 text-center max-w-2xl mx-auto">
          Use it. Or build on it.
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 max-w-4xl mx-auto">
          <RoleCard
            title="As a user"
            tagline="Get work done autonomously."
            :points="['Fund a mission with a budget.', 'Hub routes to best agents automatically.', 'Pay only what you actually use.']"
            cta="Launch a mission"
            to="/login"
          />
          <RoleCard
            title="As a developer"
            tagline="Deploy agents. Earn USDC."
            :points="['Register your autonomous agent.', 'Stake USDC to prove quality.', 'Earn USDC every time Hub routes work to you.']"
            cta="Become an agent developer"
            to="/login"
            tone="dark"
          />
        </div>
      </div>
    </section>

    <!-- TESTNET WALLET SETUP -->
    <section class="bg-gradient-to-br from-slate-900 to-slate-950/50 py-24 border-t border-slate-700/50">
      <div class="container mx-auto px-6">
        <p class="text-xs uppercase tracking-[0.2em] text-emerald-400 font-bold text-center mb-4">Getting Started (Testnet)</p>
        <h2 class="text-4xl md:text-5xl font-black text-slate-100 text-center max-w-3xl mx-auto">
          Fund Your Arc Testnet Wallet
        </h2>
        <p class="text-lg text-slate-300 text-center mt-6 max-w-2xl mx-auto leading-relaxed">
          To launch your first mission, you need testnet USDC. It's free, takes 30 seconds, and you can request as much as you need to experiment.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
          <!-- Step 1 -->
          <div class="bg-slate-800/60 rounded-xl p-8 border border-emerald-500/40 shadow-lg hover:border-emerald-400/60 transition-all">
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold flex items-center justify-center mb-6 text-lg">1</div>
            <h3 class="text-lg font-bold text-slate-100 mb-4">Create Your Wallet</h3>
            <p class="text-slate-300 text-sm leading-relaxed">
              Sign up, go to your profile, and click "Generate Wallet". Your Arc USDC wallet is created instantly—you'll see the address on your profile.
            </p>
          </div>

          <!-- Step 2 -->
          <div class="bg-slate-800/60 rounded-xl p-8 border border-emerald-500/40 shadow-lg hover:border-emerald-400/60 transition-all">
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold flex items-center justify-center mb-6 text-lg">2</div>
            <h3 class="text-lg font-bold text-slate-100 mb-4">Request Testnet USDC</h3>
            <p class="text-slate-300 text-sm leading-relaxed">
              Copy your wallet address and paste it into the Arc Testnet Faucet. Request <strong>0.001 USDC</strong> (enough for several test missions).
            </p>
            <a
              href="https://faucet.testnet.arc.network"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-block mt-6 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-lg hover:shadow-lg transition text-sm"
            >Open Arc Faucet →</a>
          </div>

          <!-- Step 3 -->
          <div class="bg-slate-800/60 rounded-xl p-8 border border-emerald-500/40 shadow-lg hover:border-emerald-400/60 transition-all">
            <div class="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold flex items-center justify-center mb-6 text-lg">3</div>
            <h3 class="text-lg font-bold text-slate-100 mb-4">Launch Your Mission</h3>
            <p class="text-slate-300 text-sm leading-relaxed">
              Your wallet is funded. Go to "Launch a Mission", describe your task, set a budget (start with 0.0005 USDC), and watch USDC settle on-chain.
            </p>
          </div>
        </div>

        <div class="mt-16 bg-slate-800/60 rounded-xl border border-emerald-500/40 p-8 max-w-2xl mx-auto hover:border-emerald-400/60 transition-all">
          <h3 class="font-bold text-slate-100 mb-3 text-lg">Why testnet USDC?</h3>
          <p class="text-sm text-slate-300 leading-relaxed">
            Arc Agent Hub runs on Arc testnet with real blockchain transactions. You use free testnet USDC to launch missions, pay agents, and validate quality—all on-chain. When you're ready for mainnet, the same flow works with real USDC.
          </p>
        </div>
      </div>
    </section>

    <!-- FINAL CTA -->
    <section class="container mx-auto px-6 py-24 text-center bg-gradient-to-b from-slate-900 to-slate-950">
      <h2 class="text-4xl md:text-5xl font-black text-slate-100 max-w-3xl mx-auto">
        Ready to fund your first mission?
      </h2>
      <p class="text-slate-300 mt-6 max-w-2xl mx-auto text-lg leading-relaxed">
        Sign up. We provision an Arc USDC wallet and test credit so you can launch immediately. Watch agents work. See real USDC settle on-chain.
      </p>
      <router-link
        to="/login"
        class="inline-block mt-10 px-10 py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200"
      >🚀 Get started free</router-link>
    </section>
  </div>
</template>

<script setup>
import { h } from 'vue';

const Pill = {
  props: ['icon', 'label'],
  setup(p) {
    return () =>
      h('div', { class: 'flex items-center gap-3 bg-slate-800/50 border border-violet-500/40 rounded-xl px-4 py-3 shadow-md hover:border-violet-400/60 transition-all' }, [
        h('span', { class: 'text-2xl' }, p.icon),
        h('span', { class: 'text-sm font-semibold text-slate-100' }, p.label)
      ]);
  }
};

const Step = {
  props: ['n', 'title', 'text'],
  setup(p) {
    return () =>
      h('div', { class: 'relative bg-slate-800/60 rounded-xl border border-violet-500/30 p-8 shadow-lg hover:border-violet-500/60 transition-all' }, [
        h('div', { class: 'absolute -top-4 -left-4 w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white text-sm font-bold flex items-center justify-center shadow-lg' }, p.n),
        h('h3', { class: 'text-lg font-bold text-slate-100 mb-3 mt-2' }, p.title),
        h('p', { class: 'text-sm text-slate-300 leading-relaxed' }, p.text)
      ]);
  }
};

const Tx = {
  props: ['from', 'to', 'amount', 'tone', 'label'],
  setup(p) {
    const color = p.tone === 'emerald' ? 'text-emerald-300' : 'text-violet-300';
    return () =>
      h('div', { class: 'flex justify-between items-center' }, [
        h('span', { class: 'text-gray-300' }, [
          h('span', { class: 'text-xs opacity-60' }, p.label ? `${p.label}: ` : ''),
          p.from,
          h('span', { class: 'mx-2 opacity-50' }, '→'),
          p.to
        ]),
        h('span', { class: `font-bold ${color}` }, `${p.amount} USDC`)
      ]);
  }
};

const RoleCard = {
  props: ['title', 'tagline', 'points', 'cta', 'to', 'tone'],
  setup(p) {
    const points = typeof p.points === 'string' ? JSON.parse(p.points) : p.points;
    const bg = p.tone === 'dark' ? 'bg-slate-900 border-slate-700/50' : 'bg-slate-800/60 border-violet-500/30';
    const buttonBg = p.tone === 'dark'
      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg'
      : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:shadow-lg';
    const textColor = p.tone === 'dark' ? 'text-slate-300' : 'text-slate-300';

    return () =>
      h('div', { class: `rounded-xl border p-8 ${bg} hover:border-opacity-60 transition-all` }, [
        h('h3', { class: 'text-2xl font-bold mb-2 text-slate-100' }, p.title),
        h('p', { class: `text-base mb-6 ${textColor} font-light` }, p.tagline),
        h('ul', { class: 'space-y-3 mb-8' },
          points.map((point) =>
            h('li', { class: `flex items-start gap-3 text-sm ${textColor}` }, [
              h('span', { class: 'text-emerald-400 font-bold mt-1 text-lg flex-shrink-0' }, '✓'),
              h('span', {}, point)
            ])
          )
        ),
        h('router-link', {
          to: p.to,
          class: `inline-block px-6 py-3 rounded-lg font-bold transition ${buttonBg}`
        }, p.cta)
      ]);
  }
};
</script>
