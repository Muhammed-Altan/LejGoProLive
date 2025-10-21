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
      <div class="flex items-center gap-3">
        <select
          v-model="selectedModelName"
          :disabled="!datesSelected"
          class="flex-1 w-full border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
        >
          <option disabled value="">Vælg en model…</option>
          <option
            v-for="model in models"
            :key="model.name"
            :value="model.name"
            :disabled="availability[model.id] === 0 || selectedModels.some(sm => sm.name === model.name)"
          >
            {{ model.name }} — {{ Math.ceil(model.twoWeekPrice ? (model.twoWeekPrice / 14) : (model.price)) }} kr./dag
            <span v-if="datesSelected">
              <template v-if="availability[model.id] === 0">Udsolgt</template>
              <template v-else>Tilgængelige</template>
            </span>
          </option>
        </select>
        <button
          :disabled="!selectedModelName || !datesSelected || selectedModels.length >= 2"
          @click="onAddSelectedModel"
          class="flex items-center tilfoej-btn font-semibold disabled:opacity-40"
        >
          <span class="mr-1 text-xl plus-red">+</span> Tilføj
        </button>
      </div>
    </section>

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
            <small class="text-xs text-gray-500">(max: {{ getMaxProductQuantity(item) }})</small>
            <small v-if="availabilityLoading" class="ml-2 text-xs text-gray-400">• henter tilgængelighed…</small>
          </span>
          <input
            type="number"
            min="1"
            :max="getMaxProductQuantity(item)"
            v-model.number="item.quantity"
            class="w-20 text-center rounded border border-gray-300"
          />
          <span
            v-if="item.productId !== undefined && item.quantity === getMaxProductQuantity(item)"
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
            :disabled="selectedAccessories.some(sa => sa.name === acc.name && acc.name.toLowerCase() !== 'ekstra batteri')"
          >
            <span :class="{ 'text-gray-400': selectedAccessories.some(sa => sa.name === acc.name && acc.name.toLowerCase() !== 'ekstra batteri') }">
              {{ acc.name }} — {{ Math.ceil(acc.price) }} kr./Booking
            </span>
          </option>
        </select>
        <button
          :disabled="!selectedAccessoryName || !datesSelected"
          @click="onAddSelectedAccessory"
          class="flex items-center tilfoej-btn font-semibold disabled:opacity-40"
        >
          <span class="mr-1 text-xl plus-red">+</span> Tilføj
        </button>
      </div>
    </section>

    <!-- Selected Accessory and Quantity (Unified Style) -->
    <section v-if="selectedAccessories && selectedAccessories.length" class="space-y-2">
      <div
        v-for="(item, idx) in selectedAccessories"
        :key="item.name"
        class="flex items-center gap-4 bg-gray-100 rounded-lg py-4 px-4"
      >
      <img 
        src="/eventyr/GoPro-MountainTop.jpg" 
        alt="" 
        class="w-16 h-16 object-cover rounded mr-3 border border-gray-200 bg-white">

        <div class="flex-1 font-medium">
          {{ item.name }}
        </div>
        <div class="flex items-center justify-center gap-2 group relative">
          <span>Antal</span>
          <input
            type="number"
            min="1"
            :max="item.name && item.name.toLowerCase() === 'ekstra batteri' ? 5 : 1"
            v-model.number="item.quantity"
            class="w-20 text-center rounded border border-gray-300"
          />
          <span
            v-if="item.quantity === getMaxAccessoryQuantity(item)"
            class="absolute left-1/2 z-10 -translate-x-1/2 -top-14 w-56 rounded bg-white text-white text-xs px-3 py-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-normal shadow-lg"
            style="color: #b90c2c; background: #FF8800"
          >
            Maksimum antal valgt
          </span>
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
function getMaxProductQuantity(item: { name: string; productId?: number }) {
  const arr = models.value as ProductOption[];
  const id = item.productId ?? arr.find((m: ProductOption) => m.name === item.name)?.id;
  if (id === undefined) return 0;
  const product = arr.find((m: ProductOption) => m.id === id);
  // Prefer server availability; fall back to DB-configured product.quantity, then 0
  return availability.value[id] ?? product?.quantity ?? 0;
}

