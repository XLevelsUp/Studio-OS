import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface ServiceCardProps {
    title: string;
    description: string;
    icon: React.ReactElement<LucideIcon>;
    href: string;
    accentColor: 'amber' | 'blue' | 'purple' | 'green';
}

export function ServiceCard({ title, description, icon, href, accentColor }: ServiceCardProps) {
    const accentClasses = {
        amber: 'hover:shadow-amber-500/20 border-amber-500/20 hover:border-amber-500/40',
        blue: 'hover:shadow-blue-500/20 border-blue-500/20 hover:border-blue-500/40',
        purple: 'hover:shadow-purple-500/20 border-purple-500/20 hover:border-purple-500/40',
        green: 'hover:shadow-green-500/20 border-green-500/20 hover:border-green-500/40',
    };

    return (
        <Link href={href}>
            <div className={`
        group relative overflow-hidden rounded-2xl border bg-zinc-900/50 backdrop-blur-sm
        p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl
        ${accentClasses[accentColor]}
      `}>
                <div className="mb-4 text-4xl">{icon}</div>
                <h3 className="mb-2 text-2xl font-bold text-white">{title}</h3>
                <p className="mb-6 text-zinc-400">{description}</p>
                <span className="text-sm font-semibold text-white transition-transform group-hover:translate-x-1">
                    Explore →
                </span>
            </div>
        </Link>
    );
}
