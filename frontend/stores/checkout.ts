/**
 * Checkout Store (Pinia)
 * 
 * Global state management for the booking/checkout flow
 * 
 * Responsibilities:
 * - Track selected products and accessories
 * - Manage rental dates and pricing
 * - Store customer delivery information
 * - Handle delivery information
 * - Persist state across page navigation
 * - Provide computed properties for total calculations
 * 
 * State Persistence:
 * - Automatically persisted to localStorage by Pinia
 * - Survives page reloads during checkout
 * - Cleared on successful payment
 * 
 * Used by:
 * - checkout.vue (main checkout page)
 * - ProductStep.vue (product selection)
 * - DeliveryStep.vue (delivery info)
 * - PensoPayment.vue (payment processing)
 * - BasketView.vue (order summary sidebar)
 */

import { defineStore } from 'pinia'

/**
 * Selected item interface
 * Represents a product or accessory in the cart
 */
export interface SelectedItem {
  name: string;          // Product name (e.g., "GoPro Hero 12 Black")
  price: number;         // Calculated price for selected duration
  quantity: number;      // Number of units (e.g., 2 cameras)
  productId?: number;    // Database product ID (for cameras)
  config?: {             // Optional pricing config for dynamic calculations
    dailyPrice: number
    weeklyPrice: number
    twoWeekPrice: number
  }
}

/**
 * Checkout store definition
 */
