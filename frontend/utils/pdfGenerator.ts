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

    // Add logo at top right - simpler approach
    try {
      console.log('📄 Adding logo to PDF...')
      
      // Calculate logo position (top right corner)
      const logoWidth = 40
      const logoHeight = 40
      const logoX = pageWidth - logoWidth - 20
      const logoY = 20
      
      if (process.server) {
        // Server-side: use filesystem
        const fs = await import('fs')
        const path = await import('path')
        
        const logoPath = path.join(process.cwd(), 'public', 'logo', 'lejgopro-email.png')
        
        if (fs.existsSync(logoPath)) {
          console.log('📄 Logo file found, attempting to add...')
          
          // Simple approach - just try the file path
          doc.addImage(logoPath, 'PNG', logoX, logoY, logoWidth, logoHeight)
          console.log('✅ Logo added successfully')
        } else {
          console.warn('⚠️ Logo file not found at:', logoPath)
        }
      } else {
        // Client-side: use public path
        doc.addImage('/logo/lejgopro-email.png', 'PNG', logoX, logoY, logoWidth, logoHeight)
        console.log('✅ Logo added successfully (client-side)')
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
                         itemUnitPrice === 0 // Also hide if price is 0
      
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
  
  // Add business information at the bottom
  const bottomMargin = 30
  const businessInfoY = pageHeight - bottomMargin
  
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