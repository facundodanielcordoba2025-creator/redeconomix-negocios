'use client';

import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import Link from "next/link";

export function VirtualAssistantFab() {
  return (
    <div className="fixed bottom-24 right-4 z-50 md:bottom-6 md:right-6">
      <Button
        asChild
        size="lg"
        className="rounded-full h-16 max-sm:h-12 w-16 shadow-lg bg-primary hover:bg-primary/90"
      >
        <Link href="/redeconomix/servicios">
          <MessageSquare className="h-8 w-8" />
          <span className="sr-only">Abrir Asistente Virtual</span>
        </Link>
      </Button>
    </div>
  );
}
