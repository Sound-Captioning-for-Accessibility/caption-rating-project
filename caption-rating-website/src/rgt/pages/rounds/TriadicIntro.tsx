import { useNavigate } from "react-router-dom";
import { rgtRoute } from "../../routePrefix";
import IntroScreen from "../../components/IntroScreen";

export default function TriadicIntro() {
  const navigate = useNavigate();

  return (
    <IntroScreen
      phase="triadic_elicitation"
      title="Triadic Elicitation"
      onContinue={() => navigate(rgtRoute("/study/rounds/example"))}
    >
      <p>
        In this part of the study, you will be shown three clips at a time.
      </p>
      <p>
        For each set of three clips, please review each clip carefully and use
        the notes panel to record anything you notice about the non-speech
        information (NSI) captions. You will then answer comparison questions
        and rate the clips on the construct you identified.
      </p>
      <p>
        Please focus on the relationship between the non-speech information
        (NSI) captions, and, if you have access to audio, the meaningful
        sounds in the clip, rather than on the clip as a whole.
      </p>
      <p>
        There are no right or wrong answers. We are interested in how you
        understand the clips and their NSI captions.
      </p>
      <p className="font-medium text-gray-700">
        Press Continue when you are ready to proceed.
      </p>
    </IntroScreen>
  );
}
