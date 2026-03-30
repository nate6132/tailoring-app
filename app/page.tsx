import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default async function Home() {
  const cookieStore = await cookies()
  const role = cookieStore.get('role')?.value
  if (role === 'admin') redirect('/admin')
  if (role === 'tailor') redirect('/tailor')
  redirect('/login')
}