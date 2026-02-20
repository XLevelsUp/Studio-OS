'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import { generateWhatsAppLink } from '@/lib/whatsapp';

interface BookingFlyoutProps {
  service?: string;
}

export function BookingFlyout({ service }: BookingFlyoutProps = {}) {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 400, damping: 36 }}
          className='fixed bottom-6 right-6 z-50'
        >
          <AnimatePresence mode='wait'>
            {expanded ? (
              /* ── Expanded mini panel ── */
              <motion.div
                key='panel'
                initial={{ opacity: 0, scale: 0.94, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 12 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className='
                  w-72 overflow-hidden rounded-2xl
                  border border-[rgba(194,178,128,0.22)]
                  bg-[rgba(14,15,22,0.96)] backdrop-blur-2xl
                  shadow-[0_24px_80px_rgba(0,0,0,0.50),0_0_0_1px_rgba(194,178,128,0.08)]
                '
              >
                {/* Header */}
                <div className='flex items-start justify-between border-b border-[rgba(194,178,128,0.12)] p-4'>
                  <div>
                    <p className='text-[10px] font-semibold uppercase tracking-[0.18em] text-[#C2B280] opacity-80'>
                      Quick Inquiry
                    </p>
                    <p className='mt-0.5 text-sm font-semibold text-white'>
                      {service ?? 'Book a Session'}
                    </p>
                  </div>
                  <button
                    onClick={() => setExpanded(false)}
                    className='
                      flex h-7 w-7 items-center justify-center rounded-lg
                      border border-[rgba(194,178,128,0.15)] text-[#C2B280]
                      transition-all duration-200
                      hover:border-[rgba(194,178,128,0.40)] hover:bg-[rgba(194,178,128,0.12)]
                    '
                  >
                    <X className='h-3.5 w-3.5' />
                  </button>
                </div>

                {/* Body */}
                <div className='p-4'>
                  <p className='mb-4 text-xs text-[rgba(229,221,200,0.55)] leading-relaxed'>
                    Tap below to open WhatsApp with your enquiry pre-filled. We
                    typically respond within 30 minutes.
                  </p>
                  <a
                    href={generateWhatsAppLink(service)}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='
                      flex w-full items-center justify-center gap-2 rounded-xl py-3
                      bg-gradient-to-r from-[#C2B280] to-[#D9CAA0]
                      text-sm font-semibold text-[#0A0A0B]
                      transition-all duration-200
                      hover:shadow-[0_8px_28px_rgba(194,178,128,0.40)]
                      hover:scale-[1.02] active:scale-[0.98]
                    '
                  >
                    <MessageCircle className='h-4 w-4' />
                    Open WhatsApp
                  </a>
                </div>
              </motion.div>
            ) : (
              /* ── Collapsed pill button ── */
              <motion.button
                key='pill'
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.88 }}
                transition={{ duration: 0.18 }}
                onClick={() => setExpanded(true)}
                aria-label='Open quick inquiry'
                className='
                  flex items-center gap-3 rounded-full
                  border border-[rgba(194,178,128,0.35)]
                  bg-[rgba(14,15,22,0.90)] backdrop-blur-xl
                  px-5 py-3.5 text-sm font-semibold text-[#C2B280]
                  shadow-[0_8px_32px_rgba(0,0,0,0.40),0_0_0_1px_rgba(194,178,128,0.08)]
                  transition-all duration-200
                  hover:border-[rgba(194,178,128,0.60)]
                  hover:bg-[rgba(194,178,128,0.12)]
                  hover:text-white
                  hover:shadow-[0_8px_32px_rgba(194,178,128,0.25)]
                  animate-pulse-gold
                '
              >
                <MessageCircle className='h-4 w-4' />
                <span className='hidden sm:inline'>Quick Inquiry</span>
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
