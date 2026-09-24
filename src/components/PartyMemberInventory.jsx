import React from 'react';
import { Image } from '@/components/ui/image';
import { Swords, Shield, Package, Coins } from 'lucide-react';

/**
 * One party member's inventory: equipped gear (weapons + armor) separated
 * from backpack items (character.inventory). Shows gold and a portrait.
 */
export default function PartyMemberInventory({ character }) {
  const weapons = character.weapons || [];
  const armor = character.armor;
  const inventory = character.inventory || [];
  const gold = character.gold || 0;
  const portrait = character.portrait;
  const initial = (character.name || '?')[0]?.toUpperCase();

  return (
    <div className="bg-card/60 border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-background/40">
        {portrait ? (
          <div className="w-12 h-12 rounded-lg overflow-hidden border border-amber-700/40 flex-shrink-0">
            <Image src={portrait} fittingType="fill" alt={`${character.name} portrait`} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-900/50 to-muted border border-amber-700/40 flex items-center justify-center text-xl font-bold text-amber-400 font-display flex-shrink-0">
            {initial}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-amber-200 truncate">{character.name}</h3>
          <p className="text-xs text-muted-foreground truncate">{character.species} {character.class} · Lvl {character.level}</p>
        </div>
        <span className="flex items-center gap-1 text-sm text-amber-300 flex-shrink-0">
          <Coins className="w-4 h-4" />{gold}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
        {/* Equipped */}
        <div className="p-4">
          <h4 className="text-xs uppercase text-amber-600 font-semibold mb-2 flex items-center gap-1.5">
            <Swords className="w-3.5 h-3.5" /> Equipped
          </h4>
          <ul className="space-y-1.5">
            {weapons.length === 0 && !armor && (
              <li className="text-sm text-muted-foreground italic">No gear equipped</li>
            )}
            {weapons.map((w, i) => (
              <li key={`w${i}`} className="flex items-center gap-2 text-sm text-foreground bg-background/50 border border-border rounded px-2 py-1.5">
                <Swords className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <span className="truncate">{w.name || w}</span>
              </li>
            ))}
            {armor && (
              <li className="flex items-center gap-2 text-sm text-foreground bg-background/50 border border-border rounded px-2 py-1.5">
                <Shield className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                <span className="truncate">{armor}</span>
              </li>
            )}
          </ul>
        </div>

        {/* Backpack */}
        <div className="p-4">
          <h4 className="text-xs uppercase text-amber-600 font-semibold mb-2 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5" /> Backpack
          </h4>
          {inventory.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Empty</p>
          ) : (
            <ul className="space-y-1.5">
              {inventory.map((item, i) => (
                <li key={i} className="text-sm text-foreground bg-background/50 border border-border rounded px-2 py-1.5">
                  <div className="flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{item.name || item}</span>
                  </div>
                  {item.description && <p className="text-xs text-muted-foreground mt-0.5 pl-5">{item.description}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}