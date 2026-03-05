import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "gosabun - テキスト差分比較",
  description: "difff互換のクライアント完結テキスト差分比較ツール",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex min-h-screen flex-col`}
      >
        <main className="flex-1">{children}</main>
        <footer className="py-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} gosabun
        </footer>
      </body>
    </html>
  )
}
