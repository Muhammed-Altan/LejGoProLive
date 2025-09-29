import { defineStore } from 'pinia'

export interface SelectedItem {
  name: string;
  price: number;
  quantity: number;
  productId?: number;
  config?: { dailyPrice: number; weeklyPrice: number; twoWeekPrice: number };
}

export const useCheckoutStore = defineStore('checkout', {
  state: () => ({
    selectedModels: [] as SelectedItem[],
    selectedAccessories: [] as SelectedItem[],
    insurance: false,
    startDate: null as string | null,
    endDate: null as string | null,
    productId: null as number | null, // legacy: first selected product id (kept for compatibility)
    // Delivery info
    fullName: '',
    phone: '',
    email: '',
    address: '',
    apartment: '',
    postalCode: '',
    city: '',
    // Price
    backendTotal: 0,
    // Booking ID for tracking
    bookingId: null as string | null,
    // Order ID for payment tracking
    orderId: null as string | null,
  }),
  actions: {
    logState() {
      const state = this.$state;
      Object.entries(state).forEach(([key, val]) => {
        if (val && typeof val === 'object') {
          console.log(`[Pinia checkout] ${key}:`, val, 'type:', Object.prototype.toString.call(val));
        } else {
          console.log(`[Pinia checkout] ${key}:`, val, 'type:', typeof val);
        }
      });
    },
  setDates(start: Date | string | null, end: Date | string | null) {
      if (start && typeof start !== 'string' && !(start instanceof Date)) {
        // Log if something weird is passed
        console.error('Non-serializable startDate passed to setDates:', start);
      }
      if (end && typeof end !== 'string' && !(end instanceof Date)) {
        console.error('Non-serializable endDate passed to setDates:', end);
      }
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
    setSelectedAccessories(items: SelectedItem[]) {
      if (!Array.isArray(items)) {
        console.error('Non-array passed to setSelectedAccessories:', items);
      }
      this.selectedAccessories = Array.isArray(items) ? items : [];
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
          city: this.city
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
