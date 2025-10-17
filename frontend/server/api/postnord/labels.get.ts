import { defineEventHandler, getQuery } from 'h3'
import { getLabelPdf } from '../../utils/postnord'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const bookingId = query.bookingId as string
  const apiKey = process.env.POSTNORD_API_KEY
  if (!apiKey) {
    return { success: false, message: 'POSTNORD_API_KEY not set' }
  }
  if (!bookingId) return { success: false, message: 'bookingId required' }
  const baseUrl = process.env.POSTNORD_BASE_URL || ''
  const env = process.env.POSTNORD_ENV || 'test'
  const allowLive = process.env.POSTNORD_ALLOW_LIVE === 'true'
  if ((env === 'production' || baseUrl.includes('api.postnord.com')) && !allowLive) {
    return { success: false, message: 'Fetching labels from PostNord production blocked. Set POSTNORD_ALLOW_LIVE=true to allow.' }
  }

  const pdfBuffer = await getLabelPdf({ apiKey, baseUrl: baseUrl || undefined }, bookingId)
  const base64 = pdfBuffer.toString('base64')
  return { success: true, bookingId, pdfBase64: base64 }
})
