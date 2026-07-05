import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-6xl font-bold text-slate-300 mb-4">404</h1>
      <p className="text-xl text-slate-600 mb-6">Page not found</p>
      <Link
        to="/projects"
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Go to Projects
      </Link>
    </div>
  );
}
