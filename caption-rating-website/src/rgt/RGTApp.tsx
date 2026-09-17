import { Routes, Route, Navigate } from "react-router-dom";
import { useStudy } from "./context/StudyContext";
import StartPage from "./pages/StartPage";
import HeadphoneCheck from "./pages/HeadphoneCheck";
import WarmUpIntro from "./pages/warmup/WarmUpIntro";
import WarmUpExamples from "./pages/warmup/WarmUpExamples";
import WarmUpRate from "./pages/warmup/WarmUpRate";
import WarmUpClipRating from "./pages/warmup/WarmUpClipRating";
import TriadicIntro from "./pages/rounds/TriadicIntro";
import TriadicExample from "./pages/rounds/TriadicExample";
import RoundClipGrid from "./pages/rounds/RoundClipGrid";
import RoundClipDetail from "./pages/rounds/RoundClipDetail";
import ComparisonPage from "./pages/rounds/ComparisonPage";
import ConstructRatingIntro from "./pages/rounds/ConstructRatingIntro";
import ConstructRatingPage from "./pages/rounds/ConstructRatingPage";
import RoundComplete from "./pages/rounds/RoundComplete";
import SectionComplete from "./pages/rounds/SectionComplete";
import AdditionalConstructs from "./pages/constructs/AdditionalConstructs";
import ReviewIntro from "./pages/review/ReviewIntro";
import ReviewRate from "./pages/review/ReviewRate";
import ReviewClipRating from "./pages/review/ReviewClipRating";
import EndPage from "./pages/EndPage";
import "./rgt-tailwind.css";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { sessionId } = useStudy();
  if (!sessionId) return <Navigate to="/rgt" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/rgt" element={<StartPage />} />

      {/* Headphone check */}
      <Route path="/rgt/study/headphone-check" element={<ProtectedRoute><HeadphoneCheck /></ProtectedRoute>} />

      {/* Warm-up phase */}
      <Route path="/rgt/study/warmup" element={<ProtectedRoute><WarmUpIntro /></ProtectedRoute>} />
      <Route path="/rgt/study/warmup/examples" element={<ProtectedRoute><WarmUpExamples /></ProtectedRoute>} />
      <Route path="/rgt/study/warmup/rate" element={<ProtectedRoute><WarmUpRate /></ProtectedRoute>} />
      <Route path="/rgt/study/warmup/rate/:videoId" element={<ProtectedRoute><WarmUpClipRating /></ProtectedRoute>} />

      {/* Triadic elicitation phase */}
      <Route path="/rgt/study/rounds/intro" element={<ProtectedRoute><TriadicIntro /></ProtectedRoute>} />
      <Route path="/rgt/study/rounds/example" element={<ProtectedRoute><TriadicExample /></ProtectedRoute>} />
      <Route path="/rgt/study/rounds/:roundNum" element={<ProtectedRoute><RoundClipGrid /></ProtectedRoute>} />
      <Route path="/rgt/study/rounds/:roundNum/clip/:videoId" element={<ProtectedRoute><RoundClipDetail /></ProtectedRoute>} />
      <Route path="/rgt/study/rounds/:roundNum/compare" element={<ProtectedRoute><ComparisonPage /></ProtectedRoute>} />
      <Route path="/rgt/study/rounds/:roundNum/rate-intro" element={<ProtectedRoute><ConstructRatingIntro /></ProtectedRoute>} />
      <Route path="/rgt/study/rounds/:roundNum/rate" element={<ProtectedRoute><ConstructRatingPage /></ProtectedRoute>} />
      <Route path="/rgt/study/rounds/:roundNum/complete" element={<ProtectedRoute><RoundComplete /></ProtectedRoute>} />
      <Route path="/rgt/study/rounds/complete" element={<ProtectedRoute><SectionComplete /></ProtectedRoute>} />

      {/* Additional constructs phase */}
      <Route path="/rgt/study/constructs" element={<ProtectedRoute><AdditionalConstructs /></ProtectedRoute>} />

      {/* Review phase */}
      <Route path="/rgt/study/review" element={<ProtectedRoute><ReviewIntro /></ProtectedRoute>} />
      <Route path="/rgt/study/review/rate" element={<ProtectedRoute><ReviewRate /></ProtectedRoute>} />
      <Route path="/rgt/study/review/rate/:videoId" element={<ProtectedRoute><ReviewClipRating /></ProtectedRoute>} />

      {/* Complete */}
      <Route path="/rgt/study/complete" element={<ProtectedRoute><EndPage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/rgt" replace />} />
    </Routes>
  );
}
