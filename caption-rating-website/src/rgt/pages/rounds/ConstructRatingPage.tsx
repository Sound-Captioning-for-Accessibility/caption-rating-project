import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { rgtRoute } from "../../routePrefix";
import Layout from "../../components/Layout";
import VideoPlayer from "../../components/VideoPlayer";
import RatingScale from "../../components/RatingScale";
import NotesPanel from "../../components/NotesPanel";
import { useStudy } from "../../context/StudyContext";
import { api } from "../../api/client";
import type { Video, RoundDetail, ConstructRating } from "../../types";

export default function ConstructRatingPage() {
  const { roundNum } = useParams<{ roundNum: string }>();
  const navigate = useNavigate();
  const { sessionId, loadVideos, session } = useStudy();

  const [raId, setRaId] = useState<number | null>(null);
  const [allClips, setAllClips] = useState<Video[]>([]);
  const [triadClips, setTriadClips] = useState<Video[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const [poles, setPoles] = useState({ alike: "", contrast: "" });
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [phase, setPhase] = useState<"triad" | "remaining" | "remaining_intro">(
    "triad"
  );
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!sessionId || !roundNum) return;
    const [detail, vids]: [RoundDetail, Video[]] = await Promise.all([
      api.getRound(sessionId, Number(roundNum)),
      loadVideos(),
    ]);

    setRaId(detail.round_assignment.id);
    const triad = detail.round_assignment.triad?.videos ?? [];
    setTriadClips(triad);
    setAllClips(vids);

    const answerMap: Record<string, string> = {};
    detail.answers.forEach((a) => (answerMap[a.question_key] = a.answer_text));
    setPoles({
      alike: answerMap.alike_phrase ?? "",
      contrast: answerMap.contrast_phrase ?? "",
    });

    const ratingMap: Record<number, number> = {};
    Object.values(detail.construct_ratings).forEach((cr: ConstructRating) => {
      ratingMap[cr.video_id] = cr.rating;
    });
    setRatings(ratingMap);

    const noteMap: Record<number, string> = {};
    Object.entries(detail.clip_notes).forEach(([vid, note]) => {
      if (note) noteMap[Number(vid)] = note.note_text;
    });
    setNotes(noteMap);

    setLoading(false);
  }, [sessionId, roundNum, loadVideos]);

  useEffect(() => {
    load();
  }, [load]);

  const currentClips =
    phase === "triad"
      ? triadClips
      : allClips.filter((v) => !triadClips.some((t) => t.id === v.id));
  const currentVideo = currentClips[currentIdx];
  const isLastClip = currentIdx >= currentClips.length - 1;

  async function handleRate(val: number) {
    if (!raId || !currentVideo) return;
    setRatings((prev) => ({ ...prev, [currentVideo.id]: val }));
    setSaving(true);
    setError(null);
    try {
      await api.saveConstructRating(raId, currentVideo.id, val);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save rating");
      setRatings((prev) => {
        const copy = { ...prev };
        delete copy[currentVideo.id];
        return copy;
      });
    } finally {
      setSaving(false);
    }
  }

  function handleNext() {
    if (!isLastClip) {
      setCurrentIdx((i) => i + 1);
      return;
    }

    if (phase === "triad") {
      const remaining = allClips.filter(
        (v) => !triadClips.some((t) => t.id === v.id)
      );
      if (remaining.length > 0) {
        setPhase("remaining_intro");
        setCurrentIdx(0);
      } else {
        handleComplete();
      }
    } else {
      handleComplete();
    }
  }

  async function handleComplete() {
    if (!sessionId || !roundNum) return;
    setError(null);
    try {
      await api.completeRound(sessionId, Number(roundNum));
      navigate(rgtRoute(`/study/rounds/${roundNum}/complete`), { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to complete round");
    }
  }

  if (loading) {
    return (
      <Layout phase="triadic_elicitation">
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        </div>
      </Layout>
    );
  }

  if (phase === "remaining_intro") {
    return (
      <Layout phase="triadic_elicitation">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-2xl font-bold text-gray-900">Rating</h1>
          <div className="mt-6 space-y-4 text-base text-gray-600">
            <p>
              You will now rate the remaining clips on the same construct using
              the same 1 to 7 scale.
            </p>
            <p>
              You may take notes on the non-speech information (NSI) captions
              while reviewing the clips if that helps with future rating rounds.
            </p>
          </div>
          <button
            onClick={() => setPhase("remaining")}
            className="btn-primary mt-8"
          >
            Continue
          </button>
        </div>
      </Layout>
    );
  }

  if (!currentVideo) return null;

  return (
    <Layout phase="triadic_elicitation">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-xl font-bold text-gray-900">
          Clip {currentVideo.id}
        </h1>

        <div className="mt-4">
          <VideoPlayer video={currentVideo} />
        </div>

        <div className="mt-6">
          <NotesPanel
            value={notes[currentVideo.id] ?? ""}
            onChange={() => {}}
            readOnly
            saved
          />
        </div>

        <p className="mt-4 text-sm text-gray-500">
          Remember: You are rating this clip based on its non-speech
          information (NSI) captions.
        </p>

        <div className="card mt-4">
          <p className="mb-4 text-sm font-medium text-gray-700">
            Please rate the above clip based on which end of the construct it
            is nearest to.
          </p>
          <RatingScale
            min={1}
            max={7}
            value={ratings[currentVideo.id] ?? null}
            onChange={handleRate}
            lowLabel={poles.alike || "Pole 1"}
            highLabel={poles.contrast || "Pole 2"}
          />
        </div>

        {!ratings[currentVideo.id] && !error && (
          <p className="mt-3 text-center text-sm text-amber-600">
            Please rate the clip before continuing.
          </p>
        )}

        {error && (
          <p className="mt-3 text-center text-sm text-red-600">{error}</p>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleNext}
            disabled={!ratings[currentVideo.id] || saving}
            className="btn-primary"
          >
            {isLastClip
              ? phase === "triad" &&
                allClips.some((v) => !triadClips.some((t) => t.id === v.id))
                ? "Continue"
                : "Continue to Next Round"
              : "Next Clip"}
          </button>
        </div>
      </div>
    </Layout>
  );
}
