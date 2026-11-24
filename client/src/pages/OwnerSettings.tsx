import React, { useEffect, useState } from 'react';
import { Settings, Users, DollarSign, Clock, UserX, Plus, Edit2 } from 'lucide-react';
import { api } from '../services/api';
import { socket } from '../services/socket';
import type { AdminStats, Barber, Service } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

export const OwnerSettings: React.FC = () => {
  const { t } = useLanguage();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Service modal state
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [svcNameEn, setSvcNameEn] = useState('');
  const [svcNameGu, setSvcNameGu] = useState('');
  const [svcDuration, setSvcDuration] = useState('30');
  const [svcPrice, setSvcPrice] = useState('150');
  const [svcCategory, setSvcCategory] = useState('Hair');
  const [savingService, setSavingService] = useState(false);

  const loadAdminData = async () => {
    try {
      const [statsData, barbersData, servicesData] = await Promise.all([
        api.getAdminStats(),
        api.getBarbers(),
        api.getServices(true),
      ]);
      setStats(statsData);
      setBarbers(barbersData);
      setServices(servicesData);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
    const handleUpdate = () => loadAdminData();
    socket.on('services:updated', handleUpdate);
    socket.on('barbers:updated', handleUpdate);
    socket.on('settings:updated', handleUpdate);
    socket.on('queue:updated', handleUpdate);
    return () => {
      socket.off('services:updated', handleUpdate);
      socket.off('barbers:updated', handleUpdate);
      socket.off('settings:updated', handleUpdate);
      socket.off('queue:updated', handleUpdate);
    };
  }, []);

  const handleToggleOnlineQueue = async () => {
    if (!stats) return;
    try {
      await api.updateAdminSettings({ online_queue_open: !stats.onlineQueueOpen });
      loadAdminData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating queue status';
      alert(msg);
    }
  };

  const handleToggleBarberDuty = async (barber: Barber) => {
    try {
      await api.updateBarberStatus(barber.id, undefined, barber.on_duty === 0);
      loadAdminData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating barber duty';
      alert(msg);
    }
  };

  const handleToggleServiceActive = async (service: Service) => {
    try {
      await api.updateService(service.id, { active: service.active === 1 ? 0 : 1 });
      loadAdminData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error toggling service';
      alert(msg);
    }
  };

  const openAddServiceModal = () => {
    setEditingService(null);
    setSvcNameEn(''); setSvcNameGu(''); setSvcDuration('30'); setSvcPrice('150'); setSvcCategory('Hair');
    setIsServiceModalOpen(true);
  };

  const openEditServiceModal = (svc: Service) => {
    setEditingService(svc);
    setSvcNameEn(svc.name_en); setSvcNameGu(svc.name_gu);
    setSvcDuration(String(svc.duration)); setSvcPrice(String(svc.price)); setSvcCategory(svc.category);
    setIsServiceModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingService(true);
    try {
      if (editingService) {
        await api.updateService(editingService.id, { name_en: svcNameEn.trim(), name_gu: svcNameGu.trim(), duration: Number(svcDuration), price: Number(svcPrice), category: svcCategory });
      } else {
        await api.createService({ name_en: svcNameEn.trim(), name_gu: svcNameGu.trim(), duration: Number(svcDuration), price: Number(svcPrice), category: svcCategory });
      }
      setIsServiceModalOpen(false);
      loadAdminData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save service';
      alert(msg);
    } finally {
      setSavingService(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-6" style={{ borderColor: 'var(--border-soft)' }}>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3" style={{ color: 'var(--text-heading)' }}>
            <Settings className="w-6 h-6" style={{ color: 'var(--primary)' }} />
            {t('adminTitle')}
          </h1>
          <p className="text-xs font-medium mt-1" style={{ color: 'var(--text-muted)' }}>
            Executive management console for capacity, service catalog, pricing, and live analytics.
          </p>
        </div>

        {/* Online Queue Toggle */}
        <div className="flex items-center gap-3 p-2.5 rounded-2xl shadow-sm" style={{ background: '#FFFFFF', border: '1px solid var(--border-soft)' }}>
          <span className="text-xs font-bold pl-2" style={{ color: 'var(--text-body)' }}>Online Queue:</span>
          <button
            onClick={handleToggleOnlineQueue}
            className="px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all"
            style={
              stats?.onlineQueueOpen
                ? { background: '#059669', color: '#FFFFFF', boxShadow: '0 2px 10px rgba(5,150,105,0.3)' }
                : { background: '#DC2626', color: '#FFFFFF' }
            }
          >
            <span className="w-2 h-2 rounded-full" style={{ background: stats?.onlineQueueOpen ? '#6EE7B7' : '#FCA5A5' }} />
            {stats?.onlineQueueOpen ? 'OPEN FOR BOOKING' : 'CLOSED TO PUBLIC'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card p-5 space-y-2">
          <div className="flex items-center justify-between section-label">
            <span>{t('customersServedToday')}</span>
            <Users className="w-4 h-4" style={{ color: '#059669' }} />
          </div>
          <div className="text-3xl font-black" style={{ color: 'var(--text-heading)' }}>{stats?.customersServed || 0}</div>
          <span className="text-[11px] font-bold" style={{ color: '#059669' }}>Clients completed today</span>
        </div>

        <div className="kpi-card p-5 space-y-2">
          <div className="flex items-center justify-between section-label">
            <span>{t('totalRevenueToday')}</span>
            <DollarSign className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          </div>
          <div className="text-3xl font-black" style={{ color: 'var(--accent)' }}>₹{stats?.totalRevenue || 0}</div>
          <span className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>Today's gross services</span>
        </div>

        <div className="kpi-card p-5 space-y-2">
          <div className="flex items-center justify-between section-label">
            <span>{t('averageWaitTime')}</span>
            <Clock className="w-4 h-4" style={{ color: '#1D4ED8' }} />
          </div>
          <div className="text-3xl font-black" style={{ color: 'var(--text-heading)' }}>{stats?.averageWaitMinutes || 0}m</div>
          <span className="text-[11px] font-bold" style={{ color: '#1D4ED8' }}>Average wait duration</span>
        </div>

        <div className="kpi-card p-5 space-y-2">
          <div className="flex items-center justify-between section-label">
            <span>{t('noShowsCount')}</span>
            <UserX className="w-4 h-4" style={{ color: '#DC2626' }} />
          </div>
          <div className="text-3xl font-black" style={{ color: '#DC2626' }}>{stats?.noShows || 0}</div>
          <span className="text-[11px] font-bold" style={{ color: '#DC2626' }}>Unattended calls</span>
        </div>
      </div>

      {/* Stylists on Duty */}
      <div className="salon-card p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black flex items-center gap-2" style={{ color: 'var(--text-heading)' }}>
            <Users className="w-5 h-5" style={{ color: 'var(--primary)' }} /> Stylists on Duty Today
          </h2>
          <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Toggle station readiness</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {barbers.map((barber) => {
            const isOnDuty = barber.on_duty === 1;
            return (
              <div
                key={barber.id}
                className="p-4 rounded-2xl border flex items-center justify-between transition-all"
                style={
                  isOnDuty
                    ? { background: '#FFFFFF', borderColor: 'var(--border-soft)', boxShadow: 'var(--shadow-sm)' }
                    : { background: '#F9FAFB', borderColor: 'var(--border-soft)', opacity: 0.6 }
                }
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl" style={{ background: '#F3F4F6', border: '1px solid var(--border-soft)' }}>
                    {barber.avatar || '✂️'}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm" style={{ color: 'var(--text-heading)' }}>{barber.name}</h3>
                    <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                      Status: <span className="font-bold" style={{ color: 'var(--primary)' }}>{barber.status}</span>
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleBarberDuty(barber)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                  style={
                    isOnDuty
                      ? { background: '#ECFDF5', color: '#065F46', border: '1px solid #6EE7B7' }
                      : { background: '#F3F4F6', color: 'var(--text-muted)', border: '1px solid var(--border-soft)' }
                  }
                >
                  {isOnDuty ? 'On Duty' : 'Off Duty'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Services Catalog */}
      <div className="salon-card p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black flex items-center gap-2" style={{ color: 'var(--text-heading)' }}>
            <Settings className="w-5 h-5" style={{ color: 'var(--primary)' }} /> Services &amp; Pricing Catalog
          </h2>
          <button onClick={openAddServiceModal} className="btn-primary flex items-center gap-1.5 text-xs">
            <Plus className="w-4 h-4" strokeWidth={3} /> Add Service
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border-soft)' }}>
                {['Service Name (EN)', 'Gujarati Name', 'Category', 'Duration', 'Price', 'Status', 'Edit'].map((h) => (
                  <th key={h} className="py-3 px-3 font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {services.map((svc) => (
                <tr key={svc.id} className="border-b transition-colors hover:bg-slate-50" style={{ borderColor: '#F3F4F6' }}>
                  <td className="py-3.5 px-3 font-bold" style={{ color: 'var(--text-heading)' }}>{svc.name_en}</td>
                  <td className="py-3.5 px-3 font-medium" style={{ color: 'var(--text-body)' }}>{svc.name_gu}</td>
                  <td className="py-3.5 px-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: '#F3F4F6', color: 'var(--text-muted)', border: '1px solid var(--border-soft)' }}>
                      {svc.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-semibold" style={{ color: 'var(--text-body)' }}>{svc.duration} mins</td>
                  <td className="py-3.5 px-3 font-black text-sm" style={{ color: 'var(--primary)' }}>₹{svc.price}</td>
                  <td className="py-3.5 px-3">
                    <button
                      onClick={() => handleToggleServiceActive(svc)}
                      className="px-3 py-1 rounded-full text-[11px] font-bold"
                      style={
                        svc.active === 1
                          ? { background: '#ECFDF5', color: '#065F46', border: '1px solid #6EE7B7' }
                          : { background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' }
                      }
                    >
                      {svc.active === 1 ? 'Available' : 'Inactive'}
                    </button>
                  </td>
                  <td className="py-3.5 px-3">
                    <button
                      onClick={() => openEditServiceModal(svc)}
                      className="p-2 rounded-xl transition-colors"
                      style={{ background: '#F3F4F6', border: '1px solid var(--border-soft)', color: 'var(--text-muted)' }}
                      title="Edit Service"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Service Modal */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl" style={{ border: '1px solid var(--border-soft)' }}>
            <h3 className="text-base font-black flex items-center gap-2" style={{ color: 'var(--text-heading)' }}>
              <Plus className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              {editingService ? 'Edit Service Details' : 'Add New Service'}
            </h3>

            <form onSubmit={handleSaveService} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold mb-1 uppercase" style={{ color: 'var(--text-body)' }}>Service Name (English) *</label>
                <input type="text" required value={svcNameEn} onChange={(e) => setSvcNameEn(e.target.value)} placeholder="e.g. Hair Wash & Blow Dry" className="salon-input" />
              </div>
              <div>
                <label className="block font-bold mb-1 uppercase" style={{ color: 'var(--text-body)' }}>Service Name (Gujarati) *</label>
                <input type="text" required value={svcNameGu} onChange={(e) => setSvcNameGu(e.target.value)} placeholder="દા.ત. વાળ ધોવા અને બ્લો ડ્રાય" className="salon-input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 uppercase" style={{ color: 'var(--text-body)' }}>Duration (Min) *</label>
                  <input type="number" required min={5} max={180} value={svcDuration} onChange={(e) => setSvcDuration(e.target.value)} className="salon-input font-mono" />
                </div>
                <div>
                  <label className="block font-bold mb-1 uppercase" style={{ color: 'var(--text-body)' }}>Price (₹ INR) *</label>
                  <input type="number" required min={10} value={svcPrice} onChange={(e) => setSvcPrice(e.target.value)} className="salon-input font-mono" />
                </div>
              </div>
              <div>
                <label className="block font-bold mb-1 uppercase" style={{ color: 'var(--text-body)' }}>Category</label>
                <select value={svcCategory} onChange={(e) => setSvcCategory(e.target.value)} className="salon-input">
                  <option value="Hair">Hair</option>
                  <option value="Beard">Beard</option>
                  <option value="Treatment">Treatment</option>
                  <option value="Massage">Massage</option>
                  <option value="Combo">Combo Package</option>
                </select>
              </div>
              <div className="flex gap-2.5 pt-3">
                <button type="button" onClick={() => setIsServiceModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={savingService} className="btn-primary flex-1">
                  {savingService ? 'Saving...' : 'Save Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
