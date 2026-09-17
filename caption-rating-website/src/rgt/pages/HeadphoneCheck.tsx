import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { rgtRoute } from "../routePrefix";
import Layout from "../components/Layout";

const STIMULI = [
  { id: 1, src: "https://s3.amazonaws.com/mcd-headphone-check/v1.0/assets/antiphase_HC_ISO.wav", correct: "2" },
  { id: 2, src: "https://s3.amazonaws.com/mcd-headphone-check/v1.0/assets/antiphase_HC_IOS.wav", correct: "3" },
  { id: 3, src: "https://s3.amazonaws.com/mcd-headphone-check/v1.0/assets/antiphase_HC_SOI.wav", correct: "1" },
  { id: 4, src: "https://s3.amazonaws.com/mcd-headphone-check/v1.0/assets/antiphase_HC_SIO.wav", correct: "1" },
  { id: 5, src: "https://s3.amazonaws.com/mcd-headphone-check/v1.0/assets/antiphase_HC_OSI.wav", correct: "2" },
  { id: 6, src: "https://s3.amazonaws.com/mcd-headphone-check/v1.0/assets/antiphase_HC_OIS.wav", correct: "3" },
];

const CALIBRATION_SRC =
  "https://s3.amazonaws.com/mcd-headphone-check/v1.0/assets/noise_calib_stim.wav";

const PASS_THRESHOLD = 5;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Step = "intro" | "calibration" | "trial" | "result";

