<template>
  <div class="bg-white rounded-2xl shadow-lg border p-6 flex flex-col" :class="{ 'relative': popular }">
  <span v-if="popular" class="absolute top-3 right-3 bg-[#B8082A] text-white text-xs font-semibold px-3 py-1 rounded-full">Mest Populær</span>
  <img 
    :src="img" 
    :alt="title" 
    class="w-full h-52 object-contain mb-4"
    loading="lazy"
  />
  <div class="flex justify-between items-center mb-3">
    <h3 class="font-bold text-2xl text-black">{{ title }}</h3>
    <span class="font-bold text-[#B8082A] text-lg">fra {{ displayPrice }} kr/dag</span>
  </div>
    <p class="text-sm text-gray-600 mb-3">{{ description }}</p>
    <ul class="text-sm text-gray-500 mb-6 space-y-1">
      <li v-for="feature in features" :key="feature">{{ feature }}</li>
    </ul>
  <NuxtLink :to="`/checkout?product=${productId}`" class="bg-[#B8082A] text-white font-semibold py-2 px-6 rounded-full mt-auto text-center block hover:bg-[#a10725] transition">Se pris og tilgængelighed</NuxtLink>
  </div>
</template>

<script setup>
/**
 * ProductCard Component
 * 
 * Displays a single product (GoPro camera) with pricing and features
 * 
 * Features:
 * - Product image with lazy loading
 * - Dynamic pricing (calculated from 2-week price for best value)
 * - Feature list
 * - "Mest Populær" badge for highlighted products
 * - Direct link to checkout with pre-selected product
 * 
 * Used on:
 * - Homepage product grid
 * - Products page
 */

// Component props - all product display data
const props = defineProps({
  title: String,           // Product name (e.g., "GoPro Hero 12 Black")
  description: String,     // Short product description
  img: String,             // Product image URL
  features: Array,         // Array of feature strings (max 3 displayed)
  priceDay: [String, Number],     // Daily rental price
  priceWeek: [String, Number],    // Weekly rental price
  twoWeekPrice: [String, Number], // 2-week rental price (best value)
  popular: Boolean,        // Show "Mest Populær" badge if true
  productId: Number        // Database product ID for checkout link
})

// Calculate display price by dividing 2-week price by 14 days
// This shows the best per-day rate to customers
// Falls back to daily price if 2-week price not available
const displayPrice = computed(() => {
  return Math.ceil(props.twoWeekPrice ? (props.twoWeekPrice / 14) : props.priceDay)
})
</script>
