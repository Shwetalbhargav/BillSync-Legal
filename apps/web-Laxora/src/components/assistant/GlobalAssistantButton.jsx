import { Bot, Sparkles } from "lucide-react";
import { Button } from "../common/Button";

export function GlobalAssistantButton() {
  return (
    <div className="fixed bottom-20 right-4 z-40 sm:bottom-5">
      <Button className="shadow-soft" type="button">
        <Bot className="h-4 w-4" />
        <span className="hidden sm:inline">Assistant</span>
        <Sparkles className="h-4 w-4 animate-pulse text-accentSoft" />
      </Button>
    </div>
  );
}
