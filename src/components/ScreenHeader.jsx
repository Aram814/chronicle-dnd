import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Consistent child-screen header: safe-top, back button on the left,
 * centered/flex title, action buttons on the right. Mirrors NavBar's
 * visual pattern so every child screen shares the same chrome.
 */
export default function ScreenHeader({ title, backTo = '/', onBack, actions, icon: Icon, containerClassName }) {
  return (
    <header className="safe-top bg-card backdrop-blur border-b border-border z-30 flex-shrink-0">
      <div className={cn('flex items-center gap-3 px-4 h-14 mx-auto max-w-2xl', containerClassName)}>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back"
            className="text-muted-foreground hover:text-amber-300 flex-shrink-0 p-3"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <Link
            to={backTo}
            aria-label="Go back"
            className="text-muted-foreground hover:text-amber-300 flex-shrink-0 p-3"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        )}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {Icon && <Icon className="w-5 h-5 text-amber-500 flex-shrink-0" aria-hidden="true" />}
          <h1 className="font-serif text-amber-200 flex-1 truncate text-lg">{title}</h1>
        </div>
        {actions && <div className="flex items-center gap-1 flex-shrink-0">{actions}</div>}
      </div>
    </header>
  );
}