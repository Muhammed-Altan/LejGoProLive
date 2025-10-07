
<template>
  <div :class="['bg-white rounded-2xl p-10 max-w-[400px] mx-auto text-[#111]', stickyClasses]">
    <h2 class="text-xl font-semibold mb-6">Din kurv</h2>
    <div v-if="models.length === 0" class="text-[#888] text-base">Ingen produkter valgt endnu.</div>
    <div v-else>
      <div v-for="(line, idx) in backendBreakdown.models" :key="idx" class="mb-5 text-lg flex items-center">
        <img
          :src="line.image || '/eventyr/GoPro-MountainTop.jpg'"
          :alt="line.name"
          class="w-12 h-12 object-cover rounded mr-3 border border-gray-200 bg-white"
          style="flex-shrink:0;"
        />
        <span>{{ line.quantity }}x <span class="font-semibold">{{ line.name }}</span></span>
        <span class="ml-auto">{{ formatCurrency(line.total) }}</span>
      </div>
      <div class="text-xs text-[#888] mb-4">Beskyttelsescases medfølger til alle modeller.</div>
      <div v-if="backendBreakdown && backendBreakdown.accessories && backendBreakdown.accessories.length" class="mt-6 mb-4">
        <div class="font-semibold mb-2 text-[1.05rem]">Ekstra udstyr:</div>
        <div>
          <div v-for="(acc, i) in backendBreakdown.accessories" :key="i" class="text-base mb-1 flex">
            <span>{{ acc.quantity }}x {{ acc.name }}</span>
            <span class="ml-auto">{{ formatCurrency(acc.total) }}</span>
          </div>
        </div>
      </div>
      <div v-if="backendBreakdown && backendBreakdown.discountTotal > 0" class="flex justify-between text-base mt-5 font-medium">
        <span class="text-green-700">Du sparer</span>
        <span class="font-semibold text-green-700">-{{ formatCurrency(backendBreakdown.discountTotal) }}</span>
      </div>
      <div v-if="insurance" class="flex justify-between text-base mt-5">
        <span>Forsikring</span>
        <span>
          <template v-if="backendBreakdown && backendBreakdown.insurance !== undefined && backendBreakdown.insurance !== null">
            {{ formatCurrency(backendBreakdown.insurance) }}
          </template>
          <template v-else>—</template>
        </span>
      </div>
      <div class="flex justify-between text-base mt-2">
        <span>Levering</span>
        <span class="text-[#888]">Gratis</span>
      </div>
      <div class="flex justify-between items-end mt-8 text-[1.3rem] font-semibold">
        <span class="text-[1.2rem] font-semibold">I alt:</span>
        <span class="text-[1.3rem] font-semibold text-[#222]">
          <span v-if="loading">Beregner…</span>
          <span v-else-if="error">Fejl</span>
          <span v-else><span class="text-base text-[#888] mr-1">DKK</span> {{ formatCurrency(backendTotal) }}</span>
        </span>
      </div>
      <div class="text-sm text-[#888] mt-2" v-if="rentalDays > 0">Antal dage: {{ rentalDays }}</div>
      <div class="text-sm text-[#d00] mt-2" v-if="error">{{ error }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useCheckoutStore } from '@/stores/checkout';
import { useNuxtApp } from '#app';

const store = useCheckoutStore();
const stickyClasses = computed(() => 'lg:sticky lg:top-20 lg:max-h-[calc(100vh-5rem)] lg:overflow-auto');
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
    // Calculate prices locally instead of calling external API
    let total = 0;
    const breakdown: any = {
      models: [],
      accessories: [],
      insurance: 0,
      subtotal: 0,
      total: 0
    };

    // Calculate model prices with new logic
    models.value.forEach((model, idx) => {
      const quantity = model.quantity || 1;
      const config = model.config || {
        dailyPrice: model.price,
        weeklyPrice: model.price * 7,
        twoWeekPrice: model.price * 14
      };
      let modelTotal = 0;
      let pricePerDay = config.dailyPrice;
      let priceType = 'daily';
      if (rentalDays.value <= 6) {
        // 1–6 dage: dagspris × antal dage
        modelTotal = config.dailyPrice * rentalDays.value * quantity;
        pricePerDay = config.dailyPrice;
        priceType = 'daily';
      } else if (rentalDays.value === 7) {
        // 7 dage: ugepris
        modelTotal = config.weeklyPrice * quantity;
        pricePerDay = config.weeklyPrice / 7;
        priceType = 'weekly';
      } else if (rentalDays.value >= 8 && rentalDays.value <= 13) {
        // 8–13 dage: (ugepris / 7) × antal dage
        modelTotal = (config.weeklyPrice / 7) * rentalDays.value * quantity;
        pricePerDay = config.weeklyPrice / 7;
        priceType = 'weekly-pro-rata';
      } else if (rentalDays.value === 14) {
        // 14 dage: 2-ugers pris
        modelTotal = config.twoWeekPrice * quantity;
        pricePerDay = config.twoWeekPrice / 14;
        priceType = 'two-week';
      } else if (rentalDays.value > 14) {
        // 15+ dage: (2-ugers pris / 14) × antal dage
        modelTotal = (config.twoWeekPrice / 14) * rentalDays.value * quantity;
        pricePerDay = config.twoWeekPrice / 14;
        priceType = 'two-week-pro-rata';
      }
      // Apply 25% discount to all except first
      let discount = idx > 0 ? pricePerDay * 0.25 : 0;
      let discountedPricePerDay = pricePerDay - discount;
      // If discount applies, recalculate total
      if (discount > 0) {
        modelTotal = discountedPricePerDay * rentalDays.value * quantity;
      }
      total += modelTotal;
      breakdown.models.push({
        name: model.name,
        quantity,
        pricePerDay,
        discountedPricePerDay,
        discount,
        days: rentalDays.value,
        total: modelTotal,
        originalTotal: pricePerDay * rentalDays.value * quantity,
        priceType
      });
    });
    // Calculate total discount for all models
  breakdown.discountTotal = breakdown.models.reduce((sum: number, m: any) => sum + ((m.discount || 0) * m.quantity * m.days), 0);

    // Calculate accessory prices
    for (const accessory of accessories.value) {
      const quantity = accessory.quantity || 1;
      // Accessory price is for the entire booking, not per day
      const accessoryTotal = accessory.price * quantity;
      total += accessoryTotal;
      
      breakdown.accessories.push({
        name: accessory.name,
        quantity,
        priceTotal: accessory.price,
        total: accessoryTotal
      });
    }

    // Add insurance if selected (assuming 10% of subtotal)
    if (insurance.value) {
      const insuranceAmount = total * 0.1; // 10% insurance
      breakdown.insurance = insuranceAmount;
      total += insuranceAmount;
    }

    breakdown.subtotal = total - breakdown.insurance;
    breakdown.total = total;
    
    backendTotal.value = total;
    backendBreakdown.value = breakdown;
    
    // Update the store with the calculated total
    store.setBackendTotal(total);
    console.log('🛒 BasketView: Updated store backendTotal to:', total);
  } catch (e: any) {
    error.value = (typeof e === 'object' && e && 'message' in e) ? (e as any).message : 'Ukendt fejl ved prisberegning';
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
</style>
