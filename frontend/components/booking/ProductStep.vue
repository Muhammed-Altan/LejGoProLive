<template>
  <div class="space-y-6 w-full max-w-2xl mx-auto">
    <article>
      <h1 class="font-semibold text-lg">Vælg dit udstyr</h1>
      <h2 class="font-medium text-base">
        Udfyld formularen nedenfor for at få et tilbud
      </h2>
    </article>
    <!-- Booking Period Picker (Styled Section) -->
    <section class="bg-gray-50 rounded-xl p-6 shadow flex flex-col gap-2">
      <div class="flex items-center justify-between mb-2">
        <h2 class="font-semibold text-lg">Vælg din booking periode</h2>
      </div>
      <div class="flex gap-4">
        <div class="flex-1">
          <VueDatePicker
            v-model="startDate"
            :enable-time-picker="false"
            format="dd/MM/yyyy"
            :input-class="'w-full border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-400'"
            placeholder="Start dato"
            :auto-apply="true"
            :min-date="minStartDate"
            :disabled-dates="isStartDateDisabled"
          />
          <!-- Small helper text -->
          <!-- <p class="mt-2 text-sm text-gray-500">Bemærk: Startdato må ikke være en weekend (lørdag eller søndag).</p> -->
        </div>
        <div class="flex-1">
              <VueDatePicker
                v-model="endDate"
                :enable-time-picker="false"
                format="dd/MM/yyyy"
                :input-class="'w-full border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-400'"
                placeholder="Slut dato"
                :auto-apply="true"
                :min-date="minEndDate"
                :disabled="!startDate"
                :start-date="startDate || new Date()"
              />
        </div>
      </div>
    </section>
    <!-- GoPro Model Selection (Dropdown) -->
    <section class="bg-gray-50 rounded-xl p-6 shadow flex flex-col gap-2">
      <div class="flex items-center justify-between mb-2">
        <h2 class="font-semibold text-lg">Vælg en GoPro Model</h2>
      </div>
      <div v-if="!datesSelected" class="mb-3 p-3 rounded bg-yellow-100 border border-yellow-300 text-yellow-900 flex items-center gap-2 animate-pulse">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>
        <span>Vælg venligst bookingperiode først for at vælge model.</span>
      </div>
      <div v-if="availabilityLoading && datesSelected" class="mb-3 p-3 rounded bg-blue-100 border border-blue-300 text-blue-900 flex items-center gap-2">
        <svg class="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Checking availability...</span>
      </div>
      <div class="flex items-center gap-3">
        <select
          v-model="selectedModelName"
          :disabled="!datesSelected || availabilityLoading"
          class="flex-1 w-full border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
        >
          <option disabled value="">Vælg en model…</option>
          <option
            v-for="model in models"
            :key="model.name"
            :value="model.name"
            :disabled="!isProductAvailable(model.id, 1)"
            :class="{
              'text-gray-400': !isProductAvailable(model.id, 1),
              'text-red-600': datesSelected && getMaxProductQuantity(model.id) === 0
            }"
          >
            {{ model.name }} — {{ Math.ceil(model.twoWeekPrice ? (model.twoWeekPrice / 14) : (model.price)) }} kr./dag
            <span v-if="datesSelected">
              <template v-if="getMaxProductQuantity(model.id) === 0"> - Ikke tilgængelig</template>
              <template v-else> - {{ getMaxProductQuantity(model.id) }} tilgængelige</template>

            </span>
          </option>
          <option disabled value="" style="border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 4px; font-style: italic; color: #6b7280;">
            Har du brug for 7+ GoPros? Kontakt os på email for en specialpris
          </option>
        </select>
        <button
          :disabled="!selectedModelName || !datesSelected || selectedModels.length >= 2 || availabilityLoading || !canAddSelectedModel"
          @click="onAddSelectedModel"
          class="flex items-center tilfoej-btn font-semibold disabled:opacity-40"
          :title="getAddButtonTooltip()"
        >
          <span class="mr-1 text-xl plus-red">+</span> Tilføj
        </button>
      </div>
    </section>

    <!-- Availability Error Display -->
    <div v-if="availabilityError" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div class="flex items-center gap-2">
        <svg class="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span class="text-red-700 font-medium">Availability Issue</span>
      </div>
      <p class="text-red-600 mt-1">{{ availabilityError }}</p>
    </div>

    <!-- Selected Model and Quantity (Unified) -->
    <section v-if="selectedModels && selectedModels.length" class="space-y-2">
      <div
        v-for="(item, idx) in selectedModels"
        :key="item.name"
        class="flex items-center gap-4 bg-gray-100 rounded-lg py-4 px-4"
      >
      <img 
        src="/eventyr/GoPro-MountainTop.jpg" 
        alt="" 
        class="w-16 h-16 object-cover rounded mr-3 border border-gray-200 bg-white">

        <div class="flex-1">
           <p class="font-medium">{{ item.name }}</p> <p class="text-xs text-gray-600">inkluderer: Beskyttelsescase, Batteri, Rejsetaske</p>
        </div>
        <div class="flex items-center justify-center gap-2 group relative">
          <span>
            Antal
            <small class="text-xs text-gray-500">(max: {{ getMaxProductQuantityForItem(item) }})</small>
            <small v-if="availabilityLoading" class="ml-2 text-xs text-gray-400">• henter tilgængelighed…</small>
          </span>
          <input
            type="number"
            min="1"
            :max="item.productId !== undefined ? getMaxProductQuantity(item.productId) : 1"

            v-model.number="item.quantity"
            :disabled="getMaxProductQuantityForItem(item) <= 1"
            class="w-12 text-center rounded border border-gray-300"
            :class="{ 'bg-gray-100 cursor-not-allowed border-none': getMaxProductQuantityForItem(item) <= 1 }"
          />
          <span
            v-if="item.productId !== undefined && item.quantity === getMaxProductQuantity(item.productId)"

            class="absolute left-1/2 z-10 -translate-x-1/2 -top-14 w-56 rounded bg-white text-white text-xs px-3 py-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-normal shadow-lg"
            style="color: #b90c2c; background: #FF8800"
          >
            Maksimum antal valgt
          </span>
        </div>
        <button
          @click="removeModel(idx)"
          class="ml-2 text-sm text-gray-500 fjern-btn cursor-pointer tilfoej-btn"
        >
          Fjern
        </button>
      </div>
    </section>

    <!-- Accessories Selection (Dropdown) -->
    <section class="bg-gray-50 rounded-xl p-6 shadow flex flex-col gap-2">
      <div class="flex items-center justify-between mb-2">
        <h2 class="font-semibold text-lg">Vælg tilbehør</h2>
      </div>
      <div v-if="!datesSelected" class="mb-3 p-3 rounded bg-yellow-100 border border-yellow-300 text-yellow-900 flex items-center gap-2 animate-pulse">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>
        <span>Vælg venligst bookingperiode først for at vælge tilbehør.</span>
      </div>
      <div v-if="availabilityLoading && datesSelected" class="mb-3 p-3 rounded bg-blue-100 border border-blue-300 text-blue-900 flex items-center gap-2">
        <svg class="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Checking availability...</span>
      </div>
      <div class="flex items-center gap-3">
        <select
          v-model="selectedAccessoryName"
          :disabled="!datesSelected"
          class="flex-1 w-full border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
        >
          <option disabled value="">Vælg tilbehør…</option>
          <option
            v-for="acc in accessories"
            :key="acc.name"
            :value="acc.name"
            :disabled="isAccessoryAtMaxQuantity(acc.name) || isAccessoryUnavailable(acc.name)"
            :class="{ 'text-gray-400': isAccessoryAtMaxQuantity(acc.name) || isAccessoryUnavailable(acc.name) }"
            :title="getAccessoryTooltipMessage(acc.name) || (isAccessoryUnavailable(acc.name) ? 'Ikke tilgængelig i denne periode' : '')"
          >
            {{ acc.name }} — {{ Math.ceil(acc.price) }} kr./Booking
            <span v-if="datesSelected && acc.id">
              ({{ isAccessoryAvailable(acc.id, 1) ? 'Available' : 'Not available' }})
            </span>
          </option>
        </select>
        <div 
          :title="selectedAccessoryName && (isAccessoryAtMaxQuantity(selectedAccessoryName) || isAccessoryUnavailable(selectedAccessoryName)) ? (getAccessoryTooltipMessage(selectedAccessoryName) || 'Ikke tilgængelig i denne periode') : ''"
          class="inline-block"
        >
          <button
            :disabled="!selectedAccessoryName || !datesSelected || (selectedAccessoryName ? (isAccessoryAtMaxQuantity(selectedAccessoryName) || isAccessoryUnavailable(selectedAccessoryName)) : false)"
            @click="onAddSelectedAccessory"
            class="flex items-center tilfoej-btn font-semibold disabled:opacity-40"
          >
            <span class="mr-1 text-xl plus-red">+</span> Tilføj
          </button>
        </div>
      </div>
    </section>

    <!-- Selected Accessory and Quantity (Unified Style) -->
    <section v-if="selectedAccessories && selectedAccessories.length" class="space-y-2">
      <div
        v-for="(item, idx) in selectedAccessories"
        :key="item.name"
        class="flex items-center gap-4 rounded-lg py-4 px-4"
        :class="{
          'bg-gray-100': !isAccessoryAtActualLimit(item),
          'bg-orange-50 border-2 border-orange-300': isAccessoryAtActualLimit(item)
        }"
      >
      <img 
        src="/eventyr/GoPro-MountainTop.jpg" 
        alt="" 
        class="w-16 h-16 object-cover rounded mr-3 border border-gray-200 bg-white">

        <div class="flex-1 font-medium">
          {{ item.name }}
          <!-- Max quantity disclaimer - only show when at problematic limit -->
          <div 
            v-if="isAccessoryAtActualLimit(item)" 
            class="text-xs text-orange-600 mt-1 font-normal"
          >
            {{ getAccessoryTooltipMessage(item.name) }}
          </div>
        </div>
        <div class="flex items-center justify-center gap-2">
          <span>Antal</span>
          <input
            type="number"
            min="1"
            :max="getMaxAccessoryQuantity(item)"
            v-model.number="item.quantity"
            @input="onAccessoryQuantityChange"
            :disabled="getMaxAccessoryQuantity(item) <= 1"
            class="w-12 text-center rounded border"
            :class="{
              'border-gray-300': !isAccessoryAtActualLimit(item),
              'border-orange-300 bg-orange-50': isAccessoryAtActualLimit(item),
              'cursor-not-allowed': getMaxAccessoryQuantity(item) <= 1
            }"
          />
        </div>
        <button
          @click="removeAccessory(idx)"
          class="ml-2 text-sm text-gray-500 fjern-btn cursor-pointer"
        >
          Fjern
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import DOMPurify from 'dompurify';
// Sanitization helper using DOMPurify
function sanitizeInput(value: string): string {
  return DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}
