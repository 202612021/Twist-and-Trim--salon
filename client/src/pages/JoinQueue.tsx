import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scissors, Clock, Check, AlertCircle, ArrowLeft,
  User, Phone, Sparkles, Zap,
} from 'lucide-react';
import { api } from '../services/api';
import type { Service, Barber } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

export const JoinQueue: React.FC = () => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<string>('Any');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [servicesData, barbersData] = await Promise.all([
          api.getServices(false),
          api.getBarbers(),
        ]);
        setServices(servicesData);
        setBarbers(barbersData.filter((b) => b.on_duty === 1));
      } catch (err) {
        console.error('Failed to load:', err);
        setErrorMsg('Could not load salon services. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const toggleService = (service: Service) => {
    const exists = selectedServices.some((s) => s.id === service.id);
    if (exists) {
      setSelectedServices(selectedServices.filter((s) => s.id !== service.id));
      setErrorMsg(null);
    } else {
      if (selectedServices.length >= 3) {
        setErrorMsg(language === 'gu'
          ? 'વધુમાં વધુ ૩ સેવાઓ પસંદ કરી શકાય'
          : 'Maximum 3 services can be selected');
        return;
      }
      setSelectedServices([...selectedServices, service]);
      setErrorMsg(null);
    }
  };

  const totalDuration = selectedServices.reduce((s, x) => s + x.duration, 0);
  const totalPrice    = selectedServices.reduce((s, x) => s + x.price, 0);
  const onDutyCount   = Math.max(1, barbers.filter((b) => b.status !== 'on_break').length);
  const estimatedWait = Math.max(5, Math.round((totalDuration * 1.5) / onDutyCount));

  const cleanedPhone  = phone.replace(/\D/g, '');
  const isPhoneValid  = cleanedPhone.length === 10;
  const isFormValid   = name.trim().length > 0 && isPhoneValid && selectedServices.length > 0;
  const categories    = ['All', ...Array.from(new Set(services.map((s) => s.category)))];
  const filteredServices = selectedCategory === 'All' ? services : services.filter((s) => s.category === selectedCategory);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!name.trim()) {
      setErrorMsg(language === 'gu' ? 'નામ દાખલ કરો' : 'Please enter your name');
      return;
    }
    if (!isPhoneValid) {
      setErrorMsg(language === 'gu' ? '૧૦ અંકનો નંબર નાખો' : 'Please enter a valid 10-digit mobile number');
      return;
    }
    if (selectedServices.length === 0) {
      setErrorMsg(language === 'gu' ? 'ઓછામાં ઓછી ૧ સેવા પસંદ કરો' : 'Please select at least 1 service');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.joinQueue({
        name: name.trim(),
        phone: cleanedPhone,
        services: selectedServices,
        preferred_barber: selectedBarber,
        source: 'remote',
      });
      if (response.duplicate && response.entry) {
        alert(language === 'gu'
          ? 'તમારો ટોકન પહેલેથી સક્રિય છે.'
          : 'You already have an active spot. Redirecting to your status.');
        navigate(`/status/${response.entry.id}`);
        return;
      }
      navigate(`/status/${response.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to join queue. Please try again.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
        <div className="skeleton h-40 w-full" />
        <div className="skeleton h-60 w-full" />
        <div className="skeleton h-36 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-44 space-y-5">

      {/* Top Back Header */}
      <div className="flex items-center gap-3 border-b pb-4" style={{ borderColor: 'var(--border-soft)' }}>
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-xl bg-white border hover:bg-slate-50 transition-colors shadow-sm"
          style={{ borderColor: 'var(--border-soft)' }}
        >
          <ArrowLeft className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-1.5" style={{ color: 'var(--text-heading)' }}>
            {t('joinQueueBtn')}
            <Sparkles className="w-4 h-4" style={{ color: 'var(--primary)' }} />
          </h1>
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            {language === 'gu' ? 'ત્રણ સ્ટેપ — ૨ મિનિટ' : 'Reserve your chair in 3 easy steps'}
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl flex items-center gap-2.5 text-sm bg-red-50 border border-red-200 text-red-800">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
          <span className="font-medium text-xs">{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── STEP 1: Details ── */}
        <div className="salon-card p-5 space-y-4">
          <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: 'var(--border-soft)' }}>
            <span className="section-label">
              <User className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              1. {language === 'gu' ? 'તમારી વિગતો' : 'Your Details'}
            </span>
            <span className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>Required</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-body)' }}>
                {t('customerName')} *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('enterYourName')}
                className="salon-input"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5" style={{ color: 'var(--text-body)' }}>
                {t('phoneNumber')} *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 flex items-center gap-1 text-sm font-bold" style={{ color: 'var(--text-muted)' }}>
                  <Phone className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} /> +91
                </span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="9876543210"
                  className="salon-input pl-16 font-mono"
                />
              </div>
              {phone.length > 0 && !isPhoneValid && (
                <span className="text-[11px] font-medium mt-1 block text-red-600">
                  {language === 'gu' ? '૧૦ અંક પૂર્ણ કરો' : `${cleanedPhone.length}/10 digits`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── STEP 2: Services ── */}
        <div className="salon-card p-5 space-y-3.5">
          <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: 'var(--border-soft)' }}>
            <span className="section-label">
              <Scissors className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              2. {t('selectServices')}
            </span>
            <span
              className="text-xs font-bold px-2.5 py-0.5 rounded-full border"
              style={{
                background: selectedServices.length > 0 ? 'var(--primary-light)' : '#F3F4F6',
                color: selectedServices.length > 0 ? 'var(--primary)' : 'var(--text-muted)',
                borderColor: selectedServices.length > 0 ? 'var(--border-accent)' : 'var(--border-soft)',
              }}
            >
              {selectedServices.length}/3 {language === 'gu' ? 'પસંદ' : 'selected'}
            </span>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                type="button"
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all"
                style={
                  selectedCategory === cat
                    ? { background: 'var(--primary)', color: '#FFFFFF' }
                    : { background: '#F3F4F6', color: 'var(--text-muted)' }
                }
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Services List */}
          <div className="grid grid-cols-1 gap-2.5">
            {filteredServices.map((service) => {
              const isSelected = selectedServices.some((s) => s.id === service.id);
              const displayName = language === 'gu' ? service.name_gu : service.name_en;
              return (
                <button
                  type="button"
                  key={service.id}
                  onClick={() => toggleService(service)}
                  className="p-3.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 min-h-[52px]"
                  style={
                    isSelected
                      ? { background: 'var(--primary-light)', borderColor: 'var(--primary)', boxShadow: 'var(--shadow-sm)' }
                      : { background: '#FFFFFF', borderColor: 'var(--border-soft)' }
                  }
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center border flex-shrink-0 transition-all"
                      style={
                        isSelected
                          ? { background: 'var(--primary)', borderColor: 'var(--primary)', color: '#FFF' }
                          : { borderColor: '#D1D5DB', background: '#F9FAFB' }
                      }
                    >
                      {isSelected && <Check className="w-4 h-4" strokeWidth={3} />}
                    </div>
                    <div>
                      <div className="font-bold text-sm" style={{ color: 'var(--text-heading)' }}>{displayName}</div>
                      <div className="text-xs flex items-center gap-1 mt-0.5 font-medium" style={{ color: 'var(--text-muted)' }}>
                        <Clock className="w-3 h-3" /> {service.duration} mins
                      </div>
                    </div>
                  </div>
                  <span className="font-bold text-sm" style={{ color: 'var(--text-heading)' }}>₹{service.price}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── STEP 3: Choose Stylist ── */}
        <div className="salon-card p-5 space-y-3.5">
          <div className="flex items-center justify-between border-b pb-2.5" style={{ borderColor: 'var(--border-soft)' }}>
            <span className="section-label">
              <User className="w-4 h-4" style={{ color: 'var(--primary)' }} />
              3. {t('selectBarber')}
            </span>
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Optional</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Any Barber */}
            <button
              type="button"
              onClick={() => setSelectedBarber('Any')}
              className="p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 min-h-[52px]"
              style={
                selectedBarber === 'Any'
                  ? { background: 'var(--primary-light)', borderColor: 'var(--primary)' }
                  : { background: '#FFFFFF', borderColor: 'var(--border-soft)' }
              }
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--primary-light)' }}>
                <Zap className="w-4 h-4 fill-current" style={{ color: 'var(--primary)' }} />
              </div>
              <div>
                <div className="font-bold text-xs" style={{ color: 'var(--text-heading)' }}>
                  {language === 'gu' ? 'કોઈપણ (ઝડપી)' : 'Any Stylist'}
                </div>
                <span className="text-[10px] font-bold block mt-0.5" style={{ color: 'var(--primary)' }}>⚡ Fastest</span>
              </div>
            </button>

            {barbers.map((barber) => {
              const isSelected = selectedBarber === barber.name;
              const isOnBreak = barber.status === 'on_break';
              return (
                <button
                  type="button"
                  key={barber.id}
                  onClick={() => setSelectedBarber(barber.name)}
                  className="p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 min-h-[52px]"
                  style={
                    isSelected
                      ? { background: 'var(--primary-light)', borderColor: 'var(--primary)' }
                      : { background: '#FFFFFF', borderColor: 'var(--border-soft)' }
                  }
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-base flex-shrink-0">
                    {barber.avatar || '✂️'}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs truncate" style={{ color: 'var(--text-heading)' }}>{barber.name}</div>
                    <span
                      className="text-[10px] font-semibold block mt-0.5"
                      style={{
                        color: isOnBreak ? '#92400E' : barber.status === 'free' ? '#065F46' : 'var(--text-muted)',
                      }}
                    >
                      {isOnBreak ? t('barberStatusBreak') : barber.status === 'free' ? t('barberStatusFree') : t('barberStatusBusy')}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Sticky Summary + Confirm Bar ── */}
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t p-3.5 z-30"
          style={{ borderColor: 'var(--border-soft)', boxShadow: '0 -4px 20px rgba(0,0,0,0.06)' }}>
          <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                <Clock className="w-3 h-3" style={{ color: 'var(--primary)' }} />
                {t('totalSummary', { duration: totalDuration, price: totalPrice, wait: estimatedWait })}
              </div>
              <div className="text-base font-extrabold" style={{ color: 'var(--text-heading)' }}>
                ₹{totalPrice}{' '}
                <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
                  ({selectedServices.length} {selectedServices.length === 1 ? 'service' : 'services'} · {totalDuration}m)
                </span>
              </div>
            </div>
            <button
              type="submit"
              disabled={!isFormValid || submitting}
              className="btn-primary text-xs font-bold px-5"
            >
              {submitting ? 'Booking...' : t('confirmAndJoin')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
