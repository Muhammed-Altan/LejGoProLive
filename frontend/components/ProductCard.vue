<template>
  <div class="bg-white rounded-2xl shadow-lg border p-6 flex flex-col" :class="{ 'relative': popular }">
  <span v-if="popular" class="absolute top-3 right-3 bg-[#B8082A] text-white text-xs font-semibold px-3 py-1 rounded-full">Mest Populær</span>
  <img :src="img" :alt="title" class="w-full h-52 object-contain mb-4" />
    <h3 class="font-bold text-lg mb-1 text-black">{{ title }}</h3>
    <p class="text-sm text-gray-600 mb-3">{{ description }}</p>
    <ul class="text-xs text-gray-700 mb-4 space-y-1">
      <li v-for="feature in features" :key="feature">{{ feature }}</li>
    </ul>
    <div class="flex items-end gap-4 mb-4">
      <div>
        <span class="font-bold text-black text-xl">{{ priceDay }} kr</span>
        <span class="text-gray-500 text-sm">/dag</span>
      </div>
      <div>
        <span class="font-bold text-black text-base">{{ priceWeek }} kr</span>
        <span class="text-gray-500 text-sm">/uge</span>
      </div>
    </div>
  <NuxtLink :to="`/checkout?product=${productId}`" class="bg-[#B8082A] text-white font-semibold py-2 px-6 rounded-full mt-auto text-center block hover:bg-[#a10725] transition">Lej Nu</NuxtLink>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  description: String,
  img: String,
  features: Array,
  priceDay: [String, Number],
  priceWeek: [String, Number],
  popular: Boolean,
  productId: Number
})
</script>
