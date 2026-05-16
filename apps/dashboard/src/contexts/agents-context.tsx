"use client";

import { createContext, useContext, useReducer, ReactNode, useCallback, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { toast } from "sonner";
import { getApiBaseUrl } from "@/lib/api-base";

// ── Types ────────────────────────────────────────────────────────

export interface Agent {
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

export interface Job {
  id: string;
  agentId: string;
  type: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  payload: any;
  result?: any;
  error?: string;
  createdAt: string;
  finishedAt?: string;
}

export interface AgentState {
  agents: Agent[];
  jobs: Job[];
  loading: boolean;
  error: string | null;
  lastUpdated: number;
}

type AgentsAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_AGENTS"; payload: Agent[] }
  | { type: "ADD_AGENT"; payload: Agent }
  | { type: "UPDATE_AGENT"; payload: { id: string; updates: Partial<Agent> } }
  | { type: "REMOVE_AGENT"; payload: string }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "CLEAR_ERROR" }
  | { type: "REFRESH_AGENTS" }
  | { type: "SET_JOBS"; payload: Job[] }
  | { type: "MERGE_AGENT_JOBS"; payload: { agentId: string; jobs: Job[] } }
  | { type: "ADD_JOB"; payload: Job }
  | { type: "UPDATE_JOB"; payload: { id: string; updates: Partial<Job> } }
  | { type: "REMOVE_JOB"; payload: string };

// ── Reducer ────────────────────────────────────────────────────

const initialState: AgentState = {
  agents: [],
  jobs: [],
  loading: true,
  error: null,
  lastUpdated: Date.now(),
};

function agentsReducer(state: AgentState, action: AgentsAction): AgentState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_AGENTS":
      return { 
        ...state, 
        agents: action.payload, 
        loading: false, 
        error: null,
        lastUpdated: Date.now()
      };

    case "ADD_AGENT":
      return { 
        ...state, 
        agents: [action.payload, ...state.agents],
        lastUpdated: Date.now()
      };

    case "UPDATE_AGENT":
      return {
        ...state,
        agents: state.agents.map((agent: Agent) => 
          agent.id === action.payload.id 
            ? { ...agent, ...action.payload.updates }
            : agent
        ),
        lastUpdated: Date.now()
      };

    case "REMOVE_AGENT":
      return {
        ...state,
        agents: state.agents.filter((agent: Agent) => agent.id !== action.payload),
        lastUpdated: Date.now()
      };

    case "MERGE_AGENT_JOBS": {
      const { agentId, jobs } = action.payload;
      const rest = state.jobs.filter(
        (j: Job) => j.agentId !== agentId && (j.payload as any)?.agentId !== agentId
      );
      return {
        ...state,
        jobs: [...jobs, ...rest],
        error: null,
        lastUpdated: Date.now(),
      };
    }

    case "SET_JOBS":
      return {
        ...state,
        jobs: action.payload,
        error: null,
        lastUpdated: Date.now(),
      };

    case "ADD_JOB":
      return { 
        ...state, 
        jobs: [action.payload, ...state.jobs],
        lastUpdated: Date.now()
      };

    case "UPDATE_JOB":
      return {
        ...state,
        jobs: state.jobs.map((job: Job) => 
          job.id === action.payload.id 
            ? { ...job, ...action.payload.updates }
            : job
        ),
        lastUpdated: Date.now()
      };

    case "REMOVE_JOB":
      return {
        ...state,
        jobs: state.jobs.filter((job: Job) => job.id !== action.payload),
        lastUpdated: Date.now()
      };

    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };

    case "CLEAR_ERROR":
      return { ...state, error: null };

    case "REFRESH_AGENTS":
      return { ...state, lastUpdated: Date.now() };

    default:
      return state;
  }
}

// ── Context ────────────────────────────────────────────────────

const AgentsContext = createContext<{
  state: AgentState;
  dispatch: React.Dispatch<AgentsAction>;
  actions: {
    fetchAgents: () => Promise<void>;
    createAgent: (agentConfig: any) => Promise<void>;
    updateAgent: (id: string, updates: Partial<Agent>) => Promise<void>;
    deleteAgent: (id: string) => Promise<void>;
    refreshAgents: () => Promise<void>;
    fetchJobs: (agentId: string) => Promise<void>;
    runAgentTask: (agentId: string, task: string) => Promise<void>;
  };
} | null>(null);

// ── Provider ──────────────────────────────────────────────────