import { ref, watch, onMounted, computed } from "vue";
import { useCheckoutStore } from "@/stores/checkout";
import { useAvailability } from "@/composables/useAvailability";
import { useNuxtApp } from "#app";
import VueDatePicker from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";

// Models are now fetched from the backend Product table
interface ProductOption {
  id: number;
  name: string;
  price: number;
  weeklyPrice?: number;
  twoWeekPrice?: number;
  quantity?: number;
}

// Only keep max quantity helpers for UI input validation
function getMaxProductQuantityForItem(item: { name: string; productId?: number }) {
  const arr = models.value as ProductOption[];
  const id = item.productId ?? arr.find((m: ProductOption) => m.name === item.name)?.id;
  if (id === undefined) return 0;
  // Use the availability composable instead of old local state
  return getMaxProdQty(id);
}

function getMaxAccessoryQuantity(item: { name: string }) {
  // For ekstra batteri, use DB accessory.quantity field but also respect availability
  const EXTRA_BATTERY_NAME = 'ekstra batteri';
  const name = (item.name || '').toString().trim().toLowerCase();
  const modelCount = selectedModels.value.reduce((sum, model) => sum + (model.quantity || 1), 0);
  
  if (name === EXTRA_BATTERY_NAME) {
    const acc = accessories.value.find(a => a.name.toLowerCase() === EXTRA_BATTERY_NAME);
    const dbQuantity = acc?.quantity ?? 5;
    
    // Also check availability for the booking period
    const availInfo = accessoryAvailability.value[name];
    if (availInfo && availInfo.available >= 0) {
      return Math.min(dbQuantity, availInfo.available);
    }
    
    return dbQuantity; // fallback to DB quantity if no availability info
  }
  
  // For other accessories: max 1 per camera model, but respect availability and DB limits
  const acc = accessories.value.find(a => a.name.toLowerCase() === name);
  const dbQuantity = acc?.quantity ?? modelCount; // fallback to model count if no DB info
  
  // Check availability for the booking period
  const availInfo = accessoryAvailability.value[name];
  const availableQuantity = availInfo && availInfo.available >= 0 ? availInfo.available : dbQuantity;
  
  // Return minimum of: model count, DB quantity, and availability
  return Math.min(modelCount, dbQuantity, availableQuantity);
}

