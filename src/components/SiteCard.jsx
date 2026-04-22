import { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Pencil, Trash2 } from 'lucide-react';
import useStore from '../store/useStore';
import { getFaviconUrls } from '../utils/favicon';

const getAvatarColor = (name) => {
  const colors = [
    'from-red-400 to-red-600 text-white',
    'from-blue-400 to-blue-600 text-white',
    'from-green-400 to-green-600 text-white',
    'from-yellow-400 to-yellow-600 text-neutral-900',
    'from-purple-400 to-purple-600 text-white',
    'from-pink-400 to-pink-600 text-white',
    'from-indigo-400 to-indigo-600 text-white',
    'from-teal-400 to-teal-600 text-white',
    'from-orange-400 to-orange-600 text-white',
  ];
  let hash = 0;
  if (name) {
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

export default function SiteCard({ site }) {
  const { confirmDeleteSite, openAddSite, setEditingSite, updateSite } = useStore();
  const [showActions, setShowActions] = useState(false);

  const baseUrls = site.customIcon ? [site.customIcon] : getFaviconUrls(site.url);
  const initialUrls =
    site.resolvedIcon && !site.customIcon ? Array.from(new Set([site.resolvedIcon, ...baseUrls])) : baseUrls;

  const [faviconUrls, setFaviconUrls] = useState(initialUrls);
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [imgFailed, setImgFailed] = useState(() => initialUrls.length === 0);

  useEffect(() => {
    const urls = site.customIcon
      ? [site.customIcon]
      : site.resolvedIcon
        ? Array.from(new Set([site.resolvedIcon, ...getFaviconUrls(site.url)]))
        : getFaviconUrls(site.url);
    setFaviconUrls(urls);
    setCurrentUrlIndex(0);
    setImgFailed(urls.length === 0);
  }, [site.url, site.customIcon, site.resolvedIcon]);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: site.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    setEditingSite(site);
    openAddSite();
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    confirmDeleteSite(site.id);
  };

  const handleClick = () => {
    window.open(site.url, '_blank');
  };

  const handleImageError = () => {
    if (currentUrlIndex < faviconUrls.length - 1) {
      setCurrentUrlIndex((prev) => prev + 1);
    } else {
      setImgFailed(true);
    }
  };

  const handleImageLoad = (e) => {
    const img = e.target;
    // Placeholder detectado: globo genérico do DuckDuckGo/fallback tem 16x16 ou menos
    if (img.naturalWidth <= 16 && img.naturalHeight <= 16) {
      handleImageError();
      return;
    }
    const currentUrl = faviconUrls[currentUrlIndex];
    // Só cacheia resolvedIcon de fontes confiáveis (evita envenenar com placeholders 200 OK)
    const isFonteConfiavel =
      currentUrl &&
      (currentUrl.includes('google.com/s2/favicons') ||
        currentUrl.endsWith('/favicon.ico') ||
        currentUrl.endsWith('/favicon.png'));
    if (isFonteConfiavel && site.resolvedIcon !== currentUrl && !site.customIcon) {
      updateSite(site.id, { resolvedIcon: currentUrl }, true);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group flex flex-col items-center"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      {...attributes}
      {...listeners}
    >
      <div onClick={handleClick} className="group/card relative cursor-pointer w-16 h-16 sm:w-24 sm:h-24 mb-3 mx-auto">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-accent/20 rounded-2xl blur-xl opacity-0 group-hover/card:opacity-100 transition-opacity duration-300" />

        {/* Card Body */}
        <div className="relative w-full h-full bg-card/80 backdrop-blur-md border border-border/50 group-hover/card:border-accent/50 rounded-2xl flex items-center justify-center shadow-sm group-hover/card:shadow-md transition-all duration-300 group-hover/card:-translate-y-1 overflow-hidden">
          {!imgFailed ? (
            <img
              src={faviconUrls[currentUrlIndex] || ''}
              alt={site.name}
              className="w-10 h-10 sm:w-14 sm:h-14 object-contain transition-transform duration-300 group-hover/card:scale-110 drop-shadow-md"
              onError={handleImageError}
              onLoad={(e) => handleImageLoad(e)}
              referrerPolicy="no-referrer"
            />
          ) : (
            <span
              className={`flex w-10 h-10 sm:w-14 sm:h-14 items-center justify-center text-xl sm:text-3xl font-bold bg-gradient-to-br ${getAvatarColor(site.name)} rounded-xl transition-transform duration-300 group-hover/card:scale-110 shadow-inner`}
            >
              {site.name?.[0]?.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Name below card */}
      <h3 className="text-xs sm:text-sm font-medium text-muted text-center line-clamp-1 w-full px-1 group-hover:text-text transition-colors drop-shadow-sm">
        {site.name}
      </h3>

      {/* Action Buttons */}
      {showActions && (
        <div className="absolute -top-2 -right-2 flex flex-col gap-1.5 animate-slideIn z-20">
          <button
            onClick={handleEdit}
            className="p-2 bg-card/90 backdrop-blur-sm border border-border rounded-xl text-muted hover:text-accent hover:border-accent transition-all hover:scale-110 shadow-lg"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 bg-card/90 backdrop-blur-sm border border-border rounded-xl text-muted hover:text-red-500 hover:border-red-500 transition-all hover:scale-110 shadow-lg"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
