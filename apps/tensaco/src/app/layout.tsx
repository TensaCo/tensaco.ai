import type { Metadata, Viewport } from 'next'
import { Newsreader, Inter, IBM_Plex_Mono } from 'next/font/google'
import './globals.css'

const serif = Newsreader({ subsets: ['latin'], weight: ['300', '400', '500'], style: ['normal', 'italic'], variable: '--f-serif', display: 'swap' })
const sans = Inter({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--f-sans', display: 'swap' })
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--f-mono', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL('https://tensaco.ai/'),
  title: 'TensaCo — we are building artificial superintelligence',
  description: 'TensaCo Inc. is a company of companies, each removing one limit between today’s AI and superintelligence: PHASER (optical compute) and TensorCode (AI your team can check, correct, and own).',
  openGraph: { title: 'TensaCo', description: 'We are building artificial superintelligence.', images: ['og.png'] },
  twitter: { card: 'summary_large_image', site: '@TensacoInc', title: 'TensaCo', description: 'We are building artificial superintelligence.', images: ['og.png'] },
}

export const viewport: Viewport = { themeColor: '#ffffff', colorScheme: 'light' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
