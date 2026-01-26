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
    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto mt-12 mb-16">
      <!-- Debug info -->
      <div v-if="products.length === 0" class="col-span-full text-center text-gray-500">
        Ingen produkter fundet
      </div>
      <!-- <div v-else class="col-span-full text-center text-sm text-gray-500 mb-4">
        {{ products.length }} produkter fundet
      </div> -->
      
      <ProductCard
        v-for="product in products"
        :key="product.id"
        :title="product.name"
        :description="''"
        :img="product.imageUrl || placeholderImage"
        :features="product.features ? product.features.split(',').map(f => f.trim()) : []"
        :priceDay="product.dailyPrice"
        :priceWeek="product.weeklyPrice"
        :twoWeekPrice="product.twoWeekPrice"
        :popular="false"
        :productId="product.id"
      />
    </div>
    <div class="flex flex-wrap justify-center gap-8 my-12 max-w-7xl mx-auto">
      <div 
        v-for="accessory in accessories" 
        :key="accessory.id" 
        class="w-full md:w-[30%] lg:w-[30%] bg-gray-50 rounded-xl p-6 shadow flex flex-col items-center mb-8"
        :class="accessory.includedByDefault ? 'relative' : ''"
      >
        <span v-if="accessory.includedByDefault" class="absolute top-3 right-3 bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full">Inkluderet</span>
        <img 
          :src="accessory.imageUrl || placeholderImage" 
          :alt="`GoPro ${accessory.name} - ${accessory.description}`" 
          class="w-24 h-24 object-cover rounded-lg mb-3" 
          loading="lazy" 
        />
        <h4 class="text-lg font-bold mb-1">{{ accessory.name }}</h4>
        <p class="text-sm text-gray-600 text-center">{{ accessory.description }}</p>
      </div>
      <!-- Hardcoded Beskyttelsescase - always included -->
      <div class="w-full md:w-[30%] lg:w-[30%] bg-gray-50 rounded-xl p-6 shadow flex flex-col items-center mb-8 relative">
        <span class="absolute top-3 right-3 bg-green-600 text-white text-xs font-semibold px-3 py-1 rounded-full">Inkluderet</span>
        <img src="https://static.gopro.com/assets/blta2b8522e5372af40/blt412da0ad3ddaa0f6/64835bbbcc30bb258ab04e57/pdp-protective-housing-image03-1920-2x.png?width=400&quality=90&auto=webp" alt="GoPro beskyttelsescase vandtæt etui - robust beskyttelse mod stød og vand" class="w-24 h-24 object-cover rounded-lg mb-3" loading="lazy" />
        <h4 class="text-lg font-bold mb-1">Beskyttelsescase</h4>
        <p class="text-sm text-gray-600 text-center">Robust etui der beskytter kameraet mod stød, vand og snavs.</p>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import ProductCard from '@/components/ProductCard.vue';
import Header from '@/components/Header.vue';
import Footer from '@/components/Footer.vue';

// Define the product interface to match Supabase table structure
interface Product {
  id: number;
  name: string;
  features: string;
  dailyPrice: number;
  weeklyPrice: number;
  twoWeekPrice?: number;
  quantity: number;
  imageUrl?: string;
}

// Define the accessory interface
interface Accessory {
  id: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  includedByDefault?: boolean;
}

// Reactive state
const products = ref<Product[]>([]);
const accessories = ref<Accessory[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const placeholderImage = 'https://static.gopro.com/assets/blta2b8522e5372af40/blt6ff9ada3eca94bbc/643ee100b1f4db27b0203e9d/pdp-h10-image01-1920-2x.png';

// Get Supabase client
const supabase = useSupabase();

// Generate SEO-optimized meta description based on available products
const generateMetaDescription = (productsList: Product[]) => {
  if (productsList.length === 0) {
    return 'Udforsk vores udvalg af GoPro actionkameraer til leje. Professionelt udstyr til dit næste eventyr med tilbehør og konkurrencedygtige priser.';
  }
  
  const productNames = productsList.map(p => p.name).join(', ');
  const lowestPrice = Math.min(...productsList.map(p => p.dailyPrice));
  
  return `Lej ${productNames} fra kun ${lowestPrice}kr/dag. Professionelt GoPro udstyr med komplet tilbehør til eventyr, sport og rejser. Hurtig levering i Danmark.`;
};

// Dynamic SEO Meta Tags - will update when products load
const metaTitle = computed(() => {
  if (products.value.length > 0) {
    const names = products.value.map(p => p.name).join(', ');
    return `Lej ${names} - GoPro Actionkamera Udlejning | LejGoPro`;
  }
  return 'GoPro Produkter til Leje - Hero 13, Hero 12 & Tilbehør | LejGoPro';
});

const metaDescription = computed(() => generateMetaDescription(products.value));

useSeoMeta({
  title: metaTitle,
  description: metaDescription,
  keywords: 'gopro hero 13 leje, gopro hero 12 rental, gopro hero 11 udlejning, actionkamera produkter, gopro tilbehør leje, grip headstrap brystmount',
  robots: 'index, follow',
  
  // Open Graph
  ogTitle: metaTitle,
  ogDescription: metaDescription,
  ogType: 'website',
  ogUrl: 'https://lejgopro.dk/products',
  
  // Twitter Card
  twitterCard: 'summary_large_image',
  twitterTitle: metaTitle,
  twitterDescription: metaDescription
})

// Fetch products from Supabase
const fetchProducts = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    if (!supabase) {
      throw new Error('Supabase client ikke tilgængelig');
    }
    
    const { data, error: supabaseError } = await supabase
      .from('Product')
      .select('*')
      .order('id', { ascending: true });
    
    if (supabaseError) {
      throw supabaseError;
    }
    
    console.log('Raw products data from Supabase:', data);
    
    // Use the data directly as it matches our interface
    products.value = data || [];
    
    console.log('Products:', products.value);
    console.log('First product dailyPrice:', products.value[0]?.dailyPrice);
    console.log('First product weeklyPrice:', products.value[0]?.weeklyPrice);
    console.log('Products length:', products.value.length);
  } catch (err: any) {
    error.value = err.message || 'Der opstod en fejl ved indlæsning af produkter';
    console.error('Error fetching products:', err);
  } finally {
    loading.value = false;
  }
};

// Fetch accessories from Supabase
const fetchAccessories = async () => {
  try {
    if (!supabase) {
      throw new Error('Supabase client ikke tilgængelig');
    }
    
    const { data, error: supabaseError } = await supabase
      .from('Accessory')
      .select('*')
      .order('id', { ascending: true });
    
    if (supabaseError) {
      throw supabaseError;
    }
    
    accessories.value = data || [];
    console.log('Accessories loaded:', accessories.value.length);
  } catch (err: any) {
    console.error('Error fetching accessories:', err);
  }
};

// Fetch products on component mount
onMounted(() => {
  fetchProducts();
  fetchAccessories();
});
</script>
