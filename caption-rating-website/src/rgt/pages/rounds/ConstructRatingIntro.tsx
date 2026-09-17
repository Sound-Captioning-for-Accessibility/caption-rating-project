import { useNavigate, useParams } from "react-router-dom";
import { rgtRoute } from "../../routePrefix";
import IntroScreen from "../../components/IntroScreen";

export default function ConstructRatingIntro() {
  const navigate = useNavigate();
  const { roundNum } = useParams<{ roundNum: string }>();

  return (
    <IntroScreen
      phase="triadic_elicitation"
      title="Rating"
      buttonLabel="Continue"
      onContinue={() => navigate(rgtRoute(`/study/rounds/${roundNum}/rate`))}
    >
      <p>Your responses have been saved.</p>
      <p>
        You will now rate the clips you just reviewed on the construct you
        identified. Here, a construct refers to the pair of contrasting words
        or phrases you just used to describe an important difference between
        the clips.
      </p>
      <p>
        Please rate each clip on a scale from 1 to 7 based on how closely it
        matches each end of the construct.
      </p>
      <p className="font-medium text-gray-700">
        Press Continue when you are ready to proceed.
      </p>
    </IntroScreen>
  );
}
