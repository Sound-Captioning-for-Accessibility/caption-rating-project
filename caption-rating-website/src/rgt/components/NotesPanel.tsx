import { useState, useEffect, useRef } from "react";

interface Props {
  value: string;
  onChange: (text: string) => void;
  saving?: boolean;
  saved?: boolean;
  readOnly?: boolean;
}

export default function NotesPanel({
  value,
  onChange,
  saving = false,
  saved = false,
  readOnly = false,
}: Props) {
  const [localValue, setLocalValue] = useState(value);
  const debounce = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  function handleChange(text: string) {
    setLocalValue(text);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => onChange(text), 800);
  }

  return (
    <div className="card">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700">
          NSI Caption Notes
        </h4>
        <span className="text-xs text-gray-400">
          {saving
            ? "Saving..."
            : saved
              ? "All changes saved"
              : "Changes will be saved automatically"}
        </span>
      </div>
      <textarea
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        readOnly={readOnly}
        placeholder="Add any notes or observations here..."
        className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm
                   text-gray-700 placeholder:text-gray-400 focus:border-brand-300
                   focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-300
                   disabled:opacity-60"
        rows={5}
      />
      <p className="mt-2 text-xs text-gray-400">
        Note: Non-speech information captions describe meaningful sounds or
        audio cues other than spoken words. Examples might include sounds like
        [laughter], [door creaks], or [dramatic music].
      </p>
    </div>
  );
}
