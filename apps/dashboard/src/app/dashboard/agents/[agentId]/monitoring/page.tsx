"use client";

import {
  StackTrace,
  StackTraceHeader,
  StackTraceError,
  StackTraceErrorType,
  StackTraceErrorMessage,
  StackTraceActions,
  StackTraceCopyButton,
  StackTraceExpandButton,
  StackTraceContent,
  StackTraceFrames,
} from "@/components/ai-elements/stack-trace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Activity,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

// ── Mock Log Data ─────────────────────────────────────────────────────────────

const logEntries = [
  {
    id: "log-001",
    timestamp: "2025-05-10 14:32:01",
    traceId: "trc_a8f3b2c1",
    action: "qualify_lead",
    input: "Inbound from Acme Corp",
    status: "success" as const,
    duration: "1.2s",
    tokens: 842,
    model: "gemini-2.5-pro",
  },
  {
    id: "log-002",
    timestamp: "2025-05-10 14:28:15",
    traceId: "trc_d4e5f6a7",
    action: "web_search",
    input: "Company size lookup: TechStart Inc",
    status: "success" as const,
    duration: "3.8s",
    tokens: 1204,
    model: "gemini-2.5-pro",
  },
  {
    id: "log-003",
    timestamp: "2025-05-10 14:25:33",
    traceId: "trc_b8c9d0e1",
    action: "generate_response",
    input: "Follow-up email for qualified lead",
    status: "error" as const,
    duration: "0.3s",
    tokens: 0,
    model: "gemini-2.5-pro",
    error: `Error: API rate limit exceeded
at GoogleGenerativeAI.generateContent (node_modules/@google/generative-ai/dist/index.js:234:15)
at streamText (node_modules/ai/src/stream-text.ts:89:12)
at AgentExecutor.run (src/lib/agent-executor.ts:45:8)
at processRequest (src/routes/agents.ts:112:5)`,
  },
  {
    id: "log-004",
    timestamp: "2025-05-10 14:22:08",
    traceId: "trc_f2a3b4c5",
    action: "tool_call",
    input: "CRM lookup: contact@acme.com",
    status: "success" as const,
    duration: "0.8s",
    tokens: 312,
    model: "gemini-2.5-pro",
  },
  {
    id: "log-005",
    timestamp: "2025-05-10 14:18:42",
    traceId: "trc_e6f7a8b9",
    action: "qualify_lead",
    input: "Inbound from DataFlow Systems",
    status: "warning" as const,
    duration: "2.1s",
    tokens: 1567,
    model: "gemini-2.5-pro",
  },
  {
    id: "log-006",
    timestamp: "2025-05-10 14:15:19",
    traceId: "trc_c0d1e2f3",
    action: "generate_response",
    input: "Rejection email for unqualified lead",
    status: "success" as const,
    duration: "1.5s",
    tokens: 634,
    model: "gemini-2.5-pro",
  },
  {
    id: "log-007",
    timestamp: "2025-05-10 14:12:55",
    traceId: "trc_a4b5c6d7",
    action: "web_search",
    input: "Industry trends: FinTech Q2 2025",
    status: "success" as const,
    duration: "4.2s",
    tokens: 2103,
    model: "gemini-2.5-pro",
  },
  {
    id: "log-008",
    timestamp: "2025-05-10 14:08:30",
    traceId: "trc_e8f9a0b1",
    action: "tool_call",
    input: "BigQuery: SELECT recent_signups FROM analytics",
    status: "success" as const,
    duration: "1.9s",
    tokens: 0,
    model: "gemini-2.5-pro",
  },
];

const ruleExecutions = [
  { id: "rule-1", name: "Budget Threshold", condition: "budget >= 10000", result: "pass", count: 89 },
  { id: "rule-2", name: "Company Size Filter", condition: "employees >= 50", result: "pass", count: 72 },
  { id: "rule-3", name: "Rate Limiter", condition: "requests < 100/min", result: "fail", count: 3 },
  { id: "rule-4", name: "Content Safety", condition: "toxicity < 0.1", result: "pass", count: 142 },
];

