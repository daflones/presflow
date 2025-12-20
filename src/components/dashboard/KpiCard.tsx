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
    <div className={`relative flex flex-col p-4 rounded-lg shadow-md text-white`} style={{ backgroundColor: color }}>
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <Icon className="w-6 h-6 mr-3" />
          <h3 className="text-sm font-semibold uppercase tracking-wider">{title}</h3>
        </div>
        {status && (
          <span className={`px-2 py-1 text-xs font-bold rounded-full bg-black bg-opacity-20`}>
            {status}
          </span>
        )}
      </div>
      <p className="mt-4 text-4xl font-bold">{value}</p>
    </div>
  );
}
