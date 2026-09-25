import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const sans = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--f-sans', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL('https://account.tensaco.ai/'),
  title: { default: 'TensaCo Account', template: '%s · TensaCo Account' },
  description: 'Sign in to your TensaCo account: support, service requests and applications.',
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
  robots: { index: false, follow: false },
}

export const viewport: Viewport = { themeColor: '#0a1f44' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sans.variable}>
      <body>{children}</body>
    </html>
  )
}
