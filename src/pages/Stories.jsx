import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ChevronRight, BookOpen, ScrollText } from 'lucide-react';
import PullToRefresh from '@/components/PullToRefresh';

export default function Stories() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const sts = await base44.entities.SavedStory.filter({});
      setStories(sts || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-amber-900 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={load} className="h-full bg-background text-foreground overscroll-none">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-serif text-amber-200">Saved Stories</h2>
          <Link
            to="/story-recap"
            className="touch-target inline-flex items-center gap-2 px-4 py-2 bg-amber-900/50 hover:bg-amber-800/60 border border-amber-700/50 text-amber-200 rounded-lg text-sm font-semibold transition-all"
          >
            <ScrollText className="w-4 h-4" /> Recap
          </Link>
        </div>
        {stories.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            No saved stories yet. Save a campaign's story to continue it later.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stories.map((s) => (
              <div
                key={s.id}
                className="bg-gradient-to-br from-card/80 to-background/80 border border-amber-900/30 rounded-xl p-5"
              >
                <h3 className="text-lg font-serif text-amber-200 mb-2">{s.name}</h3>
                {s.premise && <p className="text-sm text-muted-foreground mb-3">{s.premise}</p>}
                {s.current_situation && (
                  <p className="text-sm text-muted-foreground italic mb-3">"{s.current_situation}"</p>
                )}
                <Link
                  to={`/new-campaign?story=${s.id}`}
                  className="touch-target inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 text-sm font-semibold"
                >
                  Continue this story <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}