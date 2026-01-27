import { describe, it, expect } from 'vitest'
import { calculatePricing } from './pricing'

describe('calculatePricing', () => {
  it('should calculate daily price correctly', () => {
    const models = [{ 
      name: 'GoPro HERO12', 
      quantity: 1, 
      productId: 1, 
      price: 49,
      weeklyPrice: 159,
      twoWeekPrice: 299
    }]
    
    const result = calculatePricing(models, [], false, '2026-01-15', '2026-01-15')
    
    expect(result.total).toBe(49) // 1 dag * 49 kr
  })

  it('should calculate weekly price correctly', () => {
    const models = [{ 
      name: 'GoPro HERO12', 
      quantity: 1, 
      productId: 1, 
      price: 49,
      weeklyPrice: 159,
      twoWeekPrice: 299
    }]
    
    const result = calculatePricing(models, [], false, '2026-01-15', '2026-01-21')
    
    expect(result.total).toBe(159) // Ugepris
  })

  it('should calculate two-week price correctly', () => {
    const models = [{ 
      name: 'GoPro HERO12', 
      quantity: 1, 
      productId: 1, 
      price: 49,
      weeklyPrice: 159,
      twoWeekPrice: 299
    }]
    
    const result = calculatePricing(models, [], false, '2026-01-15', '2026-01-28')
    
    expect(result.total).toBe(299) // To-ugers pris
  })
})
