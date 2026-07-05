import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-sm">
        <div className="w-16 h-16 mx-auto rounded-full bg-red-50 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
          </svg>
        </div>
        <h1 className="text-2xl font-light text-[#2f2b26]">Nicht berechtigt</h1>
        <p className="text-sm text-[#756b62]">Sie haben keine Berechtigung, auf diese Seite zuzugreifen.</p>
        <Button onClick={() => navigate("/")} className="rounded-full px-6" size="lg">
          Zurück zum Chat
        </Button>
      </div>
    </div>
  );
}
