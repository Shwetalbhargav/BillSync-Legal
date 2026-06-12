import { Bot, Sparkles } from "lucide-react";
import { Button } from "../common/Button";

export function GlobalAssistantButton() {
  return (
    <div className="fixed bottom-24 right-4 z-40 sm:bottom-5">
      <Button className="shadow-soft" type="button" aria-label="Open assistant">
        <Bot className="h-4 w-4" />
        <span className="hidden sm:inline">Assistant</span>
        <Sparkles className="h-4 w-4 animate-pulse text-accentSoft motion-reduce:animate-none" aria-hidden="true" />
      </Button>
    </div>
  );
}
