import React, { useEffect, useState } from 'react';
import { Users, Clock, Plus, X } from 'lucide-react';
import { api } from '../services/api';
import { socket } from '../services/socket';
import type { Barber, QueueEntry, Service } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

export const ReceptionDashboard: React.FC = () => {
  const { t, language } = useLanguage();

  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Walk-in modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInSelectedServices, setWalkInSelectedServices] = useState<Service[]>([]);
  const [walkInBarber, setWalkInBarber] = useState('Any');
  const [submittingWalkIn, setSubmittingWalkIn] = useState(false);
  const [walkInError, setWalkInError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [barberList, queueList, serviceList] = await Promise.all([
        api.getBarbers(),
        api.getQueue(),
        api.getServices(false),
      ]);
      setBarbers(barberList.filter((b) => b.on_duty === 1));
      setQueue(queueList);
      setServices(serviceList);
    } catch (err) {
      console.error('Error fetching reception data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    socket.on('queue:updated', handleUpdate);
    socket.on('barbers:updated', handleUpdate);
    return () => {
      socket.off('queue:updated', handleUpdate);
      socket.off('barbers:updated', handleUpdate);
    };
  }, []);

  const handleCallNext = async (barberName: string) => {
    try {
      await api.callNext(barberName);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error calling next customer';
      alert(msg);
    }
  };

  const handleStatusChange = async (entryId: number, newStatus: string) => {
    try {
      await api.updateEntryStatus(entryId, newStatus);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating status';
      alert(msg);
    }
  };

  const handleAddWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setWalkInError(null);
    const cleaned = walkInPhone.replace(/\D/g, '');
    if (!walkInName.trim()) { setWalkInError('Please enter guest name'); return; }
    if (cleaned.length !== 10) { setWalkInError('Please enter a valid 10-digit phone number'); return; }
    if (walkInSelectedServices.length === 0) { setWalkInError('Please select at least 1 service'); return; }
    setSubmittingWalkIn(true);
    try {
      await api.joinQueue({ name: walkInName.trim(), phone: cleaned, services: walkInSelectedServices, preferred_barber: walkInBarber, source: 'walk-in' });
      setIsModalOpen(false);
      setWalkInName(''); setWalkInPhone(''); setWalkInSelectedServices([]); setWalkInBarber('Any');
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to add walk-in';
      setWalkInError(msg);
    } finally {
      setSubmittingWalkIn(false);
    }
  };

  const waitingEntries    = queue.filter((e) => e.status === 'Waiting');
  const calledEntries     = queue.filter((e) => e.status === 'Called');
  const activeBarbersCount = barbers.filter((b) => b.status === 'free').length;
  const overdueCount      = waitingEntries.filter((e) => {
    const elapsed = Math.round((Date.now() - new Date(e.created_at).getTime()) / 60000);
    return elapsed > 60;
  }).length;

  if (loading) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-6" style={{ borderColor: 'var(--border-soft)' }}>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--text-heading)' }}>
              {t('receptionTitle')}
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--border-accent)' }}>
              Twist &amp; Trim Console
            </span>
          </div>
          <p className="text-xs font-medium mt-1" style={{ color: 'var(--text-muted)' }}>
            {language === 'gu'
              ? 'સ્ટેશન સ્ટેટસ, વૉક-ઇન ઉમેરો, અને કતાર નિયંત્રણ'
              : 'Station workload dispatch, walk-in admission & queue control'}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" strokeWidth={3} />
          {t('addWalkIn')}
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Waiting in Lounge', value: waitingEntries.length, color: 'var(--text-heading)' },
          { label: 'Chairs Available', value: activeBarbersCount, color: '#059669' },
          { label: 'Currently Called', value: calledEntries.length, color: '#1D4ED8' },
          { label: 'Overdue (>60m)', value: overdueCount, color: overdueCount > 0 ? '#DC2626' : '#9CA3AF' },
        ].map((kpi) => (
          <div key={kpi.label} className="kpi-card p-4">
            <span className="section-label block mb-1">{kpi.label}</span>
            <div className="text-2xl font-black" style={{ color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* LEFT: Barber Stations */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-label">
              <Users className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              Styling Stations ({barbers.length})
            </h2>
            <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Duty Bay</span>
          </div>

          <div className="space-y-3.5">
            {barbers.map((barber) => {
              const currentCustomer = barber.currentCustomer;
              const isFree = barber.status === 'free';
              const isOnBreak = barber.status === 'on_break';

              return (
                <div key={barber.id} className="salon-card p-5 space-y-4 transition-all hover:border-emerald-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm" style={{ background: 'var(--primary-light)', border: '1px solid var(--border-accent)' }}>
                        {barber.avatar || '✂️'}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base leading-tight" style={{ color: 'var(--text-heading)' }}>{barber.name}</h3>
                        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: isFree ? '#059669' : isOnBreak ? '#92400E' : '#1D4ED8' }}>
                          {isOnBreak ? '● On Break' : isFree ? '● Available' : '● In Chair'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCallNext(barber.name)}
                      disabled={isOnBreak || (!isFree && currentCustomer?.status === 'In chair')}
                      className={`px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition-all ${
                        isOnBreak || (!isFree && currentCustomer?.status === 'In chair')
                          ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                          : 'btn-primary'
                      }`}
                    >
                      {t('callNext')}
                    </button>
                  </div>

                  {currentCustomer ? (
                    <div className="rounded-2xl p-4 border space-y-2 text-xs" style={{ background: 'var(--primary-light)', borderColor: 'var(--border-accent)' }}>
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm" style={{ color: 'var(--primary)' }}>
                          {currentCustomer.token} · {currentCustomer.customer_name}
                        </span>
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase"
                          style={
                            currentCustomer.status === 'Called'
                              ? { background: '#FFFBEB', color: '#92400E', border: '1px solid #FCD34D' }
                              : { background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--border-accent)' }
                          }
                        >
                          {currentCustomer.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between" style={{ color: 'var(--text-muted)' }}>
                        <span className="flex items-center gap-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5" /> {currentCustomer.total_duration} mins
                        </span>
                        <span className="font-bold" style={{ color: 'var(--text-heading)' }}>₹{currentCustomer.total_price}</span>
                      </div>
                      {currentCustomer.status === 'Called' && (
                        <div className="pt-2 flex gap-2">
                          <button
                            onClick={() => handleStatusChange(currentCustomer.id, 'In chair')}
                            className="flex-1 py-2 rounded-xl font-bold text-xs text-white transition-colors"
                            style={{ background: '#059669' }}
                          >
                            Mark In Chair
                          </button>
                          <button
                            onClick={() => handleStatusChange(currentCustomer.id, 'No-show')}
                            className="px-3.5 py-2 rounded-xl font-bold text-xs transition-colors"
                            style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B' }}
                          >
                            {t('noShow')}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-2xl p-3.5 border border-dashed text-center text-xs font-medium" style={{ borderColor: '#D1D5DB', color: '#9CA3AF', background: '#F9FAFB' }}>
                      Chair is ready for next client
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Waiting List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="section-label">
              <Clock className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              {t('waitingList')} ({waitingEntries.length})
            </h2>
            <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>FCFS Order</span>
          </div>

          {/* Called tokens */}
          {calledEntries.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: '#92400E' }}>
                🔔 Currently Called
              </span>
              {calledEntries.map((entry) => (
                <div key={entry.id} className="p-4 rounded-2xl flex items-center justify-between gap-3 animate-pulse" style={{ background: '#FFFBEB', border: '1px solid #FCD34D' }}>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl font-black" style={{ color: '#92400E' }}>{entry.token}</span>
                      <span className="font-bold text-sm" style={{ color: 'var(--text-heading)' }}>{entry.customer_name}</span>
                      <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>({entry.customer_phone})</span>
                    </div>
                    <div className="text-xs font-medium mt-1" style={{ color: 'var(--text-body)' }}>
                      Assigned to: <span className="font-bold" style={{ color: 'var(--primary)' }}>{entry.assigned_barber}</span> · {entry.total_duration}m
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStatusChange(entry.id, 'In chair')}
                      className="px-3.5 py-1.5 rounded-xl font-bold text-xs text-white"
                      style={{ background: '#059669' }}
                    >
                      Start
                    </button>
                    <button
                      onClick={() => handleStatusChange(entry.id, 'No-show')}
                      className="px-3.5 py-1.5 rounded-xl font-bold text-xs"
                      style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B' }}
                    >
                      {t('noShow')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Waiting list */}
          {waitingEntries.length === 0 ? (
            <div className="salon-card border-dashed rounded-3xl p-12 text-center space-y-3">
              <Users className="w-12 h-12 mx-auto" style={{ color: '#D1D5DB' }} />
              <div className="text-base font-bold" style={{ color: 'var(--text-muted)' }}>{t('noOneWaiting')}</div>
              <p className="text-xs font-medium max-w-sm mx-auto" style={{ color: '#9CA3AF' }}>
                No clients in queue. Remote and walk-in reservations sync instantly.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {waitingEntries.map((entry, idx) => {
                const elapsedMin = Math.round((Date.now() - new Date(entry.created_at).getTime()) / 60000);
                const isOverdue = elapsedMin > 60;
                return (
                  <div
                    key={entry.id}
                    className="rounded-2xl p-4 border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    style={
                      isOverdue
                        ? { background: '#FEF2F2', borderColor: '#FECACA' }
                        : { background: '#FFFFFF', borderColor: 'var(--border-soft)' }
                    }
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full text-xs font-black flex items-center justify-center" style={{ background: '#F3F4F6', color: 'var(--text-body)', border: '1px solid var(--border-soft)' }}>
                          #{idx + 1}
                        </span>
                        <span className="text-lg font-black" style={{ color: 'var(--primary)' }}>{entry.token}</span>
                        <span className="font-bold text-sm" style={{ color: 'var(--text-heading)' }}>{entry.customer_name}</span>
                        <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>({entry.customer_phone})</span>
                        {entry.source === 'walk-in' && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                            Walk-in
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-medium flex flex-wrap items-center gap-x-3 gap-y-1" style={{ color: 'var(--text-muted)' }}>
                        <span>Pref: <span className="font-bold" style={{ color: 'var(--primary)' }}>{entry.preferred_barber}</span></span>
                        <span>·</span>
                        <span>{entry.services?.map((s) => s.name_en).join(', ')} ({entry.total_duration}m)</span>
                        <span>·</span>
                        <span style={{ color: isOverdue ? '#DC2626' : 'var(--text-muted)', fontWeight: isOverdue ? 700 : 500 }}>
                          Waiting: {elapsedMin}m {isOverdue && '⚠️'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => handleStatusChange(entry.id, 'Cancelled')}
                        className="px-3.5 py-1.5 rounded-xl font-bold text-xs transition-colors"
                        style={{ border: '1px solid #FECACA', background: '#FEF2F2', color: '#991B1B' }}
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Walk-in Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 shadow-2xl relative" style={{ border: '1px solid var(--border-soft)' }}>
            <button onClick={() => setIsModalOpen(false)} className="absolute right-6 top-6" style={{ color: '#9CA3AF' }}>
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black flex items-center gap-2" style={{ color: 'var(--text-heading)' }}>
              <Plus className="w-5 h-5" style={{ color: 'var(--primary)' }} />
              {t('addWalkIn')}
            </h3>

            {walkInError && (
              <div className="p-3.5 rounded-xl text-xs font-semibold" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B' }}>
                {walkInError}
              </div>
            )}

            <form onSubmit={handleAddWalkIn} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1.5 uppercase" style={{ color: 'var(--text-body)' }}>Guest Name *</label>
                <input type="text" required value={walkInName} onChange={(e) => setWalkInName(e.target.value)} placeholder="e.g. Ramesh Patel" className="salon-input" />
              </div>
              <div>
                <label className="block font-bold mb-1.5 uppercase" style={{ color: 'var(--text-body)' }}>Phone (10 digits) *</label>
                <input type="tel" required maxLength={10} value={walkInPhone} onChange={(e) => setWalkInPhone(e.target.value.replace(/\D/g, ''))} placeholder="9876543210" className="salon-input font-mono" />
              </div>
              <div>
                <label className="block font-bold mb-1.5 uppercase" style={{ color: 'var(--text-body)' }}>Select Services (Max 3) *</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                  {services.map((svc) => {
                    const isSelected = walkInSelectedServices.some((s) => s.id === svc.id);
                    return (
                      <button
                        type="button"
                        key={svc.id}
                        onClick={() => {
                          if (isSelected) {
                            setWalkInSelectedServices(walkInSelectedServices.filter((s) => s.id !== svc.id));
                          } else {
                            if (walkInSelectedServices.length < 3) {
                              setWalkInSelectedServices([...walkInSelectedServices, svc]);
                            }
                          }
                        }}
                        className="p-2.5 rounded-xl border text-left transition-all"
                        style={
                          isSelected
                            ? { background: 'var(--primary-light)', borderColor: 'var(--primary)', color: 'var(--primary)', fontWeight: 700 }
                            : { background: '#FFFFFF', borderColor: 'var(--border-soft)', color: 'var(--text-body)' }
                        }
                      >
                        <div>{svc.name_en}</div>
                        <div className="mt-0.5" style={{ color: 'var(--text-muted)' }}>{svc.duration}m · ₹{svc.price}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block font-bold mb-1.5 uppercase" style={{ color: 'var(--text-body)' }}>Preferred Stylist</label>
                <select value={walkInBarber} onChange={(e) => setWalkInBarber(e.target.value)} className="salon-input">
                  <option value="Any">Any Stylist (Fastest)</option>
                  {barbers.map((b) => <option key={b.id} value={b.name}>{b.name} ({b.status})</option>)}
                </select>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={submittingWalkIn} className="btn-primary flex-1">
                  {submittingWalkIn ? 'Enrolling...' : 'Add to Queue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
