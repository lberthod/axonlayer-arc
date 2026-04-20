<template>
  <div>
    <div class="flex items-center justify-between mb-3">
      <div>
        <h3 class="text-sm font-bold text-gray-900">Private execution fabric</h3>
        <p class="text-[11px] text-gray-500">Agents hosted by external developers — not directly callable by end-users.</p>
      </div>
      <button
        @click="refresh"
        :disabled="loading"
        class="text-xs px-2 py-1 rounded-md bg-gray-900 text-white disabled:bg-gray-400"
      >
        {{ loading ? '...' : 'Refresh' }}
      </button>
    </div>

    <div v-if="data">
      <div class="mb-4">
        <p class="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Execution agents</p>
        <AgentCards :rows="data.workers" kind="execution" />
      </div>
      <div>
        <p class="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Quality agents</p>
        <AgentCards :rows="data.validators" kind="quality" />
      </div>
      <p class="text-[11px] text-gray-500 mt-3">
        Strategy: <span class="font-mono">{{ data.strategy }}</span>
      </p>
    </div>

    <div v-else-if="error" class="text-red-600 text-sm">{{ error }}</div>
    <div v-else class="text-gray-500 text-center py-4 text-sm">Loading…</div>
  </div>
</template>

<script setup>
import { ref, onMounted, h } from 'vue';
import { api } from '../services/api.js';

const data = ref(null);
const loading = ref(false);
const error = ref('');

const refresh = async () => {
  loading.value = true;
  error.value = '';
  try {
    data.value = await api.getAgents();
  } catch (err) {
    error.value = err.message || 'Failed to load agents';
  } finally {
    loading.value = false;
  }
};

defineExpose({ refresh });

onMounted(refresh);

const AgentCards = {
  props: ['rows', 'kind'],
  setup(props) {
    return () => {
      if (!props.rows?.length) {
        return h('div', { class: 'text-xs text-gray-500' }, 'No agents.');
      }
      return h(
        'div',
        { class: 'grid grid-cols-1 sm:grid-cols-2 gap-2' },
        props.rows.map((row) => {
          const isExternal = row.providerId || row.ownerUid || row.ownerType === 'third_party';
          return h(
            'div',
            {
              key: row.id,
              class: 'border border-gray-200 rounded-lg p-2.5 bg-white hover:border-violet-300 transition'
            },
            [
              h('div', { class: 'flex items-start justify-between mb-1.5' }, [
                h('span', { class: 'font-semibold text-sm text-gray-900 truncate' }, row.name || row.id),
                h(
                  'div',
                  {
                    class: 'flex flex-col items-end gap-0.5'
                  },
                  [
                    h(
                      'div',
                      {
                        class: 'flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold px-2 py-1 rounded-full bg-violet-900 text-violet-100 shadow-md'
                      },
                      ['🔒', 'PRIVATE AGENT']
                    ),
                    h(
                      'div',
                      {
                        class: 'text-[8px] text-gray-600 text-right leading-tight max-w-28 bg-violet-50 rounded px-1.5 py-1 border border-violet-100'
                      },
                      [
                        h('div', { class: 'font-semibold text-violet-800 mb-0.5' }, '• Hosted on external VPS'),
                        h('div', { class: 'text-gray-600' }, '• Not accessible directly'),
                        h('div', { class: 'text-gray-600' }, '• Only callable via ArcAgent Hub')
                      ]
                    )
                  ]
                )
              ]),
              h('p', { class: 'text-[10px] text-gray-500 font-mono truncate' }, row.id),
              h('div', { class: 'grid grid-cols-3 gap-1 mt-2 text-[11px]' }, [
                h('div', {}, [
                  h('span', { class: 'text-gray-400 block text-[9px]' }, 'Price'),
                  h('span', { class: 'font-semibold text-gray-800' }, `${row.basePrice} USDC`)
                ]),
                h('div', {}, [
                  h('span', { class: 'text-gray-400 block text-[9px]' }, 'Score'),
                  h('span', { class: 'font-semibold text-gray-800' }, row.score.toFixed(2))
                ]),
                h('div', {}, [
                  h('span', { class: 'text-gray-400 block text-[9px]' }, 'Served'),
                  h('span', { class: 'font-semibold text-gray-800' }, row.completed)
                ])
              ]),
              h(
                'p',
                { class: 'text-[10px] text-gray-500 mt-1.5' },
                [
                  h('span', { class: 'text-gray-400' }, 'Owner: '),
                  h(
                    'span',
                    { class: 'font-semibold' },
                    'External Developer'
                  )
                ]
              ),
              h(
                'p',
                { class: 'text-[10px] text-gray-400 mt-0.5 truncate' },
                (row.taskTypes || []).join(', ')
              )
            ]
          );
        })
      );
    };
  }
};
</script>
