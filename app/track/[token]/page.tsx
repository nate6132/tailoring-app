import { createServerClient } from '@/lib/supabase-server'

export default async function TrackPage({ params }: { params: { token: string } }) {
  const supabase = createServerClient()

  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('tracking_token', params.token)
    .single()

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Order not found</h1>
          <p className="text-gray-500">This tracking link may be invalid.</p>
        </div>
      </div>
    )
  }

  const items = order.order_items || []
  const done = items.filter((i: { status: string }) => i.status === 'done').length
  const total = items.length
  const percent = total ? Math.round((done / total) * 100) : 0

  const statusMessages: Record<string, string> = {
    received: 'We have received your order and will begin work soon.',
    in_progress: 'Your alterations are currently in progress.',
    ready: 'Your order is ready for pickup!',
    picked_up: 'Your order has been picked up. Thank you!',
  }

  const statusColors: Record<string, string> = {
    received: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    ready: 'bg-green-100 text-green-700',
    picked_up: 'bg-blue-100 text-blue-700',
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-lg mx-auto">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Order Tracking</h1>
          <p className="text-gray-500 text-sm mt-1">{order.shopify_order_number ?? 'Manual Order'}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-4">
          <div className="bg-blue-600 text-white px-6 py-4">
            <h2 className="text-xl font-bold">{order.customer_name}</h2>
            <p className="text-blue-100 text-sm mt-1">{statusMessages[order.status]}</p>
          </div>

          <div className="px-6 py-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-500">Overall progress</span>
              <span className="text-sm font-medium text-gray-700">{done}/{total} complete</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-3 bg-green-500 rounded-full transition-all duration-500"
                style={{ width: percent + '%' }}
              />
            </div>
          </div>

          <div className="px-6 pb-2">
            <span className={'text-xs font-medium px-2 py-1 rounded-full ' + statusColors[order.status]}>
              {order.status.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Your items</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {items.map((item: { id: string, alteration_type: string, status: string, due_date: string }) => (
              <div key={item.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className={'font-medium ' + (item.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800')}>
                    {item.alteration_type}
                  </p>
                  <p className="text-sm text-gray-400">
                    Due {new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <span className={'text-xs font-medium px-2 py-1 rounded-full ' + (
                  item.status === 'done'
                    ? 'bg-green-100 text-green-700'
                    : item.status === 'in_progress'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-600'
                )}>
                  {item.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          This page updates automatically as your order progresses.
        </p>

      </div>
    </div>
  )
}