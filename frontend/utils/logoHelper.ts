// Logo utility for PDF generation
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

/**
 * Get logo as base64 data URL for PDF generation
 */
export function getLogoDataUrl(): string | null {
  try {
    const logoPath = join(process.cwd(), 'public', 'logo', 'lejgopro-email.png')
    
    if (!existsSync(logoPath)) {
      console.warn('Logo file not found at:', logoPath)
      return null
    }
    
    const logoBuffer = readFileSync(logoPath)
    const logoBase64 = logoBuffer.toString('base64')
    
    // Try both PNG and JPEG data URLs
    return `data:image/png;base64,${logoBase64}`
  } catch (error) {
    console.error('Error loading logo:', error)
    return null
  }
}

/**
 * Get logo file path for client-side usage
 */
export function getLogoPath(): string {
  return '/logo/lejgopro-email.png'
}