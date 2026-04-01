require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
const os = require('os')
const PDFDocument = require('pdfkit')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const LOCATION_ID = process.argv[2] || null
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const PRINTNODE_API_KEY = process.env.PRINTNODE_API_KEY
const PRINTNODE_PRINTER_ID = parseInt(process.env.PRINTNODE_PRINTER_ID)

console.log('=================================')
console.log('  Tailor Manager Print Server')
console.log('=================================')

if (!LOCATION_ID) {
  console.error('ERROR: Please provide a location ID')
  console.log('Usage: node print-server.js <location-id>')
  process.exit(1)
}

if (!PRINTNODE_API_KEY || !PRINTNODE_PRINTER_ID) {
  console.error('ERROR: Missing PRINTNODE_API_KEY or PRINTNODE_PRINTER_ID in .env.local')
  process.exit(1)
}

console.log('Location ID:', LOCATION_ID)
console.log('Printer ID:', PRINTNODE_PRINTER_ID)
console.log('Connecting to Supabase...')

function generateBarcode128(text) {
  const CODE128_START_B = 104
  const patterns = [
    '11011001100','11001101100','11001100110','10010011000','10010001100',
    '10001001100','10011001000','10011000100','10001100100','11001001000',
    '11001000100','11000100100','10110011100','10011011100','10011001110',
    '10111001100','10011101100','10011100110','11001110010','11001011100',
    '11001001110','11011100100','11001110100','11101101110','11101001100',
    '11100101100','11100100110','11101100100','11100110100','11100110010',
    '11011011000','11011000110','11000110110','10100011000','10001011000',
    '10001000110','10110001000','10001101000','10001100010','11010001000',
    '11000101000','11000100010','10110111000','10110001110','10001101110',
    '10111011000','10111000110','10001110110','11101110110','11010001110',
    '11000101110','11011101000','11011100010','11011101110','11101011000',
    '11101000110','11100010110','11101101000','11101100010','11100011010',
    '11101111010','11001000010','11110001010','10100110000','10100001100',
    '10010110000','10010000110','10000101100','10000100110','10110010000',
    '10110000100','10011010000','10011000010','10000110100','10000110010',
    '11000010010','11001010000','11110111010','11000010100','10001111010',
    '10100111100','10010111100','10010011110','10111100100','10011110100',
    '10011110010','11110100100','11110010100','11110010010','11011011110',
    '11011110110','11110110110','10101111000','10100011110','10001011110',
    '10111101000','10111100010','11110101000','11110100010','10111011110',
    '10111101110','11101011110','11110101110','11010000100','11010010000',
    '11010011100','11000111010','11'
  ]

  let checksum = CODE128_START_B
  const values = [CODE128_START_B]
  for (let i = 0; i < text.length; i++) {
    const v = text.charCodeAt(i) - 32
    values.push(v)
    checksum += v * (i + 1)
  }
  values.push(checksum % 103)
  values.push(106)

  return values.map(v => patterns[v]).join('')
}

function drawBarcode(doc, text, x, y, barWidth, barHeight) {
  const pattern = generateBarcode128(text)
  let currentX = x
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === '1') {
      doc.rect(currentX, y, barWidth, barHeight).fill('#000000')
    }
    currentX += barWidth
  }
  doc.fillColor('#000000')
  doc.fontSize(9).font('Helvetica').text(text, x, y + barHeight + 3, {
    width: pattern.length * barWidth,
    align: 'center'
  })
}

