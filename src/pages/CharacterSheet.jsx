import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Heart, Shield, Star, Coins, Sword, Sparkles, Pencil } from 'lucide-react';
import { abilityModifier, ABILITY_LABELS, SKILL_LABELS, SKILLS, proficiencyBonusForLevel } from '@/lib/dndClient';
import ScreenHeader from '@/components/ScreenHeader';
import { Image } from '@/components/ui/image';

export default function CharacterSheet() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [character, setCharacter] = useState(null);

  useEffect(() => {
    if (id) load();
  }, [id]);

  const load = async () => {
    if (id === 'new') { navigate('/character/new/edit', { replace: true }); return; }
    try {
      const c = await base44.entities.Character.get(id);
      setCharacter(c);
    } catch (e) {
      navigate('/characters', { replace: true });
    }
  };

  if (!character) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-amber-900 border-t-amber-500 rounded-full animate-spin"></div></div>;

  const scores = character.ability_scores || {};
  const profBonus = character.proficiency_bonus || proficiencyBonusForLevel(character.level);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ScreenHeader
        title="Character Sheet"
        actions={
          <Link to={`/character/${id}/edit`} className="touch-target flex items-center gap-2 px-4 py-2 bg-amber-700 hover:bg-amber-600 text-amber-50 rounded-lg text-sm font-semibold"><Pencil className="w-4 h-4" /> Edit</Link>
        }
      />
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header card */}
        <div className="bg-gradient-to-br from-card/80 to-background/80 border border-amber-900/30 rounded-xl p-6 mb-4">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-gradient-to-br from-amber-900/50 to-muted border border-amber-700/40 flex items-center justify-center text-3xl font-bold text-amber-400 font-serif flex-shrink-0">
              {character.portrait ? (
                <Image src={character.portrait} alt={character.name || 'Character portrait'} fittingType="fill" className="w-full h-full" />
              ) : (
                character.name?.[0]?.toUpperCase()
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-serif text-amber-200">{character.name}</h2>
              <p className="text-muted-foreground">{character.species} {character.class} {character.subclass}</p>
              <p className="text-sm text-muted-foreground">Level {character.level} · {character.background} · {character.alignment}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <Stat label="HP" value={`${character.hp}/${character.max_hp}`} icon={<Heart className="w-3 h-3" />} color="text-rose-300" />
            <Stat label="AC" value={character.ac} icon={<Shield className="w-3 h-3" />} color="text-sky-300" />
            <Stat label="Speed" value={character.speed} color="text-foreground" />
            <Stat label="Gold" value={character.gold || 0} icon={<Coins className="w-3 h-3" />} color="text-amber-300" />
          </div>
        </div>

        {/* Ability Scores */}
        <Section title="Ability Scores">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {Object.entries(ABILITY_LABELS).map(([key, label]) => {
              const score = scores[key] || 10;
              const mod = abilityModifier(score);
              return (
                <div key={key} className="bg-background/60 border border-border rounded-lg p-3 text-center">
                  <div className="text-xs text-muted-foreground uppercase" title={label}>{label.slice(0, 3)}</div>
                  <>
                    <div className="text-2xl font-bold text-amber-200 mt-1">{score}</div>
                    <div className="text-sm text-muted-foreground">{mod >= 0 ? `+${mod}` : mod}</div>
                  </>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Skills */}
        <Section title="Skills">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(SKILLS).map(([key, ability]) => {
              const mod = abilityModifier(scores[ability] || 10);
              const proficient = (character.proficiencies || []).includes(key) || (character.proficiencies || []).includes(SKILL_LABELS[key]);
              const total = mod + (proficient ? profBonus : 0);
              return (
                <div key={key} className="flex items-center justify-between bg-background/50 border border-border rounded px-3 py-1.5 text-sm">
                  <span className="flex items-center gap-2">
                    {proficient && <Star className="w-3 h-3 text-amber-500" />}
                    <span className="text-foreground">{SKILL_LABELS[key]}</span>
                  </span>
                  <span className="text-amber-300 font-semibold">{total >= 0 ? `+${total}` : total}</span>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Saving Throws */}
        <Section title="Saving Throws">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(ABILITY_LABELS).map(([key, label]) => {
              const mod = abilityModifier(scores[key] || 10);
              const proficient = (character.saving_throws || []).includes(key) || (character.saving_throws || []).includes(label);
              const total = mod + (proficient ? profBonus : 0);
              return (
                <div key={key} className="flex items-center justify-between bg-background/50 border border-border rounded px-3 py-1.5 text-sm">
                  <span className="flex items-center gap-2">
                    {proficient && <Star className="w-3 h-3 text-amber-500" />}
                    <span className="text-foreground">{label}</span>
                  </span>
                  <span className="text-amber-300 font-semibold">{total >= 0 ? `+${total}` : total}</span>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Combat */}
        <Section title="Combat">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm text-amber-600 mb-2 flex items-center gap-1"><Sword className="w-3 h-3" /> Weapons</h4>
              {(character.weapons || []).length === 0 ? <p className="text-xs text-muted-foreground">None</p> : (
                <ul className="space-y-1">
                  {character.weapons.map((w, i) => <li key={i} className="text-sm text-foreground">{w.name || w}{w.damage && <span className="text-xs text-muted-foreground"> · {w.damage}</span>}</li>)}
                </ul>
              )}
              {character.armor && <p className="text-sm text-foreground mt-2">Armor: {character.armor}</p>}
            </div>
            <div>
              <h4 className="text-sm text-amber-600 mb-2">Conditions</h4>
              {(character.conditions || []).length === 0 ? <p className="text-xs text-muted-foreground">None</p> : (
                <div className="flex flex-wrap gap-1">
                  {character.conditions.map((c, i) => <span key={i} className="text-xs px-2 py-1 bg-amber-900/30 text-amber-300 border border-amber-800/40 rounded">{c}</span>)}
                </div>
              )}
            </div>
          </div>
        </Section>

        {/* Inventory */}
        <Section title="Inventory & Spells">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm text-amber-600 mb-2">Items</h4>
              {(character.inventory || []).length === 0 ? <p className="text-xs text-muted-foreground">Empty</p> : (
                <ul className="space-y-1">
                  {character.inventory.map((item, i) => <li key={i} className="text-sm text-foreground">{item.name || item}</li>)}
                </ul>
              )}
            </div>
            <div>
              <h4 className="text-sm text-amber-600 mb-2 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Spells</h4>
              {(character.spells || []).length === 0 ? <p className="text-xs text-muted-foreground">None</p> : (
                <ul className="space-y-1">
                  {character.spells.map((s, i) => <li key={i} className="text-sm text-foreground">{s.name || s}{s.level && <span className="text-xs text-muted-foreground"> · Lvl {s.level}</span>}</li>)}
                </ul>
              )}
            </div>
          </div>
        </Section>

        {/* Background */}
        <Section title="Background & Personality">
          <div className="space-y-3 text-sm">
            {character.personality && <Field label="Personality" value={character.personality} />}
            {character.ideals && <Field label="Ideals" value={character.ideals} />}
            {character.bonds && <Field label="Bonds" value={character.bonds} />}
            {character.flaws && <Field label="Flaws" value={character.flaws} />}
            {character.backstory && <Field label="Backstory" value={character.backstory} />}
            {character.appearance && <Field label="Appearance" value={character.appearance} />}
            {character.goals && <Field label="Goals" value={character.goals} />}
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-gradient-to-br from-card/60 to-background/60 border border-amber-900/20 rounded-xl p-5 mb-4">
      <h3 className="font-serif text-amber-200 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Stat({ label, value, icon, color }) {
  return (
    <div className="bg-background/60 border border-border rounded-lg p-3 text-center">
      <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">{icon}{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <span className="text-amber-600 font-semibold">{label}: </span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}