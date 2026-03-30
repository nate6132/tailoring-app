import { createServerClient } from '@/lib/supabase-server'
import PrintButton from './PrintButton'

export default async function PrintPage({ params }: { params: { orderId: string } }) {
  const supabase = createServerClient()

  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', params.orderId)
    .single()

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Order not found.</p>
      </div>
    )
  }

  const items = order.order_items || []

  return (
    <div>
      <div className="no-print flex gap-2 p-4 bg-gray-100 border-b">
        <PrintButton />
      </div>

      <div className="p-6 flex flex-wrap gap-6">
        {items.map((item: { id: string, alteration_type: string, barcode_id: string, due_date: string }) => (
          <div
            key={item.id}
            className="ticket border-2 border-black p-4 w-72 font-mono text-sm"
            style={{ pageBreakInside: 'avoid' }}
          >
            <div className="text-center font-bold text-lg mb-1">
              {order.shopify_order_number ?? 'Manual'}
            </div>
            <div className="border-t border-black my-2" />
            <div className="mb-1"><span className="font-bold">Name:</span> {order.customer_name}</div>
            <div className="mb-1"><span className="font-bold">Phone:</span> {order.customer_phone}</div>
            <div className="mb-1"><span className="font-bold">Item:</span> {item.alteration_type}</div>
            <div className="mb-3"><span className="font-bold">Due:</span> {new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
            <div className="border-t border-black my-2" />
            <div className="text-center mt-2">
              <svg id={'barcode-' + item.id} />
              <div className="text-xs mt-1 tracking-widest">{item.barcode_id}</div>
            </div>
          </div>
        ))}
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.onload = function() {
              const items = ${JSON.stringify(items)};
              items.forEach(item => {
                if (typeof JsBarcode !== 'undefined') {
                  JsBarcode('#barcode-' + item.id, item.barcode_id, {
                    format: 'CODE128',
                    width: 2,
                    height: 60,
                    displayValue: false
                  });
                }
              });
            }
          `
        }}
      />
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js" />

      <style>{`
        @media print {
          .no-print { display: none; }
          body { margin: 0; }
          .ticket { margin: 8px; }
        }
      `}</style>
    </div>
  )
}