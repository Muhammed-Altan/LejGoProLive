<template>
  <div>
    <Header />
    <h1 class="text-3xl md:text-4xl font-bold text-center mb-8 mt-8">Vores GoPro Produkter</h1>
    
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center items-center my-12">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[#B8082A] mx-auto mb-4"></div>
        <p class="text-gray-600">Indlæser produkter...</p>
      </div>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="max-w-2xl mx-auto text-center my-12 p-6 bg-red-50 rounded-lg">
      <p class="text-red-600 mb-4">{{ error }}</p>
      <button @click="fetchProducts" class="bg-[#B8082A] text-white px-4 py-2 rounded hover:bg-[#a10725]">
        Prøv igen
      </button>
    </div>
    
    <!-- Products grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-7xl mx-auto mt-12 mb-16">
      <ProductCard
        v-for="product in products"
        :key="product.id"
        :title="product.name"
        :description="product.description"
        :img="product.image_url || placeholderImage"
        :features="typeof product.features === 'string' ? product.features.split(',') : product.features"
        :priceDay="product.dailyPrice"
        :priceWeek="product.weeklyPrice"
        :popular="product.popular || false"
        :productId="product.id"
      />
    </div>
    <div class="flex flex-wrap justify-center gap-8 my-12 max-w-7xl mx-auto">
      <div class="w-full md:w-[30%] lg:w-[30%] bg-gray-50 rounded-xl p-6 shadow flex flex-col items-center mb-8">
        <img src="https://static.gopro.com/assets/blta2b8522e5372af40/blt4a6b3e1087b3473f/663a841c2a72d93452178ba2/01-pdp-h12b-handler-gallery-1920.png?width=1920&quality=80&auto=webp&disable=upscale" alt="Grip" class="w-24 h-24 object-cover rounded-lg mb-3" />
        <h4 class="text-lg font-bold mb-1">Grip</h4>
        <p class="text-sm text-gray-600 text-center">Stabilt håndtag til actionoptagelser og nem håndtering af kameraet.</p>
      </div>
      <div class="w-full md:w-[30%] lg:w-[30%] bg-gray-50 rounded-xl p-6 shadow flex flex-col items-center mb-8">
        <img src="https://static.gopro.com/assets/blta2b8522e5372af40/blt4a3f356761a12e6d/6465f1c79cb8cadbd353f013/pdp-max-enduro-battery-image01-1920-2x.png?width=1920&quality=80&auto=webp&disable=upscale" alt="Ekstra batteri" class="w-24 h-24 object-cover rounded-lg mb-3" />
        <h4 class="text-lg font-bold mb-1">Ekstra batteri</h4>
        <p class="text-sm text-gray-600 text-center">Sørger for ekstra strøm, så du kan optage længere tid uden afbrydelser.</p>
      </div>
      <div class="w-full md:w-[30%] lg:w-[30%] bg-gray-50 rounded-xl p-6 shadow flex flex-col items-center mb-8">
        <img src="https://static.gopro.com/assets/blta2b8522e5372af40/blt5028e412643854ae/65cbdc3afcd8646428eec8a5/01-pdp-h12b-headstrap-gallery-1920.png?width=1920&quality=80&auto=webp&disable=upscale" alt="Headstrap" class="w-24 h-24 object-cover rounded-lg mb-3" />
        <h4 class="text-lg font-bold mb-1">Headstrap</h4>
        <p class="text-sm text-gray-600 text-center">Monter kameraet på hovedet for hands-free POV-optagelser.</p>
      </div>
      <div class="w-full md:w-[30%] lg:w-[30%] bg-gray-50 rounded-xl p-6 shadow flex flex-col items-center mb-8">
        <img src="https://static.gopro.com/assets/blta2b8522e5372af40/bltbc6b778286c13383/64ccd3c131eb6a3cbbd4c86f/01-pdp-h12b-chesty-gallery-1920.png?width=1920&quality=80&auto=webp&disable=upscale" alt="Brystmount" class="w-24 h-24 object-cover rounded-lg mb-3" />
        <h4 class="text-lg font-bold mb-1">Brystmount</h4>
        <p class="text-sm text-gray-600 text-center">Perfekt til sport og aktiviteter, hvor du vil have kameraet tæt på kroppen.</p>
      </div>
      <div class="w-full md:w-[30%] lg:w-[30%] bg-gray-50 rounded-xl p-6 shadow flex flex-col items-center mb-8">
        <img src="https://static.gopro.com/assets/blta2b8522e5372af40/blt412da0ad3ddaa0f6/64835bbbcc30bb258ab04e57/pdp-protective-housing-image03-1920-2x.png?width=1920&quality=80&auto=webp&disable=upscale" alt="Beskyttelsescase" class="w-24 h-24 object-cover rounded-lg mb-3" />
        <h4 class="text-lg font-bold mb-1">Beskyttelsescase</h4>
        <p class="text-sm text-gray-600 text-center">Robust etui der beskytter kameraet mod stød, vand og snavs.</p>
      </div>
      <div class="w-full md:w-[30%] lg:w-[30%] bg-gray-50 rounded-xl p-6 shadow flex flex-col items-center mb-8">
        <img src="https://static.gopro.com/assets/blta2b8522e5372af40/blt865a9a20edc4b79b/663a899c8447cbcee89cb5a8/01-pdp-h12b-suction-cup-gallery-1920.png?width=1920&quality=80&auto=webp&disable=upscale" alt="Sugekop til ruder" class="w-24 h-24 object-cover rounded-lg mb-3" />
        <h4 class="text-lg font-bold mb-1">Sugekop til ruder</h4>
        <p class="text-sm text-gray-600 text-center">Fastgør kameraet sikkert til bilruder og glatte overflader for unikke vinkler.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import ProductCard from '@/components/ProductCard.vue';
import Header from '@/components/Header.vue';

// Define the product interface to match Supabase table structure
interface Product {
  id: number;
  name: string;
  description: string;
  features: string | string[];
  dailyPrice: number;
  weeklyPrice: number;
  twoWeekPrice?: number;
  popular: boolean;
  image_url?: string;
  category?: string;
  quantity?: number;
  created_at?: string;
}

// Reactive state
const products = ref<Product[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const placeholderImage = 'https://images.unsplash.com/photo-1519183071298-a2962be56693?auto=format&fit=crop&w=400&q=80';

// Get Supabase client
const supabase = useSupabase();

// Fetch products from Supabase
const fetchProducts = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    const { data, error: supabaseError } = await supabase
      .from('Product')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (supabaseError) {
      throw supabaseError;
    }
    
    // Transform the data from database schema to interface
    products.value = (data || []).map(p => ({
      id: p.id,
      name: p.name,
      description: '', // No description in your table
      features: p.features,
      dailyPrice: p.dailyPrice,
      weeklyPrice: p.weeklyPrice,
      twoWeekPrice: p.twoWeekPrice,
      popular: p.popular,
      image_url: p.image_url, // May not exist but keeping for future
      category: p.category, // May not exist but keeping for future
      quantity: p.quantity
    }));
  } catch (err: any) {
    error.value = err.message || 'Der opstod en fejl ved indlæsning af produkter';
    console.error('Error fetching products:', err);
  } finally {
    loading.value = false;
  }
};

// Fetch products on component mount
onMounted(() => {
  fetchProducts();
});
</script>
