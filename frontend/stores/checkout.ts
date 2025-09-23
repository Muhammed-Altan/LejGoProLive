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
        
        const bookingData = {
          cameraId: this.productId || 1, // Using productId as cameraId for now
          cameraName: 'Selected Camera', // Default value, could be improved
          productName: this.selectedModels[0]?.name || 'Selected Product',
          startDate: this.startDate,
          endDate: this.endDate,
          address: this.address,
          apartment: this.apartment,
          email: this.email,
          fullName: this.fullName,
          phone: this.phone,
          totalPrice: this.backendTotal,
          accessoryInstanceIds: null, // Set to null instead of empty array
          city: this.city
          // Note: postalCode is not in the schema, so we'll skip it
        };
        
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
          // Note: postalCode, insurance, selectedModels, selectedAccessories are not in the schema
        }
        
        return data;
      } catch (error) {
        console.error('Error loading booking from Supabase:', error);
        throw error;
      }
    }
  }
});
