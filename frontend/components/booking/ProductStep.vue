<template>
  <div class="space-y-6 w-full max-w-2xl mx-auto">
    <article>
      <h1 class="font-semibold text-lg">Vælg dit udstyr</h1>
      <h2 class="font-medium text-base">
        Udfyld formularen nedenfor for at få et tilbud
      </h2>
    </article>
    <!-- Date Pickers -->
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
        />
      </div>
      <div class="flex-1">
        <VueDatePicker
          v-model="endDate"
          :enable-time-picker="false"
          format="dd/MM/yyyy"
          :input-class="'w-full border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-400'"
          placeholder="Slut dato"
        />
      </div>
    </div>
    <!-- GoPro Model Selection (Dropdown) -->
    <section class="bg-gray-50 rounded-xl p-6 shadow flex flex-col gap-2">
      <div class="flex items-center justify-between mb-2">
        <h2 class="font-semibold text-lg">Vælg en GoPro Model</h2>
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
            :disabled="availability[model.id] === 0"
          >
            {{ model.name }} — {{ model.price.toFixed(2) }} kr./dag
            <span v-if="datesSelected">
              <template v-if="availability[model.id] === 0">Udsolgt</template>
              <template v-else>{{ availability[model.id] }} tilgængelige</template>
            </span>
          </option>
        </select>
        <button
          :disabled="!selectedModelName || !datesSelected"
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
        class="flex items-center gap-4 bg-blue-100 rounded-lg py-2 px-4 font-medium"
      >
        <div class="flex-1 text-center">
          {{ item.name }}
        </div>
        <div class="flex items-center justify-center gap-2 group relative">
          <span>Antal modeller</span>
          <input
            type="number"
            min="1"
            :max="item.productId !== undefined ? availability[item.productId] ?? 1 : 1"
            v-model.number="item.quantity"
            class="w-20 text-center rounded border border-gray-300"
          />
          <span
            v-if="item.productId !== undefined && item.quantity === (availability[item.productId] ?? 1)"
            class="absolute left-1/2 z-10 -translate-x-1/2 -top-14 w-56 rounded bg-white text-white text-xs px-3 py-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-normal shadow-lg"
            style="color: #b90c2c; background: #FF8800"
          >
            Maksimum antal valgt
          </span>
        </div>
        <button
          @click="removeModel(idx)"
          class="ml-2 text-sm text-gray-500 fjern-btn cursor-pointer"
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
      <div class="flex items-center gap-3">
        <select
          v-model="selectedAccessoryName"
          :disabled="!datesSelected"
          class="flex-1 w-full border border-gray-300 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
        >
          <option disabled value="">Vælg tilbehør…</option>
          <option v-for="acc in accessories" :key="acc.name" :value="acc.name">
            {{ acc.name }} — {{ acc.price.toFixed(2) }} kr./dag
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

    <!-- Selected Accessory and Quantity -->
    <div
      v-if="selectedAccessories && selectedAccessories.length"
      class="space-y-2"
    >
      <div
        v-for="(item, idx) in selectedAccessories"
        :key="item.name"
        class="flex gap-4 items-center"
      >
        <div class="flex-1 bg-blue-100 text-center rounded-lg py-2 font-medium">
          {{ item.name }}
        </div>
        <div
          class="flex-1 bg-blue-100 text-center rounded-lg py-2 font-medium flex items-center justify-center gap-2"
        >
          <span>Antal modeller</span>
          <input
            type="number"
            min="1"
            :max="getMaxAccessoryQuantity(item)"
            v-model.number="item.quantity"
            class="w-20 text-center rounded border border-gray-300"
          />
          <span v-if="item.quantity >= getMaxAccessoryQuantity(item)" class="relative group ml-2">
            <span class="absolute left-1/2 z-10 -translate-x-1/2 mt-2 w-40 rounded bg-white text-red-600 text-xs px-3 py-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-normal shadow-lg">
              Du kan ikke vælge flere end det maksimale antal tilgængelige.
            </span>
          </span>
        </div>
        <button
          @click="removeAccessory(idx)"
          class="ml-2 text-sm text-gray-500 hover:text-black"
        >
          Fjern
        </button>
      </div>
    </div>

    <!-- Insurance Toggle -->
    <section
      class="bg-gray-50 rounded-xl p-6 shadow flex items-center justify-between"
    >
      <div class="flex items-center gap-3">
        <span
          class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 24 24"
          >
            <path
              fill="#08d035"
              d="M12 22q-3.475-.875-5.738-3.988T4 11.1V5l8-3l8 3v6.1q0 3.8-2.262 6.913T12 22m0-2.1q2.6-.825 4.3-3.3t1.7-5.5V6.375l-6-2.25l-6 2.25V11.1q0 3.025 1.7 5.5t4.3 3.3m0-7.9"
            />
          </svg>
        </span>
        <div>
          <div class="font-semibold flex items-center gap-1">
            Forsikring
            <span class="relative group cursor-pointer">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle cx="12" cy="12" r="10" fill="#FBBF24" />
                <text
                  x="12"
                  y="17"
                  text-anchor="middle"
                  font-size="16"
                  fill="#fff"
                  font-family="Arial"
                  font-weight="bold"
                >
                  !
                </text>
              </svg>
              <span
                class="absolute left-1/2 z-10 -translate-x-1/2 mt-2 w-56 rounded bg-white text-white text-xs px-3 py-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-normal shadow-lg"
              >
                Dette er dummy tekst om forsikringen. Her kan du forklare hvad
                forsikringen dækker, f.eks. skader, tyveri, selvrisiko osv.
              </span>
            </span>
          </div>
          <div class="text-sm text-gray-500">Fuld erstatningsdækning</div>
        </div>
      </div>
      <label class="inline-flex relative items-center cursor-pointer">
        <input
          type="checkbox"
          v-model="insurance"
          class="sr-only peer"
          :disabled="!datesSelected"
        />
        <div
          class="w-14 h-8 bg-gray-200 rounded-full peer peer-checked:bg-rose-600 transition-colors"
        ></div>
        <div
          class="absolute left-1 top-1 w-6 h-6 bg-white rounded-full shadow peer-checked:translate-x-6 transition-transform"
        ></div>
      </label>
    </section>
  </div>
