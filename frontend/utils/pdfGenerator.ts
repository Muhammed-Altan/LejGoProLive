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
  const JsPDFClass = await getJsPDF()
  const doc = new JsPDFClass()
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  
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
    service: bookingData.service || 'GoPro leje',
    startDate: bookingData.startDate,
    endDate: bookingData.endDate,
    totalAmount: bookingData.totalAmount || 0,
    items: bookingData.items,
    vatRate: bookingData.vatRate || 25,
    rentalPeriod: bookingData.rentalPeriod
  }
  
  // Colors
  const darkGray = [64, 64, 64] as const
  const lightGray = [128, 128, 128] as const
  const redColor = [185, 12, 44] as const // LejGoPro red
  
  // Top Left - Customer Information
  doc.setFontSize(10)
  doc.setTextColor(...darkGray)
  doc.setFont('helvetica', 'normal')
  
  let yPos = 30
  doc.text(safeBookingData.customerName, 20, yPos)
  yPos += 12
  doc.text(safeBookingData.customerEmail, 20, yPos)
  
  if (safeBookingData.address) {
    yPos += 12
    doc.text(safeBookingData.address, 20, yPos)
    
    if (safeBookingData.apartment) {
      yPos += 12
      doc.text(safeBookingData.apartment, 20, yPos)
    }
    
    if (safeBookingData.postalCode && safeBookingData.city) {
      yPos += 12
      doc.text(`${safeBookingData.postalCode} ${safeBookingData.city}`, 20, yPos)
    }
  }
  
  if (safeBookingData.customerPhone) {
    yPos += 12
    doc.text(safeBookingData.customerPhone, 20, yPos)
  }
  
  // Top Right - Logo (text-based for now)
  doc.setFontSize(24)
  doc.setTextColor(...redColor)
  doc.setFont('helvetica', 'bold')
  const companyName = 'lejgopro'
  const companyNameWidth = doc.getTextWidth(companyName)
  doc.text(companyName, pageWidth - companyNameWidth - 20, 40)
  
  // Date (left) and Order ID (right) - positioned below customer info and logo
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
  doc.text(`Fakturanr: ${safeBookingData.orderNumber}`, pageWidth - 100, yPos)
  
  // Main "Faktura" heading
  yPos += 30
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...darkGray)
  doc.text('Faktura', 20, yPos)
  
  // Table setup
  yPos += 30
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
  yPos += 20
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
  
  if (safeBookingData.items && safeBookingData.items.length > 0) {
    // Display each item from the booking
    safeBookingData.items.forEach(item => {
      // Safely handle potentially undefined properties
      const itemName = item.name || 'GoPro leje'
      const itemQuantity = item.quantity || 1
      const itemUnitPrice = item.unitPrice || 0
      const itemTotalPrice = item.totalPrice || (itemQuantity * itemUnitPrice)
      
      const description = `${itemName} ${dateRange}`
      const quantity = itemQuantity.toString()
      const unit = 'stk.'
      const unitPrice = itemUnitPrice.toFixed(2)
      const totalPrice = itemTotalPrice.toFixed(2)
      
      doc.text(description, 20, yPos)
      doc.text(quantity, 100, yPos)
      doc.text(unit, 130, yPos)
      doc.text(unitPrice, 150, yPos)
      doc.text(totalPrice, 180, yPos)
      
      subtotalAmount += itemTotalPrice
      yPos += 15
    })
  } else {
    // Fallback to service description if no items
    const serviceDescription = `${safeBookingData.service || 'GoPro leje'} ${dateRange}`
    const quantity = '1'
    const unit = 'stk.'
    const unitPrice = (safeBookingData.totalAmount || 0).toFixed(2)
    const totalPrice = (safeBookingData.totalAmount || 0).toFixed(2)
    
    doc.text(serviceDescription, 20, yPos)
    doc.text(quantity, 100, yPos)
    doc.text(unit, 130, yPos)
    doc.text(unitPrice, 150, yPos)
    doc.text(totalPrice, 180, yPos)
    
    subtotalAmount = safeBookingData.totalAmount || 0
    yPos += 15
  }
  
  // Totals section
  yPos += 20
  const rightAlign = pageWidth - 40
  const labelAlign = pageWidth - 100
  
  // Subtotal
  doc.setFont('helvetica', 'normal')
  doc.text('Subtotal', labelAlign, yPos)
  doc.text(`${subtotalAmount.toFixed(2)}`, rightAlign, yPos)
  
  yPos += 15
  // VAT (25%)
  const vatRate = safeBookingData.vatRate || 25
  const vatAmount = (subtotalAmount * vatRate / (100 + vatRate))
  doc.text(`Moms (${vatRate},00%)`, labelAlign, yPos)
  doc.text(vatAmount.toFixed(2), rightAlign, yPos)
  
  yPos += 15
  // Total
  doc.setFont('helvetica', 'bold')
  
  // Line above total
  doc.setLineWidth(0.5)
  doc.line(labelAlign - 10, yPos - 5, rightAlign + 20, yPos - 5)
  
  doc.text('Total DKK', labelAlign, yPos)
  doc.text(subtotalAmount.toFixed(2), rightAlign, yPos)
  
  return doc
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
  const doc = await generateReceiptPDF(bookingData)
  return Buffer.from(doc.output('arraybuffer'))
}