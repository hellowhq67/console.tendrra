"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ModelSelectorLogo } from "@/components/ai-elements/model-selector";
import {
  ArrowLeft,
  Settings,
  BookOpen,
  Link2,
  Activity,
  LayoutDashboard,
  Play,
  Pause,
  MessageSquare,
  Terminal,
  Edit2,
  Save,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useAgent } from "@/contexts/agents-context";
import { toast } from "sonner";

const statusStyles = {
  running: { dot: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]", text: "text-emerald-400", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  paused: { dot: "bg-amber-500", text: "text-amber-400", badge: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  error: { dot: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]", text: "text-red-400", badge: "bg-red-500/10 text-red-400 border-red-500/20" },
};

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, href: "" },
  { id: "workspace", label: "Workspace", icon: Terminal, href: "/workspace" },
  { id: "configuration", label: "Configuration", icon: Settings, href: "/configuration" },
  { id: "knowledge", label: "Knowledge", icon: BookOpen, href: "/knowledge" },
  { id: "integrations", label: "Integrations", icon: Link2, href: "/integrations" },
  { id: "monitoring", label: "Monitoring", icon: Activity, href: "/monitoring" },
];

export default function AgentDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const agentId = params.agentId as string;
  const { state: agentState, actions: agentActions } = useAgent(agentId);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");

  const agent = agentState.agent;
  const loading = agentState.loading;

  // Update edited name when agent data loads
  useEffect(() => {
    if (agent) {
      setEditedName(agent.name);
    }
  }, [agent]);

  const handleSaveName = async () => {
    if (!agent || !editedName.trim()) return;

    try {
      await agentActions.saveAgentName(editedName.trim());
      setIsEditingName(false);
      toast.success("Agent name updated successfully");
    } catch (error) {
      toast.error("Failed to update agent name");
      // Reset to original name on error
      setEditedName(agent.name);
    }
  };

  const handleCancelEdit = () => {
    setEditedName(agent?.name || "");
    setIsEditingName(false);
  };

  const handleToggleStatus = async () => {
    if (!agent) return;
    await agentActions.toggleAgentStatus();
  };

  // Fallback data for loading state
  const fallbackAgent = {
    name: "Loading...",
    model: "Unknown",
    modelProvider: "google" as const,
    version: "v0.0.0",
    status: "paused" as const,
    environment: "Staging" as const,
  };

  const currentAgent = (agent || fallbackAgent) as typeof fallbackAgent;
  const normalizedStatus = (currentAgent.status || "paused").toLowerCase() as keyof typeof statusStyles;
  const ss = statusStyles[normalizedStatus] || statusStyles.paused;

  const basePath = `/dashboard/agents/${agentId}`;
  const activeTab = tabs.find((t) => {
    if (t.href === "") return pathname === basePath;
    return pathname.startsWith(basePath + t.href);
  })?.id || "overview";

  return (
    <div className="space-y-0">
      {/* ── Agent Header ──────────────────────────────────────────── */}
      <div className="pb-6 space-y-6">
        {/* Back + Actions Row */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard/agents"
            className="flex items-center gap-2 text-xs text-slate-500 hover:text-white transition-colors group"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Registry
          </Link>
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/agents/${agentId}/workspace`}>
              <Button
                size="sm"
                className="rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-400 hover:bg-cyan-500/20 h-8"
              >
                <Terminal className="h-3.5 w-3.5 mr-2" /> Open Workspace
              </Button>
            </Link>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-xl h-8 w-8 p-0 text-slate-500 hover:text-white hover:bg-white/10"
              onClick={handleToggleStatus}
              disabled={loading}
            >
              {normalizedStatus === "running" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Agent Identity */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.05] flex items-center justify-center border border-white/5">
            <ModelSelectorLogo provider={currentAgent.modelProvider} className="!size-6 !invert" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="text-2xl font-bold tracking-tight text-white bg-white/5 border-white/10 h-10 w-auto min-w-[200px]"
                    placeholder="Agent name..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSaveName();
                      } else if (e.key === "Escape") {
                        handleCancelEdit();
                      }
                    }}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-xl h-8 w-8 p-0 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                    onClick={handleSaveName}
                    disabled={!editedName.trim()}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-xl h-8 w-8 p-0 text-slate-500 hover:text-white hover:bg-white/10"
                    onClick={handleCancelEdit}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-white">{currentAgent.name}</h1>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-xl h-6 w-6 p-0 text-slate-600 hover:text-white hover:bg-white/10"
                    onClick={() => setIsEditingName(true)}
                    disabled={loading}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <Badge className={`${ss.badge} text-[9px] py-0 px-2 rounded-full font-medium capitalize`}>
                {currentAgent.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-500">{currentAgent.model}</span>
              <span className="text-slate-700">·</span>
              <span className="text-xs text-emerald-500/80">{currentAgent.version}</span>
              <span className="text-slate-700">·</span>
              <span className="text-xs text-slate-500">{currentAgent.environment}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-white/5 mb-8">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              href={`${basePath}${tab.href}`}
              className={`relative flex items-center gap-2 px-4 py-3 text-xs font-medium transition-colors ${isActive ? "text-white" : "text-slate-500 hover:text-slate-300"
                }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="agentTab"
                  className="absolute bottom-0 left-0 right-0 h-px bg-white"
                />
              )}
            </Link>
          );
        })}
      </div>

      {/* ── Page Content ──────────────────────────────────────────── */}
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
