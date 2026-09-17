import type { Phase } from "../types";

const STEPS = [
  { key: "overall_ratings", label: "Rating" },
  { key: "triadic_elicitation", label: "Rounds" },
  { key: "review", label: "Review" },
  { key: "completed", label: "Done" },
] as const;

function phaseToStep(phase: Phase): string {
  if (phase === "additional_constructs" || phase === "review_ratings")
    return "review";
  return phase;
}

interface LayoutProps {
  phase?: Phase;
  children: React.ReactNode;
}

export default function Layout({ phase, children }: LayoutProps) {
  const activeStep = phase ? phaseToStep(phase) : null;

  return (
    <div className="min-h-screen flex flex-col">
      {phase && phase !== "completed" && (
        <nav className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-4xl items-center gap-0">
            {STEPS.map((step, i) => {
              const isActive = step.key === activeStep;
              const activeIdx = STEPS.findIndex((s) => s.key === activeStep);
              const isPast = i < activeIdx;
              return (
                <div
                  key={step.key}
                  className={`flex-1 py-4 text-center text-sm font-medium transition-colors ${
                    isActive
                      ? "border-b-2 border-brand-600 text-brand-700"
                      : isPast
                        ? "text-brand-500"
                        : "text-gray-400"
                  }`}
                >
                  {step.label}
                </div>
              );
            })}
          </div>
        </nav>
      )}
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
