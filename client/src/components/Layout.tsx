import { BookOpen, Heart, Home, Plus, ShoppingBasket } from 'lucide-react';
import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAppData } from '../lib/AppData';

const NAV = [
  { to: '/', label: 'Főoldal', icon: Home, end: true },
  { to: '/receptek', label: 'Receptek', icon: BookOpen, end: false },
  { to: '/kedvencek', label: 'Kedvencek', icon: Heart, end: false },
  { to: '/bevasarlolista', label: 'Bevásárlólista', icon: ShoppingBasket, end: false },
] as const;

function Badge({ count }: { count: number | undefined }) {
  if (!count) return null;
  return (
    <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-sage-600 px-1.5 text-[11px] leading-5 font-semibold text-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}

export function Layout() {
  const { stats } = useAppData();
  const location = useLocation();

  // Oldalváltáskor a lap tetejére görgetünk.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  const badgeFor = (to: string) =>
    to === '/kedvencek' ? stats?.favoriteCount : to === '/bevasarlolista' ? stats?.shoppingListOpenCount : undefined;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-cream-200/80 bg-cream-50/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="group flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-sage-600 text-white shadow-soft transition group-hover:rotate-[-6deg]">
              <BookOpen className="size-5" />
            </span>
            <span className="font-display text-lg font-semibold text-ink-900">
              Digitális <span className="text-sage-600">receptkönyv</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Fő navigáció">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-sage-100 text-sage-800' : 'text-ink-600 hover:bg-cream-200 hover:text-ink-900'
                  }`
                }
              >
                <Icon className="size-4" />
                {label}
                <Badge count={badgeFor(to)} />
              </NavLink>
            ))}
          </nav>

          <Link to="/receptek/uj" className="btn-primary hidden sm:inline-flex">
            <Plus className="size-4" /> Új recept
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-28 sm:px-6 md:pb-12 lg:px-8">
        <Outlet />
      </main>

      <footer className="hidden border-t border-cream-200 py-6 text-center text-xs text-ink-400 md:block">
        Digitális receptkönyv · Informatika projekt 1 · Dunaújvárosi Egyetem
      </footer>

      {/* Mobil alsó navigáció */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-cream-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        aria-label="Mobil navigáció"
      >
        <div className="grid grid-cols-5">
          {NAV.slice(0, 2).map((item) => (
            <MobileNavItem key={item.to} {...item} badge={badgeFor(item.to)} />
          ))}
          <Link
            to="/receptek/uj"
            className="flex flex-col items-center justify-center"
            aria-label="Új recept hozzáadása"
          >
            <span className="-mt-5 flex size-12 items-center justify-center rounded-2xl bg-sage-600 text-white shadow-lift">
              <Plus className="size-6" />
            </span>
          </Link>
          {NAV.slice(2).map((item) => (
            <MobileNavItem key={item.to} {...item} badge={badgeFor(item.to)} />
          ))}
        </div>
      </nav>
    </div>
  );
}

function MobileNavItem({
  to,
  label,
  icon: Icon,
  end,
  badge,
}: (typeof NAV)[number] & { badge: number | undefined }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
          isActive ? 'text-sage-700' : 'text-ink-500'
        }`
      }
    >
      <Icon className="size-5" />
      <span className="max-w-full truncate px-1">{label === 'Bevásárlólista' ? 'Lista' : label}</span>
      {!!badge && (
        <span className="absolute top-1.5 left-1/2 ml-2 rounded-full bg-sage-600 px-1.5 text-[10px] leading-4 font-semibold text-white">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </NavLink>
  );
}
