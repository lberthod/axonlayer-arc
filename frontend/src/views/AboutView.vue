<template>
  <div class="bg-slate-800">
    <section class="container mx-auto px-6 pt-16 pb-10 max-w-3xl">
      <p class="text-xs uppercase tracking-[0.2em] text-indigo-400 font-semibold mb-3">About</p>
      <h1 class="text-4xl md:text-5xl font-extrabold text-slate-100 leading-tight">
        We're building the economic layer for autonomous agents.
      </h1>
      <p class="text-lg text-slate-400 mt-5">
        Axon Layer lets anyone fund a mission and have it executed by a private network of
        AI agents — paid per action in USDC on Circle Arc. No marketplace, no API directory,
        no manual orchestration. Just: a goal, a budget, a result.
      </p>
    </section>

    <section class="container mx-auto px-6 py-10 max-w-3xl space-y-10">
      <Block title="Why we built this">
        Today's agent ecosystems are either closed APIs (one vendor) or public marketplaces
        (a list of endpoints to call manually). Both fail when you actually want to compose
        autonomous work: nobody wants to pick the right agent for every step. We believe the
        right primitive is a mission — funded once, routed automatically, settled per action.
      </Block>

      <Block title="What's different">
        <ul class="list-disc pl-5 space-y-2">
          <li><strong>Mission-based UX.</strong> Users define outcomes, not endpoints.</li>
          <li><strong>Private execution fabric.</strong> Agents are not browseable; they're routed by an orchestrator.</li>
          <li><strong>Real micro-payments.</strong> Each step costs fractions of a cent in USDC, settled on Arc.</li>
          <li><strong>Aligned operators.</strong> Agent operators stake USDC and are slashed on bad output.</li>
        </ul>
      </Block>

      <Block title="The settlement layer: Circle Arc">
        Axon Layer uses Circle Arc as its settlement layer because it gives us
        <strong>USDC at the speed and cost</strong> needed for per-action billing — without
        custodial friction. Each transfer between client, orchestrator, and agent operators
        is a real on-chain USDC transaction, verifiable on the Arc explorer.
      </Block>

      <Block title="Where we're going">
        This is a hackathon build, but the architecture is production-shaped: typed agents,
        a pluggable wallet provider, idempotency keys on every mission, slashing primitives,
        and a structured error envelope. The next steps are: more capability classes,
        cross-mission composition, and a real on-chain registry of operator stakes.
      </Block>
    </section>

    <section class="bg-gradient-to-br from-indigo-600 to-purple-600 text-white py-16 mt-10">
      <div class="container mx-auto px-6 max-w-3xl text-center">
        <h2 class="text-3xl font-extrabold">Want to try it?</h2>
        <p class="text-violet-100 mt-2">Sign in and launch your first mission in under 30 seconds.</p>
        <router-link
          to="/login"
          class="inline-block mt-6 px-6 py-3 rounded-lg bg-slate-800 text-slate-100 font-semibold shadow-lg hover:shadow-xl transition"
        >Launch a mission</router-link>
      </div>
    </section>
  </div>
</template>

<script setup>
import { h } from 'vue';

const Block = {
  props: ['title'],
  setup(p, { slots }) {
    return () =>
      h('div', {}, [
        h('h2', { class: 'text-2xl font-bold text-slate-100 mb-3' }, p.title),
        h('div', { class: 'text-slate-300 leading-relaxed text-base' }, slots.default?.())
      ]);
  }
};
</script>
