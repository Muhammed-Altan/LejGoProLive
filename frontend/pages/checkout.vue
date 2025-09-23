<template>
  <Header />
  <section class="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Venstre side (2/3 af bredden) -->
    <div class="lg:col-span-2 space-y-6 bg-white p-6 rounded-xl shadow-md">
      <ProductStep />
      <DeliveryStep />
      <PaymentStep />
      <BookingConfirmation />
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
import PaymentStep from '@/components/booking/PaymentStep.vue';
import BookingConfirmation from '@/components/booking/BookingConfirmation.vue';
import BasketView from '@/components/booking/BasketView.vue';
import Header from '~/components/Header.vue';
import Footer from '~/components/Footer.vue';
import { useCheckoutStore } from '@/stores/checkout';

// Handle URL parameters for pre-selecting products
const route = useRoute();
const store = useCheckoutStore();

onMounted(async () => {
  const productId = route.query.product;
  
  if (productId && typeof productId === 'string') {
    const supabase = useSupabase();
    
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