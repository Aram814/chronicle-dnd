import { Link } from 'react-router-dom';
import { ArrowLeft, Swords, Mail } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-stone-950 text-foreground flex flex-col">
      <header className="safe-top bg-stone-950/90 backdrop-blur border-b border-amber-900/40 z-30 flex-shrink-0">
        <div className="flex items-center gap-3 px-4 h-14 max-w-2xl mx-auto">
          <Link to="/login" aria-label="Back to login" className="text-muted-foreground hover:text-amber-300 flex-shrink-0 p-3">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Swords className="w-5 h-5 text-amber-500 flex-shrink-0" aria-hidden="true" />
            <h1 className="font-serif text-amber-200 flex-1 truncate text-lg">About Chronicle D&amp;D</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto overscroll-none">
        <article className="max-w-2xl mx-auto px-5 py-8 space-y-6">
          <section className="space-y-4">
            <p className="text-sm uppercase tracking-widest text-amber-600 font-semibold">The AI Dungeon Master</p>
            <h2 className="font-serif text-3xl text-amber-200">A full campaign, run by an AI that knows the rules.</h2>
            <div className="space-y-4 text-foreground/90 leading-relaxed">
              <p>
                Chronicle D&amp;D is an AI-powered Dungeon Master that runs complete, persistent Dungeons &amp; Dragons
                5th edition campaigns. Instead of a chatbot that merely pretends to be a DM, Chronicle maintains a real
                game world: a character sheet with tracked HP, AC, ability scores, inventory, and spells; a living cast
                of NPCs with portraits, dispositions, and interaction histories; a bestiary of monsters encountered; a
                world map with discovered and undiscovered locations; and an active quest journal. Every roll is
                resolved by a rules engine, never invented by the AI, so success and failure are honest.
              </p>
              <p>
                It is built for the player who has no table — the solo adventurer who wants a genuine campaign without
                scheduling four friends, the aspiring Dungeon Master who wants to see how an AI weaves a story, and
                any group that needs a DM on demand. Start from a prebuilt adventure, describe a custom world and let
                the AI help shape it, or upload your own campaign materials. Multiplayer lets you invite friends to a
                shared session, each with their own character, while the AI DM narrates for the whole party.
              </p>
              <p>
                Chronicle D&amp;D is built on the Base44 platform by an independent developer who loves tabletop
                roleplaying and wanted a faithful, rules-respecting AI companion for the times no human DM is
                available. The dark fantasy interface, procedural sound, and illustrated maps and portraits are all
                designed to pull you into the story. Your saga is saved between sessions, so the world remembers what
                you did.
              </p>
            </div>
          </section>

          <section className="pt-4 border-t border-amber-900/30">
            <div className="flex flex-wrap gap-3">
              <Link to="/login" className="touch-target inline-flex items-center gap-2 px-5 py-2.5 bg-amber-700 hover:bg-amber-600 text-amber-50 rounded-lg font-semibold transition-all">
                Begin Your Saga
              </Link>
              <Link to="/contact" className="touch-target inline-flex items-center gap-2 px-5 py-2.5 border border-amber-800/50 text-amber-200 hover:bg-amber-950/40 rounded-lg font-semibold transition-all">
                <Mail className="w-4 h-4" /> Contact
              </Link>
            </div>
          </section>
        </article>
      </main>
    </div>
  );
}