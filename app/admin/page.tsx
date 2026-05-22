import { cookies } from 'next/headers'
import AdminLogin from './AdminLogin'
import AdminDashboard from './AdminDashboard'

export const metadata = { title: 'Takefyy Admin' }

export default async function AdminPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  const secret = process.env.ADMIN_SECRET
  const isAuthed = !!secret && token === secret
  return isAuthed ? <AdminDashboard /> : <AdminLogin />
}
