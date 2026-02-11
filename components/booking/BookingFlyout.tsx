'use client';

import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { generateWhatsAppLink } from '@/lib/whatsapp';

interface BookingFlyoutProps {
    service?: string;
}

export function BookingFlyout({ service }: BookingFlyoutProps = {}) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), 2000);
        return () => clearTimeout(timer);
    }, []);

    if (!visible) return null;

    return (
        <a
            href={generateWhatsAppLink(service)}
            target="_blank"
            rel="noopener noreferrer"
            className="
        fixed bottom-6 right-6 z-50
        flex items-center gap-3 rounded-full
        bg-green-600 px-6 py-4 text-white shadow-2xl
        transition-all duration-300 hover:scale-110 hover:bg-green-500
        hover:shadow-green-500/50
        md:px-8
      "
            aria-label="Quick inquiry via WhatsApp"
        >
            <MessageCircle className="h-6 w-6" />
            <span className="hidden font-semibold md:inline">Quick Inquiry</span>
        </a>
    );
}
