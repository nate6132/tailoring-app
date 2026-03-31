'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

const navItems = [
  {
    href: '/admin',
    label: 'Orders',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M4.5 6.75h9M4.5 9h6M4.5 11.25h7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <rect x="2" y="3" width="14" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    href: '/admin/jobs',
    label: 'Job board',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M6 9l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="2" y="3" width="14" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    href: '/admin/tailors',
    label: 'Tailors',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M3 15c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/admin/locations',
    label: 'Locations',
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 9.75a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M9 2.25C6.1 2.25 3.75 4.6 3.75 7.5c0 4.125 5.25 8.25 5.25 8.25s5.25-4.125 5.25-8.25c0-2.9-2.35-5.25-5.25-5.25z" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  async function logout() {
    await fetch('/api/auth/logout?full=true', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex">
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-100 fixed top-0 left-0 h-full z-10">
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 6h8M4 8h5M4 10h6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <rect x="2" y="3" width="12" height="10" rx="2" stroke="white" strokeWidth="1.5"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-tight">Tailor Manager</p>
              <p className="text-xs text-gray-400">Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className={active ? 'text-white' : 'text-gray-400'}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition w-full"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M6.75 15.75H3.75a1.5 1.5 0 01-1.5-1.5V3.75a1.5 1.5 0 011.5-1.5h3M12 12.75L15.75 9 12 5.25M15.75 9H6.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 md:ml-56 pb-20 md:pb-0">
        {children}
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-10 px-2 py-2">
        <div className="flex items-center justify-around">
          {navItems.map(item => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all ${
                  active ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                {item.icon}
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}