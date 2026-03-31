'use client'

import QRCode from 'react-qr-code'
import Barcode from 'react-barcode'

type Item = {
  id: string
  alteration_type: string
  barcode_id: string
  due_date: string
}

type Props = {
  order: {
    customer_name: string
    customer_phone: string
    shopify_order_number: string | null
  }
  items: Item[]
  trackingUrl: string
}

export default function TicketClient({ order, items, trackingUrl }: Props) {
  const earliestDue = items.reduce((earliest, item) => {
    return item.due_date < earliest ? item.due_date : earliest
  }, items[0]?.due_date ?? '')

  return (
    <div className="p-6 flex justify-center">
      <div
        className="ticket bg-white rounded-2xl shadow-sm border border-gray-200 p-5 w-80"
        style={{ pageBreakInside: 'avoid' }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
              {order.shopify_order_number ?? 'Manual order'}
            </p>
            <p className="text-lg font-bold text-gray-900 mt-0.5">{order.customer_name}</p>
            <p className="text-sm text-gray-500">{order.customer_phone}</p>
          </div>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 6h8M4 8h5M4 10h6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <rect x="2" y="3" width="12" height="10" rx="2" stroke="white" strokeWidth="1.5"/>
            </svg>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl px-4 py-3 mb-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Alterations</p>
          <div className="space-y-1.5">
            {items.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-4 flex-shrink-0">{idx + 1}.</span>
                <span className="text-sm font-medium text-gray-900">{item.alteration_type}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Due by</p>
          <p className="text-sm font-semibold text-gray-900">
            {new Date(earliestDue).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <div className="border-t border-gray-100 pt-4 mb-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Barcode</p>
          <div className="flex justify-center">
            <Barcode
              value={order.shopify_order_number ?? items[0]?.barcode_id ?? 'ORDER'}
              format="CODE128"
              width={1.5}
              height={50}
              displayValue={true}
              fontSize={11}
              margin={0}
              background="#ffffff"
              lineColor="#111827"
            />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Scan to track order</p>
          <div className="flex items-center gap-4">
            <QRCode value={trackingUrl} size={72} />
            <p className="text-xs text-gray-400 leading-relaxed">Customer can scan to track their order in real time.</p>
          </div>
        </div>
      </div>
    </div>
  )
}