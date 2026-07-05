import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import DashboardLayout from "./components/layout/DashboardLayout";
import ChatPage from "./pages/ChatPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import TokenUsagePage from "./pages/TokenUsagePage";
import IngestionPage from "./pages/IngestionPage";
import SourcesPage from "./pages/SourcesPage";
import UsersPage from "./pages/UsersPage";
import SettingsPage from "./pages/SettingsPage";
import SourceViewPage from "./pages/SourceViewPage";
import TeamsPage from "./pages/TeamsPage";

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-500">
        Loading...
      </div>
    );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const TIER_RANK: Record<string, number> = { admin: 0, team_lead: 1, member: 2 };

function TierGuard({ minTier, children }: { minTier: string; children: React.ReactNode }) {
  const { user } = useAuth();
  const actual = TIER_RANK[user?.tier || "member"] ?? TIER_RANK.member;
  const required = TIER_RANK[minTier] ?? TIER_RANK.member;
  if (actual > required) return <Navigate to="/unauthorized" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route
        path="/"
        element={
          <AuthGuard>
            <DashboardLayout />
          </AuthGuard>
        }
      >
        <Route index element={<ChatPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:projectId" element={<ProjectDetailPage />} />
        <Route path="projects/:projectId/chats/:chatId" element={<ChatPage />} />
        <Route path="token-usage" element={<TokenUsagePage />} />
        <Route
          path="ingestion"
          element={
            <TierGuard minTier="team_lead">
              <IngestionPage />
            </TierGuard>
          }
        />
        <Route path="sources" element={<SourcesPage />} />
        <Route
          path="teams"
          element={
            <TierGuard minTier="team_lead">
              <TeamsPage />
            </TierGuard>
          }
        />
        <Route
          path="users"
          element={
            <TierGuard minTier="admin">
              <UsersPage />
            </TierGuard>
          }
        />
        <Route
          path="settings"
          element={
            <TierGuard minTier="admin">
              <SettingsPage />
            </TierGuard>
          }
        />
        <Route path="source-view/:projectId/:documentId" element={<SourceViewPage />} />
      </Route>
    </Routes>
  );
}
