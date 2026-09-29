import { LucideIcon } from 'lucide-react';
import { cn } from '../utils';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: string;
  color?: 'brand' | 'emerald' | 'amber' | 'red';
}

const colorMap = {
  brand: 'from-zinc-900 to-black border-zinc-800 text-white',
  emerald: 'from-zinc-900 to-black border-zinc-800 text-white',
  amber: 'from-zinc-900 to-black border-zinc-800 text-white',
  red: 'from-zinc-900 to-black border-zinc-800 text-zinc-400',
};

export function StatCard({ title, value, icon: Icon, trend, color = 'brand' }: StatCardProps) {
  return (
    <div className={cn(
      'rounded-xl border bg-gradient-to-br p-5 transition-all duration-200 hover:scale-[1.02]',
      colorMap[color]
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-surface-400 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {trend && <p className="text-xs text-surface-400 mt-1">{trend}</p>}
        </div>
        <div className={cn('p-2.5 rounded-lg bg-gradient-to-br', colorMap[color].split(' ')[0])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
