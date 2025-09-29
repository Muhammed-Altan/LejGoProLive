<template>
  <div class="bg-gray-50 rounded-xl p-4 shadow">
    <div class="font-bold text-lg mb-2 text-[#B8082A]">Produktinformation</div>
    <div class="mb-1 text-base"><span class="font-semibold">Kamera:</span> <span class="text-gray-700">{{ cameraName || 'Ukendt' }}</span></div>
    <div class="mb-4 text-base"><span class="font-semibold">Produkt:</span> <span class="text-gray-700">{{ productName || 'Ukendt' }}</span></div>
    <div class="mt-2">
      <div class="font-semibold mb-1">Bookinger:</div>
      <ul class="space-y-1">
        <li v-for="booking in formattedBookings" :key="booking.id" class="bg-white rounded px-3 py-2 shadow-sm border border-gray-200">
          <span class="text-gray-800">{{ booking.start }} - {{ booking.end }}</span>
          <span class="ml-2 text-[#B8082A] font-medium">{{ booking.customerName || 'Ukendt kunde' }}</span>
        </li>
        <li v-if="formattedBookings.length === 0" class="text-gray-400 italic">Ingen bookinger for dette kamera.</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ 
  cameraId: number; 
  cameraName?: string; 
  productName?: string;
  bookings?: Array<any>;
}>();

const formattedBookings = computed(() => {
  if (!props.bookings || props.bookings.length === 0) {
    return [];
  }
  
  return props.bookings.map((booking: any) => ({
    id: booking.id,
    start: booking.startDate ? new Date(booking.startDate).toLocaleDateString() : 'Ukendt start',
    end: booking.endDate ? new Date(booking.endDate).toLocaleDateString() : 'Ukendt slut',
    customerName: booking.fullName || booking.customerName || booking.name,
    productName: booking.productName || 'Ukendt produkt'
  }));
});
</script>
