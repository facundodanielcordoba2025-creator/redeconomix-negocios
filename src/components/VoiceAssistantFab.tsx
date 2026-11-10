
'use client';

import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";

interface VoiceAssistantFabProps {
  onClick: () => void;
}

export function VoiceAssistantFab({ onClick }: VoiceAssistantFabProps) {
  return (
    <div className="fixed bottom-[7rem] right-4 z-50 md:bottom-6 md:right-6">
      <Button
        onClick={onClick}
        size="lg"
        className="rounded-full h-16 max-sm:h-12 w-16 shadow-lg bg-primary hover:bg-primary/90"
      >
        <Mic className="h-8 w-8" />
        <span className="sr-only">Buscar por voz</span>
      </Button>
    </div>
  );
}