const statusStyles = {
  success: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  error: { icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10", badge: "bg-red-500/10 text-red-400 border-red-500/20" },
  warning: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10", badge: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
};

export default function MonitoringPage() {
  const [selectedLog, setSelectedLog] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const errorLog = logEntries.find((l) => l.id === selectedLog && l.status === "error");

  return (
    <div className="space-y-8">
      {/* ── Live Stats Bar ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-3 gap-4"
      >
        {[
          { label: "Total Executions", value: logEntries.length.toString(), icon: Activity, color: "text-blue-400" },
          { label: "Avg Latency", value: "1.9s", icon: Zap, color: "text-amber-400" },
          { label: "Error Rate", value: "12.5%", icon: AlertCircle, color: "text-red-400" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl bg-white/[0.03] flex items-center justify-center ${stat.color}`}>
              <stat.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{stat.value}</p>
              <p className="text-[9px] uppercase tracking-wider text-slate-600">{stat.label}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* ── Execution Logs Table ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Execution Logs</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-600" />
              <Input className="h-7 w-48 pl-8 rounded-lg border-white/5 bg-white/[0.02] text-[10px]" placeholder="Search logs..." />
            </div>
            <Button variant="ghost" size="sm" className="text-slate-500 text-[10px] h-7 hover:text-white">
              <Filter className="h-3 w-3 mr-1" /> Filter
            </Button>
            <Button variant="ghost" size="sm" className="text-slate-500 text-[10px] h-7 hover:text-white">
              <Download className="h-3 w-3 mr-1" /> Export
            </Button>
            <Button variant="ghost" size="sm" className="text-slate-500 text-[10px] h-7 hover:text-white">
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[140px_100px_1fr_80px_70px_70px] gap-4 px-5 py-3 border-b border-white/5 text-[10px] uppercase tracking-wider text-slate-600 font-medium">
            <span className="flex items-center gap-1">Timestamp <ArrowUpDown className="h-3 w-3" /></span>
            <span>Trace ID</span>
            <span>Action</span>
            <span>Status</span>
            <span>Duration</span>
            <span>Tokens</span>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-white/5">
            {logEntries.map((log) => {
              const sc = statusStyles[log.status];
              const StatusIcon = sc.icon;
              return (
                <button
                  key={log.id}
                  onClick={() => setSelectedLog(selectedLog === log.id ? null : log.id)}
                  className={`w-full grid grid-cols-[140px_100px_1fr_80px_70px_70px] gap-4 px-5 py-3 text-left hover:bg-white/[0.02] transition-colors text-xs ${
                    selectedLog === log.id ? "bg-white/[0.03]" : ""
                  }`}
                >
                  <span className="text-slate-500 font-mono text-[11px]">{log.timestamp.split(" ")[1]}</span>
                  <span className="text-slate-400 font-mono text-[11px] truncate">{log.traceId}</span>
                  <span className="text-slate-300 truncate">{log.input}</span>
                  <span>
                    <Badge className={`${sc.badge} text-[9px] py-0 px-1.5 rounded-full`}>
                      <StatusIcon className="h-3 w-3 mr-0.5" />
                      {log.status}
                    </Badge>
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">{log.duration}</span>
                  <span className="text-slate-500 font-mono text-[11px]">{log.tokens > 0 ? log.tokens.toLocaleString() : "—"}</span>
                </button>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
            <span className="text-[10px] text-slate-600">Showing {logEntries.length} of {logEntries.length} entries</span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-600 hover:text-white" disabled>
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <span className="text-[10px] text-slate-400 px-2">Page {page}</span>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-600 hover:text-white" disabled>
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Error Stack Trace (conditionally shown) ───────────── */}
      {errorLog?.error && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Error Details — {errorLog.traceId}</h3>
          <StackTrace trace={errorLog.error} defaultOpen className="rounded-2xl border-white/5 bg-white/[0.02]">
            <StackTraceHeader>
              <StackTraceError>
                <StackTraceErrorType />
                <StackTraceErrorMessage />
              </StackTraceError>
              <StackTraceActions>
                <StackTraceCopyButton />
                <StackTraceExpandButton />
              </StackTraceActions>
            </StackTraceHeader>
            <StackTraceContent>
              <StackTraceFrames showInternalFrames={false} />
            </StackTraceContent>
          </StackTrace>
        </motion.div>
      )}

      {/* ── Rule Execution Log ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        <h2 className="text-sm font-semibold text-white">Rule Execution</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {ruleExecutions.map((rule) => (
            <div
              key={rule.id}
              className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 flex items-center gap-4"
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                rule.result === "pass" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
              }`}>
                {rule.result === "pass" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{rule.name}</p>
                <p className="text-[10px] text-slate-600 font-mono truncate">{rule.condition}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-white">{rule.count}</p>
                <p className="text-[9px] text-slate-600 uppercase">Runs</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
