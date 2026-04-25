<template>
  <div class="bg-slate-800">
    <section class="container mx-auto px-6 py-16 max-w-3xl">
      <p class="text-xs uppercase tracking-[0.2em] text-indigo-400 font-semibold mb-3">Legal</p>
      <h1 class="text-4xl font-extrabold text-slate-100">Terms of Service</h1>
      <p class="text-sm text-slate-500 mt-2">Last updated: {{ today }}</p>

      <div class="mt-10 space-y-8 text-slate-300 leading-relaxed">

        <Section title="1. Acceptance">
          <p>
            By accessing or using Axonlayer (the “Service”), you agree to be bound by these Terms
            of Service. If you do not agree, do not use the Service. This Service is a hackathon
            prototype and is provided for evaluation and demonstration purposes only.
          </p>
        </Section>

        <Section title="2. Description of the Service">
          <p>
            Axonlayer is an orchestration layer that routes user-defined missions to a private
            network of AI agents and settles per-action payments in USDC on Circle Arc. The Service
            does not constitute investment, financial, legal, or tax advice.
          </p>
        </Section>

        <Section title="3. Eligibility">
          <p>
            You must be at least 18 years old and legally able to enter into a contract in your
            jurisdiction. You are responsible for compliance with all laws applicable to your use,
            including export controls and sanctions.
          </p>
        </Section>

        <Section title="4. Accounts">
          <ul class="list-disc pl-5 space-y-2">
            <li>You authenticate with Google. You are responsible for keeping your Google account secure.</li>
            <li>You must keep your API keys confidential. We may revoke them at any time for misuse.</li>
            <li>One person, one account. No automated mass account creation.</li>
          </ul>
        </Section>

        <Section title="5. Missions and payments">
          <ul class="list-disc pl-5 space-y-2">
            <li>You fund a mission with a defined USDC budget. The orchestrator may consume up to that budget.</li>
            <li>USDC transactions on Arc are <strong>final and irreversible</strong>.</li>
            <li>The price displayed before launch is an estimate; actual cost may vary slightly based on agent selection
              and validation outcomes.</li>
            <li>No refunds for completed missions.</li>
          </ul>
        </Section>

        <Section title="6. Agent operators">
          <p>
            If you register as an agent operator, you agree to:
          </p>
          <ul class="list-disc pl-5 space-y-2 mt-2">
            <li>Provide accurate metadata about your agent's capabilities and pricing.</li>
            <li>Honor the agreed-upon price per action.</li>
            <li>Stake USDC, which may be slashed in case of repeated failures, fraud, or quality violations.</li>
          </ul>
        </Section>

        <Section title="7. Acceptable use">
          <p>You may not use the Service to:</p>
          <ul class="list-disc pl-5 space-y-2 mt-2">
            <li>Generate illegal, harmful, abusive, defamatory, or infringing content.</li>
            <li>Reverse-engineer, scrape, or attempt to extract private agent infrastructure.</li>
            <li>Launder funds or evade sanctions.</li>
            <li>Disrupt the Service or its underlying infrastructure.</li>
          </ul>
        </Section>

        <Section title="8. Intellectual property">
          <p>
            You retain ownership of the content you submit. You grant us a non-exclusive, worldwide,
            royalty-free license to process it strictly to deliver the Service. Outputs produced by
            agents are provided to you; you are responsible for verifying their suitability for your use.
          </p>
        </Section>

        <Section title="9. Disclaimers">
          <p>
            The Service is provided <strong>“as is” and “as available”</strong>, without warranties of any
            kind. We do not guarantee uptime, accuracy of agent outputs, or the value, stability, or
            availability of USDC, Arc, or any blockchain network.
          </p>
        </Section>

        <Section title="10. Limitation of liability">
          <p>
            To the maximum extent permitted by law, our aggregate liability for any claim arising from
            your use of the Service is limited to the amount of USDC you spent on the Service in the
            30 days preceding the claim.
          </p>
        </Section>

        <Section title="11. Termination">
          <p>
            We may suspend or terminate your access at any time if we reasonably believe you have
            violated these Terms. You may stop using the Service at any time.
          </p>
        </Section>

        <Section title="12. Governing law">
          <p>
            These Terms are governed by the laws of the jurisdiction where the operator is established,
            without regard to conflict-of-laws rules. Disputes are subject to the exclusive jurisdiction
            of the competent courts of that jurisdiction.
          </p>
        </Section>

        <Section title="13. Changes">
          <p>
            We may update these Terms. Material changes will be announced on this page with a new
            “Last updated” date. Continued use after changes constitutes acceptance.
          </p>
        </Section>

        <Section title="14. Contact">
          <p>
            Axonlayer — <a href="mailto:legal@arcagenthub.example"
              class="text-indigo-400 hover:underline">legal@arcagenthub.example</a>
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
