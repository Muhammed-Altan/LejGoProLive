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
          <span>Antal</span>
          <input
            type="number"
            min="1"
            :max="item.productId !== undefined ? getMaxProductQuantity(item.productId) : 1"
            v-model.number="item.quantity"
            class="w-20 text-center rounded border border-gray-300"
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
          <option v-for="acc in accessories" :key="acc.name" :value="acc.name"
            :class="{
              'text-gray-400': datesSelected && !isAccessoryAvailable(acc.id, 1),
              'text-red-600': datesSelected && getMaxAccQty(acc.id) === 0
            }">
            {{ acc.name }} — {{ Math.ceil(acc.price) }} kr./Booking
            <span v-if="datesSelected">
              ({{ isAccessoryAvailable(acc.id, 1) ? 'Available' : 'Not available' }})
            </span>
          </option>
        </select>
        <button
          :disabled="!selectedAccessoryName || !datesSelected || availabilityLoading || !canAddSelectedAccessory"
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
            :max="getMaxAccessoryQuantity(item)"
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
  return id !== undefined ? getMaxProdQty(id) : 0;
}

function getMaxAccessoryQuantity(item: { name: string }) {
  const acc = accessories.value.find(a => a.name === item.name);
  if (!acc) return 0;
  
  // Use real availability data from the composable
  return getMaxAccQty(acc.id);
}

interface Camera {
  id: number;
  productId: number;
  dailyPrice: number;
  weeklyPrice: number;
  twoWeekPrice: number;
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
const accessories = ref<{ id: number; name: string; price: number }[]>([]);
const availableCameras = ref<Camera[]>([]);
const selectedCameras = ref<SelectedCamera[]>([]);
const selectedCameraId = ref<number | null>(null);

// Use availability composable
const availability = useAvailability();
const { loading: availabilityLoading, checkAvailability, isProductAvailable, isAccessoryAvailable, getMaxProductQuantity: getMaxProdQty, getMaxAccessoryQuantity: getMaxAccQty, getAvailabilityMessage } = availability;

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

// Error handling for availability
const availabilityError = ref<string | null>(null);

// Watch startDate: if it changes, reset endDate
watch(startDate, (newVal, oldVal) => {
  if (newVal !== oldVal) {
    endDate.value = null;
  }
});

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
  if (!accessory) return false;
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
    
    const { data: cameras, error } = await supabase
      .from('Camera')
      .select('*')
      .eq('productId', productId);
    
    console.log('Raw camera data:', cameras);
    console.log('Camera error:', error);
    
    if (error) throw error;
    
    availableCameras.value = cameras || [];
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
  const found = selectedAccessories.value.find((a) => a.name === acc.name);
  if (found) {
    found.quantity++;
  } else {
    selectedAccessories.value.push({ ...acc, quantity: 1 });
  }
}

async function onAddSelectedAccessory() {
  availabilityError.value = null;
  
  const acc = accessories.value.find(
    (a) => a.name === selectedAccessoryName.value
  );
  if (!acc) return;

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

// Check availability when dates change
watch([startDate, endDate], async () => {
  availabilityError.value = null;
  
  if (!startDate.value || !endDate.value) {
    availability.clearAvailability();
    return;
  }

  // Get all product IDs and accessory IDs to check
  const productIds = models.value.map(m => m.id);
  const accessoryIds = accessories.value.map(a => a.id);
  
  console.log('🔍 Component: Checking availability for productIds:', productIds);
  console.log('🔍 Component: Checking availability for accessoryIds:', accessoryIds);
  
  if (productIds.length > 0 || accessoryIds.length > 0) {
    try {
      await checkAvailability(startDate.value, endDate.value, productIds, accessoryIds);
    } catch (error) {
      console.error('Error checking availability:', error);
      availabilityError.value = 'Failed to check availability';
    }
  }
});

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
    }));
  } catch (e) {
    console.error("Error fetching accessories from Supabase:", e);
  }

  // Check availability if dates are already selected
  if (startDate.value && endDate.value && (models.value.length > 0 || accessories.value.length > 0)) {
    const productIds = models.value.map(m => m.id);
    const accessoryIds = accessories.value.map(a => a.id);
    try {
      await checkAvailability(startDate.value, endDate.value, productIds, accessoryIds);
    } catch (error) {
      console.error('Error checking initial availability:', error);
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
