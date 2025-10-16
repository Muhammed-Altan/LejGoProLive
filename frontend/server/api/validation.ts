// Centralized validation and business rules
export function enforceMaxQuantities(models: Array<{ quantity: number }>, maxPerProduct = 5): boolean {
  return models.every(m => m.quantity > 0 && m.quantity <= maxPerProduct);
}

export function enforceMaxAccessoryQuantities(accessories: Array<{ quantity: number }>, maxPerAccessory = 5): boolean {
  return accessories.every(a => a.quantity > 0 && a.quantity <= maxPerAccessory);
}

export function validateBookingPeriod(startDate: string, endDate: string, minDays = 3, maxDays = 30): boolean {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Ensure dates are valid
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;

  // Disallow bookings that start on weekend (Saturday=6 or Sunday=0)
  const startDay = start.getDay();
  if (startDay === 0 || startDay === 6) return false;

  const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
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
