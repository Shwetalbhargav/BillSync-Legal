import { useEffect, useRef, useState } from "react";
import { Bot, ExternalLink, Send, Sparkles, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { aiWorkspaceApi } from "../../api";
import { Button, Toast } from "../common";

const starterPrompts = [
  "What should I do next on this screen?",
  "Guide me through today's work flow.",
  "How does the Chrome extension work?",
];

export function GlobalAssistantDrawer({ isOpen, onClose }) {
  const location = useLocation();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Ask me how to use BillSync, what to do next in your daily work, or how a workflow connects across tasks, work meter, captured work, matters, billing, and the extension.",
    },
  ]);
  const [notice, setNotice] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  async function submit(event) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) {
      setNotice({ tone: "warning", title: "Add a request", message: "Write what you need help with before sending." });
      return;
    }

    setNotice(null);
    setInput("");
    setIsLoading(true);
    setMessages((current) => [...current, { role: "user", text: trimmed }]);

    try {
      const result = await aiWorkspaceApi.assist(trimmed, {
        currentPath: location.pathname,
        surface: "global_assistant",
      });
      setMessages((current) => [
        ...current,
        { role: "assistant", title: result.title || "Assistant response", text: result.text || "I could not prepare a response." },
      ]);
    } catch (error) {
      setNotice({ tone: "warning", title: "Assistant is not ready", message: error?.userMessage || "Please try again in a moment." });
      setMessages((current) => [
        ...current,
        { role: "assistant", text: "I could not reach the assistant service. Check that the API server is running and you are signed in." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/30 p-3 sm:p-5" role="dialog" aria-modal="true" aria-label="Global assistant">
      <section className="flex h-full w-full max-w-[440px] flex-col overflow-hidden rounded-lg border border-border bg-panel shadow-soft">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blueSoft text-primary">
              <Bot className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="safe-text font-bold text-primary">Assistant</h2>
              <p className="text-xs text-muted">Global drafting and quick help</p>
            </div>
          </div>
          <Button aria-label="Close assistant" size="icon" type="button" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </header>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          {notice ? <Toast tone={notice.tone} title={notice.title} message={notice.message} /> : null}
          {messages.map((message, index) => (
            <article
              className={message.role === "user" ? "ml-8 rounded-lg bg-primary px-3 py-2 text-sm leading-6 text-white" : "mr-8 rounded-lg border border-border bg-blueSoft px-3 py-2 text-sm leading-6 text-ink"}
              key={`${message.role}-${index}`}
            >
              {message.title ? <p className="mb-1 font-semibold text-primary">{message.title}</p> : null}
              <p className="whitespace-pre-wrap">{message.text}</p>
            </article>
          ))}
          {isLoading ? (
            <div className="mr-8 flex items-center gap-2 rounded-lg border border-border bg-blueSoft px-3 py-2 text-sm text-muted">
              <Sparkles className="h-4 w-4 animate-pulse text-accent" />
              Preparing response
            </div>
          ) : null}
        </div>

        <div className="border-t border-border p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {starterPrompts.map((prompt) => (
              <button
                className="focus-ring rounded-lg border border-border px-2.5 py-1.5 text-left text-xs font-semibold text-primary hover:bg-blueSoft"
                key={prompt}
                onClick={() => setInput(prompt)}
                type="button"
              >
                {prompt}
              </button>
            ))}
          </div>
          <form className="space-y-3" onSubmit={submit}>
            <textarea
              className="form-input min-h-24 resize-none"
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask how to use this screen, what to do next, or how a workflow works..."
              ref={inputRef}
              value={input}
            />
            <div className="flex items-center justify-between gap-3">
              <Link className="focus-ring inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-primary hover:bg-blueSoft" to="/app/assistant/documents/qa" onClick={onClose}>
                Matter Q&A
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
              <Button disabled={isLoading} isLoading={isLoading} type="submit">
                <Send className="h-4 w-4" />
                Send
              </Button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