interface Camera {
  id: number;
  productId: number;
  dailyPrice: number;
  weeklyPrice: number;
  twoWeekPrice: number;
  isAvailable?: boolean;
}

interface SelectedCamera {
  id: number;
  productId: number;
  productName: string;
  dailyPrice: number;
  weeklyPrice: number;
  twoWeekPrice: number;
}

const models = ref<ProductOption[]>([]);
const accessories = ref<{ id?: number; name: string; price: number; quantity?: number }[]>([]);
const accessoryAvailability = ref<Record<string, { total: number; available: number; booked: number }>>({});
const availableCameras = ref<Camera[]>([]);
const selectedCameras = ref<SelectedCamera[]>([]);
const selectedCameraId = ref<number | null>(null);

// Use availability composable
const availabilityComposable = useAvailability();
const { loading: availabilityLoading, checkAvailability, isProductAvailable, isAccessoryAvailable, getMaxProductQuantity: getMaxProdQty, getMaxAccessoryQuantity: getMaxAccQty, getAvailabilityMessage } = availabilityComposable;

// Error handling for availability
const availabilityError = ref<string | null>(null);

// SSR-safe Pinia usage
const store = useCheckoutStore();
const selectedModels = ref<
  {
    name: string;
    price: number;
    quantity: number;
    productId?: number;
    config?: { dailyPrice: number; weeklyPrice: number; twoWeekPrice: number };
  }[]
