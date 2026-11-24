import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock, ChevronRight, AlertCircle, Star, Users,
  CheckCircle2, Sparkles, Scissors, Zap, Shield, Smartphone,
} from 'lucide-react';
import { api } from '../services/api';
import { socket } from '../services/socket';
import type { SalonOverview } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

/* ── Feature highlight data ── */
const FEATURES = [
  {
    icon: <Smartphone className="w-6 h-6" style={{ color: 'var(--primary)' }} />,
    titleEn: 'Book from Your Phone',
    titleGu: 'ફોનથી બુક કરો',
    descEn: 'Join the queue remotely — no need to wait at the salon.',
    descGu: 'ઘરેથી જ નંબર લો — સલૂનમાં ઊભા ન રહો.',
  },
  {
    icon: <Zap className="w-6 h-6" style={{ color: 'var(--accent)' }} />,
    titleEn: 'Live Queue Updates',
    titleGu: 'લાઇવ કતાર અપડેટ',
    descEn: 'Real-time notifications when your turn is approaching.',
    descGu: 'તમારો વારો આવે ત્યારે તુરત સૂચના.',
  },
  {
    icon: <Shield className="w-6 h-6" style={{ color: '#1D4ED8' }} />,
    titleEn: 'Zero App Download',
    titleGu: 'કોઈ ઐપ ડાઉનલોડ નહીં',
    descEn: 'Works in any mobile browser. Instant access, always.',
    descGu: 'કોઈ પણ બ્રાઉઝરમાં ચાલે — ઐપ જોઈતી નથી.',
  },
];

const SERVICES_PREVIEW = [
  { emoji: '✂️', label: 'Haircut', labelGu: 'વાળ કાપવા', from: '₹80' },
  { emoji: '🧔', label: 'Beard Style', labelGu: 'દાઢી', from: '₹60' },
  { emoji: '💆', label: 'Head Massage', labelGu: 'માથાની મસાજ', from: '₹100' },
  { emoji: '🧴', label: 'Hair Treatment', labelGu: 'ટ્રીટમેન્ટ', from: '₹200' },
];

