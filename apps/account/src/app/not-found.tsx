import Link from 'next/link'
import { AuthLayout } from '@/components/AuthLayout'

export default function NotFound() {
  return (
    <AuthLayout title="Page not found" lede="The page you asked for doesn’t exist in your TensaCo account." below={<a href="https://tensaco.ai">Go to tensaco.ai</a>}>
      <Link href="/" style={{ fontWeight: 600, textDecoration: 'none' }}>Go to your account →</Link>
    </AuthLayout>
  )
}
