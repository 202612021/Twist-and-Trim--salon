import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Scissors, Globe, Clock, Tv, Users,
  LayoutDashboard, Settings, Sparkles,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export const Navbar: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();

  if (location.pathname === '/display') {
    return (
      <div className="border-b px-6 py-2.5 flex items-center justify-between text-xs" style={{ background: '#022C22', borderColor: 'rgba(52,211,153,0.2)', color: 'rgba(255,255,255,0.6)' }}>
        <span className="flex items-center gap-2 font-medium">
          <Tv className="w-4 h-4" style={{ color: '#F59E0B' }} />
          <span>Twist &amp; Trim · TV Waiting Lounge Display (1920×1080)</span>
        </span>
        <Link to="/" className="font-bold flex items-center gap-1.5 transition-colors" style={{ color: '#F59E0B' }}>
          Exit to Main App &rarr;
        </Link>
      </div>
    );
  }

  const navLinks = [
    { to: '/',             label: 'Home',        icon: Sparkles },
    { to: '/join',         label: 'Join Queue',  icon: Clock },
    { to: '/reception',    label: 'Reception',   icon: LayoutDashboard },
    { to: '/barber/Ravi',  label: 'Barber View', icon: Users },
    { to: '/display',      label: 'TV Display',  icon: Tv },
    { to: '/admin',        label: 'Owner Admin', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/97 backdrop-blur-md border-b shadow-sm" style={{ borderColor: 'var(--border-soft)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md transition-all group-hover:scale-105"
              style={{ background: 'var(--primary)', boxShadow: '0 4px 14px rgba(45,106,79,0.3)' }}
            >
              <Scissors className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight" style={{ color: 'var(--text-heading)' }}>
                  Twist &amp; Trim
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--border-accent)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  {t('openBadge')}
                </span>
              </div>
              <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>Professional Salon &amp; Queue System</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-1 p-1.5 rounded-xl border" style={{ background: '#F9FAFB', borderColor: 'var(--border-soft)' }}>
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to || (link.to !== '/' && location.pathname.startsWith(link.to.split('/').slice(0, 2).join('/')));
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all"
                  style={
                    isActive
                      ? { background: 'var(--primary)', color: '#FFFFFF', boxShadow: '0 2px 8px rgba(45,106,79,0.25)' }
                      : { color: 'var(--text-muted)' }
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'gu' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all min-h-[38px]"
            style={{ border: '1px solid var(--border-soft)', background: '#FFFFFF', color: 'var(--text-body)', boxShadow: 'var(--shadow-sm)' }}
            title="Toggle English / Gujarati"
          >
            <Globe className="w-4 h-4" style={{ color: 'var(--primary)' }} />
            {language === 'en' ? 'ગુજરાતી' : 'English'}
          </button>
        </div>
      </div>
    </header>
  );
};
