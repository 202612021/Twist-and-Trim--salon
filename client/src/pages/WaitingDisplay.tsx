import React, { useEffect, useState } from 'react';
import { Scissors, Clock, Volume2, Sparkles, User } from 'lucide-react';
import { api } from '../services/api';
import { socket } from '../services/socket';
import type { Barber, QueueEntry } from '../types';
import { playCallChime } from '../utils/audioChime';

export const WaitingDisplay: React.FC = () => {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [flashToken, setFlashToken] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  const fetchData = async () => {
    try {
      const [barberList, queueList] = await Promise.all([api.getBarbers(), api.getQueue()]);
      setBarbers(barberList.filter((b) => b.on_duty === 1));
      setQueue(queueList);
    } catch (err) {
      console.error('Error fetching TV display data:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    const handleUpdate = () => fetchData();
    const handleTokenCalled = (payload: { token: string; customer_name: string; assigned_barber: string }) => {
      setFlashToken(payload.token);
      playCallChime();
      fetchData();
      setTimeout(() => setFlashToken((cur) => (cur === payload.token ? null : cur)), 6000);
    };
    socket.on('queue:updated', handleUpdate);
    socket.on('barbers:updated', handleUpdate);
    socket.on('token:called', handleTokenCalled);
    return () => {
      clearInterval(timer);
      socket.off('queue:updated', handleUpdate);
      socket.off('barbers:updated', handleUpdate);
      socket.off('token:called', handleTokenCalled);
    };
  }, []);

  const waitingTokens = queue.filter((q) => q.status === 'Waiting').slice(0, 5);

  return (
    <div className="tv-screen p-8 sm:p-12 flex flex-col justify-between select-none overflow-hidden font-sans min-h-screen">

      {/* ══ TOP HEADER ══ */}
      <div className="flex items-center justify-between border-b pb-6" style={{ borderColor: 'rgba(52,211,153,0.3)' }}>
        <div className="flex items-center gap-5">
          {/* Logo Badge */}
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center shadow-xl" style={{ background: 'rgba(52,211,153,0.15)', border: '2px solid rgba(52,211,153,0.4)' }}>
            <Scissors className="w-9 h-9 stroke-[2]" style={{ color: '#34D399' }} />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              TWIST &amp; TRIM
              <span className="text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-widest" style={{ background: 'rgba(245,158,11,0.2)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.4)' }}>
                Waiting Lounge Display
              </span>
            </h1>
            <p className="text-sm mt-1 font-semibold" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Live Station Status &amp; Queue Board · 1080p High-Visibility Interface
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-4xl sm:text-5xl font-mono font-black tracking-widest" style={{ color: '#F59E0B' }}>
            {currentTime}
          </div>
          <div className="text-xs font-bold flex items-center justify-end gap-1.5 mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <Volume2 className="w-4 h-4" style={{ color: '#34D399' }} /> Audio Turn Chimes Active
          </div>
        </div>
      </div>

      {/* ══ MAIN GRID ══ */}
      <div className="grid grid-cols-12 gap-8 my-auto py-8">

        {/* LEFT: Now Serving at Stations */}
        <div className="col-span-12 lg:col-span-7 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider flex items-center gap-3" style={{ color: '#34D399' }}>
              <Sparkles className="w-6 h-6" style={{ color: '#F59E0B' }} />
              NOW STYLING AT STATIONS
            </h2>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {barbers.length} Active Stylists
            </span>
          </div>

          <div className="space-y-4">
            {barbers.map((barber) => {
              const customer = barber.currentCustomer;
              const isServing  = Boolean(customer && (customer.status === 'In chair' || customer.status === 'Called'));
              const isNewlyCalled = customer?.token === flashToken;
              const isOnBreak  = barber.status === 'on_break';

              return (
                <div
                  key={barber.id}
                  className="rounded-3xl p-6 border-2 transition-all flex items-center justify-between"
                  style={
                    isNewlyCalled
                      ? { background: 'linear-gradient(135deg, #064E3B 0%, #065F46 100%)', borderColor: '#34D399', boxShadow: '0 0 40px rgba(52,211,153,0.4)', transform: 'scale(1.02)' }
                      : isServing
                      ? { background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(52,211,153,0.3)' }
                      : isOnBreak
                      ? { background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.1)', opacity: 0.6 }
                      : { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }
                  }
                >
                  {/* Barber Info */}
                  <div className="flex items-center gap-5">
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl border"
                      style={
                        isNewlyCalled
                          ? { background: 'rgba(52,211,153,0.2)', borderColor: '#34D399' }
                          : { background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)' }
                      }
                    >
                      {barber.avatar || '✂️'}
                    </div>
                    <div>
                      <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">{barber.name}</h3>
                      <span
                        className="text-xs font-bold uppercase tracking-widest"
                        style={{
                          color: isNewlyCalled ? '#34D399'
                               : isOnBreak     ? '#F59E0B'
                               : isServing     ? '#34D399'
                               : 'rgba(255,255,255,0.4)',
                        }}
                      >
                        {isOnBreak ? 'On Break' : isServing ? 'In Service' : 'Chair Ready'}
                      </span>
                    </div>
                  </div>

                  {/* Customer Token */}
                  <div className="text-right">
                    {customer ? (
                      <div>
                        <div className="text-5xl sm:text-6xl font-black tracking-tight" style={{ color: isNewlyCalled ? '#34D399' : '#F59E0B' }}>
                          {customer.token}
                        </div>
                        <div className="text-base font-bold truncate max-w-[220px] text-white">{customer.customer_name}</div>
                        {customer.status === 'Called' && (
                          <span
                            className="inline-block mt-1 text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full"
                            style={
                              isNewlyCalled
                                ? { background: 'rgba(52,211,153,0.3)', color: '#34D399', border: '1px solid #34D399' }
                                : { background: 'rgba(245,158,11,0.2)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.5)' }
                            }
                          >
                            CALLED · PLEASE PROCEED
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-lg font-bold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {isOnBreak ? '☕ Resting' : '✨ Available'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Up Next */}
        <div className="col-span-12 lg:col-span-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider flex items-center gap-3" style={{ color: '#F59E0B' }}>
              <Clock className="w-6 h-6" style={{ color: '#F59E0B' }} />
              UP NEXT IN LINE
            </h2>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {waitingTokens.length} Queued
            </span>
          </div>

          <div className="rounded-3xl p-6 sm:p-7 space-y-3.5 shadow-xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(52,211,153,0.2)' }}>
            {waitingTokens.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <User className="w-14 h-14 mx-auto" style={{ color: 'rgba(255,255,255,0.15)' }} />
                <div className="text-lg font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>No Guests Waiting</div>
                <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>Styling chairs are open for walk-ins.</p>
              </div>
            ) : (
              waitingTokens.map((entry, index) => (
                <div
                  key={entry.id}
                  className="rounded-2xl p-4 flex items-center justify-between transition-all"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className="w-10 h-10 rounded-xl font-mono font-black text-lg flex items-center justify-center"
                      style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }}
                    >
                      #{index + 1}
                    </span>
                    <div>
                      <div className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: '#34D399' }}>
                        {entry.token}
                      </div>
                      <div className="text-xs font-semibold text-white">
                        {entry.customer_name} ·{' '}
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>Pref: {entry.preferred_barber}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base sm:text-lg font-bold" style={{ color: '#F59E0B' }}>~{entry.estimatedWait || 5} min</div>
                    <div className="text-[10px] uppercase tracking-wide font-semibold" style={{ color: 'rgba(255,255,255,0.3)' }}>Est. wait</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ══ BOTTOM TICKER ══ */}
      <div className="border-t pt-5 flex flex-col sm:flex-row items-center justify-between text-xs gap-2" style={{ borderColor: 'rgba(52,211,153,0.2)' }}>
        <span className="flex items-center gap-2 font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          When your token is highlighted in green, please walk directly to your stylist's station.
        </span>
        <span className="font-bold tracking-wider uppercase" style={{ color: 'rgba(255,255,255,0.7)' }}>
          Twist &amp; Trim · Hair &amp; Grooming Studio
        </span>
      </div>
    </div>
  );
};
