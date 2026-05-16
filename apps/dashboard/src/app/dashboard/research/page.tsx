"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "motion/react";
import {
  Search, Globe, Clock, ExternalLink,
  Sparkles, Send, Loader2, BookOpen,
  Database, LayoutGrid, Zap, FileSpreadsheet,
  Globe2,
  Badge,
  FileText
} from "lucide-react";
import { Artifact, ArtifactHeader, ArtifactTitle, ArtifactContent } from "@/components/ai-elements/artifact";
import { fetchApi } from "@/lib/fetch-api";
import { useAuth } from "@/hooks/use-auth";

type ResearchResult = {
  search_id?: string;
  results?: Array<{
    title: string;
    url: string;
    excerpts: string[];
  }>;
};

const capabilities = [
  { id: "deep", name: "Deep Research", desc: "Multi-step web analysis", icon: Zap, color: "text-amber-400" },
  { id: "search", name: "Quick Search", desc: "Real-time web excerpts", icon: Search, color: "text-blue-400" },
  { id: "extract", name: "Data Extract", desc: "Structured data from URL", icon: Database, color: "text-emerald-400" },
];

export default function ResearchPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [activeMode, setActiveMode] = useState("search");
  const [results, setResults] = useState<ResearchResult | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setResults(null);

    try {
      const endpoint = activeMode === "deep" ? "/api/research/deep-research" : "/api/research/search";
      const body = activeMode === "deep" 
        ? { objective: query, userId: user?.uid }
        : { objective: query, queries: [query], userId: user?.uid };

      const data = await fetchApi<ResearchResult>(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });

      setResults(data);
    } catch (error) {
      console.error("Research Error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.4em] text-slate-500 font-medium">
          <span>Intelligence</span>
          <span className="text-slate-800">/</span>
          <span className="text-slate-300">Research Hub</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Advanced Research</h1>
        <p className="text-slate-400 text-sm max-w-xl">Harness Parallel Web intelligence to perform deep-web extraction and competitive analysis.</p>
      </div>

      {/* Main Search Surface */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative rounded-[2rem] border border-white/10 bg-[#09090f] p-8 space-y-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 h-5 w-5" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Perform deep research on..."
                className="h-16 pl-14 bg-white/[0.02] border-white/5 text-white placeholder:text-slate-500 rounded-2xl text-lg focus:border-purple-500 transition-all"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching}
              className="h-16 px-10 bg-white text-black hover:bg-slate-200 rounded-2xl gap-3 font-bold transition-all"
            >
              {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              {activeMode === 'deep' ? 'Initiate Deep Research' : 'Execute Search'}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {capabilities.map((cap) => (
              <div 
                key={cap.id} 
                onClick={() => setActiveMode(cap.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group/cap ${
                  activeMode === cap.id ? 'bg-white/5 border-white/20' : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                }`}
              >
                <div className={`p-2 rounded-lg bg-white/[0.03] group-hover/cap:bg-white/[0.08] transition-colors ${cap.color}`}>
                  <cap.icon className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-white tracking-tight">{cap.name}</p>
                  <p className="text-[10px] text-slate-500 leading-none">{cap.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        {/* Results Area */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
              <Clock className="h-4 w-4" /> Research Intelligence
            </h2>
          </div>
          
          <div className="space-y-6">
            {!results && !isSearching && (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 border border-dashed border-white/5 rounded-[2rem]">
                <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center">
                  <Search className="h-6 w-6 text-slate-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-400">No active research</p>
                  <p className="text-xs text-slate-600">Enter a query above to begin web extraction.</p>
                </div>
              </div>
            )}

            {isSearching && (
              <div className="space-y-4 animate-pulse">
                {[1, 2].map((i) => (
                  <div key={i} className="h-32 bg-white/[0.02] border border-white/5 rounded-2xl" />
                ))}
              </div>
            )}

            {results?.results?.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Artifact className="border-white/5 bg-white/[0.01] rounded-2xl overflow-hidden hover:border-white/10 transition-all">
                  <ArtifactHeader className="bg-white/[0.02] border-white/5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Globe className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <ArtifactTitle className="text-sm font-semibold">{item.title}</ArtifactTitle>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-mono truncate max-w-md">{item.url}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg text-slate-500 hover:text-white" asChild>
                      <a href={item.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </ArtifactHeader>
                  <ArtifactContent className="p-4">
                    <div className="space-y-3">
                      {item.excerpts.map((excerpt, j) => (
                        <p key={j} className="text-xs text-slate-400 leading-relaxed">
                          {excerpt}
                        </p>
                      ))}
                    </div>
                  </ArtifactContent>
                </Artifact>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" /> Intel Sources
          </h2>
          <div className="rounded-[2rem] border border-white/10 bg-[#09090f] p-6 space-y-6">
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Connected Pipelines</p>
                <div className="flex flex-wrap gap-2">
                  <Badge  className="rounded-lg border-white/10 text-[10px] font-mono py-1">BigQuery_Enrich</Badge>
                  <Badge  className="rounded-lg border-white/10 text-[10px] font-mono py-1">Parallel_Search_v1</Badge>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Export Formats</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <FileText className="h-3 w-3" /> PDF Report
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <FileSpreadsheet className="h-3 w-3" /> Google Sheets
                  </div>
                </div>
              </div>
            </div>
            <Button className="w-full h-12 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-all">
              Configure BigQuery
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
