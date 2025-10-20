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
  
  // Colors
  const darkGray = [64, 64, 64] as const
  const lightGray = [128, 128, 128] as const
  const redColor = [185, 12, 44] as const // LejGoPro red
  
  // Header - Company name right aligned
  doc.setFontSize(24)
  doc.setTextColor(...darkGray)
  doc.setFont('helvetica', 'bold')
  const companyName = 'lejgopro'
  const companyNameWidth = doc.getTextWidth(companyName)
  doc.text(companyName, pageWidth - companyNameWidth - 20, 30)
  
  // Company info - left side
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...lightGray)
  
  // You can update these with your actual company details
  const companyInfo = [
    'LejGoPro ApS',
    'Borgmester Jørgensens Vej 3, stue. 138',
    '9000 Aalborg',
    'CVR-nr.: 12345678' // Update with your actual CVR number
  ]
  
  let yPos = 50
  companyInfo.forEach(line => {
    doc.text(line, 20, yPos)
    yPos += 12
  })
  
  // Date and Invoice number - right side
  doc.setTextColor(...darkGray)
  const currentDate = new Date().toLocaleDateString('da-DK', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
  
  doc.text(`Dato: ${currentDate}`, pageWidth - 120, 50)
  doc.text(`Fakturanr: ${bookingData.orderNumber}`, pageWidth - 120, 65)
  
  // Service description
  doc.setFontSize(10)
  doc.text('GoPro leje', 20, 85)
  
  // Main heading
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...darkGray)
  doc.text('Faktura', 20, 110)
  
  // Table header
  yPos = 130
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...lightGray)
  
  // Table headers
  doc.text('Beskrivelse', 20, yPos)
  doc.text('Antal', 100, yPos)
  doc.text('Enhed', 130, yPos)
  doc.text('Enhedspris', 150, yPos)
  doc.text('Pris', 180, yPos)
  
  // Table line under header
  doc.setDrawColor(...lightGray)
  doc.setLineWidth(0.3)
  doc.line(20, yPos + 5, pageWidth - 20, yPos + 5)
  
  // Table content
  yPos += 20
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...darkGray)
  
  // Calculate rental days
  const startDateStr = bookingData.startDate || bookingData.rentalPeriod?.startDate || new Date().toISOString()
  const endDateStr = bookingData.endDate || bookingData.rentalPeriod?.endDate || new Date(Date.now() + 24*60*60*1000).toISOString()
  
  const startDate = new Date(startDateStr)
  const endDate = new Date(endDateStr)
  const rentalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
  
  // Service line
  const serviceDescription = bookingData.service || 'GoPro leje'
  const quantity = rentalDays.toString()
  const unit = 'dage'
  const unitPrice = (bookingData.totalAmount / rentalDays).toFixed(2)
  const totalPrice = bookingData.totalAmount.toFixed(2)
  
  doc.text(serviceDescription, 20, yPos)
  doc.text(quantity, 100, yPos)
  doc.text(unit, 130, yPos)
  doc.text(unitPrice, 150, yPos)
  doc.text(totalPrice, 180, yPos)
  
  // Subtotal, VAT, and Total
  yPos += 40
  
  // Right align the totals
  const rightAlign = pageWidth - 60
  const labelAlign = pageWidth - 120
  
  // Subtotal
  doc.text('Subtotal', labelAlign, yPos)
  doc.text(`${totalPrice}`, rightAlign, yPos)
  
  yPos += 15
  // VAT (25%)
  const vatRate = bookingData.vatRate || 25
  const vatAmount = (bookingData.totalAmount * vatRate / 100).toFixed(2)
  doc.text(`Moms (${vatRate},00%)`, labelAlign, yPos)
  doc.text(vatAmount, rightAlign, yPos)
  
  yPos += 15
  // Total
  doc.setFont('helvetica', 'bold')
  const totalWithVat = (bookingData.totalAmount + parseFloat(vatAmount)).toFixed(2)
  
  // Line above total
  doc.setLineWidth(0.5)
  doc.line(labelAlign - 10, yPos - 5, rightAlign + 20, yPos - 5)
  
  doc.text('Total DKK', labelAlign, yPos)
  doc.text(totalWithVat, rightAlign, yPos)
  
  // Red dot accent (matching your design)
  doc.setFillColor(...redColor)
  doc.circle(rightAlign + 25, yPos - 2, 1, 'F')
  
  // Payment terms section
  yPos += 40
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...lightGray)
  
  const paymentDate = new Date()
  paymentDate.setDate(paymentDate.getDate() + 8) // 8 days from now
  const formattedPaymentDate = paymentDate.toLocaleDateString('da-DK', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
  
  doc.text(`Betalingsbetingelser: Netto 8 dage - Forfaldsdato: ${formattedPaymentDate}`, 20, yPos)
  
  yPos += 15
  doc.text('Beløbet indbetales på bankkonto:', 20, yPos)
  
  yPos += 10
  doc.text('Bank / Reg.nr: 2535 / Kontonr: 1234567890', 20, yPos) // Update with actual bank details
  
  yPos += 10
  doc.text('Fakturanr. skal angivet ved bankoverførsel', 20, yPos)
  
  yPos += 15
  doc.text('Ved betaling efter forfald tillskrives der renter på 0,81% pr. påbegyndt måned, samt et gebyr på 100,00 DKK', 20, yPos)
  
  // Customer information (if needed for delivery)
  const hasAddress = bookingData.address || bookingData.deliveryAddress
  if (hasAddress) {
    yPos = 140 // Position on right side
    const customerX = pageWidth - 150
    
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...darkGray)
    doc.text('Levering til:', customerX, yPos)
    
    yPos += 15
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...lightGray)
    doc.text(bookingData.customerName, customerX, yPos)
    
    if (bookingData.deliveryAddress) {
      // Handle combined delivery address
      yPos += 10
      doc.text(bookingData.deliveryAddress, customerX, yPos)
    } else if (bookingData.address) {
      // Handle separate address components
      yPos += 10
      doc.text(bookingData.address, customerX, yPos)
      
      if (bookingData.apartment) {
        yPos += 10
        doc.text(bookingData.apartment, customerX, yPos)
      }
      
      if (bookingData.postalCode && bookingData.city) {
        yPos += 10
        doc.text(`${bookingData.postalCode} ${bookingData.city}`, customerX, yPos)
      }
    }
  }
  
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