export const Home: React.FC = () => {
  const { t, language } = useLanguage();
  const [overview, setOverview] = useState<SalonOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = async () => {
    try {
      const data = await api.getOverview();
      setOverview(data);
    } catch (err) {
      console.error('Error fetching overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    const handleUpdate = () => fetchOverview();
    socket.on('queue:updated', handleUpdate);
    socket.on('barbers:updated', handleUpdate);
    socket.on('settings:updated', handleUpdate);
    return () => {
      socket.off('queue:updated', handleUpdate);
      socket.off('barbers:updated', handleUpdate);
      socket.off('settings:updated', handleUpdate);
    };
  }, []);

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
        <div className="skeleton h-52 w-full" />
        <div className="skeleton h-36 w-full" />
        <div className="skeleton h-28 w-full" />
        <div className="skeleton h-14 w-full" />
      </div>
    );
  }

  const waitingCount = overview?.waitingCount || 0;
  const estimatedWait = overview?.estimatedWait || 5;
  const isOpen = overview?.isOnlineQueueOpen ?? true;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-28">

      {/* ═══════════════════════════ HERO SECTION ═══════════════════════════ */}
      <div className="salon-card-hero p-7 relative overflow-hidden fade-in-up">
        {/* Background decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/20 pointer-events-none" />
        <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/15 pointer-events-none" />

        {/* Brand Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 border border-emerald-300/70 text-emerald-800 text-xs font-bold mb-4 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Twist &amp; Trim Salon</span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight mb-2" style={{ color: 'var(--text-heading)' }}>
          {language === 'gu'
            ? 'ટ્વિસ્ટ એન્ડ ટ્રિમ'
            : 'Twist & Trim'}
        </h1>
        <p className="text-sm font-semibold mb-4" style={{ color: '#374151' }}>
          {language === 'gu'
            ? 'પ્રીમિયમ હેર & ગ્રૂમિંગ સ્ટુડિઓ — ઓનલાઇન ક્યૂ'
            : 'Premium Hair & Grooming Studio — Smart Queue System'}
        </p>

        {/* Rating + Live tag */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/70 border border-amber-200 text-amber-800 text-[11px] font-bold shadow-sm">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> 4.9 Rating
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/70 border border-emerald-200 text-emerald-800 text-[11px] font-bold shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            Live Queue Active
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/70 border border-blue-200 text-blue-800 text-[11px] font-bold shadow-sm">
            <CheckCircle2 className="w-3 h-3 text-blue-500" /> No App Needed
          </span>
        </div>

        {/* Large scissors illustration */}
        <div className="absolute bottom-4 right-5 opacity-10 pointer-events-none">
          <Scissors className="w-24 h-24" strokeWidth={1} />
        </div>
      </div>

      {/* ═══════════════════════════ LIVE QUEUE CARD ═══════════════════════════ */}
      <div className="salon-card p-5 fade-in-up">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <span className="section-label mb-1 block">
              {language === 'gu' ? 'લાઇવ કતાર' : 'Live Queue Status'}
            </span>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping flex-shrink-0" />
              <span className="text-lg font-bold" style={{ color: 'var(--text-heading)' }}>
                {waitingCount > 0 ? `${waitingCount} ${t('peopleWaiting')}` : t('noOneWaiting')}
              </span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="section-label mb-1 block">
              {language === 'gu' ? 'અંદાજ' : 'Est. Wait'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs">
              <Clock className="w-3.5 h-3.5" />
              {t('estimatedWait', { min: estimatedWait })}
            </span>
          </div>
        </div>

        {/* Stylists on duty */}
        <div className="border-t pt-4" style={{ borderColor: 'var(--border-soft)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
              <Users className="w-4 h-4 inline mr-1.5" style={{ color: 'var(--primary)' }} />
              {language === 'gu' ? 'આજ ડ્યૂટી પર' : 'Stylists on Duty'}
            </span>
            <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
              {overview?.barbers.length} Active
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {overview?.barbers.map((barber) => {
              const isFree = barber.status === 'free';
              const isOnBreak = barber.status === 'on_break';
              return (
                <div
                  key={barber.id}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    isFree
                      ? 'bg-emerald-50 border-emerald-200'
                      : isOnBreak
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-lg mx-auto mb-1.5 shadow-sm">
                    {barber.avatar || '✂️'}
                  </div>
                  <div className="font-bold text-xs truncate" style={{ color: 'var(--text-heading)' }}>
                    {barber.name}
                  </div>
                  <span className={`inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                    isFree
                      ? 'bg-emerald-100 text-emerald-800'
                      : isOnBreak
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {isFree ? t('barberStatusFree') : isOnBreak ? t('barberStatusBreak') : t('barberStatusBusy')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════ QUEUE CLOSED ALERT ═══════════════════════════ */}
      {!isOpen && (
        <div className="p-4 rounded-xl flex items-start gap-3 text-sm bg-red-50 border border-red-200 text-red-900 fade-in-up">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-bold mb-0.5">
              {language === 'gu' ? 'ઓનલાઇન કતાર બંધ છે' : 'Online Queue Closed'}
            </div>
            <p className="text-xs text-red-700 font-medium">
              {overview?.queueClosedReason ||
                (language === 'gu'
                  ? 'ઓનલાઇન નોંધણી બંધ છે. સીધા આવો.'
                  : 'Online reservations are temporarily paused. Walk-ins welcome at the counter.')}
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════ PRIMARY CTA ═══════════════════════════ */}
      <div className="space-y-3 fade-in-up">
        <Link
          to={isOpen ? '/join' : '#'}
          className={`w-full btn-primary text-base min-h-[52px] rounded-2xl ${!isOpen ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Scissors className="w-5 h-5 mr-2" />
          <span>{t('joinQueueBtn')}</span>
          <ChevronRight className="w-5 h-5 ml-2" />
        </Link>
        <div className="text-center">
          <Link
            to="/status/1"
            className="text-xs font-semibold underline underline-offset-4 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            {language === 'gu'
              ? 'પહેલેથી જ જોડાયા? નંબર ચેક કરો →'
              : 'Already joined? Check your live status →'}
          </Link>
        </div>
      </div>

      {/* ═══════════════════════════ SERVICES PREVIEW ═══════════════════════════ */}
      <div className="space-y-3 fade-in-up">
        <span className="section-label block">
          {language === 'gu' ? 'અમારી સેવાઓ' : 'Our Services'}
        </span>
        <div className="grid grid-cols-2 gap-2.5">
          {SERVICES_PREVIEW.map((svc) => (
            <div
              key={svc.label}
              className="salon-card p-4 flex items-center gap-3 hover:border-emerald-300 transition-all"
            >
              <span className="text-2xl">{svc.emoji}</span>
              <div>
                <div className="font-bold text-sm" style={{ color: 'var(--text-heading)' }}>
                  {language === 'gu' ? svc.labelGu : svc.label}
                </div>
                <div className="text-xs font-semibold mt-0.5" style={{ color: 'var(--primary)' }}>
                  From {svc.from}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════ WHY CHOOSE US ═══════════════════════════ */}
      <div className="space-y-3 fade-in-up">
        <span className="section-label block">
          {language === 'gu' ? 'શા માટે ટ્વિસ્ટ & ટ્રિમ?' : 'Why Twist & Trim?'}
        </span>
        <div className="space-y-2.5">
          {FEATURES.map((f) => (
            <div key={f.titleEn} className="salon-card p-4 flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--primary-light)' }}>
                {f.icon}
              </div>
              <div>
                <div className="font-bold text-sm" style={{ color: 'var(--text-heading)' }}>
                  {language === 'gu' ? f.titleGu : f.titleEn}
                </div>
                <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--text-muted)' }}>
                  {language === 'gu' ? f.descGu : f.descEn}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════ TRUST FOOTER ═══════════════════════════ */}
      <div className="text-center py-4 border-t space-y-1" style={{ borderColor: 'var(--border-soft)' }}>
        <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
          {language === 'gu'
            ? '🌿 ટ્વિસ્ટ &amp; ટ્રિમ — ૨૦૨૪ ● સ્માર્ટ ક્યૂ ટેકનોલોજી'
            : '🌿 Twist & Trim — 2024 • Smart Queue Technology'}
        </p>
        <p className="text-[11px]" style={{ color: '#9CA3AF' }}>
          {language === 'gu'
            ? 'ૐ · ઘ · ॐ — Grooming with dignity'
            : 'Grooming with precision, served with dignity.'}
        </p>
      </div>
    </div>
  );
};
