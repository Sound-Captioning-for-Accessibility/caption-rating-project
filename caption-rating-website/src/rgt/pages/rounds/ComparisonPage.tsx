import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { rgtRoute } from "../../routePrefix";
import Layout from "../../components/Layout";
import { useStudy } from "../../context/StudyContext";
import { api } from "../../api/client";
import type { Video, RoundDetail } from "../../types";

export default function ComparisonPage() {
  const { roundNum } = useParams<{ roundNum: string }>();
  const navigate = useNavigate();
  const { sessionId, session } = useStudy();
  const [videos, setVideos] = useState<Video[]>([]);
  const [raId, setRaId] = useState<number | null>(null);
  const [selectedPair, setSelectedPair] = useState<[number, number] | null>(null);
  const [answers, setAnswers] = useState({
    similarity_description: "",
    alike_phrase: "",
    contrast_phrase: "",
  });
  const [showStuck, setShowStuck] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const debounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const load = useCallback(async () => {
    if (!sessionId || !roundNum) return;
    const detail: RoundDetail = await api.getRound(sessionId, Number(roundNum));
    setRaId(detail.round_assignment.id);
    setVideos(detail.round_assignment.triad?.videos ?? []);

    if (detail.comparison) {
      setSelectedPair([detail.comparison.video_a_id, detail.comparison.video_b_id]);
    }

    const answerMap: Record<string, string> = {};
    detail.answers.forEach((a) => (answerMap[a.question_key] = a.answer_text));
    setAnswers({
      similarity_description: answerMap.similarity_description ?? "",
      alike_phrase: answerMap.alike_phrase ?? "",
      contrast_phrase: answerMap.contrast_phrase ?? "",
    });

    const noteMap: Record<string, string> = {};
    Object.entries(detail.clip_notes).forEach(([vid, note]) => {
      if (note) noteMap[vid] = note.note_text;
    });
    setNotes(noteMap);
  }, [sessionId, roundNum]);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePairSelect(a: number, b: number) {
    if (!raId) return;
    setSelectedPair([a, b]);
    await api.saveComparison(raId, a, b);
  }

  function handleAnswerChange(key: string, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    clearTimeout(debounceRef.current[key]);
    debounceRef.current[key] = setTimeout(async () => {
      if (!raId) return;
      await api.saveComparisonAnswer(raId, key, value);
    }, 800);
  }

  async function handleSkip() {
    if (!sessionId || !roundNum) return;
    setSkipping(true);
    try {
      await api.skipTriad(sessionId, Number(roundNum));
      navigate(rgtRoute(`/study/rounds/${roundNum}`), { replace: true });
    } catch {
      setSkipping(false);
    }
  }

  const canContinue =
    selectedPair &&
    answers.similarity_description.trim() &&
    answers.alike_phrase.trim() &&
    answers.contrast_phrase.trim();

  function pairLabel(a: number, b: number) {
    const idxA = videos.findIndex((v) => v.id === a);
    const idxB = videos.findIndex((v) => v.id === b);
    return `Clip ${videos[idxA]?.id} + Clip ${videos[idxB]?.id}`;
  }

  const pairs: [number, number][] =
    videos.length === 3
      ? [
          [videos[0].id, videos[1].id],
          [videos[0].id, videos[2].id],
          [videos[1].id, videos[2].id],
        ]
      : [];

  return (
    <Layout phase="triadic_elicitation">
      <div className="mx-auto max-w-3xl">
        <button
          onClick={() => navigate(rgtRoute(`/study/rounds/${roundNum}`))}
          className="mb-4 text-sm text-brand-600 hover:text-brand-800"
        >
          &larr; Back
        </button>

        <h1 className="text-xl font-bold text-gray-900">
          Comparison Questions
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Please answer the questions below about the NSI captions in the clips
          you reviewed this round. You may rewatch any clip or view your notes
          while answering.
        </p>

        {/* Clip references */}
        <div className="mt-4 flex flex-wrap gap-3">
          {videos.map((v) => (
            <div key={v.id} className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                Clip {v.id}
              </span>
              <button
                onClick={() =>
                  navigate(rgtRoute(`/study/rounds/${roundNum}/clip/${v.id}`))
                }
                className="text-xs text-brand-600 hover:underline"
              >
                Rewatch
              </button>
              {notes[String(v.id)] ? (
                <button
                  onClick={() =>
                    navigate(rgtRoute(`/study/rounds/${roundNum}/clip/${v.id}`))
                  }
                  className="text-xs text-brand-600 hover:underline"
                >
                  View Notes
                </button>
              ) : (
                <span className="text-xs text-gray-400">No Notes</span>
              )}
            </div>
          ))}
        </div>

        {/* Pair selection */}
        <div className="card mt-6">
          <label className="block text-sm font-semibold text-gray-800">
            Which two of these clips are the same in some way, and different
            from the third?
          </label>
          <div className="mt-3 flex flex-wrap gap-3">
            {pairs.map(([a, b]) => {
              const isSelected =
                selectedPair &&
                ((selectedPair[0] === Math.min(a, b) &&
                  selectedPair[1] === Math.max(a, b)) ||
                  (selectedPair[0] === a && selectedPair[1] === b));
              return (
                <button
                  key={`${a}-${b}`}
                  onClick={() => handlePairSelect(a, b)}
                  className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition ${
                    isSelected
                      ? "border-brand-600 bg-brand-50 text-brand-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-brand-300"
                  }`}
                >
                  {pairLabel(a, b)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Text answers */}
        <div className="card mt-4 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-800">
              Thinking about the NSI captions — what do these two clips have in
              common, as opposed to the third?
            </label>
            <textarea
              value={answers.similarity_description}
              onChange={(e) =>
                handleAnswerChange("similarity_description", e.target.value)
              }
              placeholder="Describe what stands out to you about the NSI captions in these clips..."
              className="mt-2 w-full rounded-lg border border-gray-200 p-3 text-sm focus:border-brand-300 focus:outline-none focus:ring-1 focus:ring-brand-300"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800">
              What word or short phrase describes the way these two clips are
              alike?
            </label>
            <input
              type="text"
              value={answers.alike_phrase}
              onChange={(e) =>
                handleAnswerChange("alike_phrase", e.target.value)
              }
              placeholder="Enter a word or short phrase..."
              className="mt-2 w-full rounded-lg border border-gray-200 p-3 text-sm focus:border-brand-300 focus:outline-none focus:ring-1 focus:ring-brand-300"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800">
              What word or short phrase describes the contrasting end of this
              construct?*
            </label>
            <input
              type="text"
              value={answers.contrast_phrase}
              onChange={(e) =>
                handleAnswerChange("contrast_phrase", e.target.value)
              }
              placeholder="Enter a word or short phrase..."
              className="mt-2 w-full rounded-lg border border-gray-200 p-3 text-sm focus:border-brand-300 focus:outline-none focus:ring-1 focus:ring-brand-300"
            />
            <p className="mt-1 text-xs text-gray-400">
              * Note: The third clip does not need to be a perfect match for
              this end of the construct. You are identifying the contrast, and
              you will rate the clips on that scale in the next step. Please
              focus your responses on the non-speech information (NSI)
              captions.
            </p>
          </div>
        </div>

        {/* Feeling stuck */}
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowStuck(!showStuck)}
            className="text-sm text-brand-600 hover:underline"
          >
            Feeling stuck?
          </button>
        </div>

        {showStuck && (
          <div className="card mt-3 border-amber-200 bg-amber-50">
            <p className="text-sm font-medium text-amber-800">
              That's okay. There are no right or wrong answers in this task. We
              are interested in how you understand the non-speech information
              (NSI) captions.
            </p>
            <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-amber-700">
              <li>Focus only on the NSI captions, not the clip as a whole.</li>
              <li>
                Think about anything non-speech related, such as background
                sounds, sound effects, music, or other meaningful audio details.
              </li>
              <li>
                Ask yourself what two clips have in common and how they differ
                from the third.
              </li>
              <li>
                A word or short phrase is enough. Your answer does not need to
                be perfect.
              </li>
              <li>
                You may rewatch the clips or review your notes before answering.
              </li>
              <li>
                If you need a pause, you may take a short break and return when
                ready.
              </li>
            </ul>
            <p className="mt-3 text-sm text-amber-700">
              If this comparison still does not feel workable, you can move on
              to a different set of clips.
            </p>
            <button
              onClick={handleSkip}
              disabled={skipping}
              className="btn-secondary mt-3"
            >
              {skipping ? "Loading new triad..." : "Show me a different triad"}
            </button>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={() =>
              navigate(rgtRoute(`/study/rounds/${roundNum}/rate-intro`))
            }
            disabled={!canContinue}
            className="btn-primary"
          >
            Continue to Rating
          </button>
        </div>
      </div>
    </Layout>
  );
}
