import { useNavigate } from "react-router-dom";
import { rgtRoute } from "../../routePrefix";
import { useStudy } from "../../context/StudyContext";
import Layout from "../../components/Layout";

export default function SectionComplete() {
  const navigate = useNavigate();
  const { advancePhase } = useStudy();

  async function handleContinue() {
    try {
      const nextPhase = await advancePhase();
      if (nextPhase === "additional_constructs") {
        navigate(rgtRoute("/study/constructs"), { replace: true });
      } else if (nextPhase === "review_ratings") {
        navigate(rgtRoute("/study/review"), { replace: true });
      }
    } catch {
      // error handled by context
    }
  }

  return (
    <Layout phase="triadic_elicitation">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-2xl font-bold text-gray-900">Section Complete</h1>
        <p className="mt-4 text-gray-600">
          Your responses have been saved. You have completed this part of the
          study.
        </p>
        <p className="mt-2 text-gray-600">
          When you are ready, click Continue to begin the next part.
        </p>
        <button onClick={handleContinue} className="btn-primary mt-8">
          Continue
        </button>
      </div>
    </Layout>
  );
}
