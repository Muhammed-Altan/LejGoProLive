import { defineEventHandler, readBody, createError } from 'h3'
import { z } from 'zod'

const DINERO_API_BASE = 'https://api.dinero.dk'

// Validation schema for invoice creation
const invoiceSchema = z.object({
  bookingId: z.number().int().positive(),
  customerInfo: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(8),
    address: z.string().min(1),
    city: z.string().min(1),
    postalCode: z.string().min(4),
    apartment: z.string().optional()
  }),
  products: z.array(z.object({
    name: z.string(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
    productNumber: z.string().optional()
  })),
  totalAmount: z.number().positive(),
  currency: z.string().default('DKK'),
  dueDate: z.string().optional()
})

export default defineEventHandler(async (event) => {
  if (event.node.req.method !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed'
    })
  }

  try {
    const body = await readBody(event)
    
    // Validate request body
    const validatedData = invoiceSchema.parse(body)

    // Get API credentials from environment
    const clientId = process.env.DINERO_CLIENT_ID
    const clientSecret = process.env.DINERO_CLIENT_SECRET
    const apiKey = process.env.DINERO_API_KEY

    if (!clientId || !clientSecret || !apiKey) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Missing Dinero API credentials'
      })
    }

    // First, get or create customer in Dinero
    const customer = await getOrCreateCustomer(validatedData.customerInfo, apiKey)
    
    // Create invoice in Dinero
    const invoice = await createDineroInvoice(
      customer.ContactGuid,
      validatedData.products,
      validatedData.totalAmount,
      validatedData.dueDate,
      apiKey
    )

    // Update booking with invoice information
    await updateBookingWithInvoice(validatedData.bookingId, invoice)

    return {
      success: true,
      invoiceId: invoice.Guid,
      invoiceNumber: invoice.InvoiceNumber,
      message: 'Faktura oprettet succesfuldt i Dinero'
    }

  } catch (error: any) {
    console.error('Error creating Dinero invoice:', error)
    
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: `Validation error: ${error.issues.map((e: any) => e.message).join(', ')}`
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to create invoice'
    })
  }
})

// Helper function to get or create customer in Dinero
async function getOrCreateCustomer(customerInfo: any, apiKey: string) {
  try {
    // First, try to find existing customer by email using organization-scoped endpoint
    const organizationId = '594481' // Your organization ID
    const searchResponse = await fetch(`${DINERO_API_BASE}/v1/${organizationId}/contacts?email=${encodeURIComponent(customerInfo.email)}`, {
      method: 'GET',
      headers: {
        'Authorization': apiKey, // Try without Bearer prefix
        'Content-Type': 'application/json'
      }
    })

    if (searchResponse.ok) {
      const existingCustomers = await searchResponse.json()
      if (existingCustomers && existingCustomers.length > 0) {
        return existingCustomers[0]
      }
    }

    // If customer doesn't exist, create new one
    const customerData = {
      Name: customerInfo.name,
      Email: customerInfo.email,
      Phone: customerInfo.phone,
      Street: customerInfo.address,
      City: customerInfo.city,
      ZipCode: customerInfo.postalCode,
      CountryKey: 'DK',
      IsCustomer: true,
      IsPerson: true
    }

    const createResponse = await fetch(`${DINERO_API_BASE}/v1/${organizationId}/contacts`, {
      method: 'POST',
      headers: {
        'Authorization': apiKey, // Try without Bearer prefix
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(customerData)
    })

    if (!createResponse.ok) {
      const errorData = await createResponse.text()
      throw new Error(`Failed to create customer: ${createResponse.status} - ${errorData}`)
    }

    return await createResponse.json()

  } catch (error: any) {
    console.error('Error managing customer in Dinero:', error)
    throw new Error(`Customer management failed: ${error.message}`)
  }
}

// Helper function to create invoice in Dinero
async function createDineroInvoice(
  contactGuid: string,
  products: any[],
  totalAmount: number,
  dueDate: string | undefined,
  apiKey: string
) {
  try {
    const invoiceDate = new Date().toISOString().split('T')[0]
    const calculatedDueDate = dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Prepare invoice lines
    const productLines = products.map((product, index) => ({
      LineType: 'Product',
      Description: product.name,
      Quantity: product.quantity,
      AccountNumber: 1000, // Standard sales account - adjust as needed
      BaseAmountValue: product.unitPrice,
      TotalAmount: product.quantity * product.unitPrice,
      Unit: 'stk',
      ProductNumber: product.productNumber || `GOPRO-${index + 1}`
    }))

    const invoiceData = {
      ContactGuid: contactGuid,
      Date: invoiceDate,
      PaymentDate: calculatedDueDate,
      Currency: 'DKK',
      Language: 'da-DK',
      ExternalReference: `LejGoPro-${Date.now()}`,
      Description: 'GoPro udlejning',
      ProductLines: productLines,
      ShowLinesInclVat: true
    }

    const organizationId = '594481' // Your organization ID
    const response = await fetch(`${DINERO_API_BASE}/v1/${organizationId}/invoices`, {
      method: 'POST',
      headers: {
        'Authorization': apiKey, // Try without Bearer prefix
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invoiceData)
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Failed to create invoice: ${response.status} - ${errorData}`)
    }

    return await response.json()

  } catch (error: any) {
    console.error('Error creating invoice in Dinero:', error)
    throw new Error(`Invoice creation failed: ${error.message}`)
  }
}

// Helper function to update booking with invoice information
async function updateBookingWithInvoice(bookingId: number, invoice: any) {
  try {
    const supabase = useSupabase()
    if (!supabase) {
      throw new Error('Database connection failed')
    }

    const { error } = await supabase
      .from('Booking')
      .update({
        invoiceId: invoice.Guid,
        invoiceNumber: invoice.InvoiceNumber,
        invoiceStatus: 'created',
        updatedAt: new Date().toISOString()
      })
      .eq('id', bookingId)

    if (error) {
      console.error('Error updating booking with invoice info:', error)
      throw new Error(`Failed to update booking: ${error.message}`)
    }

  } catch (error: any) {
    console.error('Error updating booking:', error)
    throw new Error(`Booking update failed: ${error.message}`)
  }
}