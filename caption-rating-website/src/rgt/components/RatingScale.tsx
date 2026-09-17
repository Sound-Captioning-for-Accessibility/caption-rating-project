interface Props {
  min?: number;
  max?: number;
  value: number | null;
  onChange: (val: number) => void;
  lowLabel: string;
  highLabel: string;
}

export default function RatingScale({
  min = 1,
  max = 5,
  value,
  onChange,
  lowLabel,
  highLabel,
}: Props) {
  const points = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div className="w-full">
      <div className="mb-2 flex justify-between text-sm text-gray-500">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
      <div className="flex justify-between gap-2">
        {points.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-all ${
              value === n
                ? "bg-brand-600 text-white shadow-md ring-2 ring-brand-300 scale-110"
                : "bg-gray-100 text-gray-700 hover:bg-brand-50 hover:text-brand-700"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
