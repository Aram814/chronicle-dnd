import { Home, Users, BookOpen, Settings as SettingsIcon } from 'lucide-react';
import { useTabStack } from '@/components/TabStackProvider';

const TABS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/characters', label: 'Characters', icon: Users, end: false },
  { to: '/stories', label: 'Stories', icon: BookOpen, end: false },
  { to: '/settings', label: 'Settings', icon: SettingsIcon, end: false },
];

export default function BottomTabBar() {
  const { activeTab, switchToTab } = useTabStack();
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-stone-900/95 backdrop-blur border-t border-amber-900/30 safe-bottom"
      aria-label="Main navigation"
      role="navigation"
    >
      <div className="flex justify-around items-stretch max-w-2xl mx-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.to;
          return (
            <button
              key={t.to}
              type="button"
              aria-label={t.label}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => switchToTab(t.to)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-sm transition-colors ${
                isActive ? 'text-amber-300' : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span className="leading-none">{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}