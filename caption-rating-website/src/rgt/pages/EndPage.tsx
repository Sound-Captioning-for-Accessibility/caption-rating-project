import Layout from "../components/Layout";

export default function EndPage() {
  return (
    <Layout phase="completed">
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="mt-6 text-3xl font-bold text-gray-900">
            Thank You!
          </h1>
          <p className="mt-4 text-gray-600">
            You have now completed this study. Thank you for taking the time to
            participate. We appreciate your responses and look forward to
            reviewing them.
          </p>
          <button
            onClick={() => {
              sessionStorage.clear();
              window.location.href = "/";
            }}
            className="btn-primary mt-8"
          >
            Finish
          </button>
        </div>
      </div>
    </Layout>
  );
}
