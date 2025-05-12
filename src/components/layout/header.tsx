import { Button } from "@/components/ui/button";
import { Logo } from "@/components/icons/logo";
import { RotateCcw } from "lucide-react";

interface HeaderProps {
  onReset: () => void;
}

export function AppHeader({ onReset }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-primary">Chemical Imbalance</h1>
        </div>
        <Button variant="outline" size="icon" onClick={onReset} disabled aria-label="Reset Session">
          <RotateCcw className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
