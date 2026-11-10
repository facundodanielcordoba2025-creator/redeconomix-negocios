'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, TrendingDown, Landmark, Globe2, MapPin, Trophy } from 'lucide-react';

const categories = [
  { id: 'pop-culture', name: 'Cultura Pop', icon: Sparkles },
  { id: 'economy', name: 'Economía', icon: TrendingDown },
  { id: 'finance', name: 'Finanzas', icon: Landmark },
  { id: 'geopolitics', name: 'Geopolítica', icon: Globe2 },
  { id: 'argentina', name: 'Argentina', icon: MapPin },
  { id: 'futbol-ar', name: 'Fútbol AR', icon: Trophy },
];

export function CategoryNav({ activeId, onSelect }: { activeId: string; onSelect: (id: string) => void }) {
  return (
    <div className="sticky top-[calc(65px+env(safe-area-inset-top))] pt-4 pb-2 z-40 bg-white  border-b border-slate-100 w-full font-outfit">
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar px-4 h-14">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all",
                isActive 
                  ? "bg-primary/10 text-primary shadow-sm" 
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              <Icon className="h-4 w-4" />
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
