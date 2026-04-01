'use client'

export default function LogoutButton({ full = false, label = 'Sign out' }: { full?: boolean, label?: string }) {
  async function logout() {
    await fetch('/api/auth/logout' + (full ? '?full=true' : ''), { method: 'POST' })
    window.location.href = full ? '/login' : '/login/pin'
  }

  return (
    <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition w-full">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M6.75 15.75H3.75a1.5 1.5 0 01-1.5-1.5V3.75a1.5 1.5 0 011.5-1.5h3M12 12.75L15.75 9 12 5.25M15.75 9H6.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {label}
    </button>
  )
}