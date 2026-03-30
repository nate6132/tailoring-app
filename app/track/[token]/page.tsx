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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order not found</h1>
          <p className="text-gray-500">This tracking link may be invalid.</p>
        </div>
      </div>
    )
  }

  const items = order.order_items || []
  const done = items.filter((i: { status: string }) => i.status === 'done').length
  const inProgress = items.filter((i: { status: string }) => i.status === 'in_progress').length
  const total = items.length
  const percent = total ? Math.round((done / total) * 100) : 0

  const steps = [
    {
      key: 'received',
      label: 'Order received',
      description: 'We have your order and are getting started.',
      date: new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      done: true,
    },
    {
      key: 'claimed',
      label: 'Assigned to tailor',
      description: inProgress > 0 || done > 0
        ? 'Your items have been assigned to our tailors.'
        : 'Waiting to be assigned to a tailor.',
      date: inProgress > 0 || done > 0 ? 'In progress' : null,
      done: inProgress > 0 || done > 0,
    },
    {
      key: 'in_progress',
      label: 'Work in progress',
      description: done > 0 && done < total
        ? `${done} of ${total} items completed so far.`
        : done === total
        ? 'All items have been completed.'
        : 'Our tailors are working on your items.',
      date: inProgress > 0 || done > 0 ? `${done}/${total} done` : null,
      done: inProgress > 0 || done > 0,
    },
    {
      key: 'ready',
      label: 'Ready for pickup',
      description: done === total
        ? 'Your order is ready! Please come pick it up.'
        : 'Your order will be ready once all items are complete.',
      date: done === total ? 'Ready now' : null,
      done: done === total,
    },
    {
      key: 'picked_up',
      label: 'Picked up',
      description: order.status === 'picked_up'
        ? 'Order complete. Thank you!'
        : 'Waiting for pickup.',
      date: order.status === 'picked_up' ? 'Complete' : null,
      done: order.status === 'picked_up',
    },
  ]

  const currentStep = steps.filter(s => s.done).length - 1

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-6 py-5">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 6h8M4 8h5M4 10h6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <rect x="2" y="3" width="12" height="10" rx="2" stroke="white" strokeWidth="1.5"/>
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900">Tailor Manager</h1>
              <p className="text-xs text-gray-400">Order tracking</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-blue-600 px-6 py-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-200 text-xs font-medium uppercase tracking-wide mb-1">
                  {order.shopify_order_number ?? 'Manual order'}
                </p>
                <h2 className="text-xl font-bold text-white">{order.customer_name}</h2>
                <p className="text-blue-200 text-sm mt-0.5">{order.customer_phone}</p>
              </div>
              <div className="text-right">
                <p className="text-blue-200 text-xs mb-1">Progress</p>
                <p className="text-white text-2xl font-bold">{percent}%</p>
              </div>
            </div>
            <div className="mt-4 h-1.5 bg-blue-500 rounded-full overflow-hidden">
              <div
                className="h-1.5 bg-white rounded-full transition-all duration-700"
                style={{ width: percent + '%' }}
              />
            </div>
          </div>

          <div className="px-6 py-2 bg-blue-50 border-b border-blue-100">
            <p className="text-xs text-blue-600 font-medium py-1.5">
              {done === total && total > 0
                ? 'Your order is ready for pickup!'
                : inProgress > 0 || done > 0
                ? `${done} of ${total} items complete — work in progress`
                : 'Your order has been received and will begin soon'}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Tracking updates</h3>
          </div>
          <div className="px-6 py-4">
            {steps.map((step, idx) => (
              <div key={step.key} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    step.done
                      ? idx === currentStep
                        ? 'bg-blue-600'
                        : 'bg-blue-100'
                      : 'bg-gray-100'
                  }`}>
                    {step.done ? (
                      idx === currentStep ? (
                        <div className="w-2.5 h-2.5 bg-white rounded-full" />
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M2.5 7L5.5 10L11.5 4" stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )
                    ) : (
                      <div className="w-2.5 h-2.5 bg-gray-300 rounded-full" />
                    )}
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`w-0.5 flex-1 my-1 ${step.done ? 'bg-blue-200' : 'bg-gray-100'}`} style={{ minHeight: 24 }} />
                  )}
                </div>
                <div className="pb-6 flex-1">
                  <div className="flex justify-between items-start">
                    <p className={`text-sm font-semibold ${step.done ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.label}
                    </p>
                    {step.date && (
                      <span className="text-xs text-gray-400">{step.date}</span>
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 ${step.done ? 'text-gray-500' : 'text-gray-300'}`}>
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Item details</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {items.map((item: {
              id: string
              alteration_type: string
              status: string
              due_date: string
              job_assignments?: { tailors?: { name: string } }[]
            }) => {
              const tailor = item.job_assignments?.[0]?.tailors?.name
              return (
                <div key={item.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${item.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {item.alteration_type}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-gray-400">
                        Due {new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                      {tailor && (
                        <p className="text-xs text-blue-500">· {tailor}</p>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${
                    item.status === 'done'
                      ? 'bg-green-100 text-green-700'
                      : item.status === 'in_progress'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {item.status === 'done' ? 'Done' : item.status === 'in_progress' ? 'In progress' : 'Pending'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 pb-6">
          Updates automatically as your order progresses
        </p>

      </div>
    </div>
  )
}