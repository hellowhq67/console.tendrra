"use client";

import { ModelSelectorLogo } from "@/components/ai-elements/model-selector";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import {
  Save,
  Sliders,
  Plus,
  Calendar as CalendarIcon,
  Zap,
  Server,
  Bot,
  Shield,
  BarChart3,
  Terminal,
  RefreshCw,
  Link2,
  Play,
  Cpu,
  BrainCircuit,
  Sparkles,
  Info,
  Clock,
  Timer,
  Settings,
  Database,
} from "lucide-react";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getAuth } from "firebase/auth";
import { toast } from "sonner";
import { useAgent, useAgents } from "@/contexts/agents-context";
import { getApiBaseUrl } from "@/lib/api-base";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type ModelRow = { id: string; name: string; provider: string };

const FALLBACK_MODELS: ModelRow[] = [
  { id: "gemini-2.0-flash-exp", name: "Gemini 2.0 Flash", provider: "google" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", provider: "google" },
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", provider: "google" },
];

const FALLBACK_MCP = [
  { id: "filesystem", name: "File System Access", description: "Read/write files and directories" },
  { id: "database", name: "Database Query", description: "Execute SQL queries and manage data" },
  { id: "web-search", name: "Web Search", description: "Search the web and retrieve information" },
  { id: "parallel-web-search", name: "Parallel web search", description: "Multi-query Parallel search" },
  { id: "knowledge-base", name: "Knowledge base", description: "Search uploaded knowledge" },
  { id: "code-execution", name: "Code Execution", description: "Run code in sandboxed environments" },
  { id: "api-caller", name: "API Caller", description: "Make HTTP requests to external APIs" },
  { id: "email", name: "Email Client", description: "Send and receive emails" },
];

export default function ConfigurationPage() {
  const { agentId } = useParams() as { agentId: string };
  const { state: agentState, actions: agentActions } = useAgent(agentId);
  const { actions: globalActions } = useAgents();
  const agent = agentState.agent;
  const loading = agentState.loading;

  const [availableModels, setAvailableModels] = useState<ModelRow[]>(FALLBACK_MODELS);
  const [mcpServers, setMcpServers] = useState(FALLBACK_MCP);

  const [activeTab, setActiveTab] = useState("basic");
  const [saving, setSaving] = useState(false);

  // Basic Settings
  const [systemPrompt, setSystemPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("gemini-2.0-flash-exp");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4096);

  // Scheduling & Automation
  const [runMode, setRunMode] = useState("manual");
  const [schedule, setSchedule] = useState("0 9 * * 1-5");
  const [timezone, setTimezone] = useState("UTC");
  const [maxConcurrentTasks, setMaxConcurrentTasks] = useState(5);
  const [retryAttempts, setRetryAttempts] = useState(3);
  const [timeoutSeconds, setTimeoutSeconds] = useState(300);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // MCP & Tools
  const [enabledMcpServers, setEnabledMcpServers] = useState<string[]>([]);
  const [customTools, setCustomTools] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});

  // Server & Performance
  const [continuousMode, setContinuousMode] = useState(false);
  const [serverPort, setServerPort] = useState(8080);
  const [enableWebhook, setEnableWebhook] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [maxMemoryMB, setMaxMemoryMB] = useState(1024);
  const [cpuLimit, setCpuLimit] = useState(50);
  const [enableLogging, setEnableLogging] = useState(true);
  const [logLevel, setLogLevel] = useState("info");

  // Security
  const [requireAuth, setRequireAuth] = useState(true);
  const [allowedDomains, setAllowedDomains] = useState("");
  const [enableRateLimit, setEnableRateLimit] = useState(true);
  const [rateLimitPerMinute, setRateLimitPerMinute] = useState(60);

  useEffect(() => {
    const loadMeta = async () => {
      const user = getAuth().currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };
      const base = getApiBaseUrl();
      try {
        const [mr, sr] = await Promise.all([
          fetch(`${base}/api/agents/meta/models`, { headers }),
          fetch(`${base}/api/agents/meta/mcp-servers`, { headers }),
        ]);
        if (mr.ok) {
          const d = await mr.json();
          if (Array.isArray(d.models) && d.models.length) {
            setAvailableModels(d.models);
          }
        }
        if (sr.ok) {
          const d = await sr.json();
          if (Array.isArray(d.servers) && d.servers.length) {
            setMcpServers(d.servers);
          }
        }
      } catch {
        /* keep fallbacks */
      }
    };
    void loadMeta();
  }, []);

  // Initialize form values from agent data
  useEffect(() => {
    if (agent) {
      setSystemPrompt(agent.instructions || "");
      setSelectedModel(agent.model || "gemini-2.0-flash-exp");

      // Load config values
      const config = agent.config || {};
      setTemperature(config.temperature ?? 0.7);
      setMaxTokens(config.maxTokens ?? 4096);
      setRunMode(config.runMode || "manual");
      setSchedule(config.schedule || "0 9 * * 1-5");
      setTimezone(config.timezone || "UTC");
      setMaxConcurrentTasks(config.maxConcurrentTasks ?? 5);
      setRetryAttempts(config.retryAttempts ?? 3);
      setTimeoutSeconds(config.timeoutSeconds ?? 300);
      setEnabledMcpServers(config.enabledMcpServers || []);
      setCustomTools(config.customTools || []);
      setApiKeys(config.apiKeys || {});
      setContinuousMode(config.continuousMode || false);
      setServerPort(config.serverPort ?? 8080);
      setEnableWebhook(config.enableWebhook || false);
      setWebhookUrl(config.webhookUrl || "");
      setMaxMemoryMB(config.maxMemoryMB ?? 1024);
      setCpuLimit(config.cpuLimit ?? 50);
      setEnableLogging(config.enableLogging !== false);
      setLogLevel(config.logLevel || "info");
      setRequireAuth(config.requireAuth !== false);
      setAllowedDomains(config.allowedDomains || "");
      setEnableRateLimit(config.enableRateLimit !== false);
      setRateLimitPerMinute(config.rateLimitPerMinute ?? 60);
    }
  }, [agent]);

  const handleSave = async () => {
    if (!agent) return;

    setSaving(true);

    try {
      const enabledTools: string[] = [];
      for (const sid of enabledMcpServers) {
        if (sid === "web-search") enabledTools.push("webSearch");
        if (sid === "parallel-web-search") enabledTools.push("parallelWebSearch");
        if (sid === "knowledge-base") enabledTools.push("knowledgeSearch");
        if (sid === "filesystem") {
          enabledTools.push("fileRead", "fileWrite");
        }
        if (sid === "code-execution") enabledTools.push("codeExecution");
      }

      await globalActions.updateAgent(agentId, {
        instructions: systemPrompt,
        model: selectedModel,
        config: {
          temperature,
          maxTokens,
          runMode,
          schedule,
          timezone,
          maxConcurrentTasks,
          retryAttempts,
          timeoutSeconds,
          enabledMcpServers,
          enabledTools,
          customTools,
          apiKeys,
          continuousMode,
          serverPort,
          enableWebhook,
          webhookUrl,
          maxMemoryMB,
          cpuLimit,
          enableLogging,
          logLevel,
          requireAuth,
          allowedDomains,
          enableRateLimit,
          rateLimitPerMinute,
        }
      });

      toast.success("Configuration saved successfully");
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const currentModel =
    availableModels.find((m) => m.id === selectedModel) || availableModels[0];
  const modelProvider =
    (currentModel?.provider as "google" | "openai" | "anthropic") || "google";

  if (loading || !agent) return (
    <div className="flex items-center justify-center h-64">
      <RefreshCw className="h-8 w-8 animate-spin text-slate-500" />
    </div>
  );

  return (
    <TooltipProvider>
      <div className="space-y-8 max-w-6xl mx-auto pb-12">
        {/* ── Header ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <Settings className="h-7 w-7 text-blue-500" />
              Agent Configuration
            </h1>
            <p className="text-slate-400 text-sm">Fine-tune behavior, schedule tasks, and manage enterprise integrations</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-white text-black hover:bg-slate-200 font-bold px-6 py-5 shadow-xl shadow-white/5 disabled:opacity-50 transition-all active:scale-95"
            >
              {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </motion.div>

        {/* ── Configuration Tabs ────────────────────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 bg-white/[0.03] border border-white/5 rounded-2xl p-1.5 h-auto">
            {[
              { id: "basic", label: "Intelligence", icon: Bot },
              { id: "scheduling", label: "Scheduling", icon: CalendarIcon },
              { id: "tools", label: "Capabilities", icon: Zap },
              { id: "server", label: "Endpoint", icon: Server },
              { id: "performance", label: "Resources", icon: BarChart3 },
              { id: "security", label: "Security", icon: Shield },
            ].map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="rounded-xl py-3 data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-400 data-[state=active]:border-blue-500/20 border border-transparent transition-all"
              >
                <tab.icon className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ── Intelligence Tab ──────────────────────────────────────── */}
          <TabsContent value="basic" className="space-y-8 outline-none">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="p-6 rounded-3xl border border-white/5 bg-white/[0.01] backdrop-blur-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-white">System Personality</h2>
                      <p className="text-xs text-slate-500">How the agent should behave and interact</p>
                    </div>
                    <Sparkles className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="relative group">
                    <Textarea
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      rows={12}
                      className="w-full bg-black/20 border-white/5 rounded-2xl text-sm text-slate-300 p-5 resize-none focus:border-blue-500/50 focus:ring-0 transition-all leading-relaxed"
                      placeholder="e.g. You are a senior data analyst. Be concise and technical..."
                    />
                    <div className="absolute bottom-4 right-4 text-[10px] text-slate-600 bg-black/40 px-2 py-1 rounded-md">
                      {systemPrompt.length} chars
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-6 rounded-3xl border border-white/5 bg-white/[0.01] space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                      <BrainCircuit className="h-4 w-4 text-blue-400" />
                      Model & Logic
                    </h3>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Active Engine</label>
                        <Select value={selectedModel} onValueChange={setSelectedModel}>
                          <SelectTrigger className="w-full rounded-xl border border-white/5 bg-black/20 h-14 hover:border-white/10 transition-all">
                            <div className="flex items-center gap-3">
                              <ModelSelectorLogo provider={modelProvider} className="!size-5" />
                              <div className="text-left">
                                <p className="text-sm font-medium text-white leading-none">{currentModel.name}</p>
                                <p className="text-[10px] text-slate-500 capitalize mt-1">{modelProvider}</p>
                              </div>
                            </div>
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-white/10 rounded-2xl">
                            {availableModels.map((model) => (
                              <SelectItem key={model.id} value={model.id} className="rounded-xl m-1">
                                <div className="flex items-center gap-3">
                                  <ModelSelectorLogo provider={(model.provider as any) || "google"} />
                                  <div>
                                    <p className="text-sm font-medium text-white">{model.name}</p>
                                    <p className="text-[10px] text-slate-500 capitalize">{model.provider}</p>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-6 pt-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-slate-300">Temperature</label>
                            <span className="text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-full">{temperature.toFixed(1)}</span>
                          </div>
                          <Slider
                            value={[temperature]}
                            min={0}
                            max={2}
                            step={0.1}
                            onValueChange={([v]) => setTemperature(v)}
                            className="py-4"
                          />
                          <p className="text-[10px] text-slate-600">Lower is focused/deterministic, higher is creative.</p>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-slate-300">Context Window</label>
                            <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">{maxTokens}</span>
                          </div>
                          <Slider
                            value={[maxTokens]}
                            min={256}
                            max={32768}
                            step={256}
                            onValueChange={([v]) => setMaxTokens(v)}
                            className="py-4"
                          />
                          <p className="text-[10px] text-slate-600">Maximum response length in tokens.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* ── Scheduling Tab ───────────────────────────────────── */}
          <TabsContent value="scheduling" className="space-y-6 outline-none">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="p-6 rounded-3xl border border-white/5 bg-white/[0.01] space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">Execution Cycle</h2>
                      <p className="text-xs text-slate-500">Define when this agent performs its tasks</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Run Strategy</label>
                      <Select value={runMode} onValueChange={setRunMode}>
                        <SelectTrigger className="rounded-xl bg-black/20 border-white/5 h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10">
                          <SelectItem value="manual">Manual Trigger</SelectItem>
                          <SelectItem value="scheduled">Scheduled (Cron)</SelectItem>
                          <SelectItem value="continuous">Continuous Loop</SelectItem>
                          <SelectItem value="event-driven">Webhooks/Events</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Region/Timezone</label>
                      <Select value={timezone} onValueChange={setTimezone}>
                        <SelectTrigger className="rounded-xl bg-black/20 border-white/5 h-12">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-white/10">
                          <SelectItem value="UTC">Universal (UTC)</SelectItem>
                          <SelectItem value="America/New_York">Eastern Time</SelectItem>
                          <SelectItem value="Europe/London">London (GMT)</SelectItem>
                          <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Cron Pattern</label>
                    <div className="flex gap-2">
                      <Input
                        value={schedule}
                        onChange={(e) => setSchedule(e.target.value)}
                        placeholder="0 9 * * 1-5"
                        className="rounded-xl bg-black/20 border-white/5 h-12 flex-1 font-mono text-blue-400"
                      />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-xl border border-white/5">
                            <Info className="h-4 w-4 text-slate-500" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Standard Crontab expression</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/5">
                    {[
                      { label: "Concurrency", val: maxConcurrentTasks, set: setMaxConcurrentTasks, max: 20 },
                      { label: "Retries", val: retryAttempts, set: setRetryAttempts, max: 10 },
                      { label: "Timeout (s)", val: timeoutSeconds, set: setTimeoutSeconds, max: 3600, min: 30 },
                    ].map((item) => (
                      <div key={item.label} className="space-y-2">
                        <label className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">{item.label}</label>
                        <Input
                          type="number"
                          value={item.val}
                          onChange={(e) => item.set(parseInt(e.target.value) || 0)}
                          className="rounded-xl bg-black/20 border-white/5 h-10 text-center"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-6 rounded-3xl border border-white/5 bg-white/[0.01] space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white">Schedule Preview</h3>
                    <CalendarIcon className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="flex justify-center p-2 bg-black/20 rounded-2xl border border-white/5">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md"
                    />
                  </div>
                  <p className="text-[10px] text-center text-slate-500">Visualization of next 30 days based on active schedule</p>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* ── Tools Tab ────────────────────────────────────────── */}
          <TabsContent value="tools" className="space-y-6 outline-none">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Model Context Protocol</h2>
                  <p className="text-sm text-slate-500">Enable specialized toolsets and data access layers</p>
                </div>
                <Button variant="outline" className="rounded-xl border-white/10 hover:bg-white/5">
                  <Plus className="h-4 w-4 mr-2" /> Add Custom Server
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {mcpServers.map((server) => (
                  <div
                    key={server.id}
                    className={`p-5 rounded-3xl border transition-all cursor-pointer group ${enabledMcpServers.includes(server.id)
                        ? "bg-blue-500/5 border-blue-500/20"
                        : "bg-white/[0.01] border-white/5 hover:border-white/10"
                      }`}
                    onClick={() => {
                      if (enabledMcpServers.includes(server.id)) {
                        setEnabledMcpServers(enabledMcpServers.filter(id => id !== server.id));
                      } else {
                        setEnabledMcpServers([...enabledMcpServers, server.id]);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${enabledMcpServers.includes(server.id) ? "bg-blue-500/20 text-blue-400" : "bg-white/5 text-slate-500"
                        }`}>
                        {server.id === 'web-search' ? <Globe2 className="h-5 w-5" /> :
                          server.id === 'filesystem' ? <Database className="h-5 w-5" /> :
                            server.id === 'code-execution' ? <Terminal className="h-5 w-5" /> :
                              <Zap className="h-5 w-5" />}
                      </div>
                      <Switch
                        checked={enabledMcpServers.includes(server.id)}
                        onCheckedChange={() => { }} // handled by div click
                        className="data-[state=checked]:bg-blue-500"
                      />
                    </div>
                    <h4 className="text-sm font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">{server.name}</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed">{server.description}</p>
                  </div>
                ))}
              </div>

              <div className="p-8 rounded-3xl border border-white/5 bg-white/[0.01] mt-8">
                <div className="flex items-center gap-3 mb-6">
                  <Key className="h-5 w-5 text-emerald-500" />
                  <h3 className="text-lg font-semibold text-white">Encrypted Vault</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  {Object.entries(apiKeys).length === 0 ? (
                    <div className="col-span-2 py-12 text-center border-2 border-dashed border-white/5 rounded-2xl">
                      <p className="text-sm text-slate-500">No secrets configured. Add keys to enable integrations.</p>
                    </div>
                  ) : (
                    Object.entries(apiKeys).map(([service, key]) => (
                      <div key={service} className="space-y-2">
                        <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{service}</label>
                        <div className="flex gap-2">
                          <Input
                            type="password"
                            value={key}
                            onChange={(e) => setApiKeys({ ...apiKeys, [service]: e.target.value })}
                            className="rounded-xl bg-black/20 border-white/5 h-11"
                          />
                          <Button variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-xl px-3" onClick={() => {
                            const n = { ...apiKeys };
                            delete n[service];
                            setApiKeys(n);
                          }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <Button
                  variant="ghost"
                  className="mt-6 text-sm text-blue-400 hover:bg-blue-400/10 rounded-xl"
                  onClick={() => {
                    const service = prompt('Integration Name (e.g. SLACK_TOKEN):');
                    if (service) setApiKeys({ ...apiKeys, [service]: '' });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Environment Variable
                </Button>
              </div>
            </motion.div>
          </TabsContent>

          {/* ── Server Tab ────────────────────────────────────────── */}
          <TabsContent value="server" className="space-y-6 outline-none">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6">
              <div className="p-8 rounded-3xl border border-white/5 bg-white/[0.01] space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                      <Play className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Edge Server</h3>
                      <p className="text-xs text-slate-500">Expose agent as a REST API endpoint</p>
                    </div>
                  </div>
                  <Switch checked={continuousMode} onCheckedChange={setContinuousMode} className="scale-125 data-[state=checked]:bg-emerald-500" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Port Binding</label>
                    <Input
                      type="number"
                      value={serverPort}
                      onChange={(e) => setServerPort(parseInt(e.target.value) || 0)}
                      className="rounded-xl bg-black/20 border-white/5 h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Webhook Trigger</label>
                    <div className="flex items-center h-12 gap-3 px-4 rounded-xl bg-black/20 border border-white/5">
                      <span className="text-xs text-slate-400">Events</span>
                      <Switch checked={enableWebhook} onCheckedChange={setEnableWebhook} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Callback URL</label>
                  <div className="relative">
                    <Input
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://api.yourdomain.com/hooks/agent-123"
                      className="rounded-xl bg-black/20 border-white/5 h-12 pl-12"
                    />
                    <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* ── Performance Tab ───────────────────────────────────── */}
          <TabsContent value="performance" className="space-y-6 outline-none">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 rounded-3xl border border-white/5 bg-white/[0.01] space-y-6">
                  <div className="flex items-center gap-3">
                    <Cpu className="h-5 w-5 text-blue-500" />
                    <h3 className="text-base font-semibold text-white">Compute Limit</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-400">CPU Allocation</span>
                      <span className="text-xs font-bold text-blue-400">{cpuLimit}%</span>
                    </div>
                    <Slider value={[cpuLimit]} min={10} max={100} onValueChange={([v]) => setCpuLimit(v)} />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-400">Memory Cap</span>
                      <span className="text-xs font-bold text-purple-400">{maxMemoryMB} MB</span>
                    </div>
                    <Slider value={[maxMemoryMB]} min={128} max={8192} step={128} onValueChange={([v]) => setMaxMemoryMB(v)} />
                  </div>
                </div>

                <div className="p-8 rounded-3xl border border-white/5 bg-white/[0.01] space-y-6">
                  <div className="flex items-center gap-3">
                    <Terminal className="h-5 w-5 text-emerald-500" />
                    <h3 className="text-base font-semibold text-white">Observability</h3>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                    <span className="text-sm text-slate-300">Live Logging</span>
                    <Switch checked={enableLogging} onCheckedChange={setEnableLogging} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Verbosity</label>
                    <Select value={logLevel} onValueChange={setLogLevel}>
                      <SelectTrigger className="rounded-xl bg-black/20 border-white/5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10">
                        <SelectItem value="debug">Debug (All)</SelectItem>
                        <SelectItem value="info">Info (Default)</SelectItem>
                        <SelectItem value="warn">Warnings</SelectItem>
                        <SelectItem value="error">Errors Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* ── Security Tab ───────────────────────────────────────── */}
          <TabsContent value="security" className="space-y-6 outline-none">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6">
              <div className="p-8 rounded-3xl border border-white/5 bg-white/[0.01] space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                      <Shield className="h-6 w-6 text-red-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Access Policy</h3>
                      <p className="text-xs text-slate-500">Secure the agent workspace and API</p>
                    </div>
                  </div>
                  <Switch checked={requireAuth} onCheckedChange={setRequireAuth} className="scale-125" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Allowed Origins</label>
                  <Input
                    value={allowedDomains}
                    onChange={(e) => setAllowedDomains(e.target.value)}
                    placeholder="app.tendrra.com, *.yourdomain.ai"
                    className="rounded-xl bg-black/20 border-white/5 h-12"
                  />
                  <p className="text-[10px] text-slate-600">Comma separated list of domains allowed to embed this agent.</p>
                </div>

                <div className="pt-6 border-t border-white/5 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-white">Rate Limiting</h4>
                      <p className="text-[10px] text-slate-500">Prevent API abuse and control costs</p>
                    </div>
                    <Switch checked={enableRateLimit} onCheckedChange={setEnableRateLimit} />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-400">Request Quota</span>
                      <span className="text-xs font-bold text-amber-400">{rateLimitPerMinute} RPM</span>
                    </div>
                    <Slider
                      disabled={!enableRateLimit}
                      value={[rateLimitPerMinute]}
                      min={1}
                      max={1000}
                      onValueChange={([v]) => setRateLimitPerMinute(v)}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────
function Trash2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  );
}

function Key(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m21 2-9.6 9.6" />
      <path d="m15.5 7.5 3 3L22 7l-3-3" />
    </svg>
  );
}

function Globe2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" x2="22" y1="12" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

