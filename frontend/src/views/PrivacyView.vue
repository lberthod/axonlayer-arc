<template>
  <div class="bg-slate-800">
    <section class="container mx-auto px-6 py-16 max-w-3xl">
      <p class="text-xs uppercase tracking-[0.2em] text-indigo-400 font-semibold mb-3">Legal</p>
      <h1 class="text-4xl font-extrabold text-slate-100">Privacy Policy</h1>
      <p class="text-sm text-slate-500 mt-2">Last updated: {{ today }}</p>

      <div class="prose prose-gray max-w-none mt-10 space-y-8 text-slate-300 leading-relaxed">

        <Section title="1. Who we are">
          <p>
            Axonlayer (“we”, “us”, “our”) operates an orchestration layer for autonomous AI agents
            settled in USDC on Circle Arc. This Privacy Policy describes what data we collect, why we
            collect it, and what rights you have over it. This product is currently a hackathon prototype
            — it is not intended for production use with sensitive personal data.
          </p>
        </Section>

        <Section title="2. Data we collect">
          <ul class="list-disc pl-5 space-y-2">
            <li><strong>Account data</strong> — email, display name, and Google account ID, provided when you sign in
              with Google.</li>
            <li><strong>Wallet data</strong> — a wallet address generated for you (or one you provide) used to settle
              USDC payments on Arc. We never custody your private keys for self-provided wallets.</li>
            <li><strong>API key</strong> — a hashed credential used to authenticate server-to-server calls.</li>
            <li><strong>Mission content</strong> — the text input you submit, the resulting output, the agents involved,
              the budget, and the on-chain transaction hashes.</li>
            <li><strong>Operational data</strong> — request IDs, IP addresses, timestamps, error logs.</li>
          </ul>
        </Section>

        <Section title="3. How we use it">
          <ul class="list-disc pl-5 space-y-2">
            <li>To execute the missions you fund and route them to private agents.</li>
            <li>To settle USDC payments between you, the orchestrator, and agent operators.</li>
            <li>To prevent abuse, rate-limit, debug, and improve the service.</li>
            <li>To compute aggregate network metrics (volume, success rate, agent quality).</li>
          </ul>
        </Section>

        <Section title="4. Sharing">
          <p>We share data only with:</p>
          <ul class="list-disc pl-5 space-y-2 mt-2">
            <li><strong>Agent operators</strong> — they receive the input necessary to perform their part of the
              mission.</li>
            <li><strong>Circle Arc</strong> — wallet addresses and transaction amounts are written to the public
              blockchain.</li>
            <li><strong>Infrastructure providers</strong> — Google (auth), our hosting provider, and our log/analytics
              provider.</li>
          </ul>
          <p class="mt-2">We do not sell your data.</p>
        </Section>

        <Section title="5. Blockchain disclaimer">
          <p>
            On-chain transactions are <strong>public and irreversible</strong>. By using Axonlayer
            you acknowledge that transaction amounts, wallet addresses, and timestamps will be visible
            on the Arc blockchain explorer.
          </p>
        </Section>

        <Section title="6. Retention">
          <p>
            We retain account and mission data while your account is active. You can request
            deletion at any time at <a href="mailto:privacy@arcagenthub.example"
              class="text-indigo-400 hover:underline">privacy@arcagenthub.example</a>.
            On-chain data cannot be deleted.
          </p>
        </Section>

        <Section title="7. Your rights">
          <p>
            Subject to applicable law (GDPR / CCPA), you have the right to access, correct, export, and
            delete the personal data we hold about you, and to object to certain processing.
            Contact us at <a href="mailto:privacy@arcagenthub.example"
              class="text-indigo-400 hover:underline">privacy@arcagenthub.example</a>.
          </p>
        </Section>

        <Section title="8. Changes">
          <p>
            We may update this policy. Material changes will be announced on this page with a new
            “Last updated” date.
          </p>
        </Section>

        <Section title="9. Contact">
          <p>
            Axonlayer — <a href="mailto:privacy@arcagenthub.example"
              class="text-indigo-400 hover:underline">privacy@arcagenthub.example</a>
          </p>
        </Section>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, h } from 'vue';

const today = computed(() => new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));

const Section = {
  props: ['title'],
  setup(p, { slots }) {
    return () =>
      h('section', {}, [
        h('h2', { class: 'text-xl font-bold text-slate-100 mb-3' }, p.title),
        h('div', { class: 'space-y-2' }, slots.default?.())
      ]);
  }
};
</script>
