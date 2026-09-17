import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { rgtRoute } from "../../routePrefix";
import Layout from "../../components/Layout";
import { useStudy } from "../../context/StudyContext";

export default function TriadicExample() {
  const navigate = useNavigate();
  const { session } = useStudy();
  const [watched, setWatched] = useState(false);

  return (
    <Layout phase="triadic_elicitation">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Triadic Elicitation Example
        </h1>
        <p className="mt-4 text-gray-600">
          Please review the following video before continuing.
        </p>

        <div className="card mt-6">
          <div
            className="flex aspect-video items-center justify-center rounded-lg bg-gray-100"
            onClick={() => setWatched(true)}
          >
            <div className="text-center text-gray-400">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
              </svg>
              <p className="mt-2 text-sm">Example video</p>
              <p className="text-xs">Click to mark as watched</p>
            </div>
          </div>
        </div>

        {!watched && (
          <p className="mt-4 text-sm text-amber-600">
            Please watch the example video before continuing.
          </p>
        )}

        <button
          onClick={() =>
            navigate(rgtRoute(`/study/rounds/${session?.current_round ?? 1}`))
          }
          disabled={!watched}
          className="btn-primary mt-6"
        >
          Continue
        </button>
      </div>
    </Layout>
  );
}
