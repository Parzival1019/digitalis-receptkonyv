import { Heart } from 'lucide-react';
import { useState } from 'react';
import { api, errorMessage } from '../lib/api';
import { useAppData } from '../lib/AppData';
import { useToast } from './Toast';

interface FavoriteButtonProps {
  recipeId: number;
  isFavorite: boolean;
  onChange?: (isFavorite: boolean) => void;
  variant?: 'icon' | 'full';
}

/** Kedvenc jelölése / eltávolítása – optimista frissítéssel, hiba esetén visszaállítással. */
export function FavoriteButton({ recipeId, isFavorite, onChange, variant = 'icon' }: FavoriteButtonProps) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const { refreshStats } = useAppData();

  async function toggle(e: React.MouseEvent) {
    e.preventDefault(); // a kártyán belül ne navigáljon a recept oldalára
    e.stopPropagation();
    if (busy) return;
    const next = !isFavorite;
    setBusy(true);
    onChange?.(next);
    try {
      await api.setFavorite(recipeId, next);
      toast.success(next ? 'Hozzáadva a kedvencekhez.' : 'Eltávolítva a kedvencek közül.');
      refreshStats();
    } catch (err) {
      onChange?.(!next);
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const label = isFavorite ? 'Eltávolítás a kedvencek közül' : 'Hozzáadás a kedvencekhez';

  if (variant === 'full') {
    return (
      <button
        onClick={toggle}
        disabled={busy}
        aria-pressed={isFavorite}
        className={isFavorite ? 'btn border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100' : 'btn-secondary'}
      >
        <Heart className={`size-4 transition ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
        {isFavorite ? 'Kedvenc' : 'Kedvencekhez'}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-pressed={isFavorite}
      aria-label={label}
      title={label}
      className="flex size-10 items-center justify-center rounded-full bg-white/90 shadow-soft backdrop-blur transition hover:scale-110 active:scale-95"
    >
      <Heart
        className={`size-5 transition ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-ink-600'}`}
      />
    </button>
  );
}
