import React, { createContext, useContext, useState } from 'react';

export type Language = 'en' | 'gu';

interface Translations {
  [key: string]: {
    en: string;
    gu: string;
  };
}

export const translations: Translations = {
  salonName: {
    en: 'Twist and Trim',
    gu: 'ટ્વિસ્ટ એન્ડ ટ્રિમ',
  },
  openBadge: {
    en: 'Open · Closes 9 PM',
    gu: 'ખુલ્લું છે · રાત્રે 9 વાગ્યે બંધ થશે',
  },
  closedBadge: {
    en: 'Closed',
    gu: 'બંધ છે',
  },
  peopleWaiting: {
    en: 'people waiting',
    gu: 'લોકો રાહ જોઈ રહ્યા છે',
  },
  estimatedWait: {
    en: 'about {min} min',
    gu: 'આશરે {min} મિનિટ',
  },
  joinQueueBtn: {
    en: 'Join Queue',
    gu: 'કતારમાં જોડાઓ',
  },
  barberStatusBusy: {
    en: 'busy',
    gu: 'વ્યસ્ત',
  },
  barberStatusFree: {
    en: 'free',
    gu: 'મુક્ત',
  },
  barberStatusBreak: {
    en: 'on break',
    gu: 'વિરામ પર',
  },
  customerName: {
    en: 'Your Name',
    gu: 'તમારું નામ',
  },
  enterYourName: {
    en: 'Enter your full name',
    gu: 'તમારું પૂરું નામ લખો',
  },
  phoneNumber: {
    en: 'Phone Number (10 digits)',
    gu: 'મોબાઇલ નંબર (૧૦ અંક)',
  },
  selectServices: {
    en: 'Select Services (Max 3)',
    gu: 'સેવાઓ પસંદ કરો (મહત્તમ ૩)',
  },
  selectBarber: {
    en: 'Choose Barber',
    gu: 'વાળંદ પસંદ કરો',
  },
  anyBarberFastest: {
    en: 'Any Barber (Fastest)',
    gu: 'કોઈપણ વાળંદ (સૌથી ઝડપી)',
  },
  totalSummary: {
    en: 'Total: {duration} min · ₹{price} · Expected wait ~{wait} min',
    gu: 'કુલ: {duration} મિનિટ · ₹{price} · અંદાજિત રાહ ~{wait} મિનિટ',
  },
  confirmAndJoin: {
    en: 'Confirm & Join Queue',
    gu: 'પુષ્ટિ કરો અને જોડાઓ',
  },
  tokenNumber: {
    en: 'Token Number',
    gu: 'ટોકન નંબર',
  },
  positionInLine: {
    en: '{pos} in line',
    gu: 'કતારમાં {pos} મો વારો',
  },
  startComingBanner: {
    en: '🏃‍♂️ Start coming to the salon! Your turn is very close.',
    gu: '🏃‍♂️ સલૂન પર આવવાનું શરૂ કરો! તમારો વારો નજીક છે.',
  },
  itsYourTurnAlert: {
    en: "It's your turn! Go to {barber}",
    gu: 'તમારો વારો આવી ગયો! {barber} પાસે જાઓ',
  },
  cancelMySpot: {
    en: 'Cancel My Spot',
    gu: 'મારો વારો રદ કરો',
  },
  confirmCancelModal: {
    en: 'Are you sure you want to cancel your queue spot?',
    gu: 'શું તમે ખરેખર તમારો વારો રદ કરવા માંગો છો?',
  },
  receptionTitle: {
    en: 'Reception Dashboard',
    gu: 'રિસેપ્શન ડેશબોર્ડ',
  },
  addWalkIn: {
    en: '+ Add Walk-in',
    gu: '+ વૉક-ઇન ગ્રાહક ઉમેરો',
  },
  callNext: {
    en: 'Call Next',
    gu: 'આગળના ગ્રાહકને બોલાવો',
  },
  waitingList: {
    en: 'Live Waiting List',
    gu: 'કતારમાં રાહ જોતા ગ્રાહકો',
  },
  noShow: {
    en: 'No-show',
    gu: 'ગેરહાજર',
  },
  cancel: {
    en: 'Cancel',
    gu: 'રદ કરો',
  },
  barberViewTitle: {
    en: 'Barber Console',
    gu: 'વાળંદ સ્ક્રીન',
  },
  currentCustomer: {
    en: 'Current Customer',
    gu: 'હાલના ગ્રાહક',
  },
  nextForYou: {
    en: 'Next for you',
    gu: 'તમારા માટે આગામી',
  },
  startService: {
    en: 'Start Service',
    gu: 'સેવા શરૂ કરો',
  },
  doneService: {
    en: 'Mark as Done',
    gu: 'પૂર્ણ જાહેર કરો',
  },
  availableStatus: {
    en: 'Available',
    gu: 'ઉપલબ્ધ',
  },
  onBreakStatus: {
    en: 'On Break',
    gu: 'વિરામ પર',
  },
  tvTitle: {
    en: 'Now Serving & Up Next',
    gu: 'હાલમાં સેવા અને આગામી વારો',
  },
  adminTitle: {
    en: 'Owner Management Settings',
    gu: 'સલૂન માલિક સેટિંગ્સ',
  },
  onlineQueueToggle: {
    en: 'Online Queue Joining',
    gu: 'ઓનલાઇન કતાર બુકિંગ',
  },
  customersServedToday: {
    en: 'Customers Served Today',
    gu: 'આજે પૂર્ણ થયેલ ગ્રાહકો',
  },
  averageWaitTime: {
    en: 'Average Wait Time',
    gu: 'સરેરાશ પ્રતીક્ષા સમય',
  },
  noShowsCount: {
    en: 'No-Shows Recorded',
    gu: 'ગેરહાજર ગ્રાહકો',
  },
  totalRevenueToday: {
    en: "Today's Revenue",
    gu: 'આજની કમાણી',
  },
  noOneWaiting: {
    en: 'No one waiting — walk right in!',
    gu: 'હાલ કોઈ પ્રતીક્ષામાં નથી — સીધા અંદર આવી શકો છો!',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('salon_lang') as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('salon_lang', lang);
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const entry = translations[key];
    let text = entry ? entry[language] || entry.en : key;
    if (params) {
      Object.entries(params).forEach(([paramKey, val]) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(val));
      });
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
