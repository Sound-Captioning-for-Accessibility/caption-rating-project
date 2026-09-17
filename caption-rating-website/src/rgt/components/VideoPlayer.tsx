import type { Video } from "../types";

interface Props {
  video: Video;
  className?: string;
}

function isYouTubeUrl(url: string) {
  return url.includes("youtube.com") || url.includes("youtu.be");
}

export default function VideoPlayer({ video, className = "" }: Props) {
  if (!video.url) {
    return (
      <div
        className={`flex aspect-video items-center justify-center rounded-lg bg-gray-100 text-gray-400 ${className}`}
      >
        <div className="text-center">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
          <p className="mt-2 text-sm">{video.title}</p>
          <p className="text-xs">Video URL not configured</p>
        </div>
      </div>
    );
  }

  if (isYouTubeUrl(video.url)) {
    return (
      <iframe
        className={`aspect-video w-full rounded-lg ${className}`}
        src={video.url}
        title={video.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <video
      className={`aspect-video w-full rounded-lg bg-black ${className}`}
      controls
      preload="metadata"
      crossOrigin="anonymous"
    >
      <source src={video.url} />
      <track kind="captions" label="Captions" default />
      Your browser does not support the video element.
    </video>
  );
}
