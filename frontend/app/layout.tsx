import type { Metadata } from 'next';
import './globals.css';
import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'AgenticPay | Autonomous AI Agent Crypto Micro-Transactions & Policy Firewall',
  description: 'Non-custodial, policy-enforced programmatic wallets for autonomous AI agents on Base Sepolia using Circle Programmable Wallets and Supabase.',
  keywords: ['AI agents', 'Web3', 'Circle', 'Base Sepolia', 'Agentic Payments', 'Supabase'],
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen antialiased bg-[#07090E] text-[#F3F0FF] selection:bg-cyan-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
