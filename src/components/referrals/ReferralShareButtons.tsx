'use client';

import { Mail, Facebook, Twitter, MessageCircle } from 'lucide-react';

interface ReferralShareButtonsProps {
  referralLink: string;
}

const PLATFORMS = [
  { key: 'whatsapp', label: 'WhatsApp', Icon: MessageCircle, bg: 'bg-green-100',  text: 'text-green-600'  },
  { key: 'facebook', label: 'Facebook', Icon: Facebook,      bg: 'bg-blue-100',   text: 'text-blue-600'   },
  { key: 'twitter',  label: 'Twitter',  Icon: Twitter,       bg: 'bg-sky-100',    text: 'text-sky-600'    },
  { key: 'email',    label: 'Email',    Icon: Mail,          bg: 'bg-purple-100', text: 'text-purple-600' },
] as const;

type Platform = (typeof PLATFORMS)[number]['key'];

export default function ReferralShareButtons({ referralLink }: ReferralShareButtonsProps) {
  const share = (platform: Platform) => {
    const message = `¡Únete usando mi código de referido y obtén descuentos! ${referralLink}`;
    const urls: Record<Platform, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(message)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
      twitter:  `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`,
      email:    `mailto:?subject=¡Únete!&body=${encodeURIComponent(message)}`,
    };
    window.open(urls[platform], '_blank');
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {PLATFORMS.map(({ key, label, Icon, bg, text }) => (
        <button
          key={key}
          onClick={() => share(key)}
          className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className={`w-10 h-10 ${bg} rounded-full flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${text}`} />
          </div>
          <span className="font-medium text-gray-700">{label}</span>
        </button>
      ))}
    </div>
  );
}