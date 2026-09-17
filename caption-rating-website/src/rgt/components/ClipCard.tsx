import type { Video } from "../types";

type Status = "not_viewed" | "viewed" | "previously_viewed" | "rated";

interface Props {
  video: Video;
  label: string;
  status: Status;
  onClick: () => void;
}

const statusConfig: Record<Status, { text: string; color: string }> = {
  not_viewed: { text: "Not yet viewed", color: "bg-gray-100 text-gray-500" },
  viewed: { text: "Viewed this round", color: "bg-blue-50 text-blue-600" },
  previously_viewed: {
    text: "Previously viewed",
    color: "bg-amber-50 text-amber-600",
  },
  rated: { text: "Rated", color: "bg-green-50 text-green-600" },
};

export default function ClipCard({ video, label, status, onClick }: Props) {
  const cfg = statusConfig[status];

  return (
    <button
      type="button"
      onClick={onClick}
      className="card group w-full cursor-pointer text-left transition hover:shadow-md hover:border-brand-300"
    >
      {video.url && video.url.includes("youtube.com") ? (
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
          <img
            src={`https://img.youtube.com/vi/${video.filename}/hqdefault.jpg`}
            alt={video.title}
            className="h-full w-full object-cover"
          />
        </div>
      ) : video.url ? (
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
          <video className="h-full w-full object-cover" preload="metadata" muted>
            <source src={video.url} />
          </video>
        </div>
      ) : (
        <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-gray-100">
          <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
          </svg>
        </div>
      )}
      <div className="mt-3">
        <h3 className="font-semibold text-gray-900 group-hover:text-brand-700">
          {label}
        </h3>
        <span
          className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}
        >
          {cfg.text}
        </span>
      </div>
    </button>
  );
}
