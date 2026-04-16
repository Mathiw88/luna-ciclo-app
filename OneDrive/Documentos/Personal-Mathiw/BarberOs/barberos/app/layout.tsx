import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'BarberOS - Sistema de Gestión para Barberías',
  description: 'Sistema completo de gestión para barberías con reservas online',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.variable}>
        {children}
        <Toaster
          position="top-right"
          theme="dark"
          toastOptions={{
            style: {
              background: '#1a1a1a',
              border: '0.5px solid #2e2e2e',
              color: '#e0e0e0',
              fontSize: '13px',
            },
            className: 'sonner-toast',
          }}
        />
      </body>
    </html>
  )
}
