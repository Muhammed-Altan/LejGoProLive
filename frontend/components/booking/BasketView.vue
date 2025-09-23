<template>
  <div class="bg-white rounded-2xl p-8 max-w-lg mx-auto shadow-md" :class="stickyClasses">
    <h2 class="text-2xl font-semibold mb-4">Din kurv</h2>
    <div v-if="models.length === 0" class="text-gray-500">Ingen produkter valgt endnu.</div>
    <div v-else class="space-y-4">
      <div v-for="(line, idx) in models" :key="idx" class="border rounded-lg p-4">
        <div class="flex justify-between items-center">
          <div>
            <div class="font-semibold">{{ line.name }}</div>
            <div class="text-sm text-gray-500">x{{ line.quantity }}</div>
			<div class="text-sm text-gray-500">{{ line.price }} kr.</div>
          </div>
          <!-- Per-line price calculation is not shown, only grand total from backend is used -->
        </div>
      </div>
      <div v-if="backendBreakdown && backendBreakdown.accessories && backendBreakdown.accessories.length" class="pt-2">
        <div class="font-semibold mb-1">Tilbehør</div>
        <div class="space-y-1">
          <div v-for="(acc, i) in backendBreakdown.accessories" :key="i" class="flex justify-between text-sm">
            <span>{{ acc.quantity }}x {{ acc.name }}</span>
            <span>{{ formatCurrency(acc.price) }}</span>
          </div>
        </div>
      </div>
      <div class="flex justify-between text-base mt-4">
        <span>Forsikring</span>
        <span>
          <template v-if="backendBreakdown && backendBreakdown.insurance !== undefined && backendBreakdown.insurance !== null">
            {{ formatCurrency(backendBreakdown.insurance) }}
          </template>
          <template v-else>—</template>
        </span>
      </div>
      <div class="flex justify-between text-base mt-1">
        <span>Levering</span>
        <span class="text-gray-400">Gratis</span>
      </div>
      <div class="border-t pt-4 mt-4">
        <div class="flex justify-between items-end">
          <span class="text-xl font-semibold">I alt</span>
          <span class="text-xl font-semibold">
            <span v-if="loading">Beregner…</span>
            <span v-else-if="error">Fejl</span>
            <span v-else>{{ formatCurrency(backendTotal) }}</span>
          </span>
        </div>
        <div class="text-xs text-gray-500 mt-1" v-if="rentalDays > 0">Antal dage: {{ rentalDays }}</div>
        <div class="text-xs text-red-500 mt-1" v-if="error">{{ error }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useCheckoutStore } from '@/stores/checkout';
import { useNuxtApp } from '#app';

const store = useCheckoutStore();
const stickyClasses = computed(() => 'lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-auto');
const models = computed(() => store.selectedModels || []);
const accessories = computed(() => store.selectedAccessories || []);
const insurance = computed(() => !!store.insurance);
function diffDaysInclusive(start: Date | string | null | undefined, end: Date | string | null | undefined) {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
  // Normalize to midnight to avoid DST/timezone issues
  s.setHours(0, 0, 0, 0);
  e.setHours(0, 0, 0, 0);
  const msPerDay = 24 * 60 * 60 * 1000;
  const diff = Math.round((e.getTime() - s.getTime()) / msPerDay) + 1; // inclusive
  return diff > 0 ? diff : 0;
}
const rentalDays = computed(() => diffDaysInclusive(store.startDate, store.endDate));

const backendTotal = ref<number|null>(null);
const backendBreakdown = ref<any|null>(null);
const loading = ref(false);
const error = ref<string|null>(null);

async function fetchBackendTotal() {
  if (!models.value.length || rentalDays.value <= 0) {
    backendTotal.value = 0;
    backendBreakdown.value = null;
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    const { $config } = useNuxtApp();
    const base = ($config?.public?.apiBase) || 'http://localhost:3001';
    const res = await fetch(`${base}/price/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        models: models.value.map(m => ({
          name: m.name,
          quantity: m.quantity || 1,
          config: m.config || { dailyPrice: m.price, weeklyPrice: m.price * 7, twoWeekPrice: m.price * 14 },
        })),
        accessories: accessories.value.map(a => ({ name: a.name, quantity: a.quantity || 1, price: a.price })),
        days: rentalDays.value,
        insurance: insurance.value,
      }),
    });
    if (!res.ok) throw new Error('Prisforespørgsel fejlede');
    const data = await res.json();
    backendTotal.value = typeof data.total === 'number' ? data.total : 0;
    backendBreakdown.value = data.breakdown || null;
  } catch (e: any) {
    error.value = (typeof e === 'object' && e && 'message' in e) ? (e as any).message : 'Ukendt fejl ved prisforespørgsel';
    backendTotal.value = null;
    backendBreakdown.value = null;
  } finally {
    loading.value = false;
  }
}

// Watch for changes and update price live
watch([models, accessories, insurance, rentalDays], fetchBackendTotal, { immediate: true, deep: true });

function formatCurrency(n: number|null) {
  if (n == null) return '—';
  return new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK', minimumFractionDigits: 0 }).format(n);
}
</script>

<style scoped>
* { color: black !important; }
</style>
