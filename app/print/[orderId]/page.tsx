import { createServerClient } from '@/lib/supabase-server'
import PrintButton from './PrintButton'
import TicketClient from './TicketClient'

export default async function PrintPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const supabase = createServerClient()

  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', orderId)
    .single()

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Order not found.</p>
      </div>
    )
  }

  const items = order.order_items || []
  const trackingUrl = process.env.NEXT_PUBLIC_APP_URL + '/track/' + order.tracking_token

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="no-print bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-gray-900">Print tickets</h1>
          <p className="text-sm text-gray-400">
            {order.customer_name} · {order.shopify_order_number ?? 'Manual'} · {items.length} items
          </p>
        </div>
        <PrintButton />
      </div>

      <TicketClient
        order={{
          customer_name: order.customer_name,
          customer_phone: order.customer_phone,
          shopify_order_number: order.shopify_order_number,
        }}
        items={items}
        trackingUrl={trackingUrl}
      />

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; margin: 0; padding: 0; }
          .ticket {
            border: 1px solid #e5e7eb !important;
            box-shadow: none !important;
            border-radius: 8px !important;
            margin: 8px;
            width: 300px !important;
          }
        }
      `}</style>
    </div>
  )
}