>(Array.isArray(store.selectedModels) ? store.selectedModels : []);
const selectedAccessories = ref<
  { name: string; price: number; quantity: number }[]
>(Array.isArray(store.selectedAccessories) ? store.selectedAccessories : []);
const insurance = ref(store.insurance);
// Replaced collapsibles with dropdown selections
const selectedModelName = ref<string>("");
const selectedAccessoryName = ref<string>("");
const startDate = ref<Date | null>(
  store.startDate ? new Date(store.startDate) : null
);
const endDate = ref<Date | null>(
  store.endDate ? new Date(store.endDate) : null
);

// Watch startDate: if it changes, reset endDate and potentially clear basket
watch(startDate, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    endDate.value = null;
    // Check if user has items in basket and confirm clearing
    checkAndClearBasketOnDateChange();
  }
});

// Watch endDate: if it changes and basket has items, confirm clearing
watch(endDate, (newVal, oldVal) => {
  if (newVal !== oldVal && newVal !== null) {
    // Only check when endDate is actually set (not when being reset to null)
    checkAndClearBasketOnDateChange();
  }
});

// Function to check if basket has items and show confirmation dialog
function checkAndClearBasketOnDateChange() {
  const hasItems = selectedModels.value.length > 0 || selectedAccessories.value.length > 0;
  
  if (hasItems) {
    const confirmed = confirm(
      'Ændring af bookingperiode vil tømme din kurv.\n\n' +
      'Du skal tilføje alle produkter og tilbehør igen.\n\n' +
      'Vil du fortsætte?'
    );
    
    if (confirmed) {
      clearBasket();
    } else {
      // User cancelled - revert date changes
      // Note: This creates a brief loop, but it's handled by the oldVal !== newVal check
      setTimeout(() => {
        if (startDate.value) {
          startDate.value = store.startDate ? new Date(store.startDate) : null;
        }
        if (endDate.value) {
          endDate.value = store.endDate ? new Date(store.endDate) : null;
        }
      }, 0);
    }
  }
}

// Function to clear the entire basket
function clearBasket() {
  selectedModels.value = [];
  selectedAccessories.value = [];
  selectedCameras.value = [];
  
  // Update store immediately
  store.setSelectedModels([]);
  store.setSelectedAccessories([]);
  
  console.log('🧹 Basket cleared due to booking period change');
}

// Computed: are dates selected?
const datesSelected = computed(() => !!startDate.value && !!endDate.value);

// Computed: can we add the selected model?
const canAddSelectedModel = computed(() => {
  if (!selectedModelName.value || !datesSelected.value) return false;
  const model = models.value.find(m => m.name === selectedModelName.value);
  if (!model) return false;
  return isProductAvailable(model.id, 1);
});

const canAddSelectedAccessory = computed(() => {
  if (!selectedAccessoryName.value || !datesSelected.value) return false;
  const accessory = accessories.value.find(a => a.name === selectedAccessoryName.value);
  if (!accessory || !accessory.id) return false;
  return isAccessoryAvailable(accessory.id, 1);
});

// Computed: tooltip for add button
const getAddButtonTooltip = () => {
  if (!selectedModelName.value) return '';
  if (!datesSelected.value) return 'Select dates first';
  const model = models.value.find(m => m.name === selectedModelName.value);
  if (!model) return '';
  if (!isProductAvailable(model.id, 1)) return 'Not available for selected dates';
  return '';
};

// Helper to get max quantity for a product by ID
const getMaxProductQuantity = (productId: number): number => {
  return getMaxProdQty(productId);
};

// Minimum selectable start date: 3 days from today
const minStartDate = computed(() => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3);
  return date;
});

// Minimum selectable end date: at least 3 days after the selected start date (or minStartDate if not set)
const minEndDate = computed(() => {
  let baseDate = minStartDate.value;
  if (startDate.value && startDate.value > minStartDate.value) {
    baseDate = startDate.value;
  }
  const date = new Date(baseDate);
  date.setDate(date.getDate() + 3);
  return date;
});

// Disable weekends for the start date picker (Saturday=6, Sunday=0)
function isStartDateDisabled(date: Date) {
  if (!date) return false;
  const day = date.getDay();
  return day === 0 || day === 6;
}

function isAccessoryUnavailable(accessoryName: string): boolean {
  if (!datesSelected.value) return false;
  const name = (accessoryName || '').toString().trim().toLowerCase();
  const availInfo = accessoryAvailability.value[name];
  // If we have availability info, check if available quantity is 0
  // If we don't have availability info, assume it's available (false = not unavailable)
  return availInfo ? availInfo.available <= 0 : false;
}

