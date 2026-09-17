import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { rgtRoute } from "../../routePrefix";
import Layout from "../../components/Layout";
import { useStudy } from "../../context/StudyContext";
import { api } from "../../api/client";
import type { ElicitedConstruct, AdditionalConstruct } from "../../types";

export default function AdditionalConstructs() {
  const navigate = useNavigate();
  const { sessionId, advancePhase } = useStudy();
  const [step, setStep] = useState<"intro" | "review" | "add">("intro");
  const [elicited, setElicited] = useState<ElicitedConstruct[]>([]);
  const [additional, setAdditional] = useState<AdditionalConstruct[]>([]);
  const [newConstructs, setNewConstructs] = useState([
    { pole_one: "", pole_two: "" },
  ]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!sessionId) return;
    const [eRes, aRes] = await Promise.all([
      api.getElicitedConstructs(sessionId),
      api.getAdditionalConstructs(sessionId),
    ]);
    setElicited(eRes.constructs);
    setAdditional(aRes.constructs);
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSkip() {
    try {
      const next = await advancePhase();
      if (next === "review_ratings") {
        navigate(rgtRoute("/study/review"), { replace: true });
      }
    } catch {
      // handled by context
    }
  }

  async function handleSaveAndContinue() {
    if (!sessionId) return;
    setSaving(true);
    try {
      for (const c of newConstructs) {
        if (c.pole_one.trim() && c.pole_two.trim()) {
          await api.saveAdditionalConstruct(
            sessionId,
            c.pole_one.trim(),
            c.pole_two.trim()
          );
        }
      }
      const next = await advancePhase();
      if (next === "review_ratings") {
        navigate(rgtRoute("/study/review"), { replace: true });
      }
    } catch {
      // handled by context
    } finally {
      setSaving(false);
    }
  }

  function addRow() {
    setNewConstructs((prev) => [...prev, { pole_one: "", pole_two: "" }]);
  }

  function updateRow(idx: number, field: "pole_one" | "pole_two", val: string) {
    setNewConstructs((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, [field]: val } : c))
    );
  }

  // ---------- Intro step ----------
  if (step === "intro") {
    return (
      <Layout phase="additional_constructs">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Additional Constructs
          </h1>
          <div className="mt-6 space-y-4 text-base text-gray-600">
            <p>
              In the previous section, you identified words and phrases that
              describe important differences in the non-speech information (NSI)
              captions across the videos.
            </p>
            <p>
              In this next step, you will have the opportunity to tell us
              whether there are any other constructs you thought of while
              watching the videos. This step is completely optional.
            </p>
          </div>
          <button
            onClick={() => setStep("review")}
            className="btn-primary mt-8"
          >
            Continue
          </button>
        </div>
      </Layout>
    );
  }

  // ---------- Review step ----------
  if (step === "review") {
    return (
      <Layout phase="additional_constructs">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-center text-2xl font-bold text-gray-900">
            Review Your Constructs
          </h1>
          <p className="mt-2 text-center text-gray-600">
            Here are the constructs you have already identified:
          </p>

          <div className="mt-6 space-y-3">
            {elicited.map((c, i) => (
              <div key={i} className="card flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-gray-400">
                    Construct {i + 1}
                  </span>
                  <p className="text-sm font-medium text-gray-800">
                    {c.pole_one}{" "}
                    <span className="text-gray-400">&mdash;</span>{" "}
                    {c.pole_two}
                  </p>
                </div>
              </div>
            ))}
            {additional.map((c, i) => (
              <div
                key={`add-${c.id}`}
                className="card flex items-center justify-between border-green-200 bg-green-50"
              >
                <div>
                  <span className="text-xs font-medium text-green-600">
                    Additional {i + 1}
                  </span>
                  <p className="text-sm font-medium text-gray-800">
                    {c.pole_one}{" "}
                    <span className="text-gray-400">&mdash;</span>{" "}
                    {c.pole_two}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-center text-sm text-gray-500">
            Note: Only add a new construct in the next step if it feels
            meaningfully different from the ones listed here.
          </p>

          <div className="mt-8 flex justify-center gap-4">
            <button onClick={handleSkip} className="btn-secondary">
              Skip to Next Step
            </button>
            <button onClick={() => setStep("add")} className="btn-primary">
              Add additional constructs
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // ---------- Add step ----------
  return (
    <Layout phase="additional_constructs">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-center text-2xl font-bold text-gray-900">
          Add Additional Constructs
        </h1>
        <p className="mt-2 text-center text-gray-600">
          Please describe any additional constructs you thought of while
          watching the videos. This step is completely optional.
        </p>

        <div className="mt-6 space-y-6">
          {newConstructs.map((c, idx) => (
            <div key={idx} className="card">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">
                Additional Construct {additional.length + idx + 1}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    What word or short phrase describes one end of this
                    construct?
                  </label>
                  <input
                    type="text"
                    value={c.pole_one}
                    onChange={(e) => updateRow(idx, "pole_one", e.target.value)}
                    placeholder="Enter a word or short phrase..."
                    className="mt-1 w-full rounded-lg border border-gray-200 p-3 text-sm focus:border-brand-300 focus:outline-none focus:ring-1 focus:ring-brand-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600">
                    What word or short phrase describes the opposite end?
                  </label>
                  <input
                    type="text"
                    value={c.pole_two}
                    onChange={(e) => updateRow(idx, "pole_two", e.target.value)}
                    placeholder="Enter a word or short phrase..."
                    className="mt-1 w-full rounded-lg border border-gray-200 p-3 text-sm focus:border-brand-300 focus:outline-none focus:ring-1 focus:ring-brand-300"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addRow}
          className="mt-4 text-sm text-brand-600 hover:underline"
        >
          + Add another construct
        </button>

        <p className="mt-4 text-center text-xs text-gray-400">
          Note: Please focus your responses on the non-speech information (NSI)
          captions.
        </p>

        <div className="mt-6 flex justify-center gap-4">
          <button onClick={() => setStep("review")} className="btn-secondary">
            Back
          </button>
          <button
            onClick={handleSaveAndContinue}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? "Saving..." : "Continue"}
          </button>
        </div>
      </div>
    </Layout>
  );
}
