// app/layout.tsx (Example)

import './globals.css'
import Layout from '@/components/layout' // Adjust path if necessary

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {/* All pages (children) will be wrapped by your Layout component */}
        <Layout>{children}</Layout>
      </body>
    </html>
  )
}