export function AgentsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(agentsReducer, initialState);

  // ── Actions ──────────────────────────────────────────────

  const fetchAgents = useCallback(async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      dispatch({ type: "SET_ERROR", payload: "User not authenticated" });
      return;
    }

    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const token = await user.getIdToken();
      
      const res = await fetch(`${getApiBaseUrl()}/api/agents`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch agents: ${res.statusText}`);
      }

      const agents = await res.json();
      dispatch({ type: "SET_AGENTS", payload: agents });
    } catch (error) {
      console.error('Error fetching agents:', error);
      dispatch({ type: "SET_ERROR", payload: error instanceof Error ? error.message : 'Unknown error' });
      toast.error('Failed to fetch agents');
    }
  }, []);

  const createAgent = useCallback(async (agentConfig: any) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    try {
      const token = await user.getIdToken();
      
      const res = await fetch(`${getApiBaseUrl()}/api/agents`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(agentConfig)
      });

      if (!res.ok) {
        throw new Error(`Failed to create agent: ${res.statusText}`);
      }

      const newAgent = await res.json();
      dispatch({ type: "ADD_AGENT", payload: newAgent });
      
      toast.success('Agent created successfully');
      
      // Refresh agents list
      fetchAgents();
    } catch (error) {
      console.error('Error creating agent:', error);
      toast.error('Failed to create agent');
    }
  }, [fetchAgents]);

  const updateAgent = useCallback(async (id: string, updates: Partial<Agent>) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    try {
      const token = await user.getIdToken();
      
      const res = await fetch(`${getApiBaseUrl()}/api/agents/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(updates)
      });

      if (!res.ok) {
        throw new Error(`Failed to update agent: ${res.statusText}`);
      }

      // Update local state immediately
      dispatch({ 
        type: "UPDATE_AGENT", 
        payload: { id, updates } 
      });

      toast.success('Agent updated successfully');
    } catch (error) {
      console.error('Error updating agent:', error);
      toast.error('Failed to update agent');
    }
  }, []);

  const deleteAgent = useCallback(async (id: string) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    try {
      const token = await user.getIdToken();
      
      const res = await fetch(`${getApiBaseUrl()}/api/agents/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error(`Failed to delete agent: ${res.statusText}`);
      }

      dispatch({ type: "REMOVE_AGENT", payload: id });
      toast.success('Agent deleted successfully');
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast.error('Failed to delete agent');
    }
  }, []);

  const refreshAgents = useCallback(async () => {
    await fetchAgents();
  }, [fetchAgents]);

  // Auto-refresh effect
  useEffect(() => {
    const interval = setInterval(() => {
      // Only refresh if not already loading and it's been more than 30 seconds since last update
      if (!state.loading && Date.now() - state.lastUpdated > 30000) {
        refreshAgents();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [state.loading, state.lastUpdated, refreshAgents]);

  // Initial fetch
  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const fetchJobs = useCallback(async (agentId: string) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      dispatch({ type: "SET_ERROR", payload: "User not authenticated" });
      return;
    }

    try {
      const token = await user.getIdToken();
      
      const res = await fetch(`${getApiBaseUrl()}/api/agents/${agentId}/jobs`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch jobs: ${res.statusText}`);
      }

      const jobs = await res.json();
      dispatch({ type: "MERGE_AGENT_JOBS", payload: { agentId, jobs } });
    } catch (error) {
      console.error('Error fetching jobs:', error);
      // Don't set error for job fetching failures, just log it
    }
  }, []);

  const runAgentTask = useCallback(async (agentId: string, task: string) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      toast.error("User not authenticated");
      return;
    }

    try {
      const token = await user.getIdToken();
      const res = await fetch(`${getApiBaseUrl()}/api/agents/${agentId}/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ task }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error || res.statusText);
      }

      await fetchJobs(agentId);

      if (body.success) {
        toast.success("Task completed successfully");
      } else {
        toast.error(body.error || "Task failed");
      }
    } catch (error) {
      console.error("Error running task:", error);
      toast.error(error instanceof Error ? error.message : "Failed to run task");
    }
  }, [fetchJobs]);

  const value = {
    state,
    dispatch,
    actions: {
      fetchAgents,
      createAgent,
      updateAgent,
      deleteAgent,
      refreshAgents,
      fetchJobs,
      runAgentTask,
    },
  };

  return <AgentsContext.Provider value={value}>{children}</AgentsContext.Provider>;
}

// ── Hooks ──────────────────────────────────────────────────────

export function useAgents() {
  const context = useContext(AgentsContext);
  if (!context) {
    throw new Error('useAgents must be used within an AgentsProvider');
  }
  return context;
}

export function useAgent(agentId: string) {
  const { state, actions } = useAgents();

  const agent = state.agents.find((a: Agent) => a.id === agentId);
  const jobs = state.jobs.filter(
    (job: Job) =>
      job.agentId === agentId || (job.payload as any)?.agentId === agentId
  );

  useEffect(() => {
    if (!agentId) return;
    void actions.fetchJobs(agentId);
  }, [agentId, actions.fetchJobs]);
  
  const agentActions = {
    saveAgentName: async (name: string) => {
      await actions.updateAgent(agentId, { name });
    },
    updateAgent: async (updates: Partial<Agent>) => {
      await actions.updateAgent(agentId, updates);
    },
    runTask: async (task: string) => {
      await actions.runAgentTask(agentId, task);
    },
    toggleAgentStatus: async () => {
      if (!agent) return;
      const newStatus = agent.status === 'RUNNING' ? 'PAUSED' : 'RUNNING';
      await actions.updateAgent(agentId, { status: newStatus });
    },
    refreshJobs: async () => {
      await actions.fetchJobs(agentId);
    }
  };
  
  return {
    state: {
      agent,
      jobs,
      loading: state.loading
    },
    actions: agentActions
  };
}
