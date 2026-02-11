import { generateWhatsAppLink } from '@/lib/whatsapp';
import { Camera } from 'lucide-react';

interface EquipmentCardProps {
    name: string;
    image: string;
    dailyRate: number;
    weeklyRate: number;
    available: boolean;
    specs: string[];
}

export function EquipmentCard({ name, dailyRate, weeklyRate, available, specs }: EquipmentCardProps) {
    return (
        <div className="group overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 transition-all hover:border-zinc-700">
            <div className="relative aspect-square overflow-hidden bg-zinc-900">
                {/* Placeholder for equipment image */}
                <div className="flex h-full items-center justify-center">
                    <Camera className="h-16 w-16 text-zinc-700" />
                </div>
                {available && (
                    <span className="absolute top-3 right-3 rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white">
                        Available
                    </span>
                )}
                {!available && (
                    <span className="absolute top-3 right-3 rounded-full bg-zinc-700 px-3 py-1 text-xs font-semibold text-white">
                        Rented
                    </span>
                )}
            </div>
            <div className="p-5">
                <h3 className="mb-2 text-lg font-bold text-white">{name}</h3>

                {/* Specs */}
                <ul className="mb-4 space-y-1">
                    {specs.slice(0, 3).map((spec, index) => (
                        <li key={index} className="text-xs text-zinc-400">• {spec}</li>
                    ))}
                </ul>

                {/* Pricing */}
                <div className="mb-4 flex items-baseline gap-3">
                    <div>
                        <p className="text-2xl font-bold text-blue-500">₹{dailyRate}</p>
                        <p className="text-xs text-zinc-500">/day</p>
                    </div>
                    <div>
                        <p className="text-lg font-semibold text-zinc-400">₹{weeklyRate}</p>
                        <p className="text-xs text-zinc-500">/week</p>
                    </div>
                </div>

                <a
                    href={generateWhatsAppLink('rentals', `I'd like to rent the ${name}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full rounded-lg bg-white py-3 text-center font-semibold text-zinc-900 transition-colors hover:bg-zinc-200"
                >
                    Rent This
                </a>
            </div>
        </div>
    );
}
