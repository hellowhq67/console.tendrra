"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Upload,
  Plus,
  Database,
  FileText,
  FileSpreadsheet,
  FileCode,
  Trash2,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Cloud,
  HardDrive,
  Link2,
  Search,
  BookOpen,
  Layers,
  MoreVertical,
  ExternalLink,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Info,
  Globe2,
} from "lucide-react";
import { motion } from "motion/react";
import { useState, useCallback, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { getAuth } from "firebase/auth";
import { toast } from "sonner";
import { getApiBaseUrl } from "@/lib/api-base";

type KnowledgeSource = {
  id: string;
  name: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
  status: string;
  chunkCount: number;
  error?: string | null;
  createdAt: string;
};

function formatBytes(n?: number | null) {
  if (n == null) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

const statusConfig: Record<
  string,
  { icon: typeof CheckCircle2; color: string; badge: string }
> = {
  indexed: {
    icon: CheckCircle2,
    color: "text-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  pending: {
    icon: Loader2,
    color: "text-amber-500",
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  processing: {
    icon: Loader2,
    color: "text-amber-500",
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  error: {
    icon: AlertCircle,
    color: "text-red-500",
    badge: "bg-red-500/10 text-red-400 border-red-500/20",
  },
};

const fileIcons: Record<string, typeof FileText> = {
  pdf: FileText,
  md: FileCode,
  csv: FileSpreadsheet,
  docx: FileText,
  json: FileCode,
};

const dataConnections = [
  {
    id: "bigquery",
    name: "BigQuery",
    description: "Enterprise data warehouse",
    icon: Database,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    id: "postgres",
    name: "PostgreSQL",
    description: "Relational database integration",
    icon: HardDrive,
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
  },
  {
    id: "firebase",
    name: "Firestore",
    description: "NoSQL document storage",
    icon: Cloud,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
];

export default function KnowledgePage() {
  const { agentId } = useParams() as { agentId: string };
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const load = useCallback(async () => {
    const user = getAuth().currentUser;
    if (!user) {
      setLoading(false);
      return;
    }
    const token = await user.getIdToken();
    try {
      const res = await fetch(
        `${getApiBaseUrl()}/api/agents/${agentId}/knowledge`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) {
        toast.error("Failed to load knowledge");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setSources(data.sources || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredSources = useMemo(() => {
    return sources.filter(s =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sources, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: sources.length,
      chunks: sources.reduce((acc, s) => acc + (s.chunkCount || 0), 0),
      storage: sources.reduce((acc, s) => acc + (s.sizeBytes || 0), 0),
    };
  }, [sources]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (!file) return;
      const user = getAuth().currentUser;
      if (!user) return toast.error("Sign in required");
      const token = await user.getIdToken();
      const text = await file.text().catch(() => "");
      setSaving(true);
      const res = await fetch(
        `${getApiBaseUrl()}/api/agents/${agentId}/knowledge`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: file.name,
            mimeType: file.type || "application/octet-stream",
            content: text,
            sizeBytes: file.size,
          }),
        }
      );
      setSaving(false);
      if (!res.ok) {
        toast.error("Upload failed");
        return;
      }
      toast.success("Source added");
      await load();
    },
    [agentId, load]
  );

  const addTextSource = async () => {
    if (!newTitle.trim() || !newBody.trim()) {
      toast.error("Title and content required");
      return;
    }
    const user = getAuth().currentUser;
    if (!user) return;
    const token = await user.getIdToken();
    setSaving(true);
    const res = await fetch(
      `${getApiBaseUrl()}/api/agents/${agentId}/knowledge`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newTitle.trim(),
          mimeType: "text/plain",
          content: newBody,
        }),
      }
    );
    setSaving(false);
    if (!res.ok) {
      toast.error("Could not save");
      return;
    }
    setNewTitle("");
    setNewBody("");
    toast.success("Knowledge added");
    await load();
  };

  const removeSource = async (id: string) => {
    const user = getAuth().currentUser;
    if (!user) return;
    const token = await user.getIdToken();
    const res = await fetch(
      `${getApiBaseUrl()}/api/agents/${agentId}/knowledge/${id}`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) {
      toast.error("Delete failed");
      return;
    }
    toast.success("Removed");
    await load();
  };

  return (
    <TooltipProvider>
      <div className="space-y-8 max-w-6xl mx-auto pb-12">
        {/* ── Header ──────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <BookOpen className="h-7 w-7 text-indigo-500" />
              Agent Knowledge
            </h1>
            <p className="text-slate-400 text-sm">Index documentation, files, and databases for intelligent RAG operations</p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={load} variant="outline" className="rounded-xl border-white/10 hover:bg-white/5 h-10 px-4">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Sync
            </Button>
          </div>
        </motion.div>

        {/* ── Stats ────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Indexed Sources", value: stats.total, icon: BookOpen, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Total Chunks", value: stats.chunks, icon: Layers, color: "text-purple-500", bg: "bg-purple-500/10" },
            { label: "Storage Used", value: formatBytes(stats.storage), icon: HardDrive, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] flex items-center gap-4"
            >
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{stat.label}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left Column: Add Knowledge ─────────────────────── */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div className="p-6 rounded-3xl border border-white/5 bg-white/[0.01] backdrop-blur-sm space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Import Sources</h3>
                  <Upload className="h-4 w-4 text-slate-500" />
                </div>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`rounded-2xl border-2 border-dashed p-10 text-center transition-all cursor-pointer ${isDragging
                    ? "border-indigo-500/50 bg-indigo-500/5"
                    : "border-white/5 bg-black/20 hover:border-white/10"
                    }`}
                >
                  <Upload className="h-8 w-8 mx-auto text-indigo-500 mb-4" />
                  <p className="text-xs font-medium text-slate-300">Drop files here</p>
                  <p className="text-[10px] text-slate-600 mt-2">Support: MD, PDF, CSV, TXT, JSON</p>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-white">Add Snippet</h3>
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  </div>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Source Title"
                    className="bg-black/20 border-white/5 rounded-xl h-10 text-sm"
                  />
                  <Textarea
                    value={newBody}
                    onChange={(e) => setNewBody(e.target.value)}
                    placeholder="Paste technical docs, FAQs, or raw data..."
                    rows={5}
                    className="bg-black/20 border-white/5 rounded-xl text-xs resize-none"
                  />
                  <Button
                    onClick={() => void addTextSource()}
                    disabled={saving}
                    className="w-full rounded-xl bg-white text-black hover:bg-slate-200 font-bold h-10"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                    Index Snippet
                  </Button>
                </div>
              </div>

              <div className="p-6 rounded-3xl border border-white/5 bg-white/[0.01] space-y-4">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-emerald-500" />
                  <h3 className="text-sm font-semibold text-white">Data Connections</h3>
                </div>
                <div className="space-y-3">
                  {dataConnections.map((conn) => (
                    <div key={conn.id} className="flex items-center justify-between p-3 rounded-2xl bg-black/20 border border-white/5 group hover:border-white/10 transition-all cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${conn.bgColor} flex items-center justify-center`}>
                          <conn.icon className={`h-4 w-4 ${conn.color}`} />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-white">{conn.name}</p>
                          <p className="text-[9px] text-slate-600 leading-none">{conn.description}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-3 w-3 text-slate-700 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  ))}
                </div>
                <Button variant="ghost" className="w-full text-[10px] text-slate-500 hover:text-white h-8 rounded-xl">
                  <Link2 className="h-3 w-3 mr-2" /> Request Connector
                </Button>
              </div>
            </motion.div>
          </div>

          {/* ── Right Column: Source List ──────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="p-1 rounded-3xl border border-white/5 bg-white/[0.01] min-h-[500px]">
              <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-white">Indexed Knowledge</h3>
                  <p className="text-xs text-slate-500">Live indexed sources available to the agent</p>
                </div>
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search sources..."
                    className="bg-black/20 border-white/5 rounded-xl h-9 pl-9 w-full md:w-64 text-xs focus:ring-0"
                  />
                </div>
              </div>

              <div className="p-2">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-24 space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                    <p className="text-xs text-slate-500">Scanning knowledge index...</p>
                  </div>
                ) : filteredSources.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-16 h-16 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center mb-4">
                      <Search className="h-6 w-6 text-slate-700" />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-300">No sources found</h4>
                    <p className="text-xs text-slate-600 mt-1">Try uploading a file or adding a text snippet.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredSources.map((file) => {
                      const ext = file.name.split(".").pop() || "";
                      const FileIcon = fileIcons[ext.toLowerCase()] || FileText;
                      const sc = statusConfig[file.status] || statusConfig.pending;
                      const StatusIcon = sc.icon;

                      return (
                        <div
                          key={file.id}
                          className="flex items-center gap-4 p-4 rounded-2xl hover:bg-white/[0.03] transition-all group border border-transparent hover:border-white/5"
                        >
                          <div className="w-11 h-11 rounded-2xl bg-white/[0.03] flex items-center justify-center text-slate-400 group-hover:text-white transition-colors border border-white/5">
                            <FileIcon className="h-5 w-5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-white truncate">{file.name}</p>
                              {file.status === 'indexed' && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                <HardDrive className="h-3 w-3" /> {formatBytes(file.sizeBytes)}
                              </span>
                              <span className="text-slate-800">|</span>
                              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                <Layers className="h-3 w-3" /> {file.chunkCount} chunks
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Badge className={`${sc.badge} text-[10px] h-6 px-3 rounded-full font-medium capitalize border flex items-center gap-1.5`}>
                              <StatusIcon className={`h-3 w-3 ${file.status === 'processing' ? 'animate-spin' : ''}`} />
                              {file.status}
                            </Badge>

                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-slate-600 hover:text-white">
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>View Source</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    onClick={() => void removeSource(file.id)}
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-xl text-slate-600 hover:text-red-400"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Remove Index</TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
