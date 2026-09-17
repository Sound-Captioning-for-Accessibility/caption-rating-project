import { useNavigate } from "react-router-dom";
import { rgtRoute } from "../../routePrefix";
import IntroScreen from "../../components/IntroScreen";

export default function ReviewIntro() {
  const navigate = useNavigate();

  return (
    <IntroScreen
      phase="review_ratings"
      title="Overall NSI Caption Ratings"
      onContinue={() => navigate(rgtRoute("/study/review/rate"))}
    >
      <p>
        In this section, you will be asked to review and rate each video clip
        on its overall non-speech information (NSI) caption quality using a
        scale from 1 to 5.
      </p>
      <p>
        There are no right or wrong answers. We are interested in your own
        impressions of the NSI captions.
      </p>
      <p>
        Please focus on the relationship between the non-speech information
        (NSI) captions, and, if you have access to audio, the meaningful
        sounds in the clip, rather than on the clip as a whole. In this study,
        NSI captions refer to captioned information about meaningful sounds or
        audio details other than spoken dialogue, such as music, sound
        effects, and environmental sounds that contribute to meaning.
      </p>
      <p>
        When rating overall NSI caption quality, please consider how well the
        captions communicate important non-speech sound information in the
        clip, including whether meaningful sound information seems clearly
        represented, underrepresented, or missing.
      </p>
      <p className="font-medium text-gray-700">
        Press Continue when you are ready.
      </p>
    </IntroScreen>
  );
}
