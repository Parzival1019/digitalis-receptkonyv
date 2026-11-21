import { AlertCircle, Loader2, RefreshCw, SearchX, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function Spinner({ label = 'Betöltés…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-ink-500" role="status">
      <Loader2 className="size-5 animate-spin text-sage-500" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

/** Kártyarács betöltés közbeni „csontváz” megjelenítése. */
export function RecipeGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Receptek betöltése">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="card overflow-hidden">
          <div className="aspect-[4/3] animate-pulse bg-cream-200" />
          <div className="space-y-3 p-5">
            <div className="h-3 w-20 animate-pulse rounded bg-cream-200" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-cream-200" />
            <div className="h-3 w-full animate-pulse rounded bg-cream-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon = SearchX, title, description, action }: EmptyStateProps) {
  return (
    <div className="card flex animate-fade-in flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-sage-50 text-sage-600">
        <Icon className="size-7" />
      </div>
      <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
      {description && <p className="mt-1.5 max-w-md text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="card flex animate-fade-in flex-col items-center border-red-100 px-6 py-12 text-center" role="alert">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
        <AlertCircle className="size-7" />
      </div>
      <h3 className="text-lg font-semibold text-ink-900">Hiba történt a betöltés során</h3>
      <p className="mt-1.5 max-w-md text-sm text-ink-500">{message}</p>
      {onRetry && (
        <button className="btn-secondary mt-6" onClick={onRetry}>
          <RefreshCw className="size-4" /> Újrapróbálás
        </button>
      )}
    </div>
  );
}
