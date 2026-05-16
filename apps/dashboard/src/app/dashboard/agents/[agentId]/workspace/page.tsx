"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Terminal, Play, Pause, Settings, Save, RotateCcw, 
  AlertCircle, CheckCircle2, Loader2, Clock, MessageSquare,
  BrainCircuit, Zap, Target, Activity, Calendar, FileText,
  Plus, Edit2, Trash2, ExternalLink, RefreshCw,
  Server,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useAgent } from "@/contexts/agents-context";
import { toast } from "sonner";
import { AgentWorkspaceChat } from "@/components/agents/agent-workspace-chat";

interface Agent {
  id: string;
  name: string;
  description?: string;
  instructions?: string;
  model?: string;
  status: "IDLE" | "RUNNING" | "PAUSED" | "ERROR";
  config?: any;
  createdAt: string;
  updatedAt: string;
}

interface Job {
  id: string;
  type: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  payload: any;
  result?: any;
  error?: string;
  createdAt: string;
  finishedAt?: string;
}

export default function AgentTaskWorkspace() {
  const { agentId } = useParams() as { agentId: string };
  const router = useRouter();
  const { state, actions } = useAgent(agentId);
  const [task, setTask] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  // Update local state when agent data changes
  useEffect(() => {
    if (state.agent) {
      setAgentName(state.agent.name || '');
      setIsRunning(state.agent.status === 'RUNNING');
    }
  }, [state.agent]);

  // Auto-refresh jobs when agent is running
  useEffect(() => {
    if (state.agent?.status === 'RUNNING') {
      const interval = setInterval(() => {
        actions.refreshJobs();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [state.agent?.status, actions.refreshJobs]);

  const saveAgentName = async () => {
    if (!agentName.trim() || agentName === state.agent?.name) return;
    await actions.saveAgentName(agentName);
    setIsEditingName(false);
  };

  const runTask = async () => {
    if (!task.trim()) {
      toast.error("Please enter a task");
      return;
    }
    
    await actions.runTask(task);
    setTask("");
  };

  const toggleAgentStatus = async () => {
    await actions.toggleAgentStatus();
  };

  if (state.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!state.agent) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Agent Not Found</h3>
        <p className="text-slate-400 mb-4">The agent you're looking for doesn't exist or you don't have access.</p>
        <Button onClick={() => router.push('/dashboard/agents')} className="rounded-xl">
          Back to Agents
        </Button>
      </div>
    );
  }

  const statusConfig = {
    IDLE: { color: "text-slate-400", bg: "bg-slate-500/10", border: "border-slate-500/20", icon: Clock },
    RUNNING: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: Activity },
    PAUSED: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: Pause },
    ERROR: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", icon: AlertCircle },
  };

  const status = statusConfig[state.agent.status] || statusConfig.IDLE;
  const StatusIcon = status.icon;

  return (
    <div className="flex h-[calc(100vh-6rem)] w-full overflow-hidden gap-6 p-6">
      {/* ── Main Content Area ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        {/* ── Agent Header ────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/5 bg-white/[0.02] p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-white/5">
                <BrainCircuit className="h-6 w-6 text-cyan-400" />
              </div>
              <div className="flex-1">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      className="text-lg font-semibold text-white bg-white/5 border-white/10"
                      placeholder="Agent name"
                    />
                    <Button size="sm" onClick={saveAgentName} className="rounded-xl">
                      <Save className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setIsEditingName(false)} className="rounded-xl">
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-white">{state.agent?.name || 'Unnamed Agent'}</h1>
                    <Button size="sm" variant="ghost" onClick={() => setIsEditingName(true)} className="rounded-xl h-6 w-6 p-0">
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
                <div className="flex items-center gap-3 mt-1">
                  <Badge className={`${status.bg} ${status.color} ${status.border} text-[10px] py-0 px-2 rounded-full font-medium flex items-center gap-1`}>
                    <StatusIcon className="h-3 w-3" />
                    {state.agent?.status || 'IDLE'}
                  </Badge>
                  {state.agent?.model && (
                    <Badge variant="secondary" className="text-[10px]">
                      {state.agent.model}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={toggleAgentStatus}
                variant="outline"
                className={`rounded-xl border-white/10 ${isRunning ? 'text-amber-400 hover:bg-amber-400/10' : 'text-emerald-400 hover:bg-emerald-400/10'}`}
              >
                {isRunning ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                {isRunning ? 'Pause' : 'Start'}
              </Button>
              <Button
                onClick={() => router.push(`/dashboard/agents/${agentId}/configuration`)}
                variant="ghost"
                className="rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
              >
                <Settings className="h-4 w-4 mr-2" /> Configure
              </Button>
            </div>
          </div>
          
          {state.agent?.description && (
            <p className="text-sm text-slate-400 mt-4 leading-relaxed">{state.agent.description}</p>
          )}
        </motion.div>

        <AgentWorkspaceChat agentId={agentId} />

        {/* ── Task Input ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-white/5 bg-white/[0.02] p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Target className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Task Execution</h2>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                value={task}
                onChange={(e) => setTask(e.target.value)}
                className="rounded-xl bg-white/5 border-white/10 text-white placeholder:text-slate-600"
                placeholder="Describe a task for this agent..."
                onKeyDown={(e) => e.key === 'Enter' && runTask()}
              />
            </div>
            <Button 
              onClick={runTask} 
              disabled={!task.trim() || !isRunning}
              className="rounded-xl bg-cyan-500 text-white hover:bg-cyan-600 font-semibold shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50"
            >
              <Play className="h-4 w-4 mr-2" /> Run Task
            </Button>
          </div>
          {!isRunning && (
            <p className="text-[11px] text-amber-400 mt-2 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Agent is paused. Start the agent to execute tasks.
            </p>
          )}
        </motion.div>

        {/* ── Task History ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 rounded-2xl border border-white/5 bg-white/[0.02] p-6 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-white">Execution History</h2>
            </div>
            <Button
              onClick={() => actions.refreshJobs()}
              variant="ghost"
              size="sm"
              className="rounded-xl text-slate-400 hover:text-white"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {state.jobs.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <Terminal className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No tasks executed yet</p>
                    <p className="text-[11px] text-slate-600 mt-1">Run your first task to see execution history</p>
                  </motion.div>
                ) : (
                  state.jobs.map((job: Job, index: number) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.05] transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          job.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' :
                          job.status === 'PROCESSING' ? 'bg-blue-500/10 text-blue-500' :
                          job.status === 'FAILED' ? 'bg-red-500/10 text-red-500' :
                          'bg-slate-500/10 text-slate-500'
                        }`}>
                          {job.status === 'PROCESSING' ? <Loader2 className="h-4 w-4 animate-spin" /> :
                           job.status === 'COMPLETED' ? <CheckCircle2 className="h-4 w-4" /> :
                           job.status === 'FAILED' ? <AlertCircle className="h-4 w-4" /> :
                           <Clock className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium mb-1">{job.payload?.task || 'Untitled Task'}</p>
                          <div className="flex items-center gap-3 text-[10px] text-slate-600">
                            <span>#{job.id.slice(-8)}</span>
                            <span>•</span>
                            <span className={`capitalize ${
                              job.status === 'COMPLETED' ? 'text-emerald-400' :
                              job.status === 'PROCESSING' ? 'text-blue-400' :
                              job.status === 'FAILED' ? 'text-red-400' :
                              'text-slate-400'
                            }`}>{job.status.toLowerCase()}</span>
                            <span>•</span>
                            <span>{new Date(job.createdAt).toLocaleTimeString()}</span>
                          </div>
                          {job.result && (
                            <div className="mt-2 p-2 rounded-lg bg-white/[0.02] border border-white/5">
                              <p className="text-xs text-slate-400">{JSON.stringify(job.result).slice(0, 100)}...</p>
                            </div>
                          )}
                          {job.error && (
                            <div className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                              <p className="text-xs text-red-400">{job.error}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </motion.div>
      </div>

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <div className="w-80 space-y-6">
        {/* ── Quick Actions ────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 space-y-4"
        >
          <h3 className="text-sm font-semibold text-white">Quick Actions</h3>
          <div className="space-y-2">
            <Button
              onClick={() => router.push(`/dashboard/agents/${agentId}/configuration`)}
              variant="ghost"
              className="w-full justify-start rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
            >
              <Settings className="h-4 w-4 mr-3" /> Configuration
            </Button>
            <Button
              onClick={() => router.push(`/dashboard/agents/${agentId}/integrations`)}
              variant="ghost"
              className="w-full justify-start rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
            >
              <Zap className="h-4 w-4 mr-3" /> Integrations
            </Button>
            <Button
              onClick={() => router.push(`/dashboard/agents/${agentId}/knowledge`)}
              variant="ghost"
              className="w-full justify-start rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
            >
              <FileText className="h-4 w-4 mr-3" /> Knowledge Base
            </Button>
            <Button
              onClick={() => router.push(`/dashboard/agents/${agentId}/server`)}
              variant="ghost"
              className="w-full justify-start rounded-xl text-slate-300 hover:text-white hover:bg-white/10"
            >
              <Server className="h-4 w-4 mr-3" /> Server Settings
            </Button>
          </div>
        </motion.div>

        {/* ── Agent Stats ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 space-y-4"
        >
          <h3 className="text-sm font-semibold text-white">Agent Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">Total Tasks</span>
              <span className="text-sm font-medium text-white">{state.jobs.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">Completed</span>
              <span className="text-sm font-medium text-emerald-400">
                {state.jobs.filter(j => j.status === 'COMPLETED').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">Failed</span>
              <span className="text-sm font-medium text-red-400">
                {state.jobs.filter(j => j.status === 'FAILED').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">Running</span>
              <span className="text-sm font-medium text-blue-400">
                {state.jobs.filter(j => j.status === 'PROCESSING').length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">Created</span>
              <span className="text-sm font-medium text-slate-300">
                {state.agent?.createdAt ? new Date(state.agent.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">Last Updated</span>
              <span className="text-sm font-medium text-slate-300">
                {state.agent?.updatedAt ? new Date(state.agent.updatedAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