</template>

<script setup lang="ts">
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
}

function getMaxProductQuantity(item: { name: string; productId?: number }) {
  const arr = models.value as ProductOption[];
  const id = item.productId ?? arr.find((m: ProductOption) => m.name === item.name)?.id;
  return id !== undefined ? (availability.value[id] ?? 5) : 5;
}

function getMaxAccessoryQuantity(item: { name: string }) {
  const arr = models.value as ProductOption[];
  const id = arr.find((m: ProductOption) => m.name === item.name)?.id;
  return id !== undefined ? (availability.value[id] ?? 5) : 5;
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
const accessories = ref<{ name: string; price: number }[]>([]);
const availability = ref<Record<number, number>>({});
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

// Computed: are dates selected?
const datesSelected = computed(() => !!startDate.value && !!endDate.value);

function selectModel(model: {
  name: string;
  price: number;
  productId?: number;
  config?: { dailyPrice: number; weeklyPrice: number; twoWeekPrice: number };
}) {
  const found = selectedModels.value.find((m) => m.name === model.name);
  if (found) {
    found.quantity++;
  } else {
    selectedModels.value.push({ ...model, quantity: 1 });
  }
}

function onAddSelectedModel() {
  const model = models.value.find((m) => m.name === selectedModelName.value);
  if (model) {
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
      // TODO: Add setCameraId to store if needed
      // store.setCameraId(camera.id);
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

// --- Price calculation helpers with discount logic ---
function getRentalDays() {
  if (!startDate.value || !endDate.value) return 0;
  const msPerDay = 1000 * 60 * 60 * 24;
  // Add 1 to include both start and end date
  return Math.max(1, Math.ceil((endDate.value.getTime() - startDate.value.getTime()) / msPerDay) + 1);
}

function getModelBreakdown() {
  // Apply 25% discount to all cameras except the first
  return selectedModels.value.map((item, idx) => {
    const days = getRentalDays();
    let pricePerDay = item.price;
    if (idx > 0) pricePerDay = pricePerDay * 0.75;
    return {
      name: item.name,
      quantity: item.quantity,
      pricePerDay,
      total: pricePerDay * item.quantity * days
    };
  });
}

function getAccessoryBreakdown() {
  const days = getRentalDays();
  return selectedAccessories.value.map(item => ({
    name: item.name,
    quantity: item.quantity,
    pricePerDay: item.price,
    total: item.price * item.quantity * days
  }));
}

function getTotalPrice() {
  const days = getRentalDays();
  // Models: first full price, rest 25% off
  let modelTotal = 0;
  selectedModels.value.forEach((item, idx) => {
    let pricePerDay = item.price;
    if (idx > 0) pricePerDay = pricePerDay * 0.75;
    modelTotal += pricePerDay * item.quantity * days;
  });
  // Accessories: no discount
  let accessoryTotal = 0;
  selectedAccessories.value.forEach(item => {
    accessoryTotal += item.price * item.quantity * days;
  });
  // Insurance: add if selected (example: flat 100 kr)
  let insuranceTotal = insurance.value ? 100 : 0;
  return modelTotal + accessoryTotal + insuranceTotal;
}

// Sync to store
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
      name: a.name,
      price: typeof a.price === "number" ? a.price : 70,
    }));
  } catch (e) {
    console.error("Error fetching accessories from Supabase:", e);
    // Set some default accessories if table doesn't exist yet
    accessories.value = [
      { name: "Grip", price: 70 },
      { name: "Ekstra batteri", price: 50 },
      { name: "Headstrap", price: 60 },
      { name: "Brystmount", price: 80 },
      { name: "Beskyttelsescase", price: 40 },
      { name: "Sugekop til ruder", price: 90 }
    ];
  }

  // Note: Availability checking would need to be implemented with a bookings table
  // For now, we'll skip the availability check since we don't have booking data yet
});

// Refetch availability whenever dates change and both are set
// Note: This would need to be implemented with a bookings table in Supabase
watch([startDate, endDate], async () => {
  if (!startDate.value || !endDate.value) {
    availability.value = {};
    return;
  }
  
  // For now, we'll assume all products have availability of 5
  // In a real implementation, you'd query the bookings table to check availability
  const defaultAvailability: Record<number, number> = {};
  models.value.forEach(model => {
    defaultAvailability[model.id] = 5; // Assume 5 available
  });
  availability.value = defaultAvailability;
  
  // TODO: Implement real availability checking with Supabase
  // const supabase = useSupabase();
  // const { data: bookings } = await supabase
  //   .from('bookings')
  //   .select('product_id, quantity')
  //   .overlaps('rental_period', `[${startDate.value.toISOString()}, ${endDate.value.toISOString()}]`);
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
