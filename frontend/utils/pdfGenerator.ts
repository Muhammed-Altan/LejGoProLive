// Dynamic import for jsPDF to handle both client and server environments
let jsPDF: any = null

const getJsPDF = async () => {
  if (!jsPDF) {
    if (process.server) {
      // Server-side import
      const { jsPDF: JsPDFClass } = await import('jspdf')
      jsPDF = JsPDFClass
    } else {
      // Client-side import
      const jsPDFModule = await import('jspdf')
      jsPDF = jsPDFModule.default || jsPDFModule.jsPDF || jsPDFModule
    }
  }
  return jsPDF
}

// Get logo URL from Supabase storage
const getLogoFromSupabase = async (): Promise<string | null> => {
  try {
    console.log('🔍 Fetching logo from Supabase storage...')
    
    if (process.server) {
      // Server-side: use Supabase directly
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseUrl = process.env.SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Supabase credentials not found in environment')
        return null
      }
      
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      // Get the logo from the 'email' folder
      const { data, error } = await supabase.storage
        .from('productImage')
        .list('email', {
          limit: 10,
          search: 'lejgopro-email.png'
        })
      
      if (error || !data || data.length === 0) {
        console.error('❌ Logo not found in Supabase storage:', error)
        return null
      }
      
      // Get public URL for the logo
      const { data: publicData } = supabase.storage
        .from('productImage')
        .getPublicUrl(`email/${data[0].name}`)
      
      if (publicData?.publicUrl) {
        console.log('✅ Logo URL retrieved from Supabase:', publicData.publicUrl)
        return publicData.publicUrl
      }
      
      return null
    } else {
      // Client-side: use composable or API
      const { useSupabase } = await import('@/composables/useSupabase')
      const supabase = useSupabase()
      
      if (!supabase) {
        console.error('❌ Supabase client not available')
        return null
      }
      
      const { data, error } = await supabase.storage
        .from('productImage')
        .list('email', {
          limit: 10,
          search: 'lejgopro-email.png'
        })
      
      if (error || !data || data.length === 0) {
        console.error('❌ Logo not found in Supabase storage (client):', error)
        return null
      }
      
      const { data: publicData } = supabase.storage
        .from('productImage')
        .getPublicUrl(`email/${data[0].name}`)
      
      return publicData?.publicUrl || null
    }
  } catch (error) {
    console.error('💥 Error fetching logo from Supabase:', error)
    return null
  }
}

interface BookingItem {
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface BookingData {
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  address?: string
  apartment?: string
  city?: string
  postalCode?: string
  service: string
  startDate?: string
  endDate?: string
  duration?: string
  rentalPeriod?: {
    startDate: string
    endDate: string
  }
  deliveryAddress?: string
  totalAmount: number
  items?: BookingItem[]
  vatRate?: number
}

export async function generateReceiptPDF(bookingData: BookingData): Promise<any> {
  console.log('📄 Starting PDF generation...')
  
  try {
    const JsPDFClass = await getJsPDF()
    console.log('✅ jsPDF class loaded successfully')
    
    const doc = new JsPDFClass()
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    
    console.log('✅ PDF document initialized, page size:', pageWidth, 'x', pageHeight)
    
    // Validate required fields and provide fallbacks
    const safeBookingData = {
      orderNumber: bookingData.orderNumber || 'UNKNOWN-ORDER',
      customerName: bookingData.customerName || 'Kunde',
      customerEmail: bookingData.customerEmail || 'kunde@example.com',
      customerPhone: bookingData.customerPhone,
      address: bookingData.address,
      apartment: bookingData.apartment,
      city: bookingData.city,
      postalCode: bookingData.postalCode,
      deliveryAddress: bookingData.deliveryAddress,
      service: bookingData.service || 'GoPro leje',
      startDate: bookingData.startDate,
      endDate: bookingData.endDate,
      totalAmount: bookingData.totalAmount || 0,
      items: bookingData.items,
      vatRate: bookingData.vatRate || 25,
      rentalPeriod: bookingData.rentalPeriod
    }
    
    console.log('✅ Booking data validated and sanitized')
    
    // Colors
    const darkGray = [64, 64, 64] as const
    const lightGray = [128, 128, 128] as const
    const redColor = [185, 12, 44] as const // LejGoPro red

    // Add logo at top right - using Supabase storage
    try {
      console.log('📄 Adding logo to PDF from Supabase...')
      
      // Calculate logo position (top right corner)
      const logoWidth = 40
      const logoHeight = 40
      const logoX = pageWidth - logoWidth - 20
      const logoY = 20
      
      // Get logo from Supabase storage
      const logoUrl = await getLogoFromSupabase()
      
      if (logoUrl) {
        console.log('📄 Logo URL retrieved from Supabase:', logoUrl)
        
        // For server-side, we need to fetch the image and convert to base64
        if (process.server) {
          try {
            const response = await fetch(logoUrl)
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer()
              const buffer = Buffer.from(arrayBuffer)
              const logoBase64 = buffer.toString('base64')
              const logoDataUrl = `data:image/png;base64,${logoBase64}`
              
              doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoWidth, logoHeight)
              console.log('✅ Logo added successfully via Supabase (server-side)')
            } else {
              throw new Error(`Failed to fetch logo: ${response.status}`)
            }
          } catch (fetchError) {
            console.warn('⚠️ Failed to fetch logo from Supabase:', fetchError)
          }
        } else {
          // Client-side: use URL directly
          try {
            doc.addImage(logoUrl, 'PNG', logoX, logoY, logoWidth, logoHeight)
            console.log('✅ Logo added successfully via Supabase (client-side)')
          } catch (addError) {
            console.warn('⚠️ Failed to add logo from URL:', addError)
          }
        }
      } else {
        console.warn('⚠️ No logo URL found in Supabase')
      }
    } catch (logoError) {
      const error = logoError instanceof Error ? logoError : new Error(String(logoError))
      console.warn('⚠️ Logo failed, skipping it:', error.message)
      // Continue without logo - this is not critical
    }
  
