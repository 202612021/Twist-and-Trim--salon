import type { Service, Barber, QueueEntry, SalonOverview, AdminStats } from '../types';

const BASE_URL = window.location.hostname === 'localhost'
  ? '/api'
  : 'https://twist-and-trim-salon.onrender.com/api';

export const api = {
  async getOverview(): Promise<SalonOverview> {
    const res = await fetch(`${BASE_URL}/overview`);
    if (!res.ok) throw new Error('Failed to fetch salon overview');
    return res.json();
  },

  async getServices(all = false): Promise<Service[]> {
    const res = await fetch(`${BASE_URL}/services?all=${all}`);
    if (!res.ok) throw new Error('Failed to fetch services');
    return res.json();
  },

  async createService(data: Partial<Service>): Promise<Service> {
    const res = await fetch(`${BASE_URL}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to create service');
    return res.json();
  },

  async updateService(id: number, data: Partial<Service>): Promise<Service> {
    const res = await fetch(`${BASE_URL}/services/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to update service');
    return res.json();
  },

  async getBarbers(): Promise<Barber[]> {
    const res = await fetch(`${BASE_URL}/barbers`);
    if (!res.ok) throw new Error('Failed to fetch barbers');
    return res.json();
  },

  async updateBarberStatus(id: number, status?: string, on_duty?: boolean): Promise<Barber> {
    const res = await fetch(`${BASE_URL}/barbers/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, on_duty }),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to update barber status');
    return res.json();
  },

  async joinQueue(data: {
    name: string;
    phone: string;
    services: Service[];
    preferred_barber?: string;
    source?: 'remote' | 'walk-in';
  }): Promise<{ duplicate?: boolean; message?: string; entry?: QueueEntry } & QueueEntry> {
    const res = await fetch(`${BASE_URL}/queue/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to join queue');
    return json;
  },

  async getQueue(): Promise<QueueEntry[]> {
    const res = await fetch(`${BASE_URL}/queue`);
    if (!res.ok) throw new Error('Failed to fetch queue');
    return res.json();
  },

  async getQueueEntry(id: string | number): Promise<QueueEntry> {
    const res = await fetch(`${BASE_URL}/queue/${id}`);
    if (!res.ok) throw new Error('Failed to fetch queue entry');
    return res.json();
  },

  async cancelQueueEntry(id: string | number): Promise<{ success: boolean }> {
    const res = await fetch(`${BASE_URL}/queue/${id}/cancel`, {
      method: 'POST',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to cancel queue entry');
    return json;
  },

  async callNext(barberName: string): Promise<QueueEntry> {
    const res = await fetch(`${BASE_URL}/barbers/${barberName}/call-next`, {
      method: 'POST',
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to call next customer');
    return json;
  },

  async updateEntryStatus(id: number | string, status: string): Promise<QueueEntry> {
    const res = await fetch(`${BASE_URL}/queue/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Failed to update entry status');
    return json;
  },

  async getAdminStats(): Promise<AdminStats> {
    const res = await fetch(`${BASE_URL}/admin/stats`);
    if (!res.ok) throw new Error('Failed to fetch admin stats');
    return res.json();
  },

  async updateAdminSettings(data: { online_queue_open?: boolean; closing_time?: string }): Promise<{ success: boolean }> {
    const res = await fetch(`${BASE_URL}/admin/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update admin settings');
    return res.json();
  },
};
