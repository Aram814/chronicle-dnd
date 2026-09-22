import { Link } from 'react-router-dom';
import { Play, Eye, Pencil, Copy, Trash2, Heart } from 'lucide-react';
import { Image } from '@/components/ui/image';

export default function CharacterCard({ character, onDuplicate, onDelete }) {
  return (
    <div className="group bg-gradient-to-br from-card/80 to-background/80 border border-amber-900/30 rounded-xl p-5 hover:border-amber-700/50 transition-all">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-amber-900/50 to-muted border border-amber-700/40 flex items-center justify-center text-amber-400 text-xl font-bold font-serif flex-shrink-0">
          {character.portrait ? (
            <Image src={character.portrait} alt={character.name || 'Character portrait'} fittingType="fill" className="w-full h-full" />
          ) : (
            character.name?.[0]?.toUpperCase() || '?'
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-amber-100 font-serif truncate">{character.name}</h3>
          <p className="text-sm text-muted-foreground">{character.species} {character.class}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
        <div className="bg-background/50 rounded p-2 text-center border border-border">
          <div className="text-muted-foreground">Level</div>
          <div className="text-amber-300 font-bold">{character.level || 1}</div>
        </div>
        <div className="bg-background/50 rounded p-2 text-center border border-border">
          <div className="text-muted-foreground flex items-center justify-center gap-0.5"><Heart className="w-3 h-3" /> HP</div>
          <div className="text-rose-300 font-bold">{character.hp}/{character.max_hp}</div>
        </div>
        <div className="bg-background/50 rounded p-2 text-center border border-border">
          <div className="text-muted-foreground">AC</div>
          <div className="text-sky-300 font-bold">{character.ac}</div>
        </div>
      </div>
      {character.background && (
        <p className="text-xs text-muted-foreground mb-1">Background: {character.background}</p>
      )}
      {character.alignment && (
        <p className="text-xs text-muted-foreground mb-3">Alignment: {character.alignment}</p>
      )}
      {character.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3 min-h-[2.5rem]">{character.description}</p>
      )}
      <div className="flex flex-wrap gap-1.5">
        <Link to={`/character/${character.id}`} className="touch-target flex items-center gap-1 px-2.5 py-1.5 bg-amber-900/40 hover:bg-amber-800/50 border border-amber-700/40 rounded text-amber-200 text-xs font-semibold transition-all">
          <Eye className="w-3 h-3" /> View
        </Link>
        <Link to={`/character/${character.id}/edit`} className="touch-target flex items-center gap-1 px-2.5 py-1.5 bg-muted/60 hover:bg-accent/60 border border-border rounded text-foreground text-xs transition-all">
          <Pencil className="w-3 h-3" /> Edit
        </Link>
        <button onClick={() => onDuplicate?.(character)} className="touch-target flex items-center gap-1 px-2.5 py-1.5 bg-muted/60 hover:bg-accent/60 border border-border rounded text-foreground text-xs transition-all">
          <Copy className="w-3 h-3" /> Copy
        </button>
        <button onClick={() => onDelete?.(character)} className="touch-target flex items-center gap-1 px-2.5 py-1.5 bg-red-950/40 hover:bg-red-900/40 border border-red-900/40 rounded text-red-400 text-xs transition-all">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}