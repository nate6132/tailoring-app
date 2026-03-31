import { createServerClient } from '@/lib/supabase-server'

export default async function TrackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = createServerClient()

  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(*, job_assignments(*, tailors(*)))')
    .eq('tracking_token', token)
    .single()

  if (!order) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="#9CA3AF" strokeWidth="1.75"/>
              <path d="M12 8v4M12 16h.01" stroke="#9CA3AF" strokeWidth="1.75" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-1">Order not found</h1>
          <p className="text-sm text-gray-400">This tracking link may be invalid or expired.</p>
        </div>
      </div>
    )
  }

  const items = order.order_items || []
  const done = items.filter((i: { status: string }) => i.status === 'done').length
  const inProgress = items.filter((i: { status: string }) => i.status === 'in_progress').length
  const total = items.length
  const percent = total ? Math.round((done / total) * 100) : 0

  const overallStatus =
    done === total && total > 0 ? 'ready' :
    inProgress > 0 || done > 0 ? 'in_progress' :
    'received'

  const steps = [
    {
      key: 'received',
      label: 'Order received',
      sublabel: 'We have your order and are getting started.',
      date: new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      done: true,
      active: overallStatus === 'received',
    },
    {
      key: 'in_progress',
      label: 'Work in progress',
      sublabel: done > 0 && done < total
        ? done + ' of ' + total + ' items completed so far.'
        : inProgress > 0
        ? 'Our tailors are working on your items.'
        : 'Waiting to be assigned to a tailor.',
      date: inProgress > 0 || done > 0 ? done + '/' + total + ' done' : null,
      done: inProgress > 0 || done > 0,
      active: overallStatus === 'in_progress',
    },
    {
      key: 'ready',
      label: 'Ready for pickup',
      sublabel: done === total && total > 0
        ? 'Your order is complete — please come pick it up!'
        : 'Your order will be ready once all items are complete.',
      date: done === total && total > 0 ? 'Ready now' : null,
      done: done === total && total > 0,
      active: overallStatus === 'ready',
    },
    {
      key: 'picked_up',
      label: 'Picked up',
      sublabel: order.status === 'picked_up' ? 'Order complete. Thank you!' : 'Waiting for pickup.',
      date: order.status === 'picked_up' ? 'Complete' : null,
      done: order.status === 'picked_up',
      active: order.status === 'picked_up',
    },
  ]

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 6h8M4 8h5M4 10h6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <rect x="2" y="3" width="12" height="10" rx="2" stroke="white" strokeWidth="1.5"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-tight">Order tracking</p>
            <p className="text-xs text-gray-400 leading-tight">{order.shopify_order_number ?? 'Manual order'}</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-blue-600 px-6 py-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-blue-200 text-xs font-medium uppercase tracking-wide mb-1">Customer</p>
                <h2 className="text-xl font-bold text-white">{order.customer_name}</h2>
                <p className="text-blue-200 text-sm mt-0.5">{order.customer_phone}</p>
              </div>
              <div className="text-right">
                <p className="text-blue-200 text-xs mb-1">Progress</p>
                <p className="text-white text-3xl font-bold">{percent}%</p>
              </div>
            </div>
            <div className="mt-4 h-1.5 bg-blue-500/50 rounded-full overflow-hidden">
              <div
                className="h-1.5 bg-white rounded-full transition-all duration-700"
                style={{ width: percent + '%' }}
              />
            </div>
          </div>
          <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
            <p className="text-xs text-blue-600 font-medium">
              {done === total && total > 0
                ? 'Your order is ready for pickup!'
                : inProgress > 0 || done > 0
                ? done + ' of ' + total + ' items complete — work in progress'
                : 'Your order has been received and will begin soon'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Tracking updates</p>
          </div>
          <div className="px-5 py-4">
            {steps.map((step, idx) => (
              <div key={step.key} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                    step.active
                      ? 'bg-blue-600'
                      : step.done
                      ? 'bg-blue-100'
                      : 'bg-gray-100'
                  }`}>
                    {step.active ? (
                      <div className="w-2.5 h-2.5 bg-white rounded-full" />
                    ) : step.done ? (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2.5 7L5.5 10L11.5 4" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <div className="w-2.5 h-2.5 bg-gray-300 rounded-full" />
                    )}
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`w-0.5 my-1 ${step.done ? 'bg-blue-200' : 'bg-gray-100'}`} style={{ minHeight: 28 }} />
                  )}
                </div>
                <div className="pb-5 flex-1">
                  <div className="flex justify-between items-start">
                    <p className={`text-sm font-semibold ${step.done || step.active ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                    {step.date && (
                      <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{step.date}</span>
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 ${step.done || step.active ? 'text-gray-500' : 'text-gray-300'}`}>
                    {step.sublabel}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">Your items</p>
          </div>
          <div className="divide-y divide-gray-100">
            {items.map((item: {
              id: string
              alteration_type: string
              status: string
              due_date: string
              job_assignments?: { tailors?: { name: string } } | { tailors?: { name: string } }[]
            }) => {
              const assignment = Array.isArray(item.job_assignments)
                ? item.job_assignments[0]
                : item.job_assignments
              const tailor = assignment?.tailors?.name
              return (
                <div key={item.id} className="px-5 py-4 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${item.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {item.alteration_type}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <p className="text-xs text-gray-400">
                        Due {new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                      {tailor && (
                        <span className="text-xs text-blue-500">· {tailor}</span>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${
                    item.status === 'done'
                      ? 'bg-green-50 text-green-600 border border-green-100'
                      : item.status === 'in_progress'
                      ? 'bg-yellow-50 text-yellow-600 border border-yellow-100'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {item.status === 'done' ? 'Done' : item.status === 'in_progress' ? 'In progress' : 'Pending'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 pb-4">
          Updates automatically as your order progresses
        </p>

      </div>
    </div>
  )
}