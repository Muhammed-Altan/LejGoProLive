import { defineEventHandler, readBody, sendError, createError } from 'h3'
import { createShipment, getLabelPdf } from '../../utils/postnord'

let PDFLibAvailable = true
let PDFDocument: any
try {
  // Optional dependency; install with `npm i pdf-lib` to enable splitting
  // @ts-ignore
  PDFDocument = require('pdf-lib').PDFDocument
} catch (e) {
  PDFLibAvailable = false
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event) as any
    const apiKey = process.env.POSTNORD_API_KEY
    if (!apiKey) {
      return sendError(event, createError({ statusCode: 500, statusMessage: 'POSTNORD_API_KEY not set' }))
    }

    // Prevent accidental calls to production PostNord unless explicitly allowed
    const baseUrl = process.env.POSTNORD_BASE_URL || ''
    const env = process.env.POSTNORD_ENV || 'test'
    const allowLive = process.env.POSTNORD_ALLOW_LIVE === 'true'
    if ((env === 'production' || baseUrl.includes('api.postnord.com')) && !allowLive) {
      return { success: false, message: 'Posting to PostNord production blocked. Set POSTNORD_ALLOW_LIVE=true to allow.' }
    }

    // Build or accept booking payload
    let bookingPayload: any
    let mappedFromOrder = false
    if (body && Array.isArray(body.shipments)) {
      bookingPayload = body
    } else {
      mappedFromOrder = true
      const order = body ?? {}
      // Log which keys were present to aid debugging
      try {
        console.warn('[PostNord] mapping non-PostNord order into booking payload', Object.keys(order || {}))
      } catch (e) {
        // ignore logging errors
      }
      bookingPayload = {
        customerReference: order.customerReference ?? order.orderId ?? `ORDER-${Date.now()}`,
        shipments: [
          {
            shipmentId: '1',
            product: order.product ?? 'SE.PARCEL',
            sender: {
              name: process.env.SHOP_NAME ?? 'My Shop AB',
              address1: process.env.SHOP_ADDRESS ?? 'Shop Street 1',
              postalCode: process.env.SHOP_POSTAL ?? '12345',
              city: process.env.SHOP_CITY ?? 'Stockholm',
              country: process.env.SHOP_COUNTRY ?? 'SE',
              email: process.env.SHOP_EMAIL ?? 'shop@example.com',
              phone: process.env.SHOP_PHONE ?? '+46123456789'
            },
            recipient: {
              name: order.recipient?.name ?? order.shipping?.name ?? order.customerName,
              address1: order.recipient?.address1 ?? order.shipping?.address1 ?? order.address1,
              postalCode: order.recipient?.postalCode ?? order.shipping?.postalCode ?? order.postalCode,
              city: order.recipient?.city ?? order.shipping?.city ?? order.city,
              country: order.recipient?.country ?? order.shipping?.country ?? 'SE',
              email: order.recipient?.email ?? order.customerEmail,
              phone: order.recipient?.phone ?? order.customerPhone
            }
          }
        ]
      }

      // Add return and label hints — replace with exact PostNord fields if different
      bookingPayload.shipments[0].returnInfo = {
        returnType: 'RETURN',
        returnReference: (bookingPayload.customerReference ?? '') + '-RET'
      }
      bookingPayload.label = {
        format: 'pdf',
        layout: 'A4',
        includeQrForSender: true,
        includeQrForReturn: true
      }
    }

    const bookingResult = await createShipment({ apiKey, baseUrl: baseUrl || undefined }, bookingPayload)

    // Try to extract bookingId from common response shapes
    let bookingId: string | undefined
    if (bookingResult?.bookingId) bookingId = bookingResult.bookingId
    else if (Array.isArray(bookingResult?.bookings) && bookingResult.bookings[0]?.bookingId) bookingId = bookingResult.bookings[0].bookingId
    else if (bookingResult?.bookings && bookingResult.bookings[0]?.id) bookingId = bookingResult.bookings[0].id
    else if (typeof bookingResult === 'string') bookingId = bookingResult

  const responsePayload: any = { success: true, bookingResult, mappedFromOrder }

    if (bookingId) {
      const pdfBuffer = await getLabelPdf({ apiKey, baseUrl: baseUrl || undefined }, bookingId)
      const fullPdfBase64 = pdfBuffer.toString('base64')
      responsePayload.fullPdfBase64 = fullPdfBase64
      responsePayload.bookingId = bookingId

      if (PDFLibAvailable) {
        try {
          const srcDoc = await PDFDocument.load(pdfBuffer)
          const pageCount = srcDoc.getPageCount()

          // Heuristic: page 1 = sender, page 2 = return
          const senderPdf = await PDFDocument.create()
          const [p1] = await srcDoc.copyPages(srcDoc, [0])
          senderPdf.addPage(p1)
          const senderBytes = await senderPdf.save()
          responsePayload.senderLabelBase64 = Buffer.from(senderBytes).toString('base64')

          if (pageCount >= 2) {
            const returnPdf = await PDFDocument.create()
            const [p2] = await srcDoc.copyPages(srcDoc, [1])
            returnPdf.addPage(p2)
            const returnBytes = await returnPdf.save()
            responsePayload.returnLabelBase64 = Buffer.from(returnBytes).toString('base64')
          } else {
            responsePayload.returnLabelBase64 = responsePayload.senderLabelBase64
          }
        } catch (splitErr) {
          responsePayload.splitError = String(splitErr)
        }
      } else {
        responsePayload.pdfLibMissing = true
      }
    }

    return responsePayload
  } catch (err: any) {
    return { success: false, message: err?.message ?? String(err) }
  }
})

