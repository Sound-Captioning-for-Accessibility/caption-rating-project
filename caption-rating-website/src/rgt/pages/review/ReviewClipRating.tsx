import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { rgtRoute } from "../../routePrefix";
import Layout from "../../components/Layout";
import VideoPlayer from "../../components/VideoPlayer";
import RatingScale from "../../components/RatingScale";
import { useStudy } from "../../context/StudyContext";
import { api } from "../../api/client";
import type { Video } from "../../types";

export default function ReviewClipRating() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const { sessionId, loadVideos } = useStudy();
  const [video, setVideo] = useState<Video | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      if (!sessionId || !videoId) return;
      const vids = await loadVideos();
      const vid = vids.find((v) => v.id === Number(videoId));
      if (vid) setVideo(vid);

      const { ratings } = await api.getOverallRatings(sessionId);
      const existing = ratings.find((r) => r.video_id === Number(videoId));
      if (existing) {
        setRating(existing.revised_rating ?? existing.rating);
      }
    }
    load();
  }, [sessionId, videoId, loadVideos]);

  async function handleContinue() {
    if (!sessionId || !videoId || rating === null) return;
    setSaving(true);
    try {
      await api.saveOverallRating(sessionId, Number(videoId), rating);
      navigate(rgtRoute("/study/review/rate"));
    } finally {
      setSaving(false);
    }
  }

  if (!video) return null;

  return (
    <Layout phase="review_ratings">
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => navigate(rgtRoute("/study/review/rate"))}
          className="mb-4 text-sm text-brand-600 hover:text-brand-800"
        >
          &larr; Back
        </button>

        <h1 className="text-xl font-bold text-gray-900">Clip {video.id}</h1>

        <div className="mt-4">
          <VideoPlayer video={video} />
        </div>

        <p className="mt-6 text-sm text-gray-500">
          Remember: You are rating this clip based on its non-speech
          information (NSI) captions.
        </p>

        <div className="card mt-4">
          <p className="mb-4 text-sm font-medium text-gray-700">
            Overall, the quality of the NSI captions in this video clip are:
          </p>
          <RatingScale
            min={1}
            max={5}
            value={rating}
            onChange={setRating}
            lowLabel="Very bad"
            highLabel="Very good"
          />
        </div>

        {rating === null && (
          <p className="mt-3 text-center text-sm text-amber-600">
            Please rate the clip before continuing.
          </p>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleContinue}
            disabled={rating === null || saving}
            className="btn-primary"
          >
            {saving ? "Saving..." : "Continue"}
          </button>
        </div>
      </div>
    </Layout>
  );
}