    // Top Left - Customer Information
  doc.setFontSize(10)
  doc.setTextColor(...darkGray)
  doc.setFont('helvetica', 'normal')
  
  let yPos = 30
  doc.text(safeBookingData.customerName, 20, yPos)
  yPos += 8  
  doc.text(safeBookingData.customerEmail, 20, yPos)
  
  // Include all available address information
  const addressToShow = safeBookingData.address || safeBookingData.deliveryAddress
  if (addressToShow) {
    yPos += 8
    doc.text(addressToShow, 20, yPos)
    
    if (safeBookingData.apartment) {
      yPos += 8
      doc.text(safeBookingData.apartment, 20, yPos)
    }
    
    if (safeBookingData.postalCode && safeBookingData.city) {
      yPos += 8
      doc.text(`${safeBookingData.postalCode} ${safeBookingData.city}`, 20, yPos)
    } else if (safeBookingData.city) {
      yPos += 8
      doc.text(safeBookingData.city, 20, yPos)
    }
  }
  
  if (safeBookingData.customerPhone) {
    yPos += 8
    doc.text(safeBookingData.customerPhone, 20, yPos)
  }
  
  // Date (left) and Order ID (right) - positioned below customer info
  yPos = 100
  doc.setFontSize(10)
  doc.setTextColor(...darkGray)
  doc.setFont('helvetica', 'normal')
  
  const currentDate = new Date().toLocaleDateString('da-DK', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
  
  doc.text(`Dato: ${currentDate}`, 20, yPos)
  
  // Right-align the invoice number using the full available space
  const invoiceText = `Fakturanr: ${safeBookingData.orderNumber}`
  const invoiceTextWidth = doc.getTextWidth(invoiceText)
  doc.text(invoiceText, pageWidth - invoiceTextWidth - 20, yPos)
  
  // Main "Faktura" heading - smaller size
  yPos += 15
  doc.setFontSize(14)  // Reduced from 18
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...darkGray)
  doc.text('Faktura', 20, yPos)
  
