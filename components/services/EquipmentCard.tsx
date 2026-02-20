'use client';

import { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Camera } from 'lucide-react';
import { generateWhatsAppLink } from '@/lib/whatsapp';

interface EquipmentCardProps {
  name: string;
  image: string;
  dailyRate: number;
  weeklyRate: number;
  available: boolean;
  specs: string[];
}

export function EquipmentCard({
  name,
  dailyRate,
  weeklyRate,
  available,
  specs,
}: EquipmentCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    cardRef.current.style.setProperty(
      '--mouse-x',
      `${e.clientX - rect.left}px`,
    );
    cardRef.current.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  }, []);

  return (
    <motion.div
      whileHover={{
        y: -8,
        transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
      }}
      className='group spotlight-card h-full'
      onMouseMove={handleMouseMove}
      style={
        { '--mouse-x': '-400px', '--mouse-y': '-400px' } as React.CSSProperties
      }
    >
      <div
        ref={cardRef}
        className='
          relative h-full overflow-hidden rounded-2xl
          border border-[rgba(194,178,128,0.15)]
          bg-[rgba(17,17,22,0.80)] backdrop-blur-md
          transition-all duration-300
          group-hover:border-[rgba(194,178,128,0.40)]
          group-hover:shadow-[0_20px_60px_rgba(194,178,128,0.20)]
        '
      >
        {/* Image / placeholder */}
        <div className='relative aspect-square overflow-hidden bg-[rgba(26,29,46,0.80)]'>
          <div className='flex h-full items-center justify-center'>
            <Camera className='h-16 w-16 text-[rgba(194,178,128,0.25)] transition-all duration-300 group-hover:text-[rgba(194,178,128,0.50)]' />
          </div>

          {/* Availability badge */}
          {available ? (
            <span
              className='
              absolute right-3 top-3 rounded-full
              border border-emerald-500/30 bg-emerald-500/15
              px-3 py-1 text-xs font-semibold text-emerald-400
            '
            >
              Available
            </span>
          ) : (
            <span
              className='
              absolute right-3 top-3 rounded-full
              border border-[rgba(194,178,128,0.20)] bg-[rgba(194,178,128,0.08)]
              px-3 py-1 text-xs font-semibold text-[rgba(194,178,128,0.60)]
            '
            >
              Rented
            </span>
          )}

          {/* Bottom gradient overlay */}
          <div className='absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#111116] to-transparent' />
        </div>

        {/* Card body */}
        <div className='p-5'>
          <h3 className='mb-3 text-base font-semibold text-white'>{name}</h3>

          {/* Specs */}
          <ul className='mb-4 space-y-1.5'>
            {specs.slice(0, 3).map((spec, i) => (
              <li
                key={i}
                className='flex items-center gap-2 text-xs text-[rgba(229,221,200,0.55)]'
              >
                <span className='h-1 w-1 flex-shrink-0 rounded-full bg-[#C2B280] opacity-60' />
                {spec}
              </li>
            ))}
          </ul>

          {/* Pricing */}
          <div className='mb-5 flex items-end gap-4'>
            <div>
              <p className='text-2xl font-bold text-[#C2B280]'>₹{dailyRate}</p>
              <p className='text-xs text-[rgba(229,221,200,0.45)]'>/day</p>
            </div>
            <div>
              <p className='text-base font-semibold text-[rgba(229,221,200,0.70)]'>
                ₹{weeklyRate}
              </p>
              <p className='text-xs text-[rgba(229,221,200,0.45)]'>/week</p>
            </div>
          </div>

          {/* CTA */}
          <a
            href={generateWhatsAppLink(
              'rentals',
              `I'd like to rent the ${name}`,
            )}
            target='_blank'
            rel='noopener noreferrer'
            className='
              block w-full rounded-xl py-3 text-center
              bg-gradient-to-r from-[#C2B280] to-[#D9CAA0]
              text-sm font-semibold text-[#0A0A0B]
              transition-all duration-200
              hover:shadow-[0_8px_28px_rgba(194,178,128,0.35)]
              hover:scale-[1.02] active:scale-[0.98]
            '
          >
            Rent This
          </a>
        </div>
      </div>
    </motion.div>
  );
}
