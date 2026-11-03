import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { FinanceProvider } from '@/context/FinanceContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'FinControl - Gestão Financeira Pessoal com IA',
  description: 'Central moderna de controle financeiro, investimentos, prejuízos e automação de extratos com IA.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-screen bg-slate-50/60 text-slate-900 flex flex-col font-sans">
        <FinanceProvider>{children}</FinanceProvider>
      </body>
    </html>
  );
}
