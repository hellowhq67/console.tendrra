"use client";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from "@/components/ai-elements/message";
// PromptInput components available but using custom textarea for more control
// import { PromptInput, PromptInputTextarea, ... } from "@/components/ai-elements/prompt-input";
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
import { ModelSelectorLogo } from "@/components/ai-elements/model-selector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Bot,
  BrainCircuit,
  Copy,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Settings,
  Sparkles,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useState, useCallback, useRef } from "react";
import type { UIMessage } from "ai";

import { useAgent } from "@/contexts/agents-context";
import { getAuth } from "firebase/auth";
import { toast } from "sonner";

// Helper function to get provider from model name
function getProviderFromModel(model: string): string {
  if (model.includes("gemini") || model.includes("google")) return "google";
  if (model.includes("gpt") || model.includes("openai")) return "openai";
  if (model.includes("claude") || model.includes("anthropic")) return "anthropic";
  if (model.includes("deepseek")) return "deepseek";
  if (model.includes("llama")) return "llama";
  return "google"; // fallback
}

// ── Chat Page Component ───────────────────────────────────────────────────────

export default function ChatSessionPage() {
  const { chatId } = useParams() as { chatId: string };
  const searchParams = useSearchParams();
  const agentId = searchParams.get("agent") || "1";
  const { state: agentState, actions: agentActions } = useAgent(agentId);
  const agent = agentState.agent;
  const loading = agentState.loading;
  
  // Fallback agent data for loading state
  const fallbackAgent = { name: "Loading...", model: "Unknown" };
  const currentAgent = agent || fallbackAgent;
  const agentProvider = agent ? getProviderFromModel(agent.model || "") : "google";

  const [messages, setMessages] = useState<
    { id: string; role: "user" | "assistant"; content: string; thinking?: string[] }[]
  >([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading || !agent) return;

    const userMsg = { id: `msg-${Date.now()}`, role: "user" as const, content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setIsStreaming(true);

    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        toast.error("User not authenticated");
        return;
      }
      
      const token = await user.getIdToken();
      
      // Create streaming response
      const response = await fetch(`http://localhost:3001/api/agents/${agentId}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          message: input,
          chatId: chatId === "new" ? undefined : chatId,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantContent = "";
        let thinkingSteps: string[] = [];
        
        // Create assistant message placeholder
        const assistantMsgId = `msg-${Date.now() + 1}`;
        setMessages(prev => [...prev, {
          id: assistantMsgId,
          role: "assistant" as const,
          content: "",
          thinking: []
        }]);
        
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              if (data === '[DONE]') {
                setIsStreaming(false);
                break;
              }
              
              try {
                const parsed = JSON.parse(data);
                
                if (parsed.type === 'content') {
                  assistantContent += parsed.content;
                  setMessages(prev => prev.map(msg => 
                    msg.id === assistantMsgId 
                      ? { ...msg, content: assistantContent }
                      : msg
                  ));
                } else if (parsed.type === 'thinking') {
                  thinkingSteps.push(parsed.step);
                  setMessages(prev => prev.map(msg => 
                    msg.id === assistantMsgId 
                      ? { ...msg, thinking: thinkingSteps }
                      : msg
                  ));
                }
              } catch (e) {
                // Ignore parsing errors
              }
            }
          }
        }
      } else {
        // Fallback for non-streaming responses
        const data = await response.json();
        const assistantMsg = {
          id: `msg-${Date.now() + 1}`,
          role: "assistant" as const,
          content: data.content || "I'm sorry, I couldn't process your request.",
          thinking: data.thinking || []
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Failed to send message");
      
      // Add error message
      const errorMsg = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant" as const,
        content: "I'm sorry, I encountered an error while processing your request. Please try again.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [input, isLoading, agent, agentId, chatId]);

  if (loading && !agent) {
    return <div className="text-white">Loading agent...</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-180px)]">
      {/* ── Chat Header ───────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-0 shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/agents/chat"
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-white transition-colors group"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/[0.05] flex items-center justify-center border border-white/5">
                <ModelSelectorLogo provider={agentProvider} className="!size-5 !invert" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">{currentAgent.name}</h2>
              <p className="text-[10px] text-slate-500">{currentAgent.model}</p>
            </div>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] py-0 px-2 rounded-full">
            Online
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/agents/${agentId}/configuration`}>
            <Button variant="ghost" size="sm" className="text-slate-500 hover:text-white h-8 w-8 p-0 rounded-xl">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Conversation Area ─────────────────────────────────── */}
      <Conversation className="flex-1 min-h-0">
        <ConversationContent className="py-8 px-4 max-w-3xl mx-auto w-full">
          {messages.length === 0 ? (
            <ConversationEmptyState
              title={`Chat with ${currentAgent.name}`}
              description="Send a message to start the conversation. This agent is powered by the Vercel AI SDK and connected to various AI models."
              icon={
                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center border border-white/5">
                  <Sparkles className="h-8 w-8 text-slate-600" />
                </div>
              }
              className="text-slate-400"
            />
          ) : (
            messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Message from={msg.role}>
                  <MessageContent>
                    {msg.role === "assistant" && msg.thinking && (
                      <ChainOfThought className="mb-4">
                        <ChainOfThoughtHeader>Reasoning</ChainOfThoughtHeader>
                        <ChainOfThoughtContent>
                          {msg.thinking.map((step, i) => (
                            <ChainOfThoughtStep
                              key={i}
                              label={step}
                              status="complete"
                            />
                          ))}
                        </ChainOfThoughtContent>
                      </ChainOfThought>
                    )}
                    {msg.role === "assistant" ? (
                      <MessageResponse>{msg.content}</MessageResponse>
                    ) : (
                      <p className="text-sm">{msg.content}</p>
                    )}
                  </MessageContent>
                  {msg.role === "assistant" && (
                    <MessageActions className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MessageAction tooltip="Copy" size="sm" variant="ghost">
                        <Copy className="h-3.5 w-3.5" />
                      </MessageAction>
                      <MessageAction tooltip="Regenerate" size="sm" variant="ghost">
                        <RefreshCw className="h-3.5 w-3.5" />
                      </MessageAction>
                      <MessageAction tooltip="Good" size="sm" variant="ghost">
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </MessageAction>
                      <MessageAction tooltip="Bad" size="sm" variant="ghost">
                        <ThumbsDown className="h-3.5 w-3.5" />
                      </MessageAction>
                    </MessageActions>
                  )}
                </Message>
              </motion.div>
            ))
          )}

          {/* Loading indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Message from="assistant">
                <MessageContent>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-xs text-slate-600">{currentAgent.name} is thinking...</span>
                  </div>
                </MessageContent>
              </Message>
            </motion.div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* ── Input Area ────────────────────────────────────────── */}
      <div className="shrink-0 pt-4 border-t border-white/5">
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden focus-within:border-white/15 transition-colors"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={`Message ${currentAgent.name}...`}
              rows={3}
              className="w-full bg-transparent text-sm text-slate-300 px-5 pt-4 pb-2 resize-none outline-none placeholder:text-slate-700"
            />
            <div className="flex items-center justify-between px-4 pb-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px] font-normal text-slate-500">
                  <BrainCircuit className="h-3 w-3 mr-1" />
                  {currentAgent.model}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-700">
                  {input.length > 0 ? `${input.length} chars` : "Shift+Enter for new line"}
                </span>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!input.trim() || isLoading}
                  className="rounded-xl bg-white text-xs font-semibold text-black hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed h-8 px-4"
                >
                  Send
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
