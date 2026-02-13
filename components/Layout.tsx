
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { COLORS } from '../constants';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  
  const getLinkClass = (path: string) => {
    const isActive = location.pathname === path;
    return `text-[10px] uppercase tracking-widest transition-opacity px-2 py-1 ${isActive ? 'text-[#76F3FF] font-bold border-b border-[#76F3FF]' : 'text-white/40'}`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0A] text-[#F2F2F2]">
      <header className="fixed top-0 left-0 w-full z-50 px-6 py-5 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/5 flex items-center justify-between">
        <h1 className="text-sm font-bold tracking-[0.2em] mono cursor-pointer" onClick={() => window.location.hash = '#/'}>
          NOIR<span style={{ color: COLORS.accent }}>VRS</span>
        </h1>
        
        <nav className="flex items-center gap-2">
          <Link to="/" className={getLinkClass('/')}>
            Verse
          </Link>
          <Link to="/reader" className={getLinkClass('/reader')}>
            Reader
          </Link>
          <Link to="/profile" className={getLinkClass('/profile')}>
            Profile
          </Link>
          <Link to="/help" className={getLinkClass('/help')}>
            Info
          </Link>
        </nav>
      </header>

      <main className="flex-grow pt-24 pb-12">
        {children}
      </main>
    </div>
  );
};

export default Layout;
