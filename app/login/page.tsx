import { Suspense } from 'react'
import LoginClient from './LoginClient'

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center">
        <p className="text-white/30 text-sm">Loading...</p>
      </div>
    }>
      <LoginClient />
    </Suspense>
  )
}