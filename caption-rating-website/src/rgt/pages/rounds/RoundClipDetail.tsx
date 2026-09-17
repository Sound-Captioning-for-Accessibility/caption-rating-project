import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { rgtRoute } from "../../routePrefix";
import Layout from "../../components/Layout";
import VideoPlayer from "../../components/VideoPlayer";
import NotesPanel from "../../components/NotesPanel";
import { useStudy } from "../../context/StudyContext";
import { api } from "../../api/client";
import type { Video, RoundDetail } from "../../types";

export default function RoundClipDetail() {
  const { roundNum, videoId } = useParams<{
    roundNum: string;
    videoId: string;
  }>();
  const navigate = useNavigate();
  const { sessionId } = useStudy();
  const [video, setVideo] = useState<Video | null>(null);
  const [raId, setRaId] = useState<number | null>(null);
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reviewed, setReviewed] = useState(false);

  const load = useCallback(async () => {
    if (!sessionId || !roundNum || !videoId) return;
    const detail: RoundDetail = await api.getRound(
      sessionId,
      Number(roundNum)
    );
    setRaId(detail.round_assignment.id);
    const vid = detail.round_assignment.triad?.videos.find(
      (v) => v.id === Number(videoId)
    );
    if (vid) setVideo(vid);

    const existingNote = detail.clip_notes[videoId];
    if (existingNote) setNoteText(existingNote.note_text);

    if (detail.clip_reviews[videoId]) setReviewed(true);
  }, [sessionId, roundNum, videoId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!raId || !videoId || reviewed) return;
    api.markClipReviewed(raId, Number(videoId)).then(() => setReviewed(true));
  }, [raId, videoId, reviewed]);

  async function handleNoteChange(text: string) {
    if (!raId || !videoId) return;
    setSaving(true);
    setSaved(false);
    try {
      await api.saveClipNote(raId, Number(videoId), text);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (!video) return null;

  return (
    <Layout phase="triadic_elicitation">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => navigate(rgtRoute(`/study/rounds/${roundNum}`))}
          className="mb-4 text-sm text-brand-600 hover:text-brand-800"
        >
          &larr; Back
        </button>

        <h1 className="text-xl font-bold text-gray-900">Clip {video.id}</h1>
        <p className="mt-2 text-sm text-gray-600">
          Watch the clip below and use the notes panel to record anything you
          notice about the non-speech information (NSI) captions. Taking notes
          while you watch may make the next step easier.
        </p>

        <div className="mt-4">
          <VideoPlayer video={video} />
        </div>

        <div className="mt-6">
          <NotesPanel
            value={noteText}
            onChange={(text) => {
              setNoteText(text);
              handleNoteChange(text);
            }}
            saving={saving}
            saved={saved}
          />
        </div>

        {reviewed && (
          <p className="mt-4 text-center text-xs text-gray-400">
            You reviewed this clip earlier. You may watch it again or continue
            using your earlier notes.
          </p>
        )}
      </div>
    </Layout>
  );
}
