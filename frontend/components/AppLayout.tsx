'use client';

import React from 'react';
import Navbar from './Navbar';

interface AppLayoutProps {
  children: React.ReactNode;
  showNavbar?: boolean;
  className?: string;
  containerMaxWidth?: string;
}

export default function AppLayout({
  children,
  showNavbar = true,
  className = '',
  containerMaxWidth = 'max-w-7xl',
}: AppLayoutProps) {
  return (
    <div className={`relative min-h-screen bg-[#07090E] text-[#F3F0FF] ${className}`}>
      {/* Top Background Radial Atmosphere */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[420px] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(139,92,246,0.22),rgba(7,9,14,0))] blur-2xl pointer-events-none -z-10" />

      {/* Unified Top Navigation */}
      {showNavbar && <Navbar />}

      {/* Page Content Container */}
      <div className={`mx-auto ${containerMaxWidth}`}>
        {children}
      </div>
    </div>
  );
}
