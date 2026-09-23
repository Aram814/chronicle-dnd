import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Swords, Mail, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const CONTACT_EMAIL = 'support@chroniclednd.base44.app';

export default function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const subject = encodeURIComponent(`Chronicle D&D message from ${name || 'a visitor'}`);
    const body = encodeURIComponent(`${message}\n\n— ${name || ''}${email ? `\nReply to: ${email}` : ''}`);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen bg-stone-950 text-foreground flex flex-col">
      <header className="safe-top bg-stone-950/90 backdrop-blur border-b border-amber-900/40 z-30 flex-shrink-0">
        <div className="flex items-center gap-3 px-4 h-14 max-w-2xl mx-auto">
          <Link to="/login" aria-label="Back to login" className="text-muted-foreground hover:text-amber-300 flex-shrink-0 p-3">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Swords className="w-5 h-5 text-amber-500 flex-shrink-0" aria-hidden="true" />
            <h1 className="font-serif text-amber-200 flex-1 truncate text-lg">Contact</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto overscroll-none">
        <div className="max-w-2xl mx-auto px-5 py-8 space-y-6">
          <section className="space-y-2">
            <h2 className="font-serif text-2xl text-amber-200">Send a raven</h2>
            <p className="text-foreground/80 text-sm">
              Questions, feedback, or tales of your campaign? Reach out and we'll answer as soon as we can.
            </p>
          </section>

          <section className="rounded-xl border border-amber-900/40 bg-stone-950/60 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-950/50 border border-amber-800/40 flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-widest text-amber-600 font-semibold">Email</p>
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-foreground hover:text-amber-300 break-all">
                {CONTACT_EMAIL}
              </a>
            </div>
          </section>

          <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-amber-900/40 bg-stone-950/60 p-5">
            <p className="text-sm text-foreground/80">
              Fill this out and your email client will open with the message ready to send.
            </p>
            <div className="space-y-2">
              <Label htmlFor="name">Your name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Aldric the Bold"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Your email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what's on your mind..."
                rows={5}
              />
            </div>
            <Button type="submit" className="touch-target w-full h-12 font-medium">
              <Send className="w-4 h-4 mr-2" /> Open Email Client
            </Button>
          </form>

          <div className="pt-2">
            <Link to="/login" className="text-sm text-amber-200/70 hover:text-amber-300 hover:underline">
              ← Back to login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}