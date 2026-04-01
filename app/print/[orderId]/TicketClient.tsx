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
    rush?: boolean
  }
  items: Item[]
  trackingUrl: string
}

export default function TicketClient({ order, items, trackingUrl }: Props) {
  const earliestDue = items.reduce((earliest, item) => {
    return item.due_date < earliest ? item.due_date : earliest
  }, items[0]?.due_date ?? '')

  const barcodeValue = order.shopify_order_number || items[0]?.barcode_id || 'ORDER'

  return (
    <div className="ticket-wrapper">
      <div className="ticket">
        {order.rush && (
          <div className="rush-banner">
            ⚡ RUSH ORDER
          </div>
        )}

        <div className="ticket-header">
          <div>
            <div className="ticket-order">{order.shopify_order_number ?? 'Manual'}</div>
            <div className="ticket-name">{order.customer_name}</div>
            <div className="ticket-phone">{order.customer_phone}</div>
          </div>
        </div>

        <div className="ticket-divider" />

        <div className="ticket-section-label">Alterations</div>
        <div className="ticket-items">
          {items.map((item, idx) => (
            <div key={item.id} className="ticket-item">
              {idx + 1}. {item.alteration_type}
            </div>
          ))}
        </div>

        <div className="ticket-divider" />

        <div className="ticket-due-row">
          <div>
            <div className="ticket-section-label">Due by</div>
            <div className={order.rush ? 'ticket-due-rush' : 'ticket-due'}>
              {new Date(earliestDue).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>

        <div className="ticket-divider" />

        <div className="ticket-section-label">Barcode</div>
        <div className="ticket-barcode">
          <Barcode
            value={barcodeValue}
            format="CODE128"
            width={1.8}
            height={55}
            displayValue={true}
            fontSize={11}
            margin={0}
            background="#ffffff"
            lineColor="#000000"
          />
        </div>

        <div className="ticket-divider" />

        <div className="ticket-qr-row">
          <QRCode value={trackingUrl} size={65} />
          <div className="ticket-qr-text">
            <div className="ticket-section-label">Track your order</div>
            <div className="ticket-url">{trackingUrl}</div>
          </div>
        </div>
      </div>

      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }

        .ticket-wrapper {
          width: 4in;
          padding: 0.12in;
          font-family: Arial, Helvetica, sans-serif;
          background: white;
        }

        .ticket {
          width: 100%;
        }

        .rush-banner {
          background: #000;
          color: #fff;
          font-size: 16px;
          font-weight: 900;
          text-align: center;
          padding: 6px 0;
          letter-spacing: 0.1em;
          margin-bottom: 10px;
          border-radius: 4px;
        }

        .ticket-header {
          margin-bottom: 8px;
        }

        .ticket-order {
          font-size: 11px;
          color: #888;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 2px;
        }

        .ticket-name {
          font-size: 20px;
          font-weight: 700;
          color: #000;
          line-height: 1.1;
        }

        .ticket-phone {
          font-size: 12px;
          color: #555;
          margin-top: 2px;
        }

        .ticket-divider {
          border-top: 1px dashed #ccc;
          margin: 8px 0;
        }

        .ticket-section-label {
          font-size: 8px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #999;
          margin-bottom: 4px;
          font-weight: 600;
        }

        .ticket-items {
          margin-bottom: 2px;
        }

        .ticket-item {
          font-size: 13px;
          font-weight: 600;
          color: #000;
          line-height: 1.5;
        }

        .ticket-due-row {
          margin-bottom: 2px;
        }

        .ticket-due {
          font-size: 14px;
          font-weight: 700;
          color: #000;
        }

        .ticket-due-rush {
          font-size: 16px;
          font-weight: 900;
          color: #000;
          text-decoration: underline;
        }

        .ticket-barcode {
          display: flex;
          justify-content: center;
          margin-bottom: 2px;
        }

        .ticket-barcode svg {
          max-width: 100%;
        }

        .ticket-qr-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 2px;
        }

        .ticket-qr-text {
          flex: 1;
        }

        .ticket-url {
          font-size: 8px;
          color: #888;
          word-break: break-all;
          margin-top: 2px;
        }

        @media print {
          @page {
            size: 4in 6in;
            margin: 0;
          }
          body { margin: 0; padding: 0; background: white; }
          .no-print { display: none !important; }
          .ticket-wrapper { width: 4in; padding: 0.12in; }
        }
      `}</style>
    </div>
  )
}