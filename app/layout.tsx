import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TimeTracker',
  description: 'Gestion du temps par projet',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#f8fafc' }}>
        {children}
      </body>
    </html>
  )
}
