import type { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  status?: string;
}

export function KpiCard({ title, value, icon: Icon, color, status }: KpiCardProps) {
  return (
    <div 
      className="relative flex flex-col p-5 rounded-xl text-white overflow-hidden transition-transform hover:scale-[1.02] hover:shadow-xl"
      style={{ 
        background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
        boxShadow: `0 4px 20px ${color}40`
      }}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
        <Icon className="w-full h-full" />
      </div>
      
      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wider opacity-90">{title}</h3>
        </div>
        {status && (
          <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-black/30 text-white border border-white/20 backdrop-blur-sm">
            {status}
          </span>
        )}
      </div>
      <p className="mt-4 text-3xl font-bold relative z-10">{value}</p>
    </div>
  );
}
