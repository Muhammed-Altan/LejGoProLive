<template>
  <div class="bg-gray-50 rounded-lg p-4">
    <div class="flex items-center justify-between mb-4">
      <h4 class="font-semibold text-gray-900">Booking Kalender</h4>
      <div class="flex items-center gap-4 text-xs">
        <div class="flex items-center gap-1">
          <div class="w-3 h-3 bg-green-500 rounded"></div>
          <span>Tilgængelig</span>
        </div>
        <div class="flex items-center gap-1">
          <div class="w-3 h-3 bg-red-500 rounded"></div>
          <span>Optaget</span>
        </div>
      </div>
    </div>

    <!-- Calendar Navigation -->
    <div class="flex items-center justify-between mb-3">
      <button 
        @click="previousMonth"
        class="p-1 hover:bg-gray-200 rounded"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
        </svg>
      </button>
      <h5 class="font-medium text-gray-900">
        {{ currentMonth.toLocaleDateString('da-DK', { month: 'long', year: 'numeric' }) }}
      </h5>
      <button 
        @click="nextMonth"
        class="p-1 hover:bg-gray-200 rounded"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
        </svg>
      </button>
    </div>

    <!-- Calendar Grid -->
    <div class="grid grid-cols-7 gap-1 text-xs">
      <!-- Day headers -->
      <div v-for="day in ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn']" 
           :key="day" 
           class="p-2 text-center font-medium text-gray-600">
        {{ day }}
      </div>
      
      <!-- Calendar days -->
      <div 
        v-for="day in calendarDays" 
        :key="day.date"
        class="p-2 text-center rounded transition-colors cursor-pointer"
        :class="{
          'text-gray-400': !day.isCurrentMonth,
          'bg-red-100 text-red-800': day.isCurrentMonth && day.hasBooking,
          'bg-green-100 text-green-800': day.isCurrentMonth && !day.hasBooking,
          'hover:bg-gray-100': day.isCurrentMonth && !day.hasBooking
        }"
        :title="day.tooltip"
        @click="debugDay(day)"
      >
        {{ day.dayNumber }}
      </div>
    </div>

    <!-- Booking List for Current Month -->
    <div v-if="currentMonthBookings.length > 0" class="mt-4 pt-3 border-t">
      <h6 class="font-medium text-gray-900 mb-2 text-sm">Bookinger denne måned:</h6>
      <div class="space-y-1">
        <div 
          v-for="booking in currentMonthBookings" 
          :key="booking.id"
          class="text-xs bg-white rounded p-2 border"
        >
          <div class="flex justify-between">
            <span class="font-medium">{{ booking.customerName || 'Ukendt kunde' }}</span>
            <span class="text-gray-600">Kamera {{ booking.cameraId }}</span>
          </div>
          <div class="text-gray-600">
            {{ formatDate(booking.startDate) }} - {{ formatDate(booking.endDate) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

const props = defineProps<{
  productId: number
}>()

const currentMonth = ref(new Date())
const bookings = ref<any[]>([])
const loading = ref(false)

// Calendar navigation
const previousMonth = () => {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() - 1, 1)
}

const nextMonth = () => {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1, 1)
}

// Fetch bookings for this product
const fetchBookings = async () => {
  loading.value = true
  try {
    const response = await $fetch(`/api/admin/products/${props.productId}/bookings`)
    if (response.success) {
      bookings.value = response.data || []
      console.log(`📅 Fetched ${bookings.value.length} bookings for product ${props.productId}:`, bookings.value)
    }
  } catch (error) {
    console.error('Error fetching bookings:', error)
    bookings.value = []
  } finally {
    loading.value = false
  }
}

// Generate calendar days
const calendarDays = computed(() => {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()
  
  // First day of the month
  const firstDay = new Date(year, month, 1)
  // Last day of the month
  const lastDay = new Date(year, month + 1, 0)
  
  // Start from Monday of the week containing the first day
  const startDate = new Date(firstDay)
  const dayOfWeek = (firstDay.getDay() + 6) % 7 // Convert Sunday=0 to Monday=0
  startDate.setDate(firstDay.getDate() - dayOfWeek)
  
  // Generate 42 days (6 weeks)
  const days = []
  for (let i = 0; i < 42; i++) {
    // Create date using UTC to avoid timezone issues
    const date = new Date(Date.UTC(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate() + i
    ))
    
    const dateStr = date.toISOString().split('T')[0]
    const isCurrentMonth = date.getUTCMonth() === month
    
    // Check if this date has bookings
    const dayBookings = bookings.value.filter(booking => {
      // Extract just the date part without timezone conversion issues
      const start = booking.startDate.split('T')[0]
      const end = booking.endDate.split('T')[0]
      const isBooked = dateStr >= start && dateStr <= end
      
      return isBooked
    })
    
    const hasBooking = dayBookings.length > 0
    const isAvailable = !hasBooking
    
    let tooltip = `${date.toLocaleDateString('da-DK')}`
    if (hasBooking) {
      tooltip += ` - ${dayBookings.length} booking(er)`
    } else {
      tooltip += ' - Tilgængelig'
    }
    
    // Simple debug for November dates
    if (dateStr.includes('2025-11') && isCurrentMonth && hasBooking) {
      console.log(`🔴 BOOKED: ${dateStr} has ${dayBookings.length} booking(s)`)
    }
    
    days.push({
      date: dateStr,
      dayNumber: date.getUTCDate(),
      isCurrentMonth,
      isAvailable,
      hasBooking,
      tooltip,
      bookings: dayBookings
    })
  }
  
  return days
})

// Bookings for current month
const currentMonthBookings = computed(() => {
  const year = currentMonth.value.getFullYear()
  const month = currentMonth.value.getMonth()
  
  return bookings.value.filter(booking => {
    const bookingStart = new Date(booking.startDate)
    const bookingEnd = new Date(booking.endDate)
    const monthStart = new Date(year, month, 1)
    const monthEnd = new Date(year, month + 1, 0)
    
    // Check if booking overlaps with current month
    return bookingStart <= monthEnd && bookingEnd >= monthStart
  })
})

// Format date for display
const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('da-DK', {
    day: 'numeric',
    month: 'short'
  })
}

// Debug function to check day object when clicked
const debugDay = (day: any) => {
  // Day click handler - can be extended for specific day actions
}

// Watch for month changes and refetch data
watch(currentMonth, fetchBookings)

onMounted(() => {
  fetchBookings()
})
</script>