export const useCheckoutStore = defineStore('checkout', {
  state: () => ({
    // Selected items
    selectedModels: [] as SelectedItem[],        // GoPro cameras in cart
    selectedAccessories: [] as SelectedItem[],   // Accessories in cart
    insurance: false,                            // Insurance option (not implemented yet)
    
    // Rental period
    startDate: null as string | null,  // Rental start date (ISO string)
    endDate: null as string | null,    // Rental end date (ISO string)
    
    // Legacy compatibility
    productId: null as number | null,  // First selected product ID (kept for old code)
    
    // Customer delivery information
    fullName: '',        // Customer full name
    phone: '',           // Phone number (format: +45 12345678)
    email: '',           // Email for receipt
    address: '',         // Street address
    apartment: '',       // Optional apartment/floor number
    postalCode: '',      // 4-digit Danish postal code
    city: '',            // City name
    
    // Pricing
    backendTotal: 0,     // Total price calculated by backend (authoritative)
    
    // Tracking IDs
    bookingId: null as string | null,  // Database booking UUID
    orderId: null as string | null,    // PensoPay order ID
  }),
  actions: {
    /**
     * Log current state for debugging
     * Disabled in production for performance
     */
    logState() {
      // Debug logging disabled for production
      // const state = this.$state;
      // Object.entries(state).forEach(([key, val]) => {
      //   if (val && typeof val === 'object') {
      //     console.log(`[Pinia checkout] ${key}:`, val, 'type:', Object.prototype.toString.call(val));
      //   } else {
      //     console.log(`[Pinia checkout] ${key}:`, val, 'type:', typeof val);
      //   }
      // });
    },
  /**
   * Set rental dates with serialization handling
   * Ensures dates are stored as ISO strings for localStorage compatibility
   * 
   * @param start - Start date (Date, ISO string, or null)
   * @param end - End date (Date, ISO string, or null)
   */
  setDates(start: Date | string | null, end: Date | string | null) {
      // Validate input types (non-serializable objects cause localStorage errors)
      if (start && typeof start !== 'string' && !(start instanceof Date)) {
        // Log if something weird is passed
        console.error('Non-serializable startDate passed to setDates:', start);
      }
      if (end && typeof end !== 'string' && !(end instanceof Date)) {
        console.error('Non-serializable endDate passed to setDates:', end);
      }
      // Convert to ISO strings for storage (or null if not provided)
      this.startDate = start ? (typeof start === 'string' ? start : start.toISOString()) : null;
      this.endDate = end ? (typeof end === 'string' ? end : end.toISOString()) : null;
  this.logState();
    },
    setSelectedModels(items: SelectedItem[]) {
      if (!Array.isArray(items)) {
        console.error('Non-array passed to setSelectedModels:', items);
      }
      this.selectedModels = Array.isArray(items) ? items : [];
  this.logState();
    },
    setSelectedAccessories(items: SelectedItem[], modelCount?: number) {
      if (!Array.isArray(items)) {
        console.error('Non-array passed to setSelectedAccessories:', items);
      }
      // Calculate max quantity: 1 accessory per camera model (default to current logic if modelCount not provided)
      const maxAccessoryQuantity = modelCount && modelCount > 0 ? modelCount : 1;
      
      // Clamp accessory quantities to the number of camera models for most accessories, but allow
      // 'ekstra batteri' to use its configured quantity (no clamping for ekstra batteri).
      const EXTRA_BATTERY_NAME = 'ekstra batteri';
      this.selectedAccessories = Array.isArray(items) ? items.map(i => {
        const name = (i.name || '').toString().trim().toLowerCase();
        if (name === EXTRA_BATTERY_NAME) {
          // keep provided quantity for ekstra batteri (ensure at least 1)
          return { ...i, quantity: i.quantity > 0 ? i.quantity : 1 };
        }
        // For other accessories, clamp quantity to number of camera models
        return { ...i, quantity: i.quantity > 0 ? Math.min(maxAccessoryQuantity, i.quantity) : 1 };
      }) : [];
  this.logState();
    },
    setInsurance(val: boolean) { this.insurance = val },
    setProductId(id: number | null) { this.productId = id },
    getFirstProductId(): number | null {
      if (this.productId) return this.productId;
      const first = this.selectedModels.find(m => typeof m.productId === 'number');
      return first?.productId ?? null;
    },
    reset() {
      this.selectedModels = [];
      this.selectedAccessories = [];
      this.insurance = false;
      this.startDate = null;
      this.endDate = null;
      this.productId = null;
      this.fullName = '';
      this.phone = '';
      this.email = '';
      this.address = '';
      this.apartment = '';
      this.postalCode = '';
      this.city = '';
      this.backendTotal = 0;
      this.logState();
    },
    setDeliveryInfo(info: { fullName?: string; phone?: string; email?: string; address?: string; apartment?: string; postalCode?: string; city?: string }) {
      if (info.fullName !== undefined) this.fullName = info.fullName;
      if (info.phone !== undefined) this.phone = info.phone;
      if (info.email !== undefined) this.email = info.email;
      if (info.address !== undefined) this.address = info.address;
      if (info.apartment !== undefined) this.apartment = info.apartment;
      if (info.postalCode !== undefined) this.postalCode = info.postalCode;
      if (info.city !== undefined) this.city = info.city;
      this.logState();
    },
    setBackendTotal(total: number) {
      this.backendTotal = total;
      this.logState();
    },
    
    // Supabase integration methods
    async saveBookingToSupabase() {
      try {
        const { useSupabase } = await import('@/composables/useSupabase');
        const supabase = useSupabase();
        
        if (!supabase) {
          throw new Error('Supabase client not available. Please check your environment configuration.');
        }
        
        // First, we need to find available accessory instances for the selected accessories
        const accessoryInstanceIds: number[] = [];
        
        for (const selectedAccessory of this.selectedAccessories) {
          // First, find the accessory by name to get its ID
          const { data: accessories, error: accessoryError } = await supabase
            .from('Accessory')
            .select('id')
            .eq('name', selectedAccessory.name)
            .single();
          
          if (accessoryError) {
            console.warn(`Could not find accessory "${selectedAccessory.name}":`, accessoryError);
            continue;
          }
          
          // Now find available instances for this accessory type
          const { data: instances, error: instanceError } = await supabase
            .from('AccessoryInstance')
            .select('id')
            .eq('accessoryId', accessories.id)
            .eq('isAvailable', true)
            .limit(selectedAccessory.quantity);
          
          if (instanceError) {
            console.warn('Could not find accessory instances, using mock IDs:', instanceError);
            // Fallback: create mock instance IDs based on accessory name hash
            for (let i = 0; i < selectedAccessory.quantity; i++) {
              const mockId = Math.abs(selectedAccessory.name.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) + i;
              accessoryInstanceIds.push(mockId);
            }
          } else {
            // Add the found instance IDs
            instances?.forEach(instance => accessoryInstanceIds.push(instance.id));
            
            // If we didn't get enough instances, warn about it
            if (instances && instances.length < selectedAccessory.quantity) {
              console.warn(`Only found ${instances.length} available instances of "${selectedAccessory.name}", but ${selectedAccessory.quantity} were requested`);
            }
          }
        }
        
        // Get the first available camera for the selected product
        let cameraId = 1; // fallback
        const productIdToUse = Array.isArray(this.productId) ? this.productId[0] : this.productId;
        
        if (productIdToUse) {
          try {
            const { data: cameras, error: cameraError } = await supabase
              .from('Camera')
              .select('id')
              .eq('productId', productIdToUse)
              .limit(1);
              
            if (!cameraError && cameras && cameras.length > 0) {
              cameraId = cameras[0].id;
              console.log(`Found camera ID ${cameraId} for product ID ${productIdToUse}`);
            } else {
              console.warn(`No cameras found for product ID ${productIdToUse}, using fallback camera ID 1`);
            }
          } catch (cameraFetchError) {
            console.warn('Error fetching camera:', cameraFetchError);
          }
        }

        const bookingData = {
          cameraId: cameraId,
          cameraName: 'Selected Camera',
          productName: this.selectedModels[0]?.name || 'Selected Product',
          startDate: this.startDate,
          endDate: this.endDate,
          address: this.address,
          apartment: this.apartment,
          email: this.email,
          fullName: this.fullName,
          phone: this.phone,
          totalPrice: typeof this.backendTotal === 'number' ? this.backendTotal : (parseFloat(this.backendTotal) || 0),
          // Store accessory instance IDs as JSONB array (after recreating column)
          accessoryInstanceIds: accessoryInstanceIds.length > 0 ? accessoryInstanceIds : null,
          city: this.city,
          postalCode: this.postalCode
        };
        
        console.log('=== BOOKING DEBUG ===');
        console.log('productId type:', typeof this.productId, 'value:', this.productId);
        console.log('cameraId type:', typeof bookingData.cameraId, 'value:', bookingData.cameraId);
        console.log('totalPrice type:', typeof this.backendTotal, 'value:', this.backendTotal);
        console.log('accessoryInstanceIds type:', typeof accessoryInstanceIds, 'value:', accessoryInstanceIds);
        console.log('Full booking data:', bookingData);
        console.log('Selected accessories:', this.selectedAccessories);
        console.log('======================');
        
        const { data, error } = await supabase
          .from('Booking')
          .insert([bookingData])
          .select()
          .single();
        
        if (error) throw error;
        
        this.bookingId = data.id;
        return data;
      } catch (error) {
        console.error('Error saving booking to Supabase:', error);
        throw error;
      }
    },
    
    async loadBookingFromSupabase(bookingId: string) {
      try {
        const { useSupabase } = await import('@/composables/useSupabase');
        const supabase = useSupabase();
        
        if (!supabase) {
          throw new Error('Supabase client not available. Please check your environment configuration.');
        }
        
        const { data, error } = await supabase
          .from('Booking')
          .select('*')
          .eq('id', bookingId)
          .single();
        
        if (error) throw error;
        
        if (data) {
          this.fullName = data.fullName || '';
          this.email = data.email || '';
          this.phone = data.phone || '';
          this.address = data.address || '';
          this.apartment = data.apartment || '';
          this.city = data.city || '';
          this.startDate = data.startDate;
          this.endDate = data.endDate;
          this.backendTotal = data.totalPrice || 0;
          this.bookingId = data.id;
          
          // Load selectedAccessories and selectedModels from JSONB fields if they exist
          if (data.selectedAccessories && Array.isArray(data.selectedAccessories)) {
            this.selectedAccessories = data.selectedAccessories;
          }
          if (data.selectedModels && Array.isArray(data.selectedModels)) {
            this.selectedModels = data.selectedModels;
          }
        }
        
        return data;
      } catch (error) {
        console.error('Error loading booking from Supabase:', error);
        throw error;
      }
    }
  }
});
