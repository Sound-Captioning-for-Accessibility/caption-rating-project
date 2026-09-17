import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { rgtRoute } from "../../routePrefix";
import Layout from "../../components/Layout";
import ClipCard from "../../components/ClipCard";
import { useStudy } from "../../context/StudyContext";
import { api } from "../../api/client";
import type { Video, OverallRating } from "../../types";

export default function ReviewRate() {
  const navigate = useNavigate();
  const { sessionId, loadVideos, advancePhase } = useStudy();
  const [clips, setClips] = useState<Video[]>([]);
  const [ratings, setRatings] = useState<Record<number, OverallRating>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!sessionId) return;
      const [vids, { ratings: existing }] = await Promise.all([
        loadVideos(),
        api.getOverallRatings(sessionId),
      ]);
      setClips(vids);
      const map: Record<number, OverallRating> = {};
      existing.forEach((r) => (map[r.video_id] = r));
      setRatings(map);
      setLoading(false);
    }
    load();
  }, [sessionId, loadVideos]);

  const allRated = clips.length > 0 && clips.every((c) => ratings[c.id]);

  async function handleContinue() {
    try {
      const next = await advancePhase();
      if (next === "completed") {
        navigate(rgtRoute("/study/complete"), { replace: true });
      }
    } catch {
      // handled by context
    }
  }

  if (loading) {
    return (
      <Layout phase="review_ratings">
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout phase="review_ratings">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Rate Clips</h1>
        <p className="mt-2 text-sm text-gray-600">
          Instructions: Please review each clip below in its entirety and rate
          the overall quality of the non-speech information (NSI) captions.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {clips.map((clip) => (
            <ClipCard
              key={clip.id}
              video={clip}
              label={`Clip ${clip.id}`}
              status={
                ratings[clip.id]
                  ? "rated"
                  : "previously_viewed"
              }
              onClick={() => navigate(rgtRoute(`/study/review/rate/${clip.id}`))}
            />
          ))}
        </div>

        {!allRated && (
          <p className="mt-4 text-center text-sm text-amber-600">
            Please review all remaining clips before continuing.
          </p>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleContinue}
            disabled={!allRated}
            className="btn-primary"
          >
            Continue
          </button>
        </div>
      </div>
    </Layout>
  );
}
