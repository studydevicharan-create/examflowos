import { NavLink, useLocation } from 'react-router-dom';
import { Chrome as Home, BookOpen, Brain, ChartBar as BarChart3, Settings, Vault, User } from 'lucide-react';

const tabs = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/subjects', icon: BookOpen, label: 'Subjects' },
  { to: '/recall', icon: Brain, label: 'Recall' },
  { to: '/vault', icon: Vault, label: 'Vault' },
  { to: '/stats', icon: BarChart3, label: 'Stats' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const location = useLocation();
  if (location.pathname.startsWith('/recall/session')) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[768px] items-center justify-around py-1 pb-[max(8px,env(safe-area-inset-bottom))]">
        {tabs.map(({ to, icon: Icon, label }) => {
          const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-0.5 px-3 transition-colors duration-150 ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
