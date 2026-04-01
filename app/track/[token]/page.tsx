import { createServerClient } from '@/lib/supabase-server'
import Link from 'next/link'
import AticaLogo from '@/components/AticaLogo'

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
      <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-white/30 text-sm">Order not found</p>
          <Link href="/track" className="text-white/20 text-xs mt-2 block hover:text-white/40 transition">
            Search again
          </Link>
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
    inProgress > 0 || done > 0 ? 'in_progress' : 'received'

  const steps = [
    {
      key: 'received',
      label: 'Order received',
      sublabel: 'We have your order and will begin work shortly.',
      date: new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      done: true,
      active: overallStatus === 'received',
    },
    {
      key: 'in_progress',
      label: 'Alterations in progress',
      sublabel: done > 0 && done < total
        ? done + ' of ' + total + ' items completed.'
        : inProgress > 0 ? 'Our tailors are working on your items.'
        : 'Waiting to be assigned.',
      date: inProgress > 0 || done > 0 ? done + '/' + total + ' done' : null,
      done: inProgress > 0 || done > 0,
      active: overallStatus === 'in_progress',
    },
    {
      key: 'ready',
      label: 'Ready for pickup',
      sublabel: done === total && total > 0
        ? 'Your order is complete. Please come pick it up.'
        : 'Your order will be ready once all items are finished.',
      date: done === total && total > 0 ? 'Ready now' : null,
      done: done === total && total > 0,
      active: overallStatus === 'ready',
    },
    {
      key: 'picked_up',
      label: 'Picked up',
      sublabel: order.status === 'picked_up' ? 'Thank you for choosing Atica.' : 'Awaiting pickup.',
      date: order.status === 'picked_up' ? 'Complete' : null,
      done: order.status === 'picked_up',
      active: order.status === 'picked_up',
    },
  ]

  return (
    <div className="min-h-screen bg-[#0d0d14]">
      <div className="border-b border-white/5 px-5 py-4 flex items-center justify-between">
        <AticaLogo dark size="sm" />
        <Link href="/track" className="text-white/30 text-xs tracking-widest uppercase hover:text-white/60 transition">
          Back
        </Link>
      </div>

      <div className="max-w-lg mx-auto px-5 py-8 space-y-3">

        <div className="bg-white/[0.03] border border-white/8 rounded-3xl overflow-hidden">
          <div className="px-6 py-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-white/25 text-xs tracking-widest uppercase mb-1">
                  {order.shopify_order_number ?? 'Manual order'}
                </p>
                <h2 className="font-display text-2xl text-white">{order.customer_name}</h2>
                <p className="text-white/30 text-sm mt-0.5">{order.customer_phone}</p>
              </div>
              <div className="text-right">
                <p className="text-white/20 text-xs mb-1">Complete</p>
                <p className="font-display text-4xl text-white">{percent}%</p>
              </div>
            </div>
            <div className="h-px bg-white/8 rounded-full overflow-hidden">
              <div
                className="h-px bg-white/60 rounded-full transition-all duration-700"
                style={{ width: percent + '%' }}
              />
            </div>
          </div>
          <div className="px-6 py-3 border-t border-white/5 bg-white/[0.02]">
            <p className="text-xs text-white/30">
              {done === total && total > 0
                ? 'Your order is ready for pickup'
                : inProgress > 0 || done > 0
                ? done + ' of ' + total + ' items complete'
                : 'Order received — work beginning soon'}
            </p>
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/8 rounded-3xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <p className="text-xs text-white/40 uppercase tracking-widest">Order timeline</p>
          </div>
          <div className="px-5 py-5">
            {steps.map((step, idx) => (
              <div key={step.key} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                    step.active ? 'bg-white' :
                    step.done ? 'bg-white/15' :
                    'bg-white/5'
                  }`}>
                    {step.active ? (
                      <div className="w-2 h-2 bg-[#0d0d14] rounded-full" />
                    ) : step.done ? (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <div className="w-1.5 h-1.5 bg-white/15 rounded-full" />
                    )}
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`w-px my-1 ${step.done ? 'bg-white/15' : 'bg-white/5'}`} style={{ minHeight: 24 }} />
                  )}
                </div>
                <div className="pb-5 flex-1">
                  <div className="flex justify-between items-start">
                    <p className={`text-sm font-medium ${step.done || step.active ? 'text-white' : 'text-white/20'}`}>
                      {step.label}
                    </p>
                    {step.date && (
                      <span className="text-xs text-white/25 flex-shrink-0 ml-2">{step.date}</span>
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 leading-relaxed ${step.done || step.active ? 'text-white/35' : 'text-white/12'}`}>
                    {step.sublabel}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/8 rounded-3xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <p className="text-xs text-white/40 uppercase tracking-widest">Your items</p>
          </div>
          <div className="divide-y divide-white/5">
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
                    <p className={`text-sm font-medium ${item.status === 'done' ? 'line-through text-white/20' : 'text-white/80'}`}>
                      {item.alteration_type}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-white/25">
                        Due {new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                      {tailor && <p className="text-xs text-white/25">· {tailor}</p>}
                    </div>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full flex-shrink-0 ${
                    item.status === 'done' ? 'bg-emerald-500/10 text-emerald-400' :
                    item.status === 'in_progress' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-white/5 text-white/25'
                  }`}>
                    {item.status === 'done' ? 'Done' : item.status === 'in_progress' ? 'In progress' : 'Pending'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <p className="text-center text-xs text-white/10 pb-4 tracking-wider">
          ATICA TAILORING · NEW YORK
        </p>
      </div>
    </div>
  )
}