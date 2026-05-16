"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModelSelectorLogo } from "@/components/ai-elements/model-selector";
import {
  MessageSquare,
  Plus,
  Search,
  Clock,
  ArrowRight,
  Bot,
  User,
  Trash2,
  Filter,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";

// ── Mock Chat Sessions ────────────────────────────────────────────────────────

const chatSessions = [
  {
    id: "chat-001",
    agentName: "Lead Qualifier",
    agentId: "1",
    modelProvider: "google" as const,
    lastMessage: "Based on the company profile, this lead qualifies for our Enterprise tier. Budget range matches our pricing...",
    timestamp: "10m ago",
    messageCount: 12,
    status: "active" as const,
  },
  {
    id: "chat-002",
    agentName: "Market Scanner",
    agentId: "3",
    modelProvider: "openai" as const,
    lastMessage: "I found 3 emerging trends in the FinTech space that are worth monitoring: 1. AI-driven credit scoring...",
    timestamp: "45m ago",
    messageCount: 8,
    status: "active" as const,
  },
  {
    id: "chat-003",
    agentName: "Blog Writer",
    agentId: "2",
    modelProvider: "anthropic" as const,
    lastMessage: "Here's the draft for the blog post on 'Enterprise AI Adoption'. I focused on the 5 key challenges...",
    timestamp: "2h ago",
    messageCount: 24,
    status: "completed" as const,
  },
  {
    id: "chat-004",
    agentName: "Code Reviewer",
    agentId: "4",
    modelProvider: "deepseek" as const,
    lastMessage: "Review complete. Found 2 potential security issues and 3 performance suggestions in the PR...",
    timestamp: "1d ago",
    messageCount: 6,
    status: "completed" as const,
  },
  {
    id: "chat-005",
    agentName: "Lead Qualifier",
    agentId: "1",
    modelProvider: "google" as const,
    lastMessage: "The inbound from DataFlow Systems doesn't meet our qualification criteria. Company size is below threshold...",
    timestamp: "2d ago",
    messageCount: 4,
    status: "completed" as const,
  },
];

const agents = [
  { id: "1", name: "Lead Qualifier", provider: "google" as const },
  { id: "2", name: "Blog Writer", provider: "anthropic" as const },
  { id: "3", name: "Market Scanner", provider: "openai" as const },
  { id: "4", name: "Code Reviewer", provider: "deepseek" as const },
];

export default function ChatHubPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "completed">("all");

  const filtered = chatSessions
    .filter((s) => filterStatus === "all" || s.status === filterStatus)
    .filter(
      (s) =>
        searchQuery === "" ||
        s.agentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="space-y-8">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-slate-500 font-medium">
            <span>Intelligence</span>
            <span className="text-slate-800">/</span>
            <span className="text-slate-300">Chat Playground</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Agent Playground</h1>
          <p className="text-slate-400 text-sm max-w-xl">
            Interactive chat sessions with your deployed agents. Full conversation history with streaming responses.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/agents/chat/new">
            <Button className="rounded-xl bg-white px-5 text-xs font-semibold text-black hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              <Plus className="h-4 w-4 mr-2" /> New Chat
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Quick Start Cards ──────────────────────────────────── */}
      <div className="grid md:grid-cols-4 gap-3">
        {agents.map((agent, i) => (
          <Link key={agent.id} href={`/dashboard/agents/chat/new?agent=${agent.id}`}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 hover:border-white/15 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/[0.05] flex items-center justify-center border border-white/5">
                  <ModelSelectorLogo provider={agent.provider} className="!size-4 !invert" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{agent.name}</p>
                </div>
                <ArrowRight className="h-3 w-3 text-slate-600 group-hover:text-white transition-colors" />
              </div>
            </motion.div>
          </Link>
        ))}
      </div>

      {/* ── Search & Filter ────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9 rounded-xl border-white/5 bg-white/[0.02] text-xs"
            placeholder="Search conversations..."
          />
        </div>
        <div className="flex items-center gap-1 border border-white/5 rounded-xl p-0.5">
          {(["all", "active", "completed"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-medium capitalize transition-colors ${
                filterStatus === status
                  ? "bg-white/10 text-white"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* ── Chat Session List ──────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.map((session, i) => (
          <Link key={session.id} href={`/dashboard/agents/chat/${session.id}`}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 hover:border-white/15 transition-all group cursor-pointer mb-3"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center border border-white/5 shrink-0">
                  <ModelSelectorLogo provider={session.modelProvider} className="!size-5 !invert" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium text-white">{session.agentName}</h3>
                    <Badge
                      className={`text-[9px] py-0 px-1.5 rounded-full ${
                        session.status === "active"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                      }`}
                    >
                      {session.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1">{session.lastMessage}</p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-600">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" /> {session.messageCount} messages
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {session.timestamp}
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-white transition-colors mt-2 shrink-0" />
              </div>
            </motion.div>
          </Link>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-16 text-center">
            <MessageSquare className="h-8 w-8 text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No conversations found</p>
            <p className="text-[11px] text-slate-700 mt-1">Start a new chat to begin</p>
          </div>
        )}
      </div>
    </div>
  );
}
