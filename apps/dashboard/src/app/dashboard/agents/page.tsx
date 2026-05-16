"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bot, Plus, Play, Pause, AlertCircle, CheckCircle2, 
  Activity, Settings, Trash2, Cpu, Sparkles, Link2,
  Database, Cloud, Webhook, Search, Filter, Clock, ArrowRight, X,
  MessageSquare, FileText, Globe, RefreshCw, BrainCircuit
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAgents, type Agent} from "@/contexts/agents-context";
import { AgentsProvider } from "@/contexts/agents-context";

// ── Types ────────────────────────────────────────────────────────────────
type AgentStatus = "running" | "paused" | "error" | "idle";
type AgentEnvironment = "Production" | "Staging";

interface IntegrationPlatform {
  id: string;
  name: string;
  icon: any;
  status: "connected" | "available";
  desc: string;
}

// ── Constants ─────────────────────────────────────────────────────────────

const INTEGRATION_PLATFORMS: IntegrationPlatform[] = [
  { id: "mcp", name: "MCP Servers", icon: Cpu, status: "available", desc: "Connect model context protocol servers" },
  { id: "firebase", name: "Firebase", icon: Database, status: "connected", desc: "Firestore, Auth, Storage" },
  { id: "slack", name: "Slack", icon: MessageSquare, status: "available", desc: "Send/receive messages in channels" },
  { id: "notion", name: "Notion", icon: FileText, status: "available", desc: "Read/write Notion databases" },
  { id: "gcp", name: "Google Cloud", icon: Cloud, status: "connected", desc: "Compute, BigQuery, Vertex AI" },
  { id: "aws", name: "AWS", icon: Cloud, status: "available", desc: "Lambda, S3, SageMaker" },
  { id: "bigquery", name: "BigQuery", icon: Database, status: "connected", desc: "SQL analytics & research data" },
  { id: "webhooks", name: "Webhooks", icon: Webhook, status: "available", desc: "Custom HTTP endpoints" },
];

const STATUS_CONFIG = {
  RUNNING: {
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    icon: Activity,
  },
  PAUSED: {
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    icon: Pause,
  },
  ERROR: {
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    icon: AlertCircle,
  },
  IDLE: {
    color: "text-slate-400",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
    icon: CheckCircle2,
  },
} as const;

const ENV_CONFIG = {
  Production: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Staging: "bg-amber-500/10 text-amber-400 border-amber-500/20",
} as const;

const AGENT_TYPES = [
  { key: "General", title: "General Purpose", desc: "Versatile agent for various tasks", icon: Sparkles },
  { key: "Specialist", title: "Specialist", desc: "Focused on specific domains", icon: BrainCircuit },
] as const;

// ── Page Component ────────────────────────────────────────────────────────────

export default function AgentsPage() {
  return (
    <AgentsProvider>
      <AgentsPageContent />
    </AgentsProvider>
  );
}

// ── Components ──────────────────────────────────────────────────────────

interface StatsCardProps {
  label: string;
  value: number;
  icon: any;
  color: string;
  delay: number;
}

