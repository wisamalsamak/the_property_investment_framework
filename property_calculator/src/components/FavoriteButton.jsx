// Reusable star toggle that bookmarks/unbookmarks a listing. Works anywhere the
// app provides a normalized favorite object (see utils/favorites.js).
import React from 'react';
import { useFavorites } from '../lib/FavoritesContext';

const FavoriteButton = ({ favorite, className = '', label = false }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  if (!favorite?.id) return null;
  const active = isFavorite(favorite.id);
  return (
    <button
      type="button"
      className={`fav-star ${active ? 'is-active' : ''} ${className}`.trim()}
      aria-pressed={active}
      title={active ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(favorite);
      }}
    >
      <span className="fav-star-icon" aria-hidden="true">{active ? '★' : '☆'}</span>
      {label && <span className="fav-star-label">{active ? 'Gemerkt' : 'Merken'}</span>}
    </button>
  );
};

export default FavoriteButton;
