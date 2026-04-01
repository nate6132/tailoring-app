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

  const barcodeValue = order.shopify_order_number ?? items[0]?.barcode_id ?? 'ORDER'

  return (
    <div className="ticket-page">
      <div className="ticket">
        <div className="ticket-header">
          <div className="ticket-name">{order.customer_name}</div>
          <div className="ticket-order">{order.shopify_order_number ?? 'Manual'}</div>
        </div>

        <div className="ticket-phone">{order.customer_phone}</div>

        <div className="ticket-divider" />

        <div className="ticket-label">Alterations</div>
        <div className="ticket-items">
          {items.map((item, idx) => (
            <div key={item.id} className="ticket-item">
              {idx + 1}. {item.alteration_type}
            </div>
          ))}
        </div>

        <div className="ticket-due">
          Due: {new Date(earliestDue).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>

        <div className="ticket-divider" />

        <div className="ticket-barcode">
          <Barcode
            value={barcodeValue}
            format="CODE128"
            width={2}
            height={60}
            displayValue={true}
            fontSize={12}
            margin={0}
            background="#ffffff"
            lineColor="#000000"
          />
        </div>

        <div className="ticket-qr-row">
          <QRCode value={trackingUrl} size={60} />
          <div className="ticket-qr-text">Scan to track order</div>
        </div>
      </div>

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          background: white;
        }

        .ticket-page {
          width: 4in;
          padding: 0.15in;
          font-family: Arial, sans-serif;
        }

        .ticket {
          width: 100%;
        }

        .ticket-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 4px;
        }

        .ticket-name {
          font-size: 18px;
          font-weight: bold;
          color: #000;
        }

        .ticket-order {
          font-size: 13px;
          color: #555;
          font-weight: 600;
        }

        .ticket-phone {
          font-size: 12px;
          color: #555;
          margin-bottom: 8px;
        }

        .ticket-divider {
          border-top: 1px dashed #ccc;
          margin: 6px 0;
        }

        .ticket-label {
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #888;
          margin-bottom: 3px;
        }

        .ticket-items {
          margin-bottom: 6px;
        }

        .ticket-item {
          font-size: 13px;
          font-weight: 600;
          color: #000;
          line-height: 1.4;
        }

        .ticket-due {
          font-size: 12px;
          color: #333;
          margin-bottom: 6px;
        }

        .ticket-barcode {
          display: flex;
          justify-content: center;
          margin-bottom: 8px;
        }

        .ticket-barcode svg {
          max-width: 100%;
        }

        .ticket-qr-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ticket-qr-text {
          font-size: 11px;
          color: #555;
        }

        @media print {
          @page {
            size: 4in 6in;
            margin: 0;
          }

          body {
            margin: 0;
            padding: 0;
          }

          .no-print {
            display: none !important;
          }

          .ticket-page {
            width: 4in;
            padding: 0.15in;
          }
        }
      `}</style>
    </div>
  )
}