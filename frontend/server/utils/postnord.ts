const DEFAULT_TEST_BASE = 'https://api2.postnord.com/rest/shipment/v1'
const DEFAULT_PROD_BASE = 'https://api.postnord.com/rest/shipment/v1'

type Config = {
  apiKey: string
  baseUrl?: string
}

function getHeaders(config: Config) {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Api-Key': config.apiKey,
  }
}

function getBaseUrl(config?: Config) {
  if (config?.baseUrl) return config.baseUrl
  if (process.env.POSTNORD_BASE_URL) return process.env.POSTNORD_BASE_URL
  if (process.env.POSTNORD_ENV === 'production') return DEFAULT_PROD_BASE
  return DEFAULT_TEST_BASE
}

export async function createShipment(config: Config, payload: any) {
  const base = getBaseUrl(config)
  const url = `${base}/bookings`
  const res = await fetch(url, {
    method: 'POST',
    headers: getHeaders(config),
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PostNord createShipment failed: ${res.status} ${text}`)
  }
  return res.json()
}

export async function getLabelPdf(config: Config, bookingId: string) {
  const base = getBaseUrl(config)
  // In PostNord API, labels are retrieved via /bookings/{bookingId}/labels
  const url = `${base}/bookings/${encodeURIComponent(bookingId)}/labels?format=pdf`
  const res = await fetch(url, {
    method: 'GET',
    headers: getHeaders(config),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PostNord getLabelPdf failed: ${res.status} ${text}`)
  }
  // return buffer of PDF
  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export default { createShipment, getLabelPdf }