export default function HeadphoneCheck() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("intro");
  const [trials] = useState(() => shuffle(STIMULI));
  const [currentTrial, setCurrentTrial] = useState(0);
  const [responses, setResponses] = useState<string[]>([]);
  const [played, setPlayed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const totalCorrect = responses.reduce((sum, resp, i) => {
    return sum + (resp === trials[i].correct ? 1 : 0);
  }, 0);
  const didPass = totalCorrect >= PASS_THRESHOLD;

  const playAudio = useCallback((src: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(src);
    audioRef.current = audio;
    setPlaying(true);
    audio.addEventListener("ended", () => {
      setPlaying(false);
      setPlayed(true);
    });
    audio.play().catch(() => setPlaying(false));
  }, []);

  function handleSubmitTrial() {
    if (!selected) return;
    const newResponses = [...responses, selected];
    setResponses(newResponses);

    if (currentTrial + 1 >= trials.length) {
      setStep("result");
    } else {
      setCurrentTrial((i) => i + 1);
      setSelected(null);
      setPlayed(false);
    }
  }

  function handleContinue() {
    if (didPass) {
      sessionStorage.setItem("nsi_headphone_passed", "1");
      navigate(rgtRoute("/study/warmup"), { replace: true });
    } else {
      sessionStorage.clear();
      navigate(rgtRoute("/"), { replace: true });
    }
  }

  // --- Intro ---
  if (step === "intro") {
    return (
      <Layout phase="overall_ratings">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Headphone Check
          </h1>
          <div className="mt-6 space-y-4 text-base text-gray-600">
            <p>
              This study requires that you wear headphones. Before we begin, we
              need to verify that you are using headphones (not speakers).
            </p>
            <p>
              You will hear a series of tones. For each set of three tones,
              please select which tone was the <strong>quietest</strong>.
            </p>
            <p>
              Please put on your headphones now and make sure your volume is at
              a comfortable level.
            </p>
          </div>
          <button
            onClick={() => setStep("calibration")}
            className="btn-primary mt-8"
          >
            Continue
          </button>
        </div>
      </Layout>
    );
  }

  // --- Calibration ---
  if (step === "calibration") {
    return (
      <Layout phase="overall_ratings">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Volume Calibration
          </h1>
          <p className="mt-4 text-gray-600">
            Click the button below to play a calibration sound. Please adjust
            your volume to a comfortable level. You should be able to hear the
            sound clearly without it being too loud.
          </p>

          <div className="card mx-auto mt-8 max-w-sm">
            <button
              onClick={() => playAudio(CALIBRATION_SRC)}
              disabled={playing}
              className="btn-secondary w-full"
            >
              {playing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-brand-500" />
                  Playing...
                </span>
              ) : (
                "Play Calibration Sound"
              )}
            </button>
          </div>

          <button
            onClick={() => {
              setPlayed(false);
              setStep("trial");
            }}
            disabled={!played && !playing}
            className="btn-primary mt-8"
          >
            Begin Headphone Check
          </button>

          {!played && !playing && (
            <p className="mt-3 text-sm text-amber-600">
              Please play the calibration sound before continuing.
            </p>
          )}
        </div>
      </Layout>
    );
  }

  // --- Trial ---
  if (step === "trial") {
    const trial = trials[currentTrial];

    return (
      <Layout phase="overall_ratings">
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">
              Headphone Check
            </h1>
            <span className="text-sm text-gray-500">
              Trial {currentTrial + 1} of {trials.length}
            </span>
          </div>

          <div className="card">
            <p className="text-sm text-gray-600">
              Listen to the sound and select which tone (1, 2, or 3) was the{" "}
              <strong>quietest</strong>.
            </p>

            <div className="mt-6 flex justify-center">
              <button
                onClick={() => {
                  setPlayed(false);
                  playAudio(trial.src);
                }}
                disabled={playing}
                className="inline-flex items-center gap-2 rounded-lg border-2 border-brand-200 bg-brand-50 px-6 py-3 text-sm font-semibold text-brand-700 transition hover:bg-brand-100"
              >
                {playing ? (
                  <>
                    <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-brand-500" />
                    Playing...
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                    </svg>
                    {played ? "Play Again" : "Play Sound"}
                  </>
                )}
              </button>
            </div>

            {played && (
              <div className="mt-8">
                <p className="mb-3 text-center text-sm font-medium text-gray-700">
                  Which tone was the quietest?
                </p>
                <div className="flex justify-center gap-4">
                  {["1", "2", "3"].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setSelected(opt)}
                      className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold transition ${
                        selected === opt
                          ? "bg-brand-600 text-white shadow-md ring-2 ring-brand-300 scale-110"
                          : "bg-gray-100 text-gray-700 hover:bg-brand-50 hover:text-brand-700"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!played && !playing && (
              <p className="mt-6 text-center text-sm text-amber-600">
                Please play the sound before selecting an answer.
              </p>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSubmitTrial}
              disabled={!selected}
              className="btn-primary"
            >
              {currentTrial + 1 < trials.length ? "Next" : "Submit"}
            </button>
          </div>

          {/* Progress dots */}
          <div className="mt-4 flex justify-center gap-2">
            {trials.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full ${
                  i < currentTrial
                    ? "bg-brand-500"
                    : i === currentTrial
                      ? "bg-brand-300"
                      : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  // --- Result ---
  return (
    <Layout phase="overall_ratings">
      <div className="mx-auto max-w-2xl text-center">
        {didPass ? (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <h1 className="mt-6 text-2xl font-bold text-gray-900">
              Headphone Check Passed
            </h1>
            <p className="mt-4 text-gray-600">
              Great! You have confirmed that you are wearing headphones. You
              may now proceed to the study.
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="mt-6 text-2xl font-bold text-gray-900">
              Headphone Check Not Passed
            </h1>
            <p className="mt-4 text-gray-600">
              Unfortunately, the results suggest that you may not be wearing
              headphones. This study requires headphones to ensure accurate
              results. Please put on headphones and try again.
            </p>
          </>
        )}

        <p className="mt-2 text-sm text-gray-500">
          Score: {totalCorrect}/{trials.length}
        </p>

        <button onClick={handleContinue} className="btn-primary mt-8">
          {didPass ? "Continue to Study" : "Return to Start"}
        </button>
      </div>
    </Layout>
  );
}
