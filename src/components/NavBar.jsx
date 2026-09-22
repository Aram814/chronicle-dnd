import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Swords } from 'lucide-react';

const ROOT_TITLES = {
  '/': 'Chronicle',
  '/characters': 'Characters',
  '/stories': 'Stories',
  '/settings': 'Settings',
};

export default function NavBar({ title, showBack = false, onBack }) {
  const navigate = useNavigate();
  const location = useLocation();
  const resolvedTitle = title || ROOT_TITLES[location.pathname] || 'Chronicle';

  return (
    <header
      className="safe-top bg-stone-900/90 backdrop-blur border-b border-amber-900/30 z-30"
      role="banner"
    >
      <div className="flex items-center gap-3 px-4 h-14 max-w-2xl mx-auto">
        {showBack ? (
          <button
            type="button"
            onClick={() => (onBack ? onBack() : navigate(-1))}
            aria-label="Go back"
            className="text-stone-400 hover:text-amber-300 flex items-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <Swords className="w-5 h-5 text-amber-500 flex-shrink-0" aria-hidden="true" />
        )}
        <h1 className="font-serif text-amber-200 flex-1 truncate text-lg">{resolvedTitle}</h1>
      </div>
    </header>
  );
}