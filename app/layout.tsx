import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'DEWA Web3 DApp',
  description: 'Futuristic Web3 DApp with ERC20 & ERC721 support',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: 'rgba(0, 0, 0, 0.8)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(20px)',
              },
              success: {
                iconTheme: {
                  primary: '#00d4ff',
                  secondary: '#000',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ff1744',
                  secondary: '#000',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}