  // Table setup - reduced spacing
  yPos += 15
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...darkGray)
  
  // Table headers
  doc.text('Beskrivelse', 20, yPos)
  doc.text('Antal', 100, yPos)
  doc.text('Enhed', 130, yPos) 
  doc.text('Enhedspris', 150, yPos)
  doc.text('Pris', 180, yPos)
  
  // Table line under header
  doc.setDrawColor(...lightGray)
  doc.setLineWidth(0.5)
  doc.line(20, yPos + 5, pageWidth - 20, yPos + 5)
  
  // Table content
  yPos += 15
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...darkGray)
  
  // Calculate rental period
  const startDateStr = safeBookingData.startDate || safeBookingData.rentalPeriod?.startDate || new Date().toISOString()
  const endDateStr = safeBookingData.endDate || safeBookingData.rentalPeriod?.endDate || new Date(Date.now() + 24*60*60*1000).toISOString()
  
  const startDate = new Date(startDateStr)
  const endDate = new Date(endDateStr)
  const rentalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
  
  // Format dates for display
  const formattedStartDate = startDate.toLocaleDateString('da-DK')
  const formattedEndDate = endDate.toLocaleDateString('da-DK')
  const dateRange = `${formattedStartDate} - ${formattedEndDate}`
  
  // Display items from booking data
  let subtotalAmount = 0
  
  console.log('📋 PDF Generator - Items available:', safeBookingData.items?.length || 0)
  console.log('📋 PDF Generator - Items data:', safeBookingData.items)
  
  if (safeBookingData.items && safeBookingData.items.length > 0) {
    // Display each item from the booking
    safeBookingData.items.forEach((item, index) => {
      // Safely handle potentially undefined properties
      const itemName = item.name || 'GoPro leje'
      const itemQuantity = item.quantity || 1
      const itemUnitPrice = item.unitPrice || 0
      const itemTotalPrice = item.totalPrice || (itemQuantity * itemUnitPrice)
      
      console.log(`📋 PDF Generator - Item ${index + 1}:`, {
        name: itemName,
        quantity: itemQuantity,
        unitPrice: itemUnitPrice,
        totalPrice: itemTotalPrice
      })
      
      // Check if this item is an accessory (hide prices for accessories)
      const isAccessory = itemName.toLowerCase().includes('tilbehør') || 
                         itemName.toLowerCase().includes('accessory') ||
                         itemName.toLowerCase().includes('adapter') ||
                         itemName.toLowerCase().includes('kabel') ||
                         itemName.toLowerCase().includes('cable') ||
                         itemName.toLowerCase().includes('mount') ||
                         itemName.toLowerCase().includes('holder') ||
                         itemName.toLowerCase().includes('battery') ||
                         itemName.toLowerCase().includes('batteri') ||
                         itemName.toLowerCase().includes('card') ||
                         itemName.toLowerCase().includes('kort') ||
                         itemName.toLowerCase().includes('case') ||
                         itemName.toLowerCase().includes('etui') ||
                         itemName.toLowerCase().includes('grip') ||
                         itemName.toLowerCase().includes('bryst') ||
                         itemName.toLowerCase().includes('sugekop') ||  // Added for "Sugekop til ruder"
                         itemName.toLowerCase().includes('headstrap') || // Added for "Headstrap"  
                         itemName.toLowerCase().includes('head strap') || // Alternative spelling
                         itemName.toLowerCase().includes('strap') ||      // General strap accessories
                         itemName.toLowerCase().includes('ekstra') ||     // "Ekstra batteri" etc
                         itemName.toLowerCase().includes('extra') ||      // English version
                         itemName.toLowerCase().includes('mount') ||
                         itemUnitPrice === 0 // Also hide if price is 0
      
      console.log(`📋 PDF Generator - "${itemName}" isAccessory: ${isAccessory}, unitPrice: ${itemUnitPrice}`)
      
      const description = `${itemName} ${dateRange}`
      const quantity = itemQuantity.toString()
      const unit = 'stk.'
      
      doc.text(description, 20, yPos)
      doc.text(quantity, 100, yPos)
      doc.text(unit, 130, yPos)
      
      if (isAccessory) {
        // For accessories, don't show any price information - just leave the price columns empty
        console.log(`📋 PDF Generator - ${itemName} identified as accessory, no price shown`)
      } else {
        // For cameras/main items, show actual prices
        const unitPrice = itemUnitPrice.toFixed(2)
        const totalPrice = itemTotalPrice.toFixed(2)
        doc.text(unitPrice, 150, yPos)
        doc.text(totalPrice, 180, yPos)
        subtotalAmount += itemTotalPrice
        console.log(`📋 PDF Generator - ${itemName} is main item, showing price: ${totalPrice}`)
      }
      
      yPos += 12
    })
  } else {
    console.log('📋 PDF Generator - No items found, using fallback service description')
    // Fallback to service description if no items - use the total booking amount
    const serviceDescription = `${safeBookingData.service || 'GoPro leje'} ${dateRange}`
    const quantity = '1'
    const unit = 'stk.'
    // Use the total booking amount for both unit price and total (since quantity is 1)
    const bookingTotal = safeBookingData.totalAmount || 0
    const unitPrice = bookingTotal.toFixed(2)
    const totalPrice = bookingTotal.toFixed(2)
    
    doc.text(serviceDescription, 20, yPos)
    doc.text(quantity, 100, yPos)
    doc.text(unit, 130, yPos)
    doc.text(unitPrice, 150, yPos)
    doc.text(totalPrice, 180, yPos)
    
    subtotalAmount = bookingTotal
    yPos += 12
  }
  
  // Totals section - reduced spacing
  yPos += 10
  const rightAlign = pageWidth - 40
  const labelAlign = pageWidth - 100
  
  // The totalAmount is the final price including VAT
  const finalTotal = safeBookingData.totalAmount || 0
  
  // Calculate VAT-exclusive amount (subtotal)
  const vatRate = safeBookingData.vatRate || 25
  const subtotalExcludingVat = finalTotal / (1 + vatRate / 100)
  const vatAmount = finalTotal - subtotalExcludingVat
  
  // Subtotal (VAT excluded)
  doc.setFont('helvetica', 'normal')
  doc.text('Subtotal', labelAlign, yPos)
  doc.text(`${subtotalExcludingVat.toFixed(2)}`, rightAlign, yPos)
  
  yPos += 15
  // VAT amount
  doc.text(`Moms (${vatRate},00%)`, labelAlign, yPos)
  doc.text(vatAmount.toFixed(2), rightAlign, yPos)
  
  yPos += 15
  // Total (final amount including VAT)
  doc.setFont('helvetica', 'bold')
  
  // Line above total
  doc.setLineWidth(0.5)
  doc.line(labelAlign - 10, yPos - 5, rightAlign + 20, yPos - 5)
  
  doc.text('Total DKK', labelAlign, yPos)
  doc.text(finalTotal.toFixed(2), rightAlign, yPos)
  
  // Add business information at the bottom with dynamic spacing
  yPos += 30  // Add space after totals
  const minimumBottomMargin = 30
  const businessInfoY = Math.max(yPos, pageHeight - minimumBottomMargin - 20) // Ensure it doesn't go too close to bottom
  
  // Business info styling
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...darkGray)
  
  // Center the business information
  const businessInfo1 = 'lejgopro / Snorresgade 1, st. th / 2300 København S'
  const businessInfo2 = 'CVR-nr. DK41910437 / Tlf. 53805954 / Web: lejgopro.dk / Mail: kontakt@lejgopro.dk'
  
  const textWidth1 = doc.getTextWidth(businessInfo1)
  const textWidth2 = doc.getTextWidth(businessInfo2)
  const centerX1 = (pageWidth - textWidth1) / 2
  const centerX2 = (pageWidth - textWidth2) / 2
  
  doc.text(businessInfo1, centerX1, businessInfoY - 8)
  doc.text(businessInfo2, centerX2, businessInfoY)
  
  console.log('✅ PDF generation completed successfully')
  return doc
  
  } catch (error) {
    console.error('💥 Error in PDF generation:', error)
    throw error
  }
}