async function generatePDF(order) {
  const items = order.order_items || []
  const due = items[0]?.due_date
    ? new Date(items[0].due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'N/A'

  const barcodeValue = order.shopify_order_number || items[0]?.barcode_id || 'ORDER'
  const trackingUrl = APP_URL + '/track/' + order.tracking_token

  const labelWidth = 4 * 72
  const labelHeight = 6 * 72

  const doc = new PDFDocument({
    size: [labelWidth, labelHeight],
    margin: 0,
  })

  const tmpFile = path.join(os.tmpdir(), 'ticket-' + order.id + '.pdf')
  const stream = fs.createWriteStream(tmpFile)
  doc.pipe(stream)

  const margin = 18
  let y = margin

  doc.fillColor('#000000').fontSize(20).font('Helvetica-Bold')
  doc.text(order.customer_name, margin, y, { width: labelWidth - margin * 2 })
  y += 26

  doc.fontSize(11).font('Helvetica')
  doc.text(order.customer_phone, margin, y)
  y += 16

  doc.fontSize(12).font('Helvetica-Bold')
  doc.text(order.shopify_order_number || 'Manual Order', margin, y)
  y += 16

  doc.moveTo(margin, y).lineTo(labelWidth - margin, y).lineWidth(0.5).stroke('#cccccc')
  y += 10

  doc.fontSize(7).font('Helvetica').fillColor('#888888')
  doc.text('ALTERATIONS', margin, y)
  y += 11

  doc.fillColor('#000000').font('Helvetica-Bold').fontSize(11)
  items.forEach((item, idx) => {
    doc.text((idx + 1) + '.  ' + item.alteration_type, margin, y)
    y += 16
  })

  y += 4
  doc.moveTo(margin, y).lineTo(labelWidth - margin, y).lineWidth(0.5).stroke('#cccccc')
  y += 10

  doc.fontSize(7).font('Helvetica').fillColor('#888888')
  doc.text('DUE BY', margin, y)
  y += 11

  doc.fillColor('#000000').font('Helvetica-Bold').fontSize(13)
  doc.text(due, margin, y)
  y += 20

  doc.moveTo(margin, y).lineTo(labelWidth - margin, y).lineWidth(0.5).stroke('#cccccc')
  y += 12

  doc.fontSize(7).font('Helvetica').fillColor('#888888')
  doc.text('BARCODE', margin, y)
  y += 10

  drawBarcode(doc, barcodeValue, margin, y, 1.8, 52)
  y += 76

  doc.moveTo(margin, y).lineTo(labelWidth - margin, y).lineWidth(0.5).stroke('#cccccc')
  y += 10

  doc.fontSize(7).font('Helvetica').fillColor('#888888')
  doc.text('SCAN TO TRACK YOUR ORDER', margin, y)
  y += 11

  doc.fontSize(8).fillColor('#2563EB')
  doc.text(trackingUrl, margin, y, { width: labelWidth - margin * 2 })

  doc.end()

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(tmpFile))
    stream.on('error', reject)
  })
}

async function sendToPrintNode(pdfFile, orderNumber) {
  const pdfBase64 = fs.readFileSync(pdfFile).toString('base64')

  const payload = {
    printerId: PRINTNODE_PRINTER_ID,
    title: 'Tailor Ticket - ' + (orderNumber || 'Order'),
    contentType: 'pdf_base64',
    content: pdfBase64,
    source: 'Tailor Manager',
  }

  const credentials = Buffer.from(PRINTNODE_API_KEY + ':').toString('base64')

  const response = await fetch('https://api.printnode.com/printjobs', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + credentials,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error('PrintNode error: ' + JSON.stringify(data))
  }

  return data
}

async function printOrder(orderId) {
  try {
    console.log('Fetching order:', orderId)

    const { data: order, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single()

    if (error || !order) {
      console.error('Failed to fetch order:', error)
      return
    }

    if (order.location_id !== LOCATION_ID) {
      console.log('Order is for a different location, skipping.')
      return
    }

    console.log('Generating PDF for:', order.customer_name)
    const pdfFile = await generatePDF(order)
    console.log('PDF generated, sending to PrintNode...')

    const result = await sendToPrintNode(pdfFile, order.shopify_order_number)
    console.log('Print job sent! PrintNode job ID:', result)

    setTimeout(() => {
      try { fs.unlinkSync(pdfFile) } catch (e) {}
    }, 5000)

  } catch (err) {
    console.error('Error processing order:', err)
  }
}

async function start() {
  const { data: location, error } = await supabase
    .from('locations')
    .select('*')
    .eq('id', LOCATION_ID)
    .single()

  if (error || !location) {
    console.error('Location not found. Check your location ID.')
    process.exit(1)
  }

  console.log('Location:', location.name)
  console.log('Waiting for new orders...')
  console.log('Press Ctrl+C to stop.')
  console.log('=================================')

  const channel = supabase
    .channel('print-server-' + LOCATION_ID)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
      },
      (payload) => {
        console.log('New order detected!')
        printOrder(payload.new.id)
      }
    )
    .subscribe((status) => {
      console.log('Realtime status:', status)
      if (status === 'SUBSCRIBED') {
        console.log('Connected and listening for new orders!')
      }
    })

  process.on('SIGINT', () => {
    console.log('\nShutting down print server...')
    supabase.removeChannel(channel)
    process.exit(0)
  })
}

start()