export interface Service {
  id: number;
  name_en: string;
  name_gu: string;
  duration: number; // in minutes
  price: number; // in INR
  category: string;
  active: number; // 1 or 0
}

export interface Barber {
  id: number;
  name: string;
  status: 'free' | 'busy' | 'on_break';
  on_duty: number;
  avatar: string;
  current_order_id: number | null;
  service_started_at: string | null;
  currentCustomer?: QueueEntry | null;
}

export interface QueueEntry {
  id: number;
  token: string;
  token_number: number;
  token_date: string;
  customer_name: string;
  customer_phone: string;
  preferred_barber: string;
  assigned_barber?: string | null;
  services: Service[];
  total_duration: number;
  total_price: number;
  status: 'Waiting' | 'Called' | 'In chair' | 'Done' | 'Cancelled' | 'No-show';
  source: 'remote' | 'walk-in';
  created_at: string;
  called_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  position?: number;
  estimatedWait?: number;
}

export interface SalonOverview {
  salonName: string;
  closingTime: string;
  isOnlineQueueOpen: boolean;
  queueClosedReason: string | null;
  waitingCount: number;
  estimatedWait: number;
  barbers: Barber[];
}

export interface AdminStats {
  customersServed: number;
  totalRevenue: number;
  noShows: number;
  averageWaitMinutes: number;
  onlineQueueOpen: boolean;
  closingTime: string;
}
