"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { Message as AIMessage } from "ai";
import { DefaultChatTransport, isToolUIPart } from "ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageSquare, Send, Settings2, Users, Search,
  Hash, CircleUser, Phone, Video, CheckIcon, GlobeIcon,
  BotIcon, RefreshCcwIcon, CopyIcon,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Reasoning, ReasoningContent, ReasoningTrigger,
} from "@/components/ai-elements/reasoning";

// AI Elements Imports
import {
  Attachment, AttachmentInfo, AttachmentPreview, AttachmentRemove, Attachments,
} from "@/components/ai-elements/attachments";
import {
  Conversation, ConversationContent, ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message, MessageAction, MessageActions, MessageContent, MessageResponse,
  MessageToolbar,
} from "@/components/ai-elements/message";
import {
  ModelSelector, ModelSelectorContent, ModelSelectorEmpty, ModelSelectorGroup,
  ModelSelectorInput, ModelSelectorItem, ModelSelectorList, ModelSelectorLogo,
  ModelSelectorLogoGroup, ModelSelectorName, ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import {
  PromptInput, PromptInputActionAddAttachments, PromptInputActionMenu,
  PromptInputActionMenuContent, PromptInputActionMenuTrigger, PromptInputBody,
  PromptInputButton, PromptInputFooter, PromptInputHeader, PromptInputSubmit,
  PromptInputTextarea, PromptInputTools, usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import {
  Sandbox, SandboxContent, SandboxHeader, SandboxTabContent,
  SandboxTabs, SandboxTabsBar, SandboxTabsList, SandboxTabsTrigger,
} from "@/components/ai-elements/sandbox";
import { CodeBlock } from "@/components/ai-elements/code-block";
import {
  Tool, ToolContent, ToolHeader, ToolInput, ToolOutput,
} from "@/components/ai-elements/tool";
import { Source, Sources, SourcesContent, SourcesTrigger } from "@/components/ai-elements/sources";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { SpeechInput } from "@/components/ai-elements/speech-input";

// ── OpenRouter Free Models ────────────────────────────────────────────────
const OPENROUTER_FREE_MODELS = [
  { id: "openrouter/free", name: "Auto Free Model", providers: ["openrouter"] },
  { id: "google/gemini-2.0-flash-exp:free", name: "Gemini 2.0 Flash", providers: ["google"] },
  { id: "mistralai/mistral-7b-instruct:free", name: "Mistral 7B Instruct", providers: ["mistral"] },
  { id: "microsoft/phi-3-mini-128k-instruct:free", name: "Phi-3 Mini", providers: ["microsoft"] },
  { id: "openchat/openchat-7b:free", name: "OpenChat 7B", providers: ["openrouter"] },
];

// Remove static sidebar data

// ── Attachment display ────────────────────────────────────────────────────
const AttachmentItem = ({
  attachment,
  onRemove,
}: {
  attachment: { id: string };
  onRemove: (id: string) => void;
}) => {
  const handleRemove = useCallback(() => onRemove(attachment.id), [onRemove, attachment.id]);
  return (
    <Attachment data={attachment as any} onRemove={handleRemove}>
      <AttachmentPreview />
      <AttachmentInfo />
      <AttachmentRemove />
    </Attachment>
  );
};

const PromptInputAttachmentsDisplay = () => {
  const attachments = usePromptInputAttachments();
  const handleRemove = useCallback((id: string) => attachments.remove(id), [attachments]);
  if (attachments.files.length === 0) return null;
  return (
    <Attachments variant="inline">
      {attachments.files.map((attachment) => (
        <AttachmentItem attachment={attachment} key={attachment.id} onRemove={handleRemove} />
      ))}
    </Attachments>
  );
};

// ── Model selector item ───────────────────────────────────────────────────
const ModelItem = ({
  m,
  isSelected,
  onSelect,
}: {
  m: (typeof OPENROUTER_FREE_MODELS)[number];
  isSelected: boolean;
  onSelect: (id: string) => void;
}) => {
  const handleSelect = useCallback(() => onSelect(m.id), [onSelect, m.id]);
  return (
    <ModelSelectorItem onSelect={handleSelect} value={m.id}>
      <ModelSelectorLogo provider={m.providers[0]} />
      <ModelSelectorName>{m.name}</ModelSelectorName>
      <ModelSelectorLogoGroup>
        {m.providers.map((p) => (
          <ModelSelectorLogo key={p} provider={p} />
        ))}
      </ModelSelectorLogoGroup>
      {isSelected ? <CheckIcon className="ml-auto size-4" /> : <div className="ml-auto size-4" />}
    </ModelSelectorItem>
  );
};

// ── Main component ────────────────────────────────────────────────────────
export default function AgentChatPage() {
  const params = useParams();
  const chatId = params?.chatId as string;
  const [initialMessages, setInitialMessages] = useState<AIMessage[]>([]);
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);

  const [model, setModel] = useState("openrouter/free"); // auto-free default
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const [text, setText] = useState("");
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [fetchingSuggestions, setFetchingSuggestions] = useState(false);
  const prevStatusRef = useRef<string>("");

  useEffect(() => {
    if (!chatId) return;
    
    fetch(`http://localhost:3001/api/chat/${chatId}`)
      .then(res => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(data => {
        if (data.messages) {
          // Parse stringified messages from database
          const parsed = typeof data.messages === 'string' ? JSON.parse(data.messages) : data.messages;
          setInitialMessages(parsed);
        }
      })
      .catch(err => console.error("Failed to load chat history:", err))
      .finally(() => setIsHistoryLoaded(true));
  }, [chatId]);

  // ── useChat wired to Express API ───────────────────────────────────────
  const { messages, sendMessage, status, regenerate } = useChat({
    id: chatId,
    initialMessages,
    transport: new DefaultChatTransport({
      api: "http://localhost:3001/api/chat",
      body: { model, id: chatId },
    }),
  });

  // Only render once history has been checked/loaded
  if (!isHistoryLoaded && chatId) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  // ── Fetch suggestions after each completed response ────────────────────
  useEffect(() => {
    const wasStreaming =
      prevStatusRef.current === "streaming" || prevStatusRef.current === "submitted";
    const isNowReady = status === "ready";

    if (wasStreaming && isNowReady && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant") {
        const textParts = lastMessage.parts.filter((p) => p.type === "text") as any[];
        const lastText = textParts.map((p) => p.text).join("\\n");
        
        if (!fetchingSuggestions && lastText) {
          setFetchingSuggestions(true);
          setSuggestions([]);
          fetch("http://localhost:3001/api/chat/suggestions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lastAssistantMessage: lastText }),
          })
            .then((r) => r.json())
            .then((data) => setSuggestions(data.suggestions ?? []))
            .catch(() => setSuggestions([]))
            .finally(() => setFetchingSuggestions(false));
        }
      }
    }
    prevStatusRef.current = status;
  }, [status, messages, fetchingSuggestions]);

  // ── Handlers ───────────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    async (message: PromptInputMessage) => {
      const hasText = Boolean(message.text?.trim());
      if (!hasText && !message.files?.length) return;
      setSuggestions([]);
      
      let uploadedUrls: string[] = [];
      if (message.files?.length) {
        toast.info(`Uploading ${message.files.length} file(s)...`);
        try {
          const uploads = message.files.map(async (file) => {
             const res = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
               method: 'POST',
               body: file
             });
             const json = await res.json();
             return json.url;
          });
          uploadedUrls = await Promise.all(uploads);
          toast.success("Files uploaded successfully!");
        } catch(e) {
          toast.error("Failed to upload files");
          return; // Stop if upload fails
        }
      }

      let finalMessageText = message.text ?? "";
      if (uploadedUrls.length > 0) {
        const fileLinks = uploadedUrls.map(url => `[Attached File: ${url}]`).join("\n");
        finalMessageText += `\n\n${fileLinks}`;
      }

      sendMessage({ text: finalMessageText });
      setText("");
    },
    [sendMessage],
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setSuggestions([]);
      sendMessage({ text: suggestion });
    },
    [sendMessage],
  );

  const handleTranscriptionChange = useCallback((transcript: string) => {
    setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
  }, []);

  const handleModelSelect = useCallback((modelId: string) => {
    setModel(modelId);
    setModelSelectorOpen(false);
  }, []);

  const toggleWebSearch = useCallback(() => setUseWebSearch((prev) => !prev), []);

  const isSubmitDisabled = useMemo(
    () => !text.trim() || status === "streaming" || status === "submitted",
    [text, status],
  );

  const selectedModelData = useMemo(
    () => OPENROUTER_FREE_MODELS.find((m) => m.id === model),
    [model],
  );

  // Reasoning extraction helper
  const renderMessageContent = useCallback((content: string, isStreaming: boolean) => {
    const thoughtMatch = content.match(/<thought>([\s\S]*?)<\/thought>/i);
    if (thoughtMatch) {
      const thought = thoughtMatch[1].trim();
      const response = content.replace(thoughtMatch[0], "").trim();
      return (
        <>
          <Reasoning isStreaming={isStreaming && !response}>
            <ReasoningTrigger />
            <ReasoningContent>{thought}</ReasoningContent>
          </Reasoning>
          {response && <MessageResponse>{response}</MessageResponse>}
        </>
      );
    }
    
    // Check for an incomplete thought block (currently streaming)
    const streamingThoughtMatch = content.match(/<thought>([\s\S]*)$/i);
    if (streamingThoughtMatch) {
      const thought = streamingThoughtMatch[1].trim();
      return (
        <Reasoning isStreaming={true}>
          <ReasoningTrigger />
          <ReasoningContent>{thought}</ReasoningContent>
        </Reasoning>
      );
    }
    
    return <MessageResponse>{content}</MessageResponse>
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full max-w-4xl mx-auto overflow-hidden bg-slate-50 dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 rounded-xl my-4">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="h-14 flex items-center justify-between px-6 border-b shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <BotIcon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight">Intelligence Playground</h1>
            <p className="text-[10px] text-muted-foreground">OpenRouter · {selectedModelData?.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-secondary/50 border text-[10px] text-muted-foreground">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            AI Online
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* ── Main Chat Area ────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-h-0 relative">

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6 text-center p-8">
            <div className="h-20 w-20 rounded-3xl bg-primary/10 border flex items-center justify-center">
              <BotIcon className="h-10 w-10 text-primary" />
            </div>
            <div className="max-w-md">
              <h2 className="text-xl font-bold tracking-tight mb-2">Welcome to the Playground</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This is your focused space for advanced AI interaction.
                I can help with complex reasoning, web searches, and technical tasks.
              </p>
            </div>
          </div>
        )}

        <Conversation className="flex-1">
          <ConversationContent>

            {messages.map((message, messageIndex) => {
              const isLast = messageIndex === messages.length - 1;

              return (
                <div key={message.id}>
                  {message.parts.map((part, i) => {
                    // ── Text part ────────────────────────────────────
                    if (part.type === "text") {
                      return (
                        <div key={`${message.id}-text-${i}`}>
                          <Message from={message.role}>
                            <MessageContent>
                              {message.role === "assistant"
                                ? renderMessageContent(part.text, status === "streaming" && isLast)
                                : <MessageResponse>{part.text}</MessageResponse>
                              }
                            </MessageContent>
                          </Message>
                          {message.role === "assistant" && isLast && status === "ready" && (
                            <MessageToolbar>
                              <MessageActions>
                                <MessageAction
                                  label="Regenerate"
                                  onClick={() => regenerate()}
                                >
                                  <RefreshCcwIcon className="size-3" />
                                </MessageAction>
                                <MessageAction
                                  label="Copy"
                                  onClick={() =>
                                    navigator.clipboard.writeText(part.text)
                                  }
                                >
                                  <CopyIcon className="size-3" />
                                </MessageAction>
                              </MessageActions>
                            </MessageToolbar>
                          )}
                        </div>
                      );
                    }

                    // ── Tool call part ────────────────────────────────
                    if (isToolUIPart(part)) {
                      const toolPart = part as any;
                      if (toolPart.toolName === "sandbox") {
                        const input = part.input as any;
                        return (
                          <div key={`${message.id}-tool-${i}`} className="px-4 py-2">
                            <Sandbox>
                              <SandboxHeader
                                title={input.title || "Daytona Sandbox"}
                                state={part.state}
                              />
                              <SandboxContent>
                                <SandboxTabs defaultValue="code">
                                  <SandboxTabsBar>
                                    <SandboxTabsList>
                                      <SandboxTabsTrigger value="code">
                                        {input.mode === "code" ? "Code" : "Command"}
                                      </SandboxTabsTrigger>
                                      {part.state === "output-available" && (
                                        <SandboxTabsTrigger value="output">Output</SandboxTabsTrigger>
                                      )}
                                    </SandboxTabsList>
                                  </SandboxTabsBar>
                                  <SandboxTabContent value="code">
                                    <CodeBlock
                                      code={input.content}
                                      language={(input.language || "typescript") as any}
                                    />
                                  </SandboxTabContent>
                                  {part.state === "output-available" && (
                                    <SandboxTabContent value="output">
                                      <CodeBlock
                                        code={typeof part.output === "string" ? part.output : JSON.stringify(part.output, null, 2)}
                                        language={(typeof part.output === "string" ? "plaintext" : "json") as any}
                                      />
                                    </SandboxTabContent>
                                  )}
                                </SandboxTabs>
                              </SandboxContent>
                            </Sandbox>
                          </div>
                        );
                      }

                      return (
                        <div key={`${message.id}-tool-${i}`} className="px-4 py-2">
                          <Tool defaultOpen={part.state === "output-available"}>
                            <ToolHeader
                              type={part.type as any}
                              state={part.state as any}
                              toolName={toolPart.toolName}
                            />
                            <ToolContent>
                              {(part.state === "input-available" ||
                                part.state === "output-available") && (
                                  <ToolInput input={toolPart.input} />
                                )}
                              {part.state === "output-available" && (
                                <ToolOutput
                                  output={toolPart.output}
                                  errorText={undefined}
                                />
                              )}
                              {part.state === "output-error" && (
                                <ToolOutput
                                  output={null}
                                  errorText={toolPart.errorText}
                                />
                              )}
                            </ToolContent>
                          </Tool>
                        </div>
                      );
                    }

                    return null;
                  })}

                  {/* Sources — if message has source annotations */}
                  {message.role === "assistant" &&
                    Array.isArray((message as { annotations?: unknown[] }).annotations) &&
                    ((message as { annotations?: unknown[] }).annotations?.length ?? 0) > 0 && (
                      <div className="px-4 pb-2">
                        <Sources>
                          <SourcesTrigger
                            count={
                              (message as { annotations?: unknown[] }).annotations?.length ?? 0
                            }
                          />
                          <SourcesContent>
                            {((message as { annotations?: { url?: string; title?: string }[] }).annotations ?? []).map(
                              (src, idx) => (
                                <Source
                                  key={src.url ?? idx}
                                  href={src.url ?? "#"}
                                  title={src.title ?? src.url ?? "Source"}
                                />
                              ),
                            )}
                          </SourcesContent>
                        </Sources>
                      </div>
                    )}
                </div>
              );
            })}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        {/* ── Bottom: suggestions + input ─────────────────────────── */}
        <div className="grid shrink-0 gap-4 pt-4">
          {/* AI-generated follow-up suggestions */}
          {suggestions.length > 0 && status === "ready" && (
            <Suggestions className="px-4">
              {suggestions.map((suggestion) => (
                <Suggestion
                  key={suggestion}
                  suggestion={suggestion}
                  onClick={handleSuggestionClick}
                />
              ))}
            </Suggestions>
          )}

          <div className="w-full px-4 pb-4">
            <PromptInput globalDrop multiple onSubmit={handleSubmit}>
              <PromptInputHeader>
                <PromptInputAttachmentsDisplay />
              </PromptInputHeader>
              <PromptInputBody>
                <PromptInputTextarea
                  onChange={(e) => setText(e.target.value)}
                  value={text}
                  placeholder="Ask the AI anything…"
                />
              </PromptInputBody>
              <PromptInputFooter>
                <PromptInputTools>
                  <PromptInputActionMenu>
                    <PromptInputActionMenuTrigger />
                    <PromptInputActionMenuContent>
                      <PromptInputActionAddAttachments />
                    </PromptInputActionMenuContent>
                  </PromptInputActionMenu>
                  <SpeechInput
                    className="shrink-0"
                    onTranscriptionChange={handleTranscriptionChange}
                    size="sm"
                    variant="ghost"
                  />
                  <PromptInputButton
                    onClick={toggleWebSearch}
                    variant={useWebSearch ? "default" : "ghost"}
                  >
                    <GlobeIcon size={16} />
                    <span>Search</span>
                  </PromptInputButton>

                  <ModelSelector
                    onOpenChange={setModelSelectorOpen}
                    open={modelSelectorOpen}
                  >
                    <ModelSelectorTrigger asChild>
                      <PromptInputButton>
                        <ModelSelectorLogo provider={OPENROUTER_FREE_MODELS.find(m => m.id === model)?.providers[0] || "bot"} />
                        <ModelSelectorName>
                          {OPENROUTER_FREE_MODELS.find((m) => m.id === model)?.name || "Select Model"}
                        </ModelSelectorName>
                      </PromptInputButton>
                    </ModelSelectorTrigger>
                    <ModelSelectorContent>
                      <ModelSelectorInput placeholder="Search models…" />
                      <ModelSelectorList>
                        <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
                        <ModelSelectorGroup>
                          {OPENROUTER_FREE_MODELS.map((m) => (
                            <ModelItem
                              key={m.id}
                              m={m}
                              isSelected={model === m.id}
                              onSelect={(id) => {
                                setModel(id);
                                setModelSelectorOpen(false);
                                toast.success(`Switched to ${m.name}`);
                              }}
                            />
                          ))}
                        </ModelSelectorGroup>
                      </ModelSelectorList>
                    </ModelSelectorContent>
                  </ModelSelector>
                </PromptInputTools>
                <PromptInputSubmit
                  disabled={isSubmitDisabled}
                  status={
                    status === "streaming" || status === "submitted"
                      ? "streaming"
                      : "ready"
                  }
                />
              </PromptInputFooter>
            </PromptInput>

            {/* Mocked Agent Tools */}
            <div className="flex items-center gap-2 mt-3 px-2 overflow-x-auto text-sm">
              <span className="text-slate-500 font-medium mr-2 text-xs uppercase tracking-wide shrink-0">Agents & Tools:</span>
              <Button variant="outline" size="sm" className="rounded-full h-8 px-3 shrink-0 bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">
                <BotIcon className="w-3.5 h-3.5 mr-1.5" />
                Auto Agent
              </Button>
              <Button onClick={toggleWebSearch} variant={useWebSearch ? "default" : "outline"} size="sm" className="rounded-full h-8 px-3 shrink-0">
                <GlobeIcon className="w-3.5 h-3.5 mr-1.5" />
                Web Search
              </Button>
              <Button variant="outline" size="sm" className="rounded-full h-8 px-3 shrink-0">
                <Hash className="w-3.5 h-3.5 mr-1.5" />
                Code Sandbox
              </Button>
              <Button variant="outline" size="sm" className="rounded-full h-8 px-3 shrink-0">
                <Settings2 className="w-3.5 h-3.5 mr-1.5" />
                Data Analyzer
              </Button>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
