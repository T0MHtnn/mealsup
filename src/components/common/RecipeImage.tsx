import { useState } from 'react'
import { Utensils } from 'lucide-react'

const TINTS = ['bg-tint-sage', 'bg-tint-sand', 'bg-tint-clay']

/** Background shown while the photo loads, or instead of it when the recipe has none. */
export function recipeTint(recipe: any) {
  const tags: string[] = recipe?.tags || []
  if (tags.includes('petit-déjeuner')) return 'bg-tint-sand'
  if (tags.includes('dessert') || tags.includes('bbq')) return 'bg-tint-clay'
  return TINTS[(recipe?.title?.length ?? 0) % TINTS.length]
}

/**
 * Photo URL for the wanted size. The built-in recipes' photos are served by the
 * app (/recipes/x.webp) with a small version for lists (/recipes/thumb/x.webp);
 * other photos (uploaded, imported) are used as they are.
 */
export function recipeImageSrc(url: string | null | undefined, size: 'thumb' | 'full'): string | null {
  if (!url) return null
  if (size === 'thumb' && url.startsWith('/recipes/') && !url.startsWith('/recipes/thumb/')) {
    return url.replace('/recipes/', '/recipes/thumb/')
  }
  return url
}

interface RecipeImageProps {
  recipe: any
  size?: 'thumb' | 'full'
  iconSize?: number
}

/** Fills its (relative, sized) parent with the recipe photo, or a tinted placeholder. */
export default function RecipeImage({ recipe, size = 'thumb', iconSize = 26 }: RecipeImageProps) {
  const src = recipeImageSrc(recipe?.image_url, size)
  const [failed, setFailed] = useState<string | null>(null)
  const showImage = src && failed !== src

  return (
    <>
      <div className={`absolute inset-0 flex items-center justify-center ${recipeTint(recipe)}`}>
        <Utensils className="text-primary" size={iconSize} strokeWidth={1.75} />
      </div>
      {showImage && (
        <img
          src={src}
          alt=""
          loading={size === 'thumb' ? 'lazy' : 'eager'}
          decoding="async"
          // photos of imported recipes are hosted by other sites, some refuse to be shown elsewhere
          referrerPolicy="no-referrer"
          onError={() => setFailed(src)}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
    </>
  )
}
