import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { aiWorkspaceApi } from "../../api";
import { SkeletonBlock, StateCard, Toast } from "../../components/common";
import {
  AssistantDelayState,
  AssistantHero,
  EditableOutput,
  ModePicker,
  PromptPanel,
  ResearchSourceNotice,
  SuggestedPromptCards,
  modeCopy,
} from "../../components/assistant/AssistantCoreWidgets";
import { useAiPlatformAccess } from "./useAiPlatformAccess";

function permissionForMode(mode) {
  if (mode === "email") return "ai.client";
  if (mode === "research") return "ai.research";
  return "ai.dashboard";
}

export function AssistantCorePage({ initialMode = "assistant" }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState(initialMode);
  const access = useAiPlatformAccess(permissionForMode(mode));
  const [input, setInput] = useState("");
  const [output, setOutput] = useState({ title: "", text: "" });
  const [notice, setNotice] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDelayed, setIsDelayed] = useState(false);

  const modePath = useMemo(() => ({
    assistant: "/app/assistant",
    email: "/app/assistant/email",
    research: "/app/assistant/research",
  }), []);

  function changeMode(nextMode) {
    setMode(nextMode);
    setInput("");
    setOutput({ title: "", text: "" });
    setNotice(null);
    navigate(modePath[nextMode] || "/app/assistant");
  }

  async function submit(event) {
    event.preventDefault();
    if (access.unavailable || access.readOnly || !access.canUse || access.creditDepleted) {
      setNotice({ tone: "warning", title: "AI is not available", message: access.message || "You do not have access to this AI tool." });
      return;
    }
    const trimmed = input.trim();
    if (!trimmed) {
      setNotice({ tone: "warning", title: "Add a request first", message: "Write what you want help with, then ask BillSync to prepare a draft." });
      return;
    }

    setIsLoading(true);
    setIsDelayed(false);
    setNotice(null);
    const delayTimer = window.setTimeout(() => setIsDelayed(true), 2500);

    try {
      const result = mode === "email"
        ? await aiWorkspaceApi.draftEmail(trimmed)
        : mode === "research"
          ? await aiWorkspaceApi.analyze(trimmed)
          : await aiWorkspaceApi.assist(trimmed);
      setOutput(result);
      setNotice({ tone: "success", title: "Draft ready", message: "Review and edit the result before using it." });
      access.refreshUsage();
    } catch (error) {
      setNotice({ tone: "warning", title: "Draft was not prepared", message: error?.userMessage || "Please try again in a moment." });
    } finally {
      window.clearTimeout(delayTimer);
      setIsLoading(false);
      setIsDelayed(false);
    }
  }

  if (access.status === "loading") return <SkeletonBlock />;
  if (access.unavailable) return <StateCard state="empty" title="AI is not available" message={access.message} />;
  if (!access.canUse) return <StateCard state="permission" title="AI is not available" message="You do not have access to this AI tool." />;
  if (access.creditDepleted) return <StateCard state="retry" title="AI credits are used up" message={access.message} actionLabel="Refresh" onAction={access.refreshUsage} />;

  return (
    <div className="space-y-6">
      <AssistantHero mode={mode} />
      <ModePicker mode={mode} onModeChange={changeMode} />
      {notice ? <Toast tone={notice.tone} title={notice.title} message={notice.message} /> : null}
      {access.readOnly ? <StateCard state="empty" title="AI is paused" message={access.message} /> : null}
      {access.usage.status === "error" ? <StateCard state="retry" title="AI usage could not be refreshed" message={access.usage.message} actionLabel="Retry" onAction={access.refreshUsage} /> : null}
      <AssistantDelayState visible={isDelayed} />
      <ResearchSourceNotice mode={mode} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <PromptPanel input={input} isLoading={isLoading} mode={mode} onChange={setInput} onSubmit={submit} />
          <EditableOutput mode={mode} output={output} onChange={(text) => setOutput((current) => ({ ...current, text }))} />
        </div>
        <div className="min-w-0 space-y-6">
          <SuggestedPromptCards mode={mode} onPick={setInput} />
          <section className="surface-card p-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-accent">Mode</p>
            <h2 className="mt-1 text-xl font-bold text-primary">{modeCopy[mode].title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{modeCopy[mode].subtitle}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
