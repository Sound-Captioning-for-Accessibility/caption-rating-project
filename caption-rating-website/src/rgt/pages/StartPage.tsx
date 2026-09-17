import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStudy } from "../context/StudyContext";
import type { Phase } from "../types";
import { rgtRoute } from "../routePrefix";

function phaseToRoute(phase: Phase, currentRound: number): string {
  const passedCheck = sessionStorage.getItem("nsi_headphone_passed");
  switch (phase) {
    case "overall_ratings":
      return passedCheck ? rgtRoute("/study/warmup") : rgtRoute("/study/headphone-check");
    case "triadic_elicitation":
      return rgtRoute(`/study/rounds/${currentRound}`);
    case "additional_constructs":
      return rgtRoute("/study/constructs");
    case "review_ratings":
      return rgtRoute("/study/review");
    case "completed":
      return rgtRoute("/study/complete");
  }
}

export default function StartPage() {
  const [token, setToken] = useState("");
  const { startSession, session, loading, error, clearError, refreshSession, sessionId } =
    useStudy();
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionId && !session) {
      refreshSession();
    }
  }, [sessionId, session, refreshSession]);

  useEffect(() => {
    if (session) {
      navigate(phaseToRoute(session.current_phase, session.current_round), {
        replace: true,
      });
    }
  }, [session, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    clearError();
    if (!token.trim()) return;
    try {
      await startSession(token.trim());
    } catch {
      // error is set in context
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            NSI Caption Quality Study
          </h1>
          <p className="mt-3 text-gray-600">
            Welcome! Please enter your participant token to begin or resume the
            study.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card mt-8">
          <label
            htmlFor="token"
            className="block text-sm font-medium text-gray-700"
          >
            Participant Token
          </label>
          <input
            id="token"
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Enter your token..."
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm
                       focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            autoFocus
          />
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !token.trim()}
            className="btn-primary mt-4 w-full"
          >
            {loading ? "Loading..." : "Begin Study"}
          </button>
        </form>
      </div>
    </div>
  );
}

export { phaseToRoute };
