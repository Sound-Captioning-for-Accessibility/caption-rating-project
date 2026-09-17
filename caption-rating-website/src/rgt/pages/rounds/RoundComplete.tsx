import { useNavigate, useParams } from "react-router-dom";
import { rgtRoute } from "../../routePrefix";
import { useStudy } from "../../context/StudyContext";
import Layout from "../../components/Layout";

export default function RoundComplete() {
  const { roundNum } = useParams<{ roundNum: string }>();
  const navigate = useNavigate();
  const { session } = useStudy();

  const isLastRound =
    session && Number(roundNum) >= session.total_rounds;

  return (
    <Layout phase="triadic_elicitation">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-2xl font-bold text-gray-900">Round Complete</h1>
        <p className="mt-4 text-gray-600">
          Thank you. Your responses have been saved.
        </p>

        {isLastRound ? (
          <>
            <p className="mt-4 text-gray-600">
              You have completed all rounds of this section.
            </p>
            <button
              onClick={() => navigate(rgtRoute("/study/rounds/complete"))}
              className="btn-primary mt-8"
            >
              Continue
            </button>
          </>
        ) : (
          <>
            <p className="mt-4 text-gray-600">
              When you are ready, click Continue to begin the next round.
            </p>
            <button
              onClick={() =>
                navigate(rgtRoute(`/study/rounds/${Number(roundNum) + 1}`))
              }
              className="btn-primary mt-8"
            >
              Continue to Next Round
            </button>
          </>
        )}
      </div>
    </Layout>
  );
}