function isAccessoryAtMaxQuantity(accessoryName: string): boolean {
  const EXTRA_BATTERY_NAME = 'ekstra batteri';
  const modelCount = selectedModels.value.reduce((sum, model) => sum + (model.quantity || 1), 0);
  const foundAccessory = selectedAccessories.value.find(sa => sa.name === accessoryName);
  
  if (!foundAccessory) return false; // Not selected yet, so not at max
  
  if ((accessoryName || '').toString().trim().toLowerCase() === EXTRA_BATTERY_NAME) {
    // For ekstra batteri, check against its DB quantity or availability limit
    const dbAcc = accessories.value.find(a => a.name.toLowerCase() === EXTRA_BATTERY_NAME);
    const dbMaxQuantity = dbAcc?.quantity ?? 5;
    const name = accessoryName.toLowerCase();
    const availInfo = accessoryAvailability.value[name];
    const availableQuantity = availInfo ? availInfo.available : dbMaxQuantity;
    const maxQuantity = Math.min(dbMaxQuantity, availableQuantity);
    
    return foundAccessory.quantity >= maxQuantity;
  } else {
    // For other accessories, check against model count and availability
    const name = accessoryName.toLowerCase();
    const availInfo = accessoryAvailability.value[name];
    const availableQuantity = availInfo ? availInfo.available : modelCount;
    const maxQuantity = Math.min(modelCount, availableQuantity);
    
    return foundAccessory.quantity >= maxQuantity;
  }
}

function getAccessoryTooltipMessage(accessoryName: string): string {
  const EXTRA_BATTERY_NAME = 'ekstra batteri';
  const modelCount = selectedModels.value.reduce((sum, model) => sum + (model.quantity || 1), 0);
  const foundAccessory = selectedAccessories.value.find(sa => sa.name === accessoryName);
  
  if (!foundAccessory || !isAccessoryAtMaxQuantity(accessoryName)) {
    return ''; // No tooltip needed
  }
  
  if ((accessoryName || '').toString().trim().toLowerCase() === EXTRA_BATTERY_NAME) {
    // For ekstra batteri, check if limited by DB quantity or availability
    const dbAcc = accessories.value.find(a => a.name.toLowerCase() === EXTRA_BATTERY_NAME);
    const dbMaxQuantity = dbAcc?.quantity ?? 5;
    const name = accessoryName.toLowerCase();
    const availInfo = accessoryAvailability.value[name];
    const availableQuantity = availInfo ? availInfo.available : dbMaxQuantity;
    
    if (availableQuantity < dbMaxQuantity) {
      return `Kun ${availableQuantity} tilgængelige i denne periode`;
    } else {
      return `Maksimum ${dbMaxQuantity} ekstra batterier pr. bestilling`;
    }
  } else {
    // For other accessories, check if limited by model count or availability
    const name = accessoryName.toLowerCase();
    const availInfo = accessoryAvailability.value[name];
    const availableQuantity = availInfo ? availInfo.available : modelCount;
    
    if (availableQuantity < modelCount) {
      return `Kun ${availableQuantity} tilgængelige i denne periode`;
    } else {
      return `Maksimum 1 pr. kamera (${modelCount} kameraer = ${modelCount} tilbehør)`;
    }
  }
}

function isAccessoryAtActualLimit(item: { name: string; quantity: number }): boolean {
  const EXTRA_BATTERY_NAME = 'ekstra batteri';
  const modelCount = selectedModels.value.reduce((sum, model) => sum + (model.quantity || 1), 0);
  const maxQuantity = getMaxAccessoryQuantity(item);
  
  if ((item.name || '').toString().trim().toLowerCase() === EXTRA_BATTERY_NAME) {
    // For ekstra batteri, only show warning if limited by availability, not by DB max
    const dbAcc = accessories.value.find(a => a.name.toLowerCase() === EXTRA_BATTERY_NAME);
    const dbMaxQuantity = dbAcc?.quantity ?? 5;
    const name = item.name.toLowerCase();
    const availInfo = accessoryAvailability.value[name];
    const availableQuantity = availInfo ? availInfo.available : dbMaxQuantity;
    
    // Only warn if limited by availability (not DB max) or if at DB max and it's higher than expected
    return item.quantity >= maxQuantity && (availableQuantity < dbMaxQuantity || item.quantity >= dbMaxQuantity);
  } else {
    // For other accessories, only show warning if limited by availability (not by model count)
    const name = item.name.toLowerCase();
    const availInfo = accessoryAvailability.value[name];
    const availableQuantity = availInfo ? availInfo.available : modelCount;
    
    // Only warn if quantity is limited by availability, not by normal model count matching
    return item.quantity >= maxQuantity && availableQuantity < modelCount;
  }
}