function StatsCard({ label, value, icon: Icon, color, delay }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl border border-white/5 bg-white/[0.02] p-6"
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${
          color.includes("emerald") ? "bg-emerald-500/10" : 
          color.includes("amber") ? "bg-amber-500/10" : 
          color.includes("red") ? "bg-red-500/10" : 
          "bg-slate-500/10"
        } flex items-center justify-center`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

interface AgentCardProps {
  agent: Agent;
  index: number;
  selectedAgents: string[];
  onToggleSelect: (id: string) => void;
  router: any;
}

function AgentCard({ agent, index, selectedAgents, onToggleSelect, router }: AgentCardProps) {
  const statusConfig = STATUS_CONFIG[agent.status] || STATUS_CONFIG.IDLE;
  const StatusIcon = statusConfig.icon;

  return (
    <motion.div
      key={agent.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ delay: index * 0.04 }}
      className="group relative rounded-2xl border border-white/5 bg-white/[0.02] hover:border-white/15 transition-all overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative p-6 h-full flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center border border-white/10">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white truncate">{agent.name}</h3>
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <Badge className={`${statusConfig.bg} ${statusConfig.color} ${statusConfig.border} text-[10px] py-0 px-2 rounded-full font-medium flex items-center gap-1`}>
                  <StatusIcon className="h-3 w-3" />
                  {agent.status}
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  {agent.config?.environment || "Development"}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => router.push(`/dashboard/agents/${agent.id}/workspace`)}
              className="rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
              size="sm"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => onToggleSelect(agent.id)}
              className={`rounded-xl border ${
                selectedAgents.includes(agent.id)
                  ? "bg-white/10 border-white/20 text-white"
                  : "border-white/5 text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
              size="sm"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 mt-4 space-y-3">
          <div className="flex items-center gap-2 text-[10px] text-slate-500">
            <MessageSquare className="h-4 w-4" />
            <span className="line-clamp-2">{agent.description || "No description available"}</span>
          </div>
          
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Conversations: {agent.config?.conversations?.toLocaleString() || "0"}</span>
            <span>Errors: {agent.config?.errors || 0}</span>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => router.push(`/dashboard/agents/${agent.id}/workspace`)}
              className="flex-1 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white text-xs"
              size="sm"
            >
              <Globe className="h-3 w-3 mr-1" />
              Workspace
            </Button>
            <Button
              onClick={() => router.push(`/dashboard/agents/${agent.id}/configuration`)}
              className="flex-1 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white text-xs"
              size="sm"
            >
              <FileText className="h-3 w-3 mr-1" />
              Configure
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────

function AgentsPageContent() {
  const { state, actions } = useAgents();
  const [showCreate, setShowCreate] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [activeFilter, setActiveFilter] = useState<AgentStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [createMode, setCreateMode] = useState("General");
  const [deployLoading, setDeployLoading] = useState(false);
  const router = useRouter();

  // Memoized filtered agents
  const filteredAgents = useMemo(() => {
    let agents = state.agents;
    
    if (activeFilter !== "all") {
      agents = agents.filter((agent) => 
        agent.status.toLowerCase() === activeFilter.toLowerCase()
      );
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      agents = agents.filter((agent) =>
        agent.name.toLowerCase().includes(query) ||
        agent.description?.toLowerCase().includes(query)
      );
    }
    
    return agents;
  }, [state.agents, activeFilter, searchQuery]);

  // Memoized stats
  const stats = useMemo(() => ({
    total: state.agents.length,
    running: state.agents.filter((a) => a.status === "RUNNING").length,
    paused: state.agents.filter((a) => a.status === "PAUSED").length,
    errors: state.agents.filter((a) => a.status === "ERROR").length,
  }), [state.agents]);

  // Event handlers
  const handleToggleSelect = useCallback((agentId: string) => {
    setSelectedAgents(prev => 
      prev.includes(agentId)
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  }, []);

  const handleCreateAgent = useCallback(async () => {
    if (deployLoading) return;
    
    setDeployLoading(true);
    try {
      await actions.createAgent({
        name: "New Autonomous Agent",
        type: createMode,
        role: "Assistant",
        description: "Created via Dashboard",
        model: "gemini-2.5-pro",
        instructions: "You are a helpful AI assistant."
      });
      setShowCreate(false);
      toast.success("Agent created successfully");
    } catch (error) {
      console.error("Error creating agent:", error);
      toast.error("Failed to create agent");
    } finally {
      setDeployLoading(false);
    }
  }, [actions, createMode, deployLoading]);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedAgents.length === 0) return;
    
    try {
      // Delete selected agents
      await Promise.all(selectedAgents.map(id => actions.deleteAgent(id)));
      setSelectedAgents([]);
      toast.success(`Deleted ${selectedAgents.length} agent(s)`);
    } catch (error) {
      console.error("Error deleting agents:", error);
      toast.error("Failed to delete agents");
    }
  }, [selectedAgents, actions]);

  return (
    <div className="space-y-8">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-slate-500 font-medium">
            <span>Intelligence</span>
            <span className="text-slate-800">/</span>
            <span>Autonomous Agents</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Agents</h1>
          <p className="text-slate-400">Deploy and manage your AI agents</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowCreate(true)}
            className="rounded-xl bg-white text-black hover:bg-slate-200 font-semibold shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            <Plus className="h-4 w-4 mr-2" /> New Agent
          </Button>
          <Button
            onClick={() => setShowIntegrations(true)}
            variant="ghost"
            className="rounded-xl border border-white/5 text-slate-300 hover:text-white hover:bg-white/10"
          >
            <Link2 className="h-4 w-4 mr-2" /> Integrations
          </Button>
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Total" value={stats.total} icon={Cpu} color="text-slate-400" delay={0} />
        <StatsCard label="Running" value={stats.running} icon={Activity} color="text-emerald-400" delay={0.05} />
        <StatsCard label="Paused" value={stats.paused} icon={Pause} color="text-amber-400" delay={0.1} />
        <StatsCard label="Errors" value={stats.errors} icon={AlertCircle} color="text-red-400" delay={0.15} />
      </div>

      {/* ── Filter Bar ────────────────────────────────────── */}
      <div className="flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2 border-r border-white/5 pr-4">
          {[
            { key: "all", label: "All", count: stats.total },
            { key: "running", label: "Running", count: stats.running },
            { key: "paused", label: "Paused", count: stats.paused },
            { key: "error", label: "Errors", count: stats.errors },
          ].map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key as any)}
              className={`px-3 py-2 rounded-xl text-sm transition-all ${
                activeFilter === filter.key
                  ? "bg-white/10 text-white"
                  : "text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              {filter.label}
              <span className="ml-2 text-xs">{filter.count}</span>
            </button>
          ))}
        </div>
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search agents..."
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-600"
            />
          </div>
        </div>
        {selectedAgents.length > 0 && (
          <Button
            onClick={handleDeleteSelected}
            variant="ghost"
            className="rounded-xl text-red-400 hover:text-red-300 hover:bg-red-400/10"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete ({selectedAgents.length})
          </Button>
        )}
      </div>

      {/* ── Agents Grid ──────────────────────────────────── */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredAgents.map((agent: Agent, index: number) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              index={index}
              selectedAgents={selectedAgents}
              onToggleSelect={handleToggleSelect}
              router={router}
            />
          ))}
        </AnimatePresence>
        
        {/* Empty State */}
        {filteredAgents.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-full text-center py-16"
          >
            <Bot className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No agents found</h3>
            <p className="text-slate-400 mb-6">
              {searchQuery ? "Try adjusting your search terms" : "Create your first agent to get started"}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setShowCreate(true)}
                className="rounded-xl bg-white text-black hover:bg-slate-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Agent
              </Button>
            )}
          </motion.div>
        )}
      </div>

      {/* ── Create Agent Modal ────────────────────────────── */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-2xl shadow-[0_0_50px_rgba(0,0,0,0.3)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Create New Agent</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreate(false)}
                  className="rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
                >
                  ×
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-2 block">Agent Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: "General", title: "General Purpose", desc: "Versatile agent for various tasks", icon: Sparkles },
                      { key: "Specialist", title: "Specialist", desc: "Focused on specific domains", icon: BrainCircuit },
                    ].map((mode) => (
                      <button
                        key={mode.key}
                        onClick={() => setCreateMode(mode.key as any)}
                        className={`p-4 rounded-xl border transition-all ${
                          createMode === mode.key
                            ? "bg-white/10 border-white/20"
                            : "border-white/5 hover:bg-white/5"
                        }`}
                      >
                        <div className="flex flex-col items-center text-center">
                          <mode.icon className={`h-6 w-6 mb-2 ${
                            createMode === mode.key ? "text-white" : "text-slate-400"
                          }`} />
                          <div className={createMode === mode.key ? "text-white" : "text-slate-300"}>
                            <div className="text-sm font-medium">{mode.title}</div>
                            <div className="text-[10px]">{mode.desc}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 mt-4">
                  <Button 
                    onClick={handleCreateAgent}
                    disabled={deployLoading}
                    className="w-full rounded-xl bg-white text-black hover:bg-slate-200 font-semibold shadow-[0_0_20px_rgba(255,255,255,0.1)] disabled:opacity-50"
                  >
                    {deployLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Agent
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Integrations Side Panel ─────────────────────────────────── */}
      <AnimatePresence>
        {showIntegrations && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed right-0 top-0 h-full w-80 bg-slate-900/95 backdrop-blur-sm z-50 border-l border-white/10 p-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Platform Integrations</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowIntegrations(false)}
                className="rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
              >
                ×
              </Button>
            </div>
            <div className="space-y-4">
              {INTEGRATION_PLATFORMS.map((platform) => (
                <div
                  key={platform.id}
                  className="p-4 rounded-xl border border-white/5 hover:border-white/10 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <platform.icon className="h-5 w-5 text-slate-400" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-white">{platform.name}</h4>
                      <p className="text-xs text-slate-500">{platform.desc}</p>
                    </div>
                    <Badge
                      className={`text-xs ${
                        platform.status === "connected"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                      }`}
                    >
                      {platform.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
