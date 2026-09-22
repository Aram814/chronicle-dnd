import { Link } from 'react-router-dom';
import { Play, Info, Archive, MoreVertical } from 'lucide-react';
import { useState } from 'react';

export default function CampaignCard({ campaign, character, onArchive, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const statusColors = {
    setup: 'bg-blue-900/40 text-blue-300 border-blue-700/40',
    active: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/40',
    paused: 'bg-amber-900/40 text-amber-300 border-amber-700/40',
    completed: 'bg-purple-900/40 text-purple-300 border-purple-700/40',
    archived: 'bg-stone-800 text-stone-400 border-stone-700'
  };

  return (
    <div className="group relative bg-gradient-to-br from-stone-900/80 to-stone-950/80 border border-amber-900/30 rounded-xl p-5 hover:border-amber-700/50 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-bold text-amber-100 font-serif">{campaign.name}</h3>
          {character && (
            <p className="text-sm text-stone-400">
              {character.name} · {character.class} · Lvl {character.level}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full border capitalize ${statusColors[campaign.status] || statusColors.active}`}>
            {campaign.status}
          </span>
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Campaign options" aria-expanded={menuOpen} className="p-2 text-stone-500 hover:text-amber-300">
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 z-10 w-40 bg-stone-900 border border-amber-900/40 rounded-lg shadow-xl py-1">
                <button onClick={() => { onArchive?.(campaign); setMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-stone-300 hover:bg-amber-900/20 flex items-center gap-2">
                  <Archive className="w-3 h-3" /> Archive
                </button>
                <button onClick={() => { onDelete?.(campaign); setMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 flex items-center gap-2">
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <p className="text-sm text-stone-400 line-clamp-2 mb-3 min-h-[2.5rem]">
        {campaign.description || 'An untold adventure awaits...'}
      </p>
      {campaign.current_location && (
        <p className="text-xs text-amber-700/80 mb-3">📍 {campaign.current_location}</p>
      )}
      <div className="flex gap-2">
        <Link
          to={`/campaign/${campaign.id}`}
          className="touch-target flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-amber-900/40 hover:bg-amber-800/50 border border-amber-700/50 rounded-lg text-amber-200 text-sm font-semibold transition-all"
        >
          <Play className="w-4 h-4" />
          {campaign.status === 'setup' ? 'Continue Setup' : 'Continue'}
        </Link>
        <Link
          to={`/campaign/${campaign.id}/details`}
          className="px-3 py-2 bg-stone-800/60 hover:bg-stone-700/60 border border-stone-700 rounded-lg text-stone-300 transition-all"
        >
          <Info className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}