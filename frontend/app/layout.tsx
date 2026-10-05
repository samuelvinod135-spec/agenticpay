import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Agentic Payments | Autonomous AI Agent Crypto Micro-Transactions',
  description: 'Non-custodial, policy-enforced programmatic wallets for autonomous AI agents on Base Sepolia using Circle Programmable Wallets and Supabase.',
  keywords: ['AI agents', 'Web3', 'Circle', 'Base Sepolia', 'Agentic Payments', 'Supabase'],
  authors: [{ name: 'Agentic Payments MVP Team' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased selection:bg-blue-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
