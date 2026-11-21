import { Clock, Gauge, Users } from 'lucide-react';
import { DIFFICULTY_LABELS } from '../../../shared/constants';
import type { Difficulty } from '../../../shared/types';
import { formatDuration } from '../lib/format';

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  konnyu: 'bg-sage-50 text-sage-700 ring-sage-200',
  kozepes: 'bg-amber-50 text-amber-700 ring-amber-200',
  nehez: 'bg-rose-50 text-rose-700 ring-rose-200',
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className={`chip ring-1 ${DIFFICULTY_STYLES[difficulty]}`}>
      <Gauge className="size-3.5" />
      {DIFFICULTY_LABELS[difficulty]}
    </span>
  );
}

export function MetaItem({ icon: Icon, children }: { icon: typeof Clock; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-ink-500">
      <Icon className="size-4 text-ink-400" />
      {children}
    </span>
  );
}

export function TimeMeta({ minutes }: { minutes: number }) {
  return <MetaItem icon={Clock}>{formatDuration(minutes)}</MetaItem>;
}

export function ServingsMeta({ servings }: { servings: number }) {
  return <MetaItem icon={Users}>{servings} adag</MetaItem>;
}
