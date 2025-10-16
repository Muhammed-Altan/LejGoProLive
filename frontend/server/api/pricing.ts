// pricing.ts - Centralized business logic for pricing and discounts

export interface BookingModel {
  name: string;
  quantity: number;
  productId: number;
}

export interface BookingAccessory {
  name: string;
  quantity: number;
}

export interface PricingResult {
  total: number;
  discountTotal: number;
  insuranceAmount: number;
  rentalDays: number;
}


export function calculatePricing(models: (BookingModel & { price: number; weeklyPrice?: number; twoWeekPrice?: number })[], accessories: (BookingAccessory & { price: number })[], insurance: boolean, startDate: string, endDate: string): PricingResult {
  const msPerDay = 24 * 60 * 60 * 1000;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const rentalDays = Math.round((end.getTime() - start.getTime()) / msPerDay) + 1;
  let total = 0;
  let discountTotal = 0;
  let insuranceAmount = 0;

  models.forEach((model, idx) => {
    const quantity = model.quantity || 1;
    const dailyPrice = typeof model.price === 'number' ? model.price : 100;
    const weeklyPrice = typeof model.weeklyPrice === 'number' ? model.weeklyPrice : dailyPrice * 7;
    const twoWeekPrice = typeof model.twoWeekPrice === 'number' ? model.twoWeekPrice : dailyPrice * 14;
    let modelTotal = 0;
    let pricePerDay = dailyPrice;
    if (rentalDays >= 1 && rentalDays <= 6) {
      modelTotal = dailyPrice * rentalDays * quantity;
      pricePerDay = dailyPrice;
    } else if (rentalDays === 7) {
      modelTotal = weeklyPrice * quantity;
      pricePerDay = weeklyPrice / 7;
    } else if (rentalDays >= 8 && rentalDays <= 13) {
      modelTotal = (weeklyPrice / 7) * rentalDays * quantity;
      pricePerDay = weeklyPrice / 7;
    } else if (rentalDays === 14) {
      modelTotal = twoWeekPrice * quantity;
      pricePerDay = twoWeekPrice / 14;
    } else if (rentalDays > 14) {
      modelTotal = (twoWeekPrice / 14) * rentalDays * quantity;
      pricePerDay = twoWeekPrice / 14;
    }
    let discount = idx > 0 ? pricePerDay * 0.25 * rentalDays * quantity : 0;
    modelTotal = idx > 0 ? (pricePerDay - pricePerDay * 0.25) * rentalDays * quantity : modelTotal;
    discountTotal += discount;
    total += modelTotal;
  });

  accessories.forEach((accessory) => {
    const quantity = accessory.quantity || 1;
    const accessoryPrice = typeof accessory.price === 'number' ? accessory.price : 0;
    total += accessoryPrice * quantity;
  });

  if (insurance) {
    insuranceAmount = total * 0.1;
    total += insuranceAmount;
  }

  return {
    total,
    discountTotal,
    insuranceAmount,
    rentalDays,
  };
}
