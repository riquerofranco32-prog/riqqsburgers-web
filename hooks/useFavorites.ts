"use client";

import { useState, useEffect, useCallback } from "react";

export type FavoriteProduct = {
  id: string;
  name: string;
  price: number;
  image?: string;
  category_id?: string;
};

export function useFavorites(slug: string) {
  const STORAGE_KEY = `takefyy_favorites_${slug}`;
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setFavorites(JSON.parse(saved));
    } catch {}
    setHydrated(true);
  }, [STORAGE_KEY]);

  // Persist to localStorage after hydration
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {}
  }, [favorites, STORAGE_KEY, hydrated]);

  const isFavorite = useCallback(
    (productId: string) => favorites.some((f) => f.id === productId),
    [favorites],
  );

  const toggleFavorite = useCallback((product: FavoriteProduct) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.id === product.id);
      if (exists) return prev.filter((f) => f.id !== product.id);
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          category_id: product.category_id,
        },
      ];
    });
  }, []);

  const clearFavorites = useCallback(() => setFavorites([]), []);

  return { favorites, isFavorite, toggleFavorite, clearFavorites, hydrated };
}
