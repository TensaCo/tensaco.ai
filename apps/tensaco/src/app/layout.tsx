import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import './globals.css'

const sans = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--f-sans', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL('https://tensaco.ai/'),
  title: { default: 'TensaCo — Intelligence infrastructure for the enterprise', template: '%s — TensaCo' },
  description: 'TensaCo builds the compute and software that make AI faster, more efficient and accountable: PHASER optical AI acceleration and TensorCode accountable AI software.',
  openGraph: { siteName: 'TensaCo', images: ['og.jpg'] },
  twitter: { card: 'summary_large_image', site: '@TensacoInc', images: ['og.jpg'] },
}

export const viewport: Viewport = { themeColor: '#0a1f44' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sans.variable}>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
