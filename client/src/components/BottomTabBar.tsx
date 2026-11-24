import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sparkles, Clock, Ticket, Users, X, LayoutDashboard, Tv, Settings } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export const BottomTabBar: React.FC = () => {
  const location = useLocation();
  const { language } = useLanguage();
  const [showStaffMenu, setShowStaffMenu] = useState(false);

  if (location.pathname === '/display') return null;

  const isHome   = location.pathname === '/';
  const isJoin   = location.pathname === '/join';
  const isStatus = location.pathname.startsWith('/status');

  const staffLinks = [
    { to: '/reception',   label: language === 'gu' ? 'રિસેપ્શન'       : 'Reception Dashboard',         icon: LayoutDashboard },
    { to: '/barber/Ravi', label: language === 'gu' ? 'વાળંદ સ્ક્રીન'  : 'Stylist Console (Ravi)',       icon: Users },
    { to: '/display',     label: language === 'gu' ? 'ટીવી ડિસ્પ્લે'  : 'Waiting Area TV (1080p)',      icon: Tv },
    { to: '/admin',       label: language === 'gu' ? 'માલિક સેટિંગ્સ' : 'Owner Admin Settings',         icon: Settings },
  ];

  const getTabStyle = (active: boolean) => ({
    color: active ? 'var(--primary)' : 'var(--text-muted)',
    fontWeight: active ? 700 : 500,
  });

  return (
    <>
      {/* Mobile Bottom Tab Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
        style={{
          background: 'rgba(255,255,255,0.97)',
          borderTop: '1px solid var(--border-soft)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.05)',
        }}
      >
        <div className="grid grid-cols-4 h-16">

          {/* Home */}
          <Link to="/" onClick={() => setShowStaffMenu(false)} className="flex flex-col items-center justify-center gap-1 transition-colors" style={getTabStyle(isHome)}>
            <Sparkles className={`w-5 h-5 ${isHome ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[11px]">{language === 'gu' ? 'હોમ' : 'Home'}</span>
          </Link>

          {/* Join */}
          <Link to="/join" onClick={() => setShowStaffMenu(false)} className="flex flex-col items-center justify-center gap-1 transition-colors" style={getTabStyle(isJoin)}>
            <Clock className={`w-5 h-5 ${isJoin ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[11px]">{language === 'gu' ? 'જોડાઓ' : 'Join'}</span>
          </Link>

          {/* Status */}
          <Link to="/status/1" onClick={() => setShowStaffMenu(false)} className="flex flex-col items-center justify-center gap-1 transition-colors" style={getTabStyle(isStatus)}>
            <Ticket className={`w-5 h-5 ${isStatus ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[11px]">{language === 'gu' ? 'સ્ટેટસ' : 'Status'}</span>
          </Link>

          {/* Staff Menu */}
          <button
            type="button"
            onClick={() => setShowStaffMenu(!showStaffMenu)}
            className="flex flex-col items-center justify-center gap-1 transition-colors"
            style={getTabStyle(showStaffMenu)}
          >
            <Users className="w-5 h-5" />
            <span className="text-[11px]">{language === 'gu' ? 'સ્ટાફ ▾' : 'Staff ▾'}</span>
          </button>
        </div>
      </nav>

      {/* Staff Drawer */}
      {showStaffMenu && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end" style={{ background: 'rgba(17,24,39,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-t-3xl border-t p-6 space-y-4 shadow-2xl" style={{ borderColor: 'var(--border-soft)' }}>
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-soft)' }}>
              <span className="section-label">{language === 'gu' ? 'સ્ટાફ &amp; ઓપરેશન્સ' : 'Staff & Operations Console'}</span>
              <button type="button" onClick={() => setShowStaffMenu(false)} className="p-1 rounded-full" style={{ color: '#9CA3AF' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {staffLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setShowStaffMenu(false)}
                    className="flex items-center gap-3 p-3.5 rounded-xl font-semibold text-sm transition-all"
                    style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--border-accent)' }}
                  >
                    <Icon className="w-5 h-5" style={{ color: 'var(--primary)' }} />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
