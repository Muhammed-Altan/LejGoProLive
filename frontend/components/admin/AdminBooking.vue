<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 overflow-y-auto py-8">
    <div class="bg-white rounded-xl shadow-md p-8 w-full max-w-4xl relative my-8 admin-booking-modal">
      <button @click="$emit('close')" class="absolute top-4 right-4 text-gray-400 hover:text-[#B8082A] text-2xl font-bold">&times;</button>
      
      <h2 class="mb-6 text-2xl font-semibold">Opret Admin Booking</h2>
      
      <form @submit.prevent="submitBooking" class="space-y-6">
        
        <!-- Booking Period -->
        <section class="bg-gray-50 rounded-xl p-6 shadow">
          <h3 class="font-semibold text-lg mb-4">Booking Periode</h3>
          <div class="flex flex-col sm:flex-row gap-4">
            <div class="flex-1">
              <label class="block text-sm font-medium mb-2">Start dato</label>
              <VueDatePicker
                v-model="form.startDate"
                :enable-time-picker="false"
                format="dd/MM/yyyy"
                placeholder="Start dato"
                :auto-apply="true"
                :min-date="new Date()"
              />
            </div>
            <div class="flex-1">
              <label class="block text-sm font-medium mb-2">Slut dato</label>
              <VueDatePicker
                v-model="form.endDate"
                :enable-time-picker="false"
                format="dd/MM/yyyy"
                placeholder="Slut dato"
                :auto-apply="true"
                :min-date="form.startDate || new Date()"
                :disabled="!form.startDate"
              />
            </div>
          </div>
        </section>

        <!-- Product Selection -->
        <section class="bg-gray-50 rounded-xl p-6 shadow">
          <h3 class="font-semibold text-lg mb-4">Vælg Produkter</h3>
          <div v-if="!form.startDate || !form.endDate" class="mb-3 p-3 rounded bg-yellow-100 border border-yellow-300 text-yellow-900">
            Vælg venligst bookingperiode først
          </div>
          <div v-else>
            <select
              v-model="selectedProductId"
              @change="addProduct"
              class="w-full border border-gray-300 rounded-lg py-3 px-4 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option disabled value="">Vælg et produkt...</option>
              <option
                v-for="product in availableProducts"
                :key="product.id"
                :value="product.id"
              >
                {{ product.name }} - {{ product.dailyPrice }} kr/dag
              </option>
            </select>

            <!-- Selected Products -->
            <div v-if="form.models.length > 0" class="space-y-2 mt-4">
              <div
                v-for="(model, idx) in form.models"
                :key="idx"
                class="flex items-center justify-between bg-gray-100 rounded-lg p-3"
              >
                <div class="flex-1">
                  <p class="font-medium">{{ model.name }}</p>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-sm">Antal:</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    v-model.number="model.quantity"
                    class="w-16 text-center rounded border border-gray-300"
                  />
                  <button
                    type="button"
                    @click="removeProduct(idx)"
                    class="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Fjern
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Accessory Selection -->
        <section class="bg-gray-50 rounded-xl p-6 shadow">
          <h3 class="font-semibold text-lg mb-4">Vælg Tilbehør (Valgfri)</h3>
          <div v-if="!form.startDate || !form.endDate || form.models.length === 0" class="mb-3 p-3 rounded bg-yellow-100 border border-yellow-300 text-yellow-900">
            Vælg venligst produkt først
          </div>
          <div v-else>
            <select
              v-model="selectedAccessoryName"
              @change="addAccessory"
              class="w-full border border-gray-300 rounded-lg py-3 px-4 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option disabled value="">Vælg tilbehør...</option>
              <option
                v-for="accessory in availableAccessories"
                :key="accessory.id"
                :value="accessory.name"
              >
                {{ accessory.name }} - {{ accessory.price }} kr
              </option>
            </select>

            <!-- Selected Accessories -->
            <div v-if="form.accessories.length > 0" class="space-y-2 mt-4">
              <div
                v-for="(accessory, idx) in form.accessories"
                :key="idx"
                class="flex items-center justify-between bg-gray-100 rounded-lg p-3"
              >
                <div class="flex-1">
                  <p class="font-medium">{{ accessory.name }}</p>
                </div>
                <div class="flex items-center gap-3">
                  <span class="text-sm">Antal:</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    v-model.number="accessory.quantity"
                    class="w-16 text-center rounded border border-gray-300"
                  />
                  <button
                    type="button"
                    @click="removeAccessory(idx)"
                    class="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Fjern
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Customer Information -->
        <section class="bg-gray-50 rounded-xl p-6 shadow">
          <h3 class="font-semibold text-lg mb-4">Kunde Information</h3>
          <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">Fulde navn *</label>
                <input
                  type="text"
                  v-model="form.fullName"
                  required
                  class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Indtast navn"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">Telefon *</label>
                <input
                  type="tel"
                  v-model="form.phone"
                  required
                  class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="+45 12 34 56 78"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Email *</label>
              <input
                type="email"
                v-model="form.email"
                required
                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Adresse *</label>
              <input
                type="text"
                v-model="form.address"
                required
                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Gadenavn 123"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">Lejlighed/Etage (Valgfri)</label>
              <input
                type="text"
                v-model="form.apartment"
                class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="2. sal, th."
              />
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">Postnummer *</label>
                <input
                  type="text"
                  v-model="form.postalCode"
                  required
                  class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="1000"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-2">By *</label>
                <input
                  type="text"
                  v-model="form.city"
                  required
                  class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="København"
                />
              </div>
            </div>
          </div>
        </section>

        <!-- Custom Price -->
        <section class="bg-gray-50 rounded-xl p-6 shadow">
          <h3 class="font-semibold text-lg mb-4">Pris</h3>
          <div>
            <label class="block text-sm font-medium mb-2">Total pris (DKK) *</label>
            <input
              type="number"
              v-model.number="form.customPrice"
              required
              min="0"
              step="0.01"
              class="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="0.00"
            />
            <p class="text-xs text-gray-500 mt-1">Indtast den totale pris for denne booking i DKK</p>
          </div>
        </section>

        <!-- Error Message -->
        <div v-if="errorMessage" class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-red-700">{{ errorMessage }}</p>
        </div>

        <!-- Success Message -->
        <div v-if="successMessage" class="bg-green-50 border border-green-200 rounded-lg p-4">
          <p class="text-green-700">{{ successMessage }}</p>
        </div>

        <!-- Submit Buttons -->
        <div class="flex gap-4 justify-end pt-4">
          <button
            type="button"
            @click="$emit('close')"
            class="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
            :disabled="loading"
          >
            Annuller
          </button>
          <button
            type="submit"
            class="px-6 py-3 rounded-lg bg-[#B8082A] text-white font-semibold hover:bg-[#a10725] transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            :disabled="loading || !canSubmit"
          >
            {{ loading ? 'Opretter...' : 'Opret Booking' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';

const emit = defineEmits(['close', 'success']);

// Form data
const form = ref({
  startDate: null as Date | null,
  endDate: null as Date | null,
  models: [] as Array<{ name: string; quantity: number; productId: number }>,
  accessories: [] as Array<{ name: string; quantity: number }>,
  fullName: '',
  email: '',
  phone: '',
  address: '',
  apartment: '',
  postalCode: '',
  city: '',
  insurance: false,
  notes: '',
  customPrice: 0,
});

const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

// Products and accessories from database
const availableProducts = ref<Array<any>>([]);
const availableAccessories = ref<Array<any>>([]);

const selectedProductId = ref('');
const selectedAccessoryName = ref('');

// Fetch products and accessories
onMounted(async () => {
  try {
    // Fetch products from the same endpoint as checkout
    const productsResponse = await fetch('/api/products');
    if (productsResponse.ok) {
      const productsData = await productsResponse.json();
      console.log('📦 Loaded products raw:', productsData);
      console.log('📦 Type:', typeof productsData, 'Is array:', Array.isArray(productsData));
      
      // Handle both direct array and nested data structure
      const products = Array.isArray(productsData) ? productsData : (productsData.data || []);
      
      availableProducts.value = products.map((p: any) => ({
        id: p.id,
        name: p.name,
        dailyPrice: p.dailyPrice,
        weeklyPrice: p.weeklyPrice,
        twoWeekPrice: p.twoWeekPrice,
        imageUrl: p.imageUrl,
      }));
      
      console.log('📦 Processed products:', availableProducts.value);
    }

    // Fetch accessories from Supabase
    const supabase = useSupabase();
    const { data: accessoriesData, error: accessoriesError } = await supabase
      .from('Accessory')
      .select('*');
    
    if (!accessoriesError && accessoriesData) {
      console.log('🎒 Loaded accessories:', accessoriesData);
      availableAccessories.value = accessoriesData.map((a: any) => ({
        id: a.id,
        name: a.name,
        price: a.price,
        quantity: a.quantity,
      }));
    }
    
    /* Alternative: Use admin endpoint with auth token
    const token = localStorage.getItem('adminToken');
    const accessoriesResponse = await fetch('/api/admin/accessories', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    */
  } catch (error) {
    console.error('Error fetching data:', error);
    errorMessage.value = 'Kunne ikke hente produkter og tilbehør';
  }
});

// Add product
const addProduct = () => {
  const productId = parseInt(selectedProductId.value);
  const product = availableProducts.value.find(p => p.id === productId);
  
  if (product) {
    // Check if already added
    const exists = form.value.models.find(m => m.productId === productId);
    if (!exists) {
      form.value.models.push({
        name: product.name,
        quantity: 1,
        productId: product.id,
      });
    }
  }
  
  selectedProductId.value = '';
};

// Remove product
const removeProduct = (index: number) => {
  form.value.models.splice(index, 1);
};

// Add accessory
const addAccessory = () => {
  const name = selectedAccessoryName.value;
  const accessory = availableAccessories.value.find(a => a.name === name);
  
  if (accessory) {
    // Check if already added
    const exists = form.value.accessories.find(a => a.name === name);
    if (!exists) {
      form.value.accessories.push({
        name: accessory.name,
        quantity: 1,
      });
    }
  }
  
  selectedAccessoryName.value = '';
};

// Remove accessory
const removeAccessory = (index: number) => {
  form.value.accessories.splice(index, 1);
};

// Check if form can be submitted
const canSubmit = computed(() => {
  return (
    form.value.startDate &&
    form.value.endDate &&
    form.value.models.length > 0 &&
    form.value.fullName &&
    form.value.email &&
    form.value.phone &&
    form.value.address &&
    form.value.postalCode &&
    form.value.city &&
    form.value.customPrice > 0
  );
});

// Get auth composable
const auth = useAuth();

// Submit booking
const submitBooking = async () => {
  if (!canSubmit.value) {
    errorMessage.value = 'Udfyld venligst alle påkrævede felter';
    return;
  }

  loading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const response = await auth.authenticatedFetch('/api/admin/booking', {
      method: 'POST',
      body: {
        startDate: form.value.startDate?.toISOString(),
        endDate: form.value.endDate?.toISOString(),
        models: form.value.models,
        accessories: form.value.accessories,
        fullName: form.value.fullName,
        email: form.value.email,
        phone: form.value.phone,
        address: form.value.address,
        apartment: form.value.apartment,
        postalCode: form.value.postalCode,
        city: form.value.city,
        insurance: form.value.insurance,
        notes: form.value.notes,
        customPrice: form.value.customPrice,
      },
    });

    const data = response;

    if (data.status === 200 || data.orderId) {
      successMessage.value = `Booking oprettet! Ordre ID: ${data.orderId}`;
      emit('success');
      emit('close');
    } else {
      errorMessage.value = data.statusMessage || data.message || 'Kunne ikke oprette booking';
    }
  } catch (error) {
    console.error('Error creating booking:', error);
    errorMessage.value = 'Der opstod en fejl ved oprettelse af booking';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.admin-booking-modal {
  max-height: 90vh;
  overflow-y: auto;
}
</style>