function getMaxAccessoryQuantity(item: { name: string }) {
  // Prefer accessory-specific quantity if available
  const acc = accessories.value.find(a => a.name === item.name);
  if (acc) {
    if (typeof acc.quantity === 'number') return acc.quantity;
    if (typeof acc.id === 'number') {
      const prod = models.value.find(m => m.id === acc.id);
      return availability.value[acc.id] ?? prod?.quantity ?? 0;
    }
  }
  // fallback: match product by name
  const prod = models.value.find((m: ProductOption) => m.name === item.name);
  if (prod) return availability.value[prod.id] ?? prod.quantity ?? 0;
  return 0;
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
const availability = ref<Record<number, number>>({});
const availabilityLoading = ref<boolean>(false);
const availableCameras = ref<Camera[]>([]);
const selectedCameras = ref<SelectedCamera[]>([]);
const selectedCameraId = ref<number | null>(null);

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

// Watch startDate: if it changes, reset endDate
watch(startDate, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    endDate.value = null;
  }
});

// Computed: are dates selected?
const datesSelected = computed(() => !!startDate.value && !!endDate.value);

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

function onAddSelectedModel() {
  if (selectedModels.value.length >= 2) {
    // Hardcap: do not add more than 2 model types
    selectedModelName.value = "";
    return;
  }
  const model = models.value.find((m) => m.name === selectedModelName.value);
  if (model) {
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
    }
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
  // Allow multiple 'ekstra batteri' but keep other accessories to max 1.
  const EXTRA_BATTERY_NAME = 'ekstra batteri';
  const found = selectedAccessories.value.find((a) => a.name === acc.name);
  if (found) {
    if ((acc.name || '').toString().trim().toLowerCase() === EXTRA_BATTERY_NAME) {
      // increment ekstra batteri up to a sensible cap (5)
      found.quantity = (found.quantity || 0) + 1;
      if (found.quantity > 5) found.quantity = 5;
    }
    // for other accessories, do nothing when already present
  } else {
    selectedAccessories.value.push({ ...acc, quantity: 1 });
  }
}

function onAddSelectedAccessory() {
  const acc = accessories.value.find(
    (a) => a.name === selectedAccessoryName.value
  );
  if (acc) addAccessory(acc);
  selectedAccessoryName.value = "";
}

function removeAccessory(idx: number) {
  selectedAccessories.value.splice(idx, 1);
}


// Sync to store (no business logic)
watch(
  [selectedModels, selectedAccessories, insurance, startDate, endDate],
  () => {
    store.setSelectedModels(selectedModels.value);
    store.setSelectedAccessories(selectedAccessories.value);
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
    // Seed availability from DB-configured product quantities so UI shows non-magic defaults immediately
    availability.value = Object.fromEntries(models.value.map(m => [m.id, m.quantity ?? 0]));
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

});

watch([startDate, endDate], async () => {
  if (!startDate.value || !endDate.value) {
    availability.value = {};
    availabilityLoading.value = false;
    return;
  }

  availabilityLoading.value = true;
  try {
    const params = new URLSearchParams({ startDate: startDate.value!.toISOString(), endDate: endDate.value!.toISOString() });
    const resp = await fetch(`/api/availability?${params.toString()}`);
    if (!resp.ok) {
      console.error('Availability API error', resp.statusText);
      availability.value = {};
      return;
    }
    const body = await resp.json();
    if (body && body.availability) {
      availability.value = body.availability;
    } else {
      availability.value = {};
    }
  } catch (err) {
    console.error('Error fetching availability', err);
    availability.value = {};
  } finally {
    availabilityLoading.value = false;
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
