import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { TooltipProvider } from "@/components/ui/tooltip"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const SITE_URL = "https://gosabun.pages.dev"

export const metadata: Metadata = {
  title: "gosabun - テキスト差分比較",
  description: "サーバー送信なし。ブラウザ完結のテキスト差分比較ツール",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "gosabun - テキスト差分比較",
    description: "サーバー送信なし。ブラウザ完結のテキスト差分比較ツール",
    type: "website",
    url: SITE_URL,
    locale: "ja_JP",
    images: [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "gosabun - テキスト差分比較",
    description: "サーバー送信なし。ブラウザ完結のテキスト差分比較ツール",
    images: [`${SITE_URL}/og-image.png`],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex min-h-screen flex-col`}
      >
        <TooltipProvider>
          <main className="flex-1">{children}</main>
          <footer className="py-4 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} gosabun
          </footer>
        </TooltipProvider>
      </body>
    </html>
  )
}
