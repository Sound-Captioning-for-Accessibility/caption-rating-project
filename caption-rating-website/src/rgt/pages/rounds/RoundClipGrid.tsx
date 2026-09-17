import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { rgtRoute } from "../../routePrefix";
import Layout from "../../components/Layout";
import ClipCard from "../../components/ClipCard";
import { useStudy } from "../../context/StudyContext";
import { api } from "../../api/client";
import type { RoundDetail, Video } from "../../types";

export default function RoundClipGrid() {
  const { roundNum } = useParams<{ roundNum: string }>();
  const navigate = useNavigate();
  const { sessionId, session } = useStudy();
  const [detail, setDetail] = useState<RoundDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!sessionId || !roundNum) return;
    try {
      const d = await api.getRound(sessionId, Number(roundNum));
      setDetail(d);
    } finally {
      setLoading(false);
    }
  }, [sessionId, roundNum]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !detail) {
    return (
      <Layout phase="triadic_elicitation">
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        </div>
      </Layout>
    );
  }

  const videos = detail.round_assignment.triad?.videos ?? [];
  const allReviewed = videos.every(
    (v) => detail.clip_reviews[String(v.id)] != null
  );

  function clipStatus(v: Video) {
    if (detail!.clip_reviews[String(v.id)]) return "viewed" as const;
    return "not_viewed" as const;
  }

  return (
    <Layout phase="triadic_elicitation">
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Round {roundNum} of {session?.total_rounds ?? 8}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Instructions: Please review each clip below in its entirety. Use the
          notes panel to record anything you notice about the non-speech
          information (NSI) captions. Taking notes while you watch may make the
          next step easier.
        </p>
        <p className="mt-1 text-sm text-gray-600">
          In the next step, you will compare the clips and describe how two are
          alike and different from the third in your own words.
        </p>

        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {videos.map((v, i) => (
            <ClipCard
              key={v.id}
              video={v}
              label={`Clip ${v.id}`}
              status={clipStatus(v)}
              onClick={() =>
                navigate(rgtRoute(`/study/rounds/${roundNum}/clip/${v.id}`))
              }
            />
          ))}
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          Note: The same clips may appear in multiple rounds. If you have
          already reviewed a clip, you may reopen it if you would like a
          refresher or to edit your notes.
        </p>

        {!allReviewed && (
          <p className="mt-3 text-center text-sm text-amber-600">
            Please fully review all three clips before continuing.
          </p>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => navigate(rgtRoute(`/study/rounds/${roundNum}/compare`))}
            disabled={!allReviewed}
            className="btn-primary"
          >
            Continue to Questions
          </button>
        </div>
      </div>
    </Layout>
  );
}
