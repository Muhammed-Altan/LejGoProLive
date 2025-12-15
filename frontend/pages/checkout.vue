<template>
  <Header />
  
  <section class="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Venstre side (2/3 af bredden) -->
    <div class="lg:col-span-2 space-y-6 bg-white p-6 rounded-xl shadow-md">
      <ProductStep />
      <DeliveryStep />
      <!-- Use if we want to hide the payment section until all required info is filled -->
      <!-- <PensoPayment v-if="showPayment" /> -->
       <PensoPayment />
    </div>

    <!-- Højre side (1/3 af bredden, sticky kurv) -->
    <aside class="space-y-6">
      <BasketView />
    </aside>
  </section>
  
  <Footer />
</template>

<script setup lang="ts">
import ProductStep from '@/components/booking/ProductStep.vue';
import DeliveryStep from '@/components/booking/DeliveryStep.vue';
import PensoPayment from '@/components/booking/PensoPayment.vue';
import BasketView from '@/components/booking/BasketView.vue';
import Header from '~/components/Header.vue';
import Footer from '~/components/Footer.vue';
import { useCheckoutStore } from '@/stores/checkout';

// Handle URL parameters for pre-selecting products
const route = useRoute();
const store = useCheckoutStore();

// Show payment when all required info is filled
const showPayment = computed(() => {
  return !!(store.fullName && store.email && store.address && store.city && store.postalCode && store.phone && store.startDate && store.endDate && (store.selectedModels.length > 0 || store.selectedAccessories.length > 0));
});

onMounted(async () => {
  // Run cleanup of old pending bookings in background
  try {
    await $fetch('/api/cleanup-old-bookings');
  } catch (error) {
    // Silently fail - don't block checkout if cleanup fails
    console.log('Cleanup skipped:', error);
  }

  const productId = route.query.product;
  
  if (productId && typeof productId === 'string') {
    const supabase = useSupabase();
    if (!supabase) {
      console.error('Supabase client not available');
      return;
    }
    
    try {
      // Fetch the specific product from Supabase
      const { data: product, error } = await supabase
        .from('Product')
        .select('*')
        .eq('id', parseInt(productId))
        .single();
      
      if (error) throw error;
      
      if (product) {
        // Pre-select this product in the store
        store.setSelectedModels([{
          name: product.name,
          price: product.dailyPrice,
          quantity: 1,
          productId: product.id,
          config: {
            dailyPrice: product.dailyPrice,
            weeklyPrice: product.weeklyPrice || product.dailyPrice * 7,
            twoWeekPrice: product.twoWeekPrice || product.dailyPrice * 14,
          }
        }]);
        
        store.setProductId(product.id);
      }
    } catch (error) {
      console.error('Error pre-selecting product:', error);
    }
  }
});
</script>