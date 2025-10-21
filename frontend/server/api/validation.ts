// Centralized validation and business rules
export function enforceMaxQuantities(models: Array<{ quantity: number }>, maxPerProduct = 5): boolean {
  return models.every(m => m.quantity > 0 && m.quantity <= maxPerProduct);
}

export function enforceMaxAccessoryQuantities(
  accessories: Array<{ quantity: number; name?: string }>,
  maxPerAccessory = 1,
  maxTotalAccessories = 1
): boolean {
  // Enforce that accessory quantities are in allowed ranges.
  // Default rules:
  // - No more than `maxTotalAccessories` distinct accessory types.
  // - Each accessory quantity must be >=1 and <= maxPerAccessory.
  // Exception: accessory named 'ekstra batteri' may have a higher per-item cap (legacy rule).
  const EXTRA_BATTERY_NAME = 'ekstra batteri';
  const EXTRA_BATTERY_MAX = 5; // allow up to 5 ekstra batteri by default

  if (!Array.isArray(accessories)) return false;
  if (accessories.length > maxTotalAccessories) return false;

  return accessories.every(a => {
    const qty = typeof a.quantity === 'number' ? a.quantity : 0;
    const name = (a.name || '').toString().trim().toLowerCase();
    if (name === EXTRA_BATTERY_NAME) {
      return qty > 0 && qty <= EXTRA_BATTERY_MAX;
    }
    return qty > 0 && qty <= maxPerAccessory;
  });
}

export function validateBookingPeriod(startDate: string, endDate: string, minDays = 3, maxDays = 30): boolean {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Ensure dates are valid
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;

  // Disallow bookings that start on weekend (Saturday=6 or Sunday=0)
  const startDay = start.getDay();
  if (startDay === 0 || startDay === 6) return false;

  // Use UTC-based day calculation to avoid DST/timezone issues
  const msPerDay = 24 * 60 * 60 * 1000;
  const startUTC = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUTC = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  const days = Math.floor((endUTC - startUTC) / msPerDay) + 1;
  return start < end && days >= minDays && days <= maxDays;
}

export function validateInsurance(insurance: boolean, models: Array<any>): boolean {
  // Example: insurance required if more than 1 model
  if (models.length > 1 && !insurance) return false;
  return true;
}

export function validateAccessoryProductRelation(models: Array<any>, accessories: Array<any>): boolean {
  // Example: Only allow certain accessories with certain products
  // Implement your logic here
  return true;
}

// Reusable validators
import validator from 'validator'

export function isValidEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== 'string') return false
  return validator.isEmail(email.trim())
}

export function isValidPhoneNumber(phone: string | null | undefined): boolean {
  if (!phone || typeof phone !== 'string') return false
  // Use validator.js mobile phone check for Denmark
  return validator.isMobilePhone(phone.trim(), 'da-DK')
}
