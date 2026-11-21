import { useState } from 'react';
import type { CategoryRef } from '../../../shared/types';
import { CategoryIcon, categoryTone } from './CategoryIcon';

interface RecipeImageProps {
  imageUrl: string | null;
  title: string;
  category: CategoryRef;
  className?: string;
  iconClassName?: string;
}

/**
 * Recept képe. Ha nincs kép, vagy a kép nem tölthető be (pl. nincs internet),
 * a kategóriának megfelelő, illusztrált színátmenetes helyettesítő jelenik meg.
 */
export function RecipeImage({ imageUrl, title, category, className = '', iconClassName = 'size-14' }: RecipeImageProps) {
  const [failed, setFailed] = useState(false);

  if (imageUrl && !failed) {
    return (
      <img
        src={imageUrl}
        alt={title}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`h-full w-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br ${categoryTone(category.slug)} ${className}`}
      role="img"
      aria-label={title}
    >
      {/* dekoratív körök */}
      <div className="absolute -top-8 -right-8 size-32 rounded-full bg-white/40" />
      <div className="absolute -bottom-10 -left-6 size-28 rounded-full bg-white/30" />
      <CategoryIcon icon={category.icon} className={`relative opacity-80 ${iconClassName}`} />
    </div>
  );
}
