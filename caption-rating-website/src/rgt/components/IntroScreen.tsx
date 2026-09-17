import Layout from "./Layout";
import type { Phase } from "../types";

interface Props {
  phase: Phase;
  title: string;
  children: React.ReactNode;
  buttonLabel?: string;
  onContinue: () => void;
}

export default function IntroScreen({
  phase,
  title,
  children,
  buttonLabel = "Continue",
  onContinue,
}: Props) {
  return (
    <Layout phase={phase}>
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          {title}
        </h1>
        <div className="mt-6 space-y-4 text-base leading-relaxed text-gray-600">
          {children}
        </div>
        <button onClick={onContinue} className="btn-primary mt-8">
          {buttonLabel}
        </button>
      </div>
    </Layout>
  );
}
