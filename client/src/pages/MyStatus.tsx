import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Clock, User, Scissors, AlertTriangle, ArrowLeft,
  CheckCircle2, BellRing, Check,
} from 'lucide-react';
import { api } from '../services/api';
import { socket } from '../services/socket';
import type { QueueEntry } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { playCallChime } from '../utils/audioChime';

export const MyStatus: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const [entry, setEntry] = useState<QueueEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchEntry = async () => {
    if (!id) return;
    try {
      const data = await api.getQueueEntry(id);
      setEntry(data);
    } catch (err: unknown) {
      console.error('Failed to fetch entry:', err);
      setErrorMsg('Could not load queue status. It may have expired or been removed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntry();
    const handleQueueUpdate = () => fetchEntry();
    const handleTokenCalled = (payload: { entryId?: number | string; token?: string }) => {
      if (entry && (payload.entryId == id || payload.token === entry.token)) {
        playCallChime();
        if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);
      }
      fetchEntry();
    };
    socket.on('queue:updated', handleQueueUpdate);
    socket.on('token:called', handleTokenCalled);
    return () => {
      socket.off('queue:updated', handleQueueUpdate);
      socket.off('token:called', handleTokenCalled);
    };
  }, [id, entry?.token]);

  const handleCancelSpot = async () => {
    if (!id) return;
    setCancelling(true);
    try {
      await api.cancelQueueEntry(id);
      setShowCancelModal(false);
      fetchEntry();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel spot';
      alert(msg);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
      </div>
    );
  }

  if (errorMsg || !entry) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-red-50 border border-red-200 text-red-500 flex items-center justify-center mx-auto shadow-md">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-heading)' }}>Queue Entry Not Found</h2>
        <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          {errorMsg || "This token is no longer active in today's queue."}
        </p>
        <Link to="/" className="btn-primary inline-flex">
          Return to Twist &amp; Trim Home
        </Link>
      </div>
    );
  }

  const isCalled = entry.status === 'Called';
  const isInChair = entry.status === 'In chair';
  const isDone = entry.status === 'Done';
  const isCancelled = entry.status === 'Cancelled';
  const isNoShow = entry.status === 'No-show';
  const isWaiting = entry.status === 'Waiting';
  const isSecondInLine = isWaiting && entry.position === 2;

  const steps = [
    { key: 'Waiting',  label: language === 'gu' ? 'કતારમાં'   : 'In Line'   },
    { key: 'Called',   label: language === 'gu' ? 'બોલાવ્યા'  : 'Called'    },
    { key: 'In chair', label: language === 'gu' ? 'સેવા ચાલુ' : 'In Chair'  },
    { key: 'Done',     label: language === 'gu' ? 'પૂર્ણ'      : 'Finished'  },
  ];

  const getStepStatus = (stepKey: string) => {
    const order = ['Waiting', 'Called', 'In chair', 'Done'];
    const currentIdx = order.indexOf(entry.status);
    const stepIdx    = order.indexOf(stepKey);
    if (currentIdx > stepIdx) return 'completed';
    if (currentIdx === stepIdx) return 'current';
    return 'upcoming';
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-5 relative pb-28">

      {/* Top Bar */}
      <div className="flex items-center justify-between border-b pb-3.5" style={{ borderColor: 'var(--border-soft)' }}>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-xs font-bold transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft className="w-4 h-4" />
          {language === 'gu' ? 'હોમ' : 'Twist & Trim Home'}
        </button>
        <div className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border" style={{ background: 'var(--primary-light)', borderColor: 'var(--border-accent)', color: 'var(--primary)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>Live Sync</span>
        </div>
      </div>

      {/* ── IT'S YOUR TURN ── */}
      {isCalled && (
        <div
          className="p-7 rounded-3xl text-white text-center space-y-4 border-4 border-white"
          style={{ background: 'var(--bg-hero-dark)', boxShadow: '0 20px 60px rgba(6,78,59,0.4)' }}
        >
          <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto shadow-lg">
            <BellRing className="w-8 h-8 animate-pulse" style={{ color: 'var(--primary)' }} />
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest bg-white/15 text-white px-3.5 py-1 rounded-full border border-white/30 inline-block">
            {language === 'gu' ? 'તમારો વારો!' : "IT'S YOUR TURN NOW!"}
          </span>
          <h2 className="text-2xl font-black leading-tight tracking-tight">
            {t('itsYourTurnAlert', { barber: entry.assigned_barber || 'the stylist' })}
          </h2>
          <p className="text-xs font-bold text-white/90">
            {language === 'gu'
              ? `ટોકન ${entry.token} — ${entry.assigned_barber} ની ખુરશી પર જાઓ`
              : `Token ${entry.token} — Please proceed to ${entry.assigned_barber}'s chair immediately.`}
          </p>
        </div>
      )}

      {/* ── 2nd in Line ── */}
      {isSecondInLine && (
        <div className="p-4 rounded-2xl border-2 flex items-center gap-3 animate-pulse" style={{ background: '#FFFBEB', borderColor: '#FCD34D' }}>
          <span className="text-2xl">⚠️</span>
          <div className="text-sm font-bold" style={{ color: '#92400E' }}>{t('startComingBanner')}</div>
        </div>
      )}

      {/* ── In Chair ── */}
      {isInChair && (
        <div className="p-5 rounded-2xl text-center space-y-1" style={{ background: 'var(--primary-light)', border: '1px solid var(--border-accent)' }}>
          <span className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: 'var(--primary)' }}>
            {language === 'gu' ? 'સેવા ચાલુ છે' : 'In Service Now'}
          </span>
          <div className="text-base font-black" style={{ color: 'var(--text-heading)' }}>
            {language === 'gu'
              ? `${entry.assigned_barber} સાથે સ્ટાઇલ ચાલી રહી છે`
              : `Enjoying a styling session with ${entry.assigned_barber}`}
          </div>
        </div>
      )}

      {/* ── Done ── */}
      {isDone && (
        <div className="p-6 rounded-3xl text-center space-y-2" style={{ background: '#ECFDF5', border: '1px solid #6EE7B7' }}>
          <CheckCircle2 className="w-12 h-12 mx-auto" style={{ color: '#059669' }} />
          <h3 className="text-lg font-black" style={{ color: 'var(--text-heading)' }}>
            {language === 'gu' ? 'સેવા પૂર્ણ!' : 'Grooming Complete!'}
          </h3>
          <p className="text-xs font-medium" style={{ color: '#065F46' }}>
            {language === 'gu'
              ? 'ટ્વિસ્ટ &amp; ટ્રિમ — ધન્યવાદ! ફરી આવો.'
              : 'Thank you for visiting Twist & Trim. We hope you love your fresh look!'}
          </p>
        </div>
      )}

      {/* ── Cancelled / No Show ── */}
      {(isCancelled || isNoShow) && (
        <div className="p-5 rounded-2xl text-center space-y-1" style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
          <span className="text-sm font-bold block" style={{ color: '#991B1B' }}>
            {isCancelled ? 'Spot Cancelled' : 'Marked as No-Show'}
          </span>
          <p className="text-xs font-medium" style={{ color: '#B91C1C' }}>
            This token is no longer in line. You can rejoin the queue anytime.
          </p>
        </div>
      )}

      {/* ── Digital Pass Card ── */}
      <div className="salon-card-elevated p-6 space-y-6 overflow-hidden">

        {/* Token Badge */}
        <div className="text-center space-y-1">
          <span className="section-label block justify-center">{t('tokenNumber')}</span>
          <div
            className="text-7xl font-black tracking-tight my-2 leading-none"
            style={{ color: 'var(--primary)' }}
          >
            {entry.token}
          </div>
          <div className="text-sm font-bold flex items-center justify-center gap-1.5" style={{ color: 'var(--text-heading)' }}>
            <User className="w-4 h-4" style={{ color: 'var(--primary)' }} />
            {entry.customer_name}
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="border-t pt-4" style={{ borderColor: 'var(--border-soft)', borderStyle: 'dashed' }}>
          <div className="grid grid-cols-4 gap-1 text-center">
            {steps.map((st, i) => {
              const status = getStepStatus(st.key);
              return (
                <div key={st.key} className="relative space-y-1.5">
                  {/* Connector line */}
                  {i < steps.length - 1 && (
                    <div
                      className="absolute top-3.5 left-1/2 w-full h-0.5 -z-0"
                      style={{ background: status === 'completed' ? '#059669' : '#E5E7EB' }}
                    />
                  )}
                  <div
                    className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center text-xs font-bold relative z-10 transition-all ${
                      status === 'completed' ? 'step-dot-done'
                      : status === 'current' ? 'step-dot-current'
                      : 'step-dot-upcoming'
                    }`}
                  >
                    {status === 'completed' ? <Check className="w-4 h-4" strokeWidth={3} /> : '●'}
                  </div>
                  <span
                    className="text-[10px] font-bold block"
                    style={{
                      color: status === 'current' ? 'var(--primary)'
                           : status === 'completed' ? '#059669'
                           : '#9CA3AF',
                    }}
                  >
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Position + Wait (while waiting) */}
        {isWaiting && (
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-4 rounded-2xl border" style={{ background: 'var(--primary-light)', borderColor: 'var(--border-accent)' }}>
              <span className="section-label justify-center mb-1">
                {language === 'gu' ? 'ક્રમ' : 'Position'}
              </span>
              <span className="text-2xl font-black block" style={{ color: 'var(--primary)' }}>
                {t('positionInLine', { pos: entry.position || 1 })}
              </span>
            </div>
            <div className="text-center p-4 rounded-2xl border" style={{ background: '#EFF6FF', borderColor: '#BFDBFE' }}>
              <span className="section-label justify-center mb-1">
                {language === 'gu' ? 'સમય' : 'Est. Wait'}
              </span>
              <span className="text-2xl font-black flex items-center justify-center gap-1" style={{ color: '#1D4ED8' }}>
                <Clock className="w-5 h-5" /> ~{entry.estimatedWait || 5}m
              </span>
            </div>
          </div>
        )}

        {/* Services detail */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs border-b pb-2" style={{ borderColor: 'var(--border-soft)' }}>
            <span className="flex items-center gap-1.5 font-bold" style={{ color: 'var(--text-body)' }}>
              <Scissors className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
              {language === 'gu' ? 'સેવાઓ' : 'Selected Services'}
            </span>
            <span className="font-bold" style={{ color: 'var(--primary)' }}>
              {language === 'gu' ? `વાળંદ: ${entry.preferred_barber}` : `Stylist: ${entry.preferred_barber}`}
            </span>
          </div>

          <div className="space-y-2">
            {entry.services?.map((s, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <span className="font-medium" style={{ color: 'var(--text-body)' }}>
                  {language === 'gu' ? s.name_gu : s.name_en} ({s.duration}m)
                </span>
                <span className="font-bold" style={{ color: 'var(--text-muted)' }}>₹{s.price}</span>
              </div>
            ))}
          </div>

          <div className="pt-2.5 border-t flex justify-between items-center" style={{ borderColor: 'var(--border-soft)' }}>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              {language === 'gu' ? 'કુલ' : 'Grand Total'}
            </span>
            <span className="text-base font-black" style={{ color: 'var(--text-heading)' }}>
              ₹{entry.total_price} ({entry.total_duration} min)
            </span>
          </div>
        </div>

        {/* Cancel */}
        {isWaiting && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="w-full py-3 rounded-2xl border font-bold text-xs transition-colors"
            style={{ borderColor: '#FECACA', background: '#FEF2F2', color: '#991B1B' }}
          >
            {t('cancelMySpot')}
          </button>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border" style={{ borderColor: 'var(--border-soft)' }}>
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black" style={{ color: 'var(--text-heading)' }}>{t('confirmCancelModal')}</h3>
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              {language === 'gu'
                ? 'રદ કરવાથી ટોકન ગુમાવશો. નવો ટોકન ફરી લેવો પડશે.'
                : 'If you cancel, your token is permanently released and your place is forfeited.'}
            </p>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 rounded-xl font-bold text-xs transition-colors"
                style={{ background: '#F9FAFB', border: '1px solid var(--border-soft)', color: 'var(--text-body)' }}
              >
                {language === 'gu' ? 'પાછા' : 'Keep Spot'}
              </button>
              <button
                onClick={handleCancelSpot}
                disabled={cancelling}
                className="btn-danger flex-1 py-3 rounded-xl text-xs"
              >
                {cancelling ? 'Cancelling...' : language === 'gu' ? 'હા, રદ' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
