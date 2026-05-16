"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Activity,
  Clock,
  ArrowRight,
  Zap,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  BrainCircuit,
  Globe,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useParams } from "next/navigation";

// ── Mock Stats Data ───────────────────────────────────────────────────────────

const agentOverview: Record<string, {
  conversations: number;
  uptime: string;
  avgResponse: string;
  errors: number;
  tokensUsed: string;
  successRate: string;
  recentActivity: { time: string; action: string; status: "success" | "error" | "info" }[];
}> = {
  "1": {
    conversations: 142,
    uptime: "99.8%",
    avgResponse: "1.2s",
    errors: 0,
    tokensUsed: "2.4M",
    successRate: "98.7%",
    recentActivity: [
      { time: "2m ago", action: "Qualified lead from Acme Corp — Budget: $50K+", status: "success" },
      { time: "8m ago", action: "Processed inbound form submission from contact page", status: "success" },
      { time: "15m ago", action: "Escalated enterprise lead to sales team", status: "info" },
      { time: "1h ago", action: "Updated qualification criteria based on feedback", status: "info" },
    ],
  },
  "2": {
    conversations: 38,
    uptime: "97.2%",
    avgResponse: "3.8s",
    errors: 3,
    tokensUsed: "890K",
    successRate: "92.1%",
    recentActivity: [
      { time: "2h ago", action: "Agent paused by operator", status: "info" },
      { time: "3h ago", action: "Generated blog post: 'AI in Enterprise 2025'", status: "success" },
      { time: "5h ago", action: "Failed to fetch trending topics — API timeout", status: "error" },
    ],
  },
};

const defaultOverview = {
  conversations: 0,
  uptime: "—",
  avgResponse: "—",
  errors: 0,
  tokensUsed: "0",
  successRate: "—",
  recentActivity: [],
};

export default function AgentOverviewPage() {
  const { agentId } = useParams() as { agentId: string };
  const data = agentOverview[agentId] || defaultOverview;

  const statCards = [
    { label: "Total Conversations", value: data.conversations.toLocaleString(), icon: MessageSquare, color: "text-blue-400" },
    { label: "Uptime", value: data.uptime, icon: Activity, color: "text-emerald-400" },
    { label: "Avg Response", value: data.avgResponse, icon: Zap, color: "text-amber-400" },
    { label: "Errors", value: data.errors.toString(), icon: AlertCircle, color: data.errors > 0 ? "text-red-400" : "text-slate-400" },
    { label: "Tokens Used", value: data.tokensUsed, icon: BrainCircuit, color: "text-violet-400" },
    { label: "Success Rate", value: data.successRate, icon: TrendingUp, color: "text-cyan-400" },
  ];

  const activityIcon = {
    success: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />,
    error: <AlertCircle className="h-3.5 w-3.5 text-red-500" />,
    info: <Globe className="h-3.5 w-3.5 text-blue-500" />,
  };

  return (
    <div className="space-y-8">
      {/* ── Stats Grid ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-3"
          >
            <div className={`w-9 h-9 rounded-xl bg-white/[0.03] flex items-center justify-center ${stat.color}`}>
              <stat.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Quick Actions ───────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link href={`/dashboard/agents/chat/new?agent=${agentId}`}>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-white/5 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 p-6 hover:border-white/15 transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-400" />
                  <h3 className="font-semibold text-white text-sm">Open Playground</h3>
                </div>
                <p className="text-xs text-slate-500">Chat with this agent in the interactive playground</p>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
          </motion.div>
        </Link>

        <Link href={`/dashboard/agents/${agentId}/configuration`}>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="rounded-2xl border border-white/5 bg-gradient-to-br from-violet-500/5 to-purple-500/5 p-6 hover:border-white/15 transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="h-5 w-5 text-violet-400" />
                  <h3 className="font-semibold text-white text-sm">Configure Agent</h3>
                </div>
                <p className="text-xs text-slate-500">Edit system prompt, model, and parameters</p>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
            </div>
          </motion.div>
        </Link>
      </div>

      {/* ── Recent Activity ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-slate-500" />
            Recent Activity
          </h3>
          <Link href={`/dashboard/agents/${agentId}/monitoring`}>
            <Button variant="ghost" size="sm" className="text-xs text-slate-500 hover:text-white">
              View All <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>
        <div className="divide-y divide-white/5">
          {data.recentActivity.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-xs text-slate-600">No recent activity</p>
            </div>
          ) : (
            data.recentActivity.map((event, i) => (
              <div key={i} className="px-6 py-3.5 flex items-center gap-3 hover:bg-white/[0.02] transition-colors">
                {activityIcon[event.status]}
                <p className="text-xs text-slate-300 flex-1">{event.action}</p>
                <span className="text-[10px] text-slate-600 shrink-0">{event.time}</span>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
