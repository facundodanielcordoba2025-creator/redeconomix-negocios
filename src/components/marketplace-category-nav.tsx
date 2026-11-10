'use client';

import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import React from 'react';

type CategoryItem = {
  id: string;
  name: string;
  icon: React.ElementType;
};

type CategoryGroup = {
  title: string;
  icon: React.ElementType;
  items: CategoryItem[];
};

export function MarketplaceCategoryNav({
  groups,
  selectedCategory,
  onCategoryChange,
}: {
  groups: CategoryGroup[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}) {
  const defaultOpen = groups.map(g => g.title);

  return (
    <div className="flex h-full max-h-screen flex-col">
       <div className="flex-1 overflow-y-auto">
        <Accordion type="multiple" defaultValue={defaultOpen} className="w-full px-2">
          {groups.map((group) => (
            <AccordionItem value={group.title} key={group.title} className="border-b-0">
              <AccordionTrigger className="py-3 text-base font-semibold hover:no-underline px-2 text-muted-foreground hover:text-foreground">
                <div className="flex items-center gap-3">
                  <group.icon className="h-5 w-5" />
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">{group.title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-1">
                <div className="flex flex-col items-start gap-1 pl-4">
                  {group.items.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? 'secondary' : 'ghost'}
                      onClick={() => onCategoryChange(category.id)}
                      className="w-full justify-start gap-2 font-normal"
                    >
                      <category.icon className="h-4 w-4" />
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">{category.name}</span>
                    </Button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}
