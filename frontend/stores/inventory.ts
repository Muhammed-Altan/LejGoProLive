// Enhanced inventory store with caching
import { defineStore } from 'pinia'

interface InventoryItem {
  productId: number
  productName: string
  imageUrl: string
  dailyPrice: number
  weeklyPrice: number
  inventory: {
    total: number
    available: number
    inUse: number
  }
  availabilityStatus: 'available' | 'unavailable'
  lastUpdated: string
}

interface InventoryState {
  items: InventoryItem[]
  lastFetched: number
  isLoading: boolean
  error: string | null
}

export const useInventoryStore = defineStore('inventory', {
  state: (): InventoryState => ({
    items: [],
    lastFetched: 0,
    isLoading: false,
    error: null
  }),

  getters: {
    // Check if data is fresh (less than 5 minutes old)
    isFresh: (state) => {
      const fiveMinutes = 5 * 60 * 1000
      return Date.now() - state.lastFetched < fiveMinutes
    },

    availableProducts: (state) => {
      return state.items.filter(item => item.availabilityStatus === 'available')
    },

    getProductById: (state) => {
      return (productId: number) => state.items.find(item => item.productId === productId)
    }
  },

  actions: {
    async fetchInventory(force: boolean = false) {
      // Return cached data if fresh and not forcing refresh
      if (!force && this.isFresh && this.items.length > 0) {
        console.log('📦 Using cached inventory data')
        return this.items
      }

      this.isLoading = true
      this.error = null

      try {
        console.log('🔄 Fetching fresh inventory data')
        const { data } = await $fetch<{success: boolean, data: InventoryItem[]}>('/api/inventory-status')
        
        if (data) {
          this.items = data
          this.lastFetched = Date.now()
        }

        return this.items
      } catch (error: any) {
        console.error('Error fetching inventory:', error)
        this.error = error.message || 'Failed to fetch inventory'
        throw error
      } finally {
        this.isLoading = false
      }
    },

    // Update availability for a specific product
    updateProductAvailability(productId: number, available: number, inUse: number) {
      const item = this.items.find(i => i.productId === productId)
      if (item) {
        item.inventory.available = available
        item.inventory.inUse = inUse
        item.availabilityStatus = available > 0 ? 'available' : 'unavailable'
        item.lastUpdated = new Date().toISOString()
      }
    },

    // Clear cache (useful after bookings)
    invalidateCache() {
      this.lastFetched = 0
      console.log('🗑️ Inventory cache invalidated')
    }
  }
})