import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { api } from "../api/client";
import type { SessionStatus, Video, Phase } from "../types";

interface StudyContextValue {
  sessionId: number | null;
  session: SessionStatus | null;
  videos: Video[];
  loading: boolean;
  error: string | null;
  startSession: (token: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  advancePhase: () => Promise<Phase>;
  loadVideos: () => Promise<Video[]>;
  clearError: () => void;
  resetSession: () => void;
}

const StudyContext = createContext<StudyContextValue | null>(null);

export function StudyProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<number | null>(() => {
    const stored = sessionStorage.getItem("nsi_session_id");
    return stored ? Number(stored) : null;
  });
  const [session, setSession] = useState<SessionStatus | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const resetSession = useCallback(() => {
    setSessionId(null);
    setSession(null);
    setError(null);
    sessionStorage.removeItem("nsi_session_id");
    sessionStorage.removeItem("nsi_token");
    sessionStorage.removeItem("nsi_headphone_passed");
  }, []);

  const startSession = useCallback(async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      const { session: sess } = await api.startSession(token);
      setSessionId(sess.id);
      sessionStorage.setItem("nsi_session_id", String(sess.id));
      sessionStorage.setItem("nsi_token", token);
      const full = await api.getSession(sess.id);
      setSession(full);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to start session");
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const full = await api.getSession(sessionId);
      setSession(full);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load session");
      resetSession();
    } finally {
      setLoading(false);
    }
  }, [resetSession, sessionId]);

  const advancePhase = useCallback(async (): Promise<Phase> => {
    if (!sessionId) throw new Error("No session");
    setLoading(true);
    setError(null);
    try {
      const { session: sess } = await api.advancePhase(sessionId);
      const full = await api.getSession(sessionId);
      setSession(full);
      return sess.current_phase;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to advance phase";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const loadVideos = useCallback(async () => {
    if (videos.length > 0) return videos;
    const { videos: vids } = await api.getVideos();
    setVideos(vids);
    return vids;
  }, [videos]);

  return (
    <StudyContext.Provider
      value={{
        sessionId,
        session,
        videos,
        loading,
        error,
        startSession,
        refreshSession,
        advancePhase,
        loadVideos,
        clearError,
        resetSession,
      }}
    >
      {children}
    </StudyContext.Provider>
  );
}

export function useStudy() {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error("useStudy must be used within StudyProvider");
  return ctx;
}