export async function downloadPDF(bookingData: BookingData, filename?: string): Promise<void> {
  const doc = await generateReceiptPDF(bookingData)
  const fileName = filename || `LejGoPro-Faktura-${bookingData.orderNumber}.pdf`
  doc.save(fileName)
}

export async function getPDFBlob(bookingData: BookingData): Promise<Blob> {
  const doc = await generateReceiptPDF(bookingData)
  return new Blob([doc.output('blob')], { type: 'application/pdf' })
}

export async function getPDFBuffer(bookingData: BookingData): Promise<Buffer> {
  console.log('📄 Starting PDF buffer generation for order:', bookingData.orderNumber)
  console.log('📄 Booking data for PDF:', {
    orderNumber: bookingData.orderNumber,
    customerName: bookingData.customerName,
    service: bookingData.service,
    totalAmount: bookingData.totalAmount,
    itemsCount: bookingData.items?.length || 0
  })
  
  try {
    const doc = await generateReceiptPDF(bookingData)
    console.log('✅ PDF document generated successfully')
    
    const buffer = Buffer.from(doc.output('arraybuffer'))
    console.log('✅ PDF buffer created, size:', buffer.length, 'bytes')
    
    return buffer
  } catch (error) {
    console.error('💥 Error generating PDF buffer:', error)
    console.error('📋 PDF generation failed for data:', bookingData)
    throw error
  }
}