function calculateOptimalAccessoryQuantity(accessoryName: string, modelCount: number): number {
  const EXTRA_BATTERY_NAME = 'ekstra batteri';
  
  if ((accessoryName || '').toString().trim().toLowerCase() === EXTRA_BATTERY_NAME) {
    // For ekstra batteri, don't auto-adjust - let user control quantity
    const foundAccessory = selectedAccessories.value.find(sa => sa.name === accessoryName);
    return foundAccessory ? foundAccessory.quantity : 1;
  } else {
    // For other accessories, set quantity to match model count (up to availability)
    const name = accessoryName.toLowerCase();
    const availInfo = accessoryAvailability.value[name];
    const availableQuantity = availInfo ? availInfo.available : modelCount;
    return Math.min(modelCount, availableQuantity);
  }
}

function adjustAccessoryQuantitiesForModelCount() {
  const modelCount = selectedModels.value.reduce((sum, model) => sum + (model.quantity || 1), 0);
  
  // If no models selected, don't adjust
  if (modelCount === 0) return;
  
  // Update quantities for all existing accessories
  let accessoriesChanged = false;
  selectedAccessories.value.forEach((accessory) => {
    const optimalQuantity = calculateOptimalAccessoryQuantity(accessory.name, modelCount);
    if (accessory.quantity !== optimalQuantity) {
      accessory.quantity = optimalQuantity;
      accessoriesChanged = true;
    }
  });
  
  // If any accessories were changed, update the store
  if (accessoriesChanged) {
    store.setSelectedAccessories([...selectedAccessories.value], modelCount);
  }
}

function selectModel(model: {
  name: string;
  price: number;
  productId?: number;
  config?: { dailyPrice: number; weeklyPrice: number; twoWeekPrice: number };
}) {
  const found = selectedModels.value.find((m) => m.name === model.name);
  if (!found) {
    selectedModels.value.push({ ...model, quantity: 1 });
  }
}

async function onAddSelectedModel() {
  availabilityError.value = null;
  
  if (selectedModels.value.length >= 2) {
    // Hardcap: do not add more than 2 model types
    selectedModelName.value = "";
    return;
  }
  
  const model = models.value.find((m) => m.name === selectedModelName.value);
  if (!model) return;

  // Check availability immediately
  if (!isProductAvailable(model.id, 1)) {
    availabilityError.value = `${model.name} is not available for the selected dates. Available: ${getMaxProductQuantity(model.id)}`;
    
    // Show toast notification
    const toast = useToast();
    toast.add({
      title: 'Product Not Available',
      description: `${model.name} is not available for the selected dates`,
      color: 'error'
    });
    
    selectedModelName.value = "";
    return;
  }
  
  // Only add if not already selected
  const alreadySelected = selectedModels.value.some(m => m.name === model.name);
  if (!alreadySelected) {
    selectModel({
      name: model.name,
      price: model.price,
      productId: model.id,
      config: {
        dailyPrice: model.price,
        weeklyPrice: (model as any).weeklyPrice ?? model.price * 7,
        twoWeekPrice: (model as any).twoWeekPrice ?? model.price * 14,
      },
    });
    // also keep legacy field updated with first product id for compatibility
    if (!store.productId) store.setProductId(model.id);
    
    // Show success message
    const toast = useToast();
    toast.add({
      title: 'Product Added',
      description: `${model.name} has been added to your booking`,
      color: 'success'
    });
  }
  
  // reset selection to allow adding the same again
  selectedModelName.value = "";
}

function removeModel(idx: number) {
  selectedModels.value.splice(idx, 1);
  // Clear cameras when no models are selected
  if (selectedModels.value.length === 0) {
    availableCameras.value = [];
    selectedCameras.value = [];
  }
}

// Camera-related functions
async function fetchCamerasForProduct(productId: number) {
  try {
    const supabase = useSupabase();
    if (!supabase) {
      console.error('Supabase client not available');
      availableCameras.value = [];
      return;
    }
    console.log('Fetching cameras for product:', productId);
    // First, request authoritative availability (including booked camera ids) from the server
    let bookedCameraIds: number[] = [];
    try {
      if (startDate.value && endDate.value) {
        const params = new URLSearchParams({ startDate: startDate.value.toISOString(), endDate: endDate.value.toISOString() });
        const resp = await fetch(`/api/availability?${params.toString()}`);
        if (resp.ok) {
          const body = await resp.json();
          const camAvail = body?.cameraAvailability;
          if (camAvail && camAvail[productId] && Array.isArray(camAvail[productId].bookedCameraIds)) {
            bookedCameraIds = camAvail[productId].bookedCameraIds;
          }
        } else {
          console.warn('Availability API responded with status', resp.status);
        }
      }
    } catch (err) {
      console.warn('Error fetching availability for cameras:', err);
    }

    const { data: cameras, error } = await supabase
      .from('Camera')
      .select('*')
      .eq('productId', productId);

    console.log('Raw camera data:', cameras);
    console.log('Camera error:', error);

    if (error) throw error;

    // Filter out cameras that are explicitly booked for the period or marked unavailable
    availableCameras.value = (cameras || []).filter((c: any) => {
      if (typeof c.id === 'number' && bookedCameraIds.includes(c.id)) return false;
      if (typeof c.isAvailable === 'boolean' && c.isAvailable === false) return false;
      return true;
    });
    console.log('Available cameras set to:', availableCameras.value);
    console.log('Selected models length:', selectedModels.value.length);
    console.log('Should show camera section:', selectedModels.value.length > 0 && availableCameras.value.length > 0);
  } catch (error) {
    console.error('Error fetching cameras:', error);
    availableCameras.value = [];
  }
}

