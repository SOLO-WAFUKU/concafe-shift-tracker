/**
 * Next.js App Router レイアウト
 * アプリケーション全体の基盤設定とプロバイダー
 */

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ConCafe Shift Tracker - 秋葉原コンカフェ出勤情報',
  description: '秋葉原エリアのコンカフェ嬢出勤情報を自動集約。今日の出勤情報をリアルタイムでチェック！',
  keywords: ['コンカフェ', '秋葉原', 'メイドカフェ', '出勤情報', 'シフト'],
  authors: [{ name: 'ConCafe Shift Tracker' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'ConCafe Shift Tracker',
    description: '秋葉原エリアのコンカフェ嬢出勤情報を自動集約',
    type: 'website',
    locale: 'ja_JP',
    siteName: 'ConCafe Shift Tracker',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'ConCafe Shift Tracker'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ConCafe Shift Tracker',
    description: '秋葉原エリアのコンカフェ嬢出勤情報を自動集約',
    images: ['/og-image.jpg']
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png'
  },
  manifest: '/manifest.json'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <meta name="theme-color" content="#EC4899" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}