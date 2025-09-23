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
    }
  }
});