function onAddSelectedCamera() {
  const camera = availableCameras.value.find(c => c.id === selectedCameraId.value);
  const product = models.value.find(p => p.id === camera?.productId);
  
  if (camera && product) {
    const selectedCamera: SelectedCamera = {
      id: camera.id,
      productId: camera.productId,
      productName: product.name,
      dailyPrice: camera.dailyPrice,
      weeklyPrice: camera.weeklyPrice,
      twoWeekPrice: camera.twoWeekPrice
    };
    
    // Check if camera is already selected
    const exists = selectedCameras.value.find(c => c.id === camera.id);
    if (!exists) {
      selectedCameras.value.push(selectedCamera);
    }
  }
  
  selectedCameraId.value = null;
}

function removeCamera(idx: number) {
  selectedCameras.value.splice(idx, 1);
}

function addAccessory(acc: { name: string; price: number }) {
  // Check availability first
  const isUnavailable = isAccessoryUnavailable(acc.name);
  
  if (isUnavailable) {
    console.warn(`Accessory "${acc.name}" is not available for the selected dates`);
    return;
  }

  // Calculate max allowed quantity: 1 accessory per camera model (except ekstra batteri)
  const modelCount = selectedModels.value.reduce((sum, model) => sum + (model.quantity || 1), 0);
  const EXTRA_BATTERY_NAME = 'ekstra batteri';
  const found = selectedAccessories.value.find((a) => a.name === acc.name);
  
  if (found) {
    if ((acc.name || '').toString().trim().toLowerCase() === EXTRA_BATTERY_NAME) {
      // increment ekstra batteri up to DB quantity limit or available quantity
      const dbAcc = accessories.value.find(a => a.name.toLowerCase() === EXTRA_BATTERY_NAME);
      const dbMaxQuantity = dbAcc?.quantity ?? 5;
      const name = acc.name.toLowerCase();
      const availInfo = accessoryAvailability.value[name];
      const availableQuantity = availInfo ? availInfo.available : dbMaxQuantity;
      const maxQuantity = Math.min(dbMaxQuantity, availableQuantity);
      
      found.quantity = (found.quantity || 0) + 1;
      if (found.quantity > maxQuantity) found.quantity = maxQuantity;
    } else {
      // For other accessories, increment up to model count or availability limit
      const name = acc.name.toLowerCase();
      const availInfo = accessoryAvailability.value[name];
      const availableQuantity = availInfo ? availInfo.available : modelCount;
      const maxQuantity = Math.min(modelCount, availableQuantity);
      
      found.quantity = (found.quantity || 0) + 1;
      if (found.quantity > maxQuantity) found.quantity = maxQuantity;
    }
    
    // Update the store with the modified accessories list (pass model count)
    store.setSelectedAccessories([...selectedAccessories.value], modelCount);
  } else {
    // Calculate optimal initial quantity for new accessory
    const optimalQuantity = calculateOptimalAccessoryQuantity(acc.name, modelCount);
    selectedAccessories.value.push({ ...acc, quantity: optimalQuantity });
    
    // Update the store with the new accessories list (pass model count)
    store.setSelectedAccessories([...selectedAccessories.value], modelCount);
  }
}

async function onAddSelectedAccessory() {
  availabilityError.value = null;
  
  const acc = accessories.value.find(
    (a) => a.name === selectedAccessoryName.value
  );
  if (!acc || !acc.id) return;

  // Check availability before adding
  if (!isAccessoryAvailable(acc.id, 1)) {
    const toast = useToast();
    toast.add({
      title: 'Accessory Not Available',
      description: `${acc.name} is not available for the selected dates`,
      color: 'error'
    });
    return;
  }

  addAccessory(acc);
  selectedAccessoryName.value = "";
  
  // Show success message
  const toast = useToast();
  toast.add({
    title: 'Accessory Added',
    description: `${acc.name} has been added to your booking`,
    color: 'success'
  });
}

