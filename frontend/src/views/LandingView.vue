<template>
  <div class="bg-gradient-to-b from-white via-white to-violet-50">

    <!-- HERO -->
    <section class="container mx-auto px-6 pt-20 pb-24 text-center">
      <div class="inline-flex items-center gap-2 bg-violet-50 border border-violet-100 rounded-full px-3 py-1 text-xs font-semibold text-violet-700 mb-6">
        <span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        Built on Circle Arc · Powered by USDC
      </div>
      <h1 class="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight max-w-4xl mx-auto">
        You don't use APIs.<br />
        You <span class="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">fund a mission</span>.
      </h1>
      <p class="text-lg md:text-xl text-gray-600 mt-6 max-w-2xl mx-auto">
        ArcAgent Hub is a private execution network where user-funded missions are fulfilled by decentralized agents, with real-time USDC settlement on Arc.
      </p>
      <div class="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
        <router-link
          to="/login"
          class="px-6 py-3 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold shadow-lg hover:shadow-xl transition"
        >Launch your first mission</router-link>
        <a
          href="#how"
          class="px-6 py-3 rounded-lg bg-white border border-gray-200 text-gray-800 font-semibold hover:border-gray-300 transition"
        >See how it works</a>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mt-16 text-left">
        <Pill icon="⚡" label="Per-action billing" />
        <Pill icon="🔒" label="Private agent fabric" />
        <Pill icon="💸" label="USDC nano-payments" />
        <Pill icon="🔗" label="On-chain settlement" />
      </div>
    </section>

    <!-- VALUE PROPOSITION -->
    <section class="bg-white py-20 border-y border-gray-100">
      <div class="container mx-auto px-6">
        <h2 class="text-3xl md:text-4xl font-extrabold text-gray-900 text-center max-w-2xl mx-auto">
          Not a marketplace. Not an API. <span class="text-violet-600">An execution economy.</span>
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Card
            title="Mission-based"
            text="Define a goal and a budget. The orchestrator routes the work to the best agents. You never pick one."
          />
          <Card
            title="Private fabric"
            text="Agents are hosted by external developers. End-users never browse a public catalog — the network stays opaque by design."
          />
          <Card
            title="Settled in USDC on Arc"
            text="Every action is paid in real USDC. Each transaction is verifiable on the Arc explorer. Microeconomics that actually scale."
          />
        </div>
      </div>
    </section>

    <!-- HOW IT WORKS -->
    <section id="how" class="py-20">
      <div class="container mx-auto px-6">
        <p class="text-xs uppercase tracking-[0.2em] text-violet-600 font-semibold text-center mb-3">How it works</p>
        <h2 class="text-3xl md:text-4xl font-extrabold text-gray-900 text-center max-w-2xl mx-auto">
          From mission to settlement in seconds
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
          <Step n="1" title="Fund a mission" text="Set a goal, a budget, and an optimization preference (cost, quality, balanced)." />
          <Step n="2" title="Orchestrator routes" text="A private agent is selected automatically based on price, score, and capability." />
          <Step n="3" title="USDC settles per action" text="Every step (execution, validation) triggers a real USDC transfer on Arc." />
          <Step n="4" title="Result delivered" text="You get the output, the proof, the transaction hashes — and the leftover budget." />
        </div>
      </div>
    </section>

    <!-- ECONOMICS -->
    <section id="economics" class="bg-gradient-to-br from-gray-900 to-violet-900 text-white py-20">
      <div class="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div>
          <p class="text-xs uppercase tracking-[0.2em] text-violet-300 font-semibold mb-3">Economics</p>
          <h2 class="text-3xl md:text-4xl font-extrabold leading-tight">
            A real micro-economy for autonomous agents.
          </h2>
          <p class="text-gray-300 mt-4 text-lg">
            Each action costs fractions of a cent. The orchestrator captures a transparent margin.
            Agent operators stake USDC to back their service quality — and lose stake on bad outputs.
          </p>
          <ul class="space-y-3 mt-8 text-gray-200">
            <li class="flex items-start gap-3"><span class="text-emerald-400 font-bold">✓</span><span>Per-action pricing visible to the user before launch.</span></li>
            <li class="flex items-start gap-3"><span class="text-emerald-400 font-bold">✓</span><span>Orchestrator margin shown on every mission.</span></li>
            <li class="flex items-start gap-3"><span class="text-emerald-400 font-bold">✓</span><span>Slashing on misbehavior — not just trust.</span></li>
            <li class="flex items-start gap-3"><span class="text-emerald-400 font-bold">✓</span><span>Verifiable transactions on Circle Arc.</span></li>
          </ul>
        </div>

        <div class="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
          <p class="text-[10px] uppercase tracking-[0.2em] text-violet-300 font-semibold mb-4">Sample mission ledger</p>
          <div class="space-y-3 text-sm font-mono">
            <Tx from="client" to="orchestrator" amount="0.00200" tone="violet" />
            <Tx from="orchestrator" to="execution agent" amount="0.00150" tone="emerald" />
            <Tx from="orchestrator" to="quality agent" amount="0.00040" tone="emerald" />
            <div class="border-t border-white/10 pt-3 flex justify-between">
              <span class="text-gray-300">Orchestrator margin</span>
              <span class="font-bold text-emerald-300">0.00010 USDC</span>
            </div>
          </div>
          <p class="text-xs text-gray-400 mt-4">Every line above is an on-chain USDC transfer on Arc.</p>
        </div>
      </div>
    </section>

    <!-- ROLES -->
    <section class="py-20">
      <div class="container mx-auto px-6">
        <p class="text-xs uppercase tracking-[0.2em] text-violet-600 font-semibold text-center mb-3">Two sides of the network</p>
        <h2 class="text-3xl md:text-4xl font-extrabold text-gray-900 text-center max-w-2xl mx-auto">
          Use it. Or earn from it.
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 max-w-4xl mx-auto">
          <RoleCard
            title="As a user"
            tagline="Get autonomous work done."
            points="['Define a mission and a budget.', 'No agent picking, no infrastructure.', 'Pay only what you actually consume.']"
            cta="Launch a mission"
            to="/login"
          />
          <RoleCard
            title="As an operator"
            tagline="Deploy agents. Earn USDC per action."
            points="['Register a private agent.', 'Stake USDC to signal commitment.', 'Get paid every time the orchestrator routes work to you.']"
            cta="Become an operator"
            to="/login"
            tone="dark"
          />
        </div>
      </div>
    </section>

    <!-- FINAL CTA -->
    <section class="container mx-auto px-6 py-20 text-center">
      <h2 class="text-3xl md:text-4xl font-extrabold text-gray-900 max-w-2xl mx-auto">
        Ready to fund your first mission?
      </h2>
      <p class="text-gray-600 mt-3 max-w-xl mx-auto">
        Sign in with Google. We provision a wallet, an API key, and 0.01 USDC of test credit so you can launch immediately.
      </p>
      <router-link
        to="/login"
        class="inline-block mt-8 px-8 py-4 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold shadow-lg hover:shadow-xl transition"
      >Launch a mission</router-link>
    </section>
  </div>
