import { useNavigate } from "react-router-dom";
import { rgtRoute } from "../../routePrefix";
import Layout from "../../components/Layout";

export default function WarmUpExamples() {
  const navigate = useNavigate();

  return (
    <Layout phase="overall_ratings">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-center text-2xl font-bold text-gray-900">
          Examples of NSI Captions
        </h1>
        <p className="mt-4 text-center text-gray-600">
          Please review these examples of non-speech information (NSI) captions
          before continuing.
        </p>

        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="flex aspect-[4/3] items-center justify-center rounded border border-gray-300 bg-gray-100">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
            </svg>
          </div>
          <div className="flex aspect-[4/3] items-center justify-center rounded border border-gray-300 bg-gray-100">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
            </svg>
          </div>
          <div className="flex aspect-[4/3] items-center justify-center rounded border border-gray-300 bg-gray-100">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
            </svg>
          </div>
          <p className="text-center text-sm font-bold text-gray-700">TITLE</p>
          <p className="text-center text-sm font-bold text-gray-700">TITLE</p>
          <p className="text-center text-sm font-bold text-gray-700">TITLE</p>
        </div>

        <p className="mt-8 text-sm text-gray-700">
          <span className="font-bold">Note</span>: Non-speech information
          (NSI) captions refer to music (for example, "<em>[Rock music]</em>
          "), sound effect and environmental sounds (for example, "
          <em>[Birds chirping]</em>" or "<em>[Heavy thunderstorm]</em>") and
          extra information about dialogue (for example, "
          <em>whispering,</em>" "<em>from the other room,</em>" or "
          <em>Sarah:</em>")
        </p>

        <div className="mt-8 text-center">
          <p className="mb-4 text-sm text-gray-600">
            Press <strong><em>Continue</em></strong> when you are ready to
            begin.
          </p>
          <button
            onClick={() => navigate(rgtRoute("/study/warmup/rate"))}
            className="btn-primary"
          >
            Continue
          </button>
        </div>
      </div>
    </Layout>
  );
}
