<template>
  <div class="bg-gray-50 rounded-xl p-4 shadow">
    <div class="font-bold text-lg mb-2 text-[#B8082A]">Produktinformation</div>
    <div class="mb-1 text-base"><span class="font-semibold">Kamera:</span> <span class="text-gray-700">{{ cameraName || 'Ukendt' }}</span></div>
    <div class="mb-4 text-base"><span class="font-semibold">Produkt:</span> <span class="text-gray-700">{{ productName || 'Ukendt' }}</span></div>
    <div class="mt-2">
      <div class="font-semibold mb-1">Bookinger:</div>
      <ul class="space-y-1">
        <li v-for="booking in bookings" :key="booking.id" class="bg-white rounded px-3 py-2 shadow-sm border border-gray-200">
          <span class="text-gray-800">{{ booking.start }} - {{ booking.end }}</span>
          <span class="ml-2 text-[#B8082A] font-medium">{{ booking.productName }}</span>
        </li>
        <li v-if="bookings.length === 0" class="text-gray-400 italic">Ingen bookinger for dette kamera.</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useNuxtApp } from '#app';

const props = defineProps<{ cameraId: number; cameraName?: string; productName?: string }>();
const bookings = ref<Array<{ id: number; start: string; end: string; cameraName: string; productName: string }>>([]);

async function fetchBookings() {
  try {
    const supabase = useSupabase();
    const { data, error } = await supabase
      .from('Booking')
      .select('*')
      .eq('cameraId', props.cameraId)
      .order('startDate', { ascending: true });
    
    if (error) throw error;
    
    bookings.value = (data || []).map((booking: any) => ({
      id: booking.id,
      start: new Date(booking.startDate).toLocaleDateString(),
      end: new Date(booking.endDate).toLocaleDateString(),
      cameraName: booking.cameraName || 'Unknown Camera',
      productName: booking.productName || 'Unknown Product'
    }));
  } catch (error) {
    console.error('Error fetching camera bookings:', error);
    bookings.value = [];
  }
}

onMounted(fetchBookings);
</script>