function removeAccessory(idx: number) {
  selectedAccessories.value.splice(idx, 1);
}

function onAccessoryQuantityChange() {
  // Sync accessory quantity changes to the store
  const modelCount = selectedModels.value.reduce((sum, model) => sum + (model.quantity || 1), 0);
  store.setSelectedAccessories([...selectedAccessories.value], modelCount);
}


// Sync to store (no business logic)
watch(
  [selectedModels, selectedAccessories, insurance, startDate, endDate],
  () => {
    const modelCount = selectedModels.value.reduce((sum, model) => sum + (model.quantity || 1), 0);
    store.setSelectedModels(selectedModels.value);
    store.setSelectedAccessories(selectedAccessories.value, modelCount);
    store.setInsurance(insurance.value);
    // Always store as ISO string or null
    const start = startDate.value ? startDate.value.toISOString() : null;
    const end = endDate.value ? endDate.value.toISOString() : null;
    store.setDates(start, end);
  }
);

// Fetch products and accessories from Supabase
onMounted(async () => {
  const supabase = useSupabase();
  if (!supabase) {
    console.error('Supabase client not available on mount');
    return;
  }

  try {
    // Fetch products from Supabase
    const { data: productsData, error: productsError } = await supabase
      .from('Product')
      .select('*')
      .order('id', { ascending: false });
    
    if (productsError) throw productsError;
    
    models.value = (productsData || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      price: typeof p.dailyPrice === "number" ? p.dailyPrice : 0,
      weeklyPrice: p.weeklyPrice,
      twoWeekPrice: p.twoWeekPrice,
      quantity: typeof p.quantity === "number" ? p.quantity : 5,
    }));
  } catch (e) {
    console.error("Error fetching products from Supabase:", e);
  }
  
  try {
    // Fetch accessories from Supabase
    const { data: accessoriesData, error: accessoriesError } = await supabase
      .from('Accessory')
      .select('*')
      .order('name', { ascending: true });
    
    if (accessoriesError) throw accessoriesError;
    
    accessories.value = (accessoriesData || []).map((a: any) => ({
      id: a.id,
      name: a.name,
      price: typeof a.price === "number" ? a.price : 70,
      quantity: typeof a.quantity === 'number' ? a.quantity : undefined,
    }));
  } catch (e) {
    console.error("Error fetching accessories from Supabase:", e);
  }

  // Check availability if dates are already selected
  if (startDate.value && endDate.value && (models.value.length > 0 || accessories.value.length > 0)) {
    const productIds = models.value.map(m => m.id).filter((id): id is number => id !== undefined);
    const accessoryIds = accessories.value.map(a => a.id).filter((id): id is number => id !== undefined);
    try {
      await checkAvailability(startDate.value, endDate.value, productIds, accessoryIds);
    } catch (error) {
      console.error('Error checking initial availability:', error);
    }
  }
});

// Check availability when dates change
watch([startDate, endDate], async () => {
  availabilityError.value = null;
  
  if (!startDate.value || !endDate.value) {
    availabilityComposable.clearAvailability();
    return;
  }

  // Get all product IDs and accessory IDs to check
  const productIds = models.value.map(m => m.id).filter((id): id is number => id !== undefined);
  const accessoryIds = accessories.value.map(a => a.id).filter((id): id is number => id !== undefined);
  
  if (productIds.length > 0 || accessoryIds.length > 0) {
    try {
      await checkAvailability(startDate.value, endDate.value, productIds, accessoryIds);
    } catch (error) {
      console.error('Error checking availability:', error);
      availabilityError.value = 'Failed to check availability';
    }
  }
});

// Fetch cameras when products are selected
watch(selectedModels, async (newModels) => {
  if (newModels.length > 0) {
    // Get the latest selected product
    const latestProduct = newModels[newModels.length - 1];
    if (latestProduct.productId) {
      await fetchCamerasForProduct(latestProduct.productId);
    }
  } else {
    // Clear cameras if no products selected
    availableCameras.value = [];
    selectedCameras.value = [];
  }
}, { deep: true });

// Auto-adjust accessory quantities when model count changes
watch(
  () => selectedModels.value.reduce((sum, model) => sum + (model.quantity || 1), 0),
  (newModelCount, oldModelCount) => {
    // Only adjust if model count actually changed and we have accessories
    if (newModelCount !== oldModelCount && selectedAccessories.value.length > 0) {
      adjustAccessoryQuantitiesForModelCount();
    }
  }
);
</script>
<style scoped>
* {
  color: black !important;
}

/* Custom red for Tilføj buttons */
.tilfoej-btn {
  color: #b8082a !important;
}
.tilfoej-btn:hover {
  color: #8a061f !important;
}
.plus-red {
  color: #b8082a !important;
}
</style>