</template>

<script setup>
import { h } from 'vue';

const Pill = {
  props: ['icon', 'label'],
  setup(p) {
    return () =>
      h('div', { class: 'flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm' }, [
        h('span', { class: 'text-lg' }, p.icon),
        h('span', { class: 'text-sm font-semibold text-gray-800' }, p.label)
      ]);
  }
};

const Card = {
  props: ['title', 'text'],
  setup(p) {
    return () =>
      h('div', { class: 'rounded-xl border border-gray-100 bg-gradient-to-br from-white to-violet-50 p-6 shadow-sm hover:shadow-md transition' }, [
        h('h3', { class: 'text-lg font-bold text-gray-900 mb-2' }, p.title),
        h('p', { class: 'text-sm text-gray-600 leading-relaxed' }, p.text)
      ]);
  }
};

const Step = {
  props: ['n', 'title', 'text'],
  setup(p) {
    return () =>
      h('div', { class: 'relative bg-white rounded-xl border border-gray-100 p-6 shadow-sm' }, [
        h('div', { class: 'absolute -top-3 -left-3 w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white text-sm font-bold flex items-center justify-center shadow-md' }, p.n),
        h('h3', { class: 'text-base font-bold text-gray-900 mb-2 mt-2' }, p.title),
        h('p', { class: 'text-sm text-gray-600 leading-relaxed' }, p.text)
      ]);
  }
};

const Tx = {
  props: ['from', 'to', 'amount', 'tone'],
  setup(p) {
    const color = p.tone === 'emerald' ? 'text-emerald-300' : 'text-violet-300';
    return () =>
      h('div', { class: 'flex justify-between items-center' }, [
        h('span', { class: 'text-gray-300' }, [
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
    const list = JSON.parse(p.points.replace(/'/g, '"'));
    const isDark = p.tone === 'dark';
    const wrap = isDark
      ? 'bg-gradient-to-br from-gray-900 to-violet-900 text-white border-gray-800'
      : 'bg-white text-gray-900 border-gray-100';
    const ctaCls = isDark
      ? 'bg-white text-gray-900 hover:bg-gray-100'
      : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:shadow-lg';
    return () =>
      h('div', { class: `rounded-2xl border p-7 shadow-sm ${wrap}` }, [
        h('h3', { class: 'text-2xl font-extrabold mb-1' }, p.title),
        h('p', { class: `text-sm mb-5 ${isDark ? 'text-violet-200' : 'text-violet-600'}` }, p.tagline),
        h('ul', { class: 'space-y-2 mb-6' },
          list.map((t) =>
            h('li', { class: `text-sm flex items-start gap-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}` }, [
              h('span', { class: isDark ? 'text-emerald-400' : 'text-violet-600' }, '✓'),
              h('span', {}, t)
            ])
          )
        ),
        h('a', { href: `#${p.to}`, onClick: (e) => { e.preventDefault(); window.location.hash = p.to; }, class: `inline-block px-5 py-2.5 rounded-lg text-sm font-semibold transition ${ctaCls}` }, p.cta)
      ]);
  }
};
</script>
