import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Play, Check, Coffee, User, Clock,
  Scissors, ArrowLeft, Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { socket } from '../services/socket';
import type { Barber, QueueEntry } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

export const BarberView: React.FC = () => {
  const { name: paramName } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedBarberName, setSelectedBarberName] = useState<string>(paramName || 'Ravi');
  const [currentCustomer, setCurrentCustomer] = useState<QueueEntry | null>(null);
  const [nextCustomer, setNextCustomer] = useState<QueueEntry | null>(null);
  const [currentBarber, setCurrentBarber] = useState<Barber | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadBarberData = async (barberName: string) => {
    try {
      const [allBarbers, queue] = await Promise.all([api.getBarbers(), api.getQueue()]);
      setBarbers(allBarbers);
      const found = allBarbers.find((b) => b.name.toLowerCase() === barberName.toLowerCase());
      if (found) {
        setCurrentBarber(found);
        const activeCust = queue.find(
          (q) => q.assigned_barber === found.name && (q.status === 'Called' || q.status === 'In chair')
        );
        setCurrentCustomer(activeCust || null);
        if (activeCust && activeCust.status === 'In chair' && activeCust.started_at) {
          const started = new Date(activeCust.started_at).getTime();
          setTimerSeconds(Math.max(0, Math.floor((Date.now() - started) / 1000)));
        } else {
          setTimerSeconds(0);
        }
        const nextInLine = queue.find(
          (q) => q.status === 'Waiting' && (q.preferred_barber === found.name || q.preferred_barber === 'Any')
        );
        setNextCustomer(nextInLine || null);
      }
    } catch (err) {
      console.error('Error fetching barber data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBarberData(selectedBarberName);
    const handleUpdate = () => loadBarberData(selectedBarberName);
    socket.on('queue:updated', handleUpdate);
    socket.on('barbers:updated', handleUpdate);
    return () => {
      socket.off('queue:updated', handleUpdate);
      socket.off('barbers:updated', handleUpdate);
    };
  }, [selectedBarberName]);

  useEffect(() => {
    if (currentCustomer?.status === 'In chair') {
      const interval = setInterval(() => setTimerSeconds((p) => p + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [currentCustomer?.status]);

  const toggleBreak = async () => {
    if (!currentBarber) return;
    const newStatus = currentBarber.status === 'on_break' ? 'free' : 'on_break';
    try {
      await api.updateBarberStatus(currentBarber.id, newStatus);
      loadBarberData(selectedBarberName);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating break status';
      alert(msg);
    }
  };

  const handleStartService = async () => {
    if (!currentCustomer) return;
    try {
      await api.updateEntryStatus(currentCustomer.id, 'In chair');
      loadBarberData(selectedBarberName);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error starting service';
      alert(msg);
    }
  };

  const handleDoneService = async () => {
    if (!currentCustomer) return;
    try {
      await api.updateEntryStatus(currentCustomer.id, 'Done');
      loadBarberData(selectedBarberName);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error completing service';
      alert(msg);
    }
  };

  const handleCallNext = async () => {
    if (!currentBarber) return;
    try {
      await api.callNext(currentBarber.name);
      loadBarberData(selectedBarberName);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error calling next customer';
      alert(msg);
    }
  };

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
      </div>
    );
  }

  const isOnBreak = currentBarber?.status === 'on_break';

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-5 pb-28">

      {/* Top Bar: Back + Stylist Switcher */}
      <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--border-soft)' }}>
        <button
          onClick={() => navigate('/')}
          className="text-xs font-bold flex items-center gap-1.5 transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft className="w-4 h-4" /> Home
        </button>

        <div className="flex items-center gap-1 bg-white border rounded-2xl p-1 shadow-sm" style={{ borderColor: 'var(--border-soft)' }}>
          {barbers.map((b) => (
            <button
              key={b.id}
              onClick={() => { setSelectedBarberName(b.name); navigate(`/barber/${b.name}`); }}
              className="px-3 py-1 rounded-xl text-xs font-bold transition-all"
              style={
                selectedBarberName.toLowerCase() === b.name.toLowerCase()
                  ? { background: 'var(--primary)', color: '#FFFFFF' }
                  : { color: 'var(--text-muted)' }
              }
            >
              {b.name}
            </button>
          ))}
        </div>
      </div>

      {/* Stylist Profile Card */}
      <div
        className="rounded-3xl p-5 flex items-center justify-between shadow-lg"
        style={{ background: 'var(--bg-hero)', border: '1px solid #A7F3D0' }}
      >
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-white border border-emerald-200 flex items-center justify-center text-3xl shadow-sm">
            {currentBarber?.avatar || '✂️'}
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: 'var(--primary)' }}>
              {t('barberViewTitle')}
            </span>
            <h1 className="text-xl font-black" style={{ color: 'var(--text-heading)' }}>{currentBarber?.name}</h1>
            <span className="text-xs font-semibold" style={{ color: isOnBreak ? '#92400E' : '#065F46' }}>
              {isOnBreak ? '● On Break' : '● Station Active'}
            </span>
          </div>
        </div>

        <button
          onClick={toggleBreak}
          className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
          style={
            isOnBreak
              ? { background: 'var(--primary)', color: '#FFFFFF', boxShadow: 'var(--shadow-sm)' }
              : { background: '#FFFFFF', border: '1px solid var(--border-soft)', color: 'var(--text-body)' }
          }
        >
          <Coffee className="w-3.5 h-3.5" />
          {isOnBreak ? t('availableStatus') : t('onBreakStatus')}
        </button>
      </div>

      {/* Break Warning */}
      {isOnBreak && (
        <div className="p-4 rounded-2xl text-sm text-center font-semibold" style={{ background: '#FFFBEB', border: '1px solid #FCD34D', color: '#92400E' }}>
          You are on break. Customer screens show your station is resting.
        </div>
      )}

      {/* Customer Cockpit */}
      <div className="salon-card p-6 space-y-5">
        <div className="flex items-center justify-between border-b pb-3.5" style={{ borderColor: 'var(--border-soft)' }}>
          <span className="section-label">
            <User className="w-4 h-4" style={{ color: 'var(--primary)' }} />
            {t('currentCustomer')}
          </span>
          {currentCustomer && (
            <span
              className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider"
              style={
                currentCustomer.status === 'Called'
                  ? { background: '#FFFBEB', color: '#92400E', border: '1px solid #FCD34D' }
                  : { background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--border-accent)' }
              }
            >
              {currentCustomer.status}
            </span>
          )}
        </div>

        {currentCustomer ? (
          <div className="space-y-4">
            {/* Token display */}
            <div className="text-center py-2">
              <span className="section-label justify-center mb-1">Active Client</span>
              <div className="text-5xl font-black tracking-tight my-1" style={{ color: 'var(--primary)' }}>
                {currentCustomer.token}
              </div>
              <div className="text-base font-bold" style={{ color: 'var(--text-heading)' }}>{currentCustomer.customer_name}</div>
              <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{currentCustomer.customer_phone}</div>
            </div>

            {/* Services list */}
            <div className="rounded-2xl p-4 space-y-2" style={{ background: '#F9FAFB', border: '1px solid var(--border-soft)' }}>
              <div className="section-label mb-2">
                <Scissors className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} />
                Services ({currentCustomer.total_duration}m)
              </div>
              {currentCustomer.services?.map((svc, i) => (
                <div key={i} className="flex justify-between text-xs font-medium" style={{ color: 'var(--text-body)' }}>
                  <span>{language === 'gu' ? svc.name_gu : svc.name_en}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{svc.duration}m</span>
                </div>
              ))}
            </div>

            {/* Timer */}
            {currentCustomer.status === 'In chair' && (
              <div className="text-center p-5 rounded-2xl space-y-1" style={{ background: 'var(--primary-light)', border: '1px solid var(--border-accent)' }}>
                <span className="section-label justify-center">
                  <Clock className="w-3.5 h-3.5" /> Elapsed Time
                </span>
                <div className="text-4xl font-mono font-black tracking-widest" style={{ color: 'var(--text-heading)' }}>
                  {formatTimer(timerSeconds)}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-1">
              {currentCustomer.status === 'Called' ? (
                <button
                  onClick={handleStartService}
                  className="w-full py-4 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  style={{ background: 'var(--primary)', boxShadow: 'var(--shadow-lg)' }}
                >
                  <Play className="w-5 h-5 fill-current" />
                  {t('startService')}
                </button>
              ) : (
                <button
                  onClick={handleDoneService}
                  className="w-full py-4 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                  style={{ background: '#059669', boxShadow: '0 6px 20px rgba(5,150,105,0.3)' }}
                >
                  <Check className="w-5 h-5" strokeWidth={3} />
                  {t('doneService')}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-10 space-y-4">
            <User className="w-12 h-12 mx-auto" style={{ color: '#D1D5DB' }} />
            <div className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>Chair is currently available</div>
            {nextCustomer ? (
              <button
                onClick={handleCallNext}
                disabled={isOnBreak}
                className="btn-primary px-6"
              >
                Call Next Client ({nextCustomer.token})
              </button>
            ) : (
              <span className="text-xs font-medium block" style={{ color: '#9CA3AF' }}>No waiting customers in queue</span>
            )}
          </div>
        )}
      </div>

      {/* Up Next Card */}
      <div className="salon-card p-4 flex items-center justify-between">
        <div className="space-y-0.5">
          <span className="section-label">
            <Sparkles className="w-3 h-3" style={{ color: 'var(--accent)' }} />
            {t('nextForYou')}
          </span>
          {nextCustomer ? (
            <div className="text-sm font-bold flex items-center gap-2 mt-1" style={{ color: 'var(--text-heading)' }}>
              <span style={{ color: 'var(--primary)' }}>{nextCustomer.token}</span>
              <span>{nextCustomer.customer_name}</span>
              <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
                ({nextCustomer.services?.map((s) => s.name_en).join(', ')})
              </span>
            </div>
          ) : (
            <div className="text-xs font-medium mt-1" style={{ color: '#9CA3AF' }}>Queue is clear for this station</div>
          )}
        </div>
      </div>
    </div>
  );
};
