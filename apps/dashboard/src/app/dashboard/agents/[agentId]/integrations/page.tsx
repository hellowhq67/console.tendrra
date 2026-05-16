"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Cpu,
  Database,
  MessageSquare,
  FileText,
  Cloud,
  Webhook,
  Plus,
  CheckCircle2,
  ExternalLink,
  Settings,
  RefreshCw,
  Zap,
  Search,
} from "lucide-react";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { toast } from "sonner";

const categories = ["All", "Infrastructure", "Data", "Communication", "Productivity"];

const iconMap: Record<string, any> = {
  mcp: Cpu,
  firebase: Database,
  slack: MessageSquare,
  notion: FileText,
  gcp: Cloud,
  aws: Cloud,
  bigquery: Database,
  webhooks: Webhook,
};

export default function IntegrationsPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConnectors = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;
      const token = await user.getIdToken();
      
      const res = await fetch("http://localhost:3001/api/connectors", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setPlatforms(data.map((c: any) => ({
        ...c,
        id: c.id,
        name: c.name,
        icon: iconMap[c.type] || Cloud,
        category: "Infrastructure", // Simplify category logic for now
        status: c.status.toLowerCase(),
        desc: c.config?.desc || "Platform integration",
        gradient: "from-blue-500/10 to-cyan-500/10",
        accent: "text-blue-400"
      })));
      setLoading(false);
    };
    fetchConnectors();
  }, []);

  const handleConnect = async (connectorId: string) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;
    
    try {
      const token = await user.getIdToken();
      const res = await fetch(`http://localhost:3001/api/connectors/${connectorId}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({
          name: platforms.find(p => p.id === connectorId)?.name || connectorId,
          type: connectorId,
          config: {
            // Add default config based on connector type
            apiKey: "",
            endpoint: "",
            enabled: true
          }
        })
      });

      if (res.ok) {
        toast.success("Connector connected successfully");
        fetchConnectors();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to connect connector");
      }
    } catch (error) {
      console.error('Error connecting connector:', error);
      toast.error("Failed to connect connector");
    }
  };

  const handleDisconnect = async (connectorId: string) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;
    
    try {
      const token = await user.getIdToken();
      const res = await fetch(`http://localhost:3001/api/connectors/${connectorId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        toast.success("Connector disconnected");
        fetchConnectors();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to disconnect connector");
      }
    } catch (error) {
      console.error('Error disconnecting connector:', error);
      toast.error("Failed to disconnect connector");
    }
  };

  const filtered = activeCategory === "All"
    ? platforms
    : platforms.filter((p) => p.category === activeCategory);

  const connectedCount = platforms.filter((p) => p.status === "connected").length;

  if (loading) return <div className="text-white">Loading integrations...</div>;

  return (
    <div className="space-y-8">
      {/* ── Header Stats ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-6"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{connectedCount}</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Connected</p>
          </div>
        </div>
        <div className="h-8 w-px bg-white/5" />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-500/10 flex items-center justify-center text-slate-400">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{platforms.length - connectedCount}</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Available</p>
          </div>
        </div>
      </motion.div>

      {/* ── Category Filter ──────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-white/5 pb-0">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`relative px-4 py-3 text-xs font-medium transition-colors ${
              activeCategory === cat ? "text-white" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {cat}
            {activeCategory === cat && (
              <motion.div
                layoutId="integrationFilter"
                className="absolute bottom-0 left-0 right-0 h-px bg-white"
              />
            )}
          </button>
        ))}
      </div>

      {/* ── Platform Cards ───────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-2 text-center py-12"
          >
            <Cloud className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No integrations found in this category</p>
            <p className="text-[11px] text-slate-600 mt-1">Try selecting a different category</p>
          </motion.div>
        ) : (
          filtered.map((platform, i) => (
            <motion.div
              key={platform.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`rounded-2xl border border-white/5 overflow-hidden hover:border-white/15 transition-all group relative`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${platform.gradient} opacity-50`} />

              <div className="relative p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center border border-white/5">
                      <platform.icon className={`h-5 w-5 ${platform.accent}`} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{platform.name}</h3>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">{platform.category}</p>
                    </div>
                  </div>
                  <Badge
                    className={`text-[9px] py-0 px-2 rounded-full font-medium ${
                      platform.status === "connected"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                    }`}
                  >
                    {platform.status === "connected" ? (
                      <><CheckCircle2 className="h-3 w-3 mr-1" /> Connected</>
                    ) : (
                      "Available"
                    )}
                  </Badge>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">{platform.desc}</p>

                <div className="flex items-center justify-between pt-2">
                  {platform.status === "connected" ? (
                    <>
                      <div className="flex items-center gap-3 text-[10px] text-slate-600">
                        <span>Synced just now</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="rounded-xl h-7 w-7 p-0 text-slate-500 hover:text-white"
                          onClick={() => toast.info("Configuration coming soon")}
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="rounded-xl h-7 w-7 p-0 text-slate-500 hover:text-emerald-400"
                          onClick={() => handleDisconnect(platform.id)}
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      className="rounded-xl bg-white/5 border border-white/5 text-xs text-slate-300 hover:bg-white/10 h-8 ml-auto"
                      onClick={() => handleConnect(platform.id)}
                    >
                      <Plus className="h-3 w-3 mr-1.5" /> Connect
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
