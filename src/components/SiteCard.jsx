import { useState, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Pencil, Trash2 } from 'lucide-react';
import useStore from '../store/useStore';
import { getFaviconUrls, getDomain } from '../utils/favicon';
import { salvarFaviconDb } from '../utils/faviconDb';

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
  return colors[Math.abs(hash) % colors.length];
};

export default function SiteCard({ site, disableDrag }) {
  const { confirmDeleteSite, openAddSite, setEditingSite, setFaviconDb, syncToken, faviconsDb, registerSiteVisit } =
    useStore();
  const [showActions, setShowActions] = useState(false);

  const domain = getDomain(site.url);
  const dbUrl = faviconsDb[domain];

  // Calcula a fila de URLs: favicon do banco primeiro (se existir), depois cadeia de fallback
  const calcularUrls = (dbFavicon) => {
    if (site.customIcon) return [site.customIcon];
    const fallbacks = getFaviconUrls(site.url);
    return dbFavicon ? [dbFavicon, ...fallbacks] : fallbacks;
  };

  const [faviconUrls, setFaviconUrls] = useState(() => calcularUrls(dbUrl));
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [imgFailed, setImgFailed] = useState(() => calcularUrls(dbUrl).length === 0);

  const timerRef = useRef(null);
  const isLongPressRef = useRef(false);
  const isTouchRef = useRef(false);

  // Reage a mudança de URL, customIcon ou favicon do banco (carregado assincronamente)
  useEffect(() => {
    const urls = calcularUrls(dbUrl);
    setFaviconUrls(urls);
    setCurrentUrlIndex(0);
    setImgFailed(urls.length === 0);
  }, [site.url, site.customIcon, dbUrl]);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: site.id,
    disabled: disableDrag,
  });

  useEffect(() => {
    if (isDragging) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setShowActions(false);
    }
  }, [isDragging]);

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

  const handleMouseEnter = () => {
    if (isTouchRef.current || isDragging) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setShowActions(true);
    }, 1000);
  };

  const handleMouseLeave = () => {
    if (isTouchRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowActions(false);
  };

  const handleTouchStart = () => {
    if (isDragging) return;
    isTouchRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    isLongPressRef.current = false;
    timerRef.current = setTimeout(() => {
      setShowActions(true);
      isLongPressRef.current = true;
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    }, 500);
  };

  const handleTouchEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleTouchMove = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleContextMenu = (e) => {
    if (isTouchRef.current) {
      e.preventDefault();
    }
  };

  const handleClick = (e) => {
    if (isLongPressRef.current) {
      e.preventDefault();
      e.stopPropagation();
      isLongPressRef.current = false;
      return;
    }
    if (showActions && isTouchRef.current) {
      e.preventDefault();
      e.stopPropagation();
      setShowActions(false);
      return;
    }
    registerSiteVisit(site.id);
    window.open(site.url, '_blank');
  };

  const handleImageError = () => {
    if (currentUrlIndex < faviconUrls.length - 1) {
      setCurrentUrlIndex((prev) => prev + 1);
    } else {
      setImgFailed(true);
    }
  };

  const handleImageLoad = () => {
    const currentUrl = faviconUrls[currentUrlIndex];
    // Só persiste no banco se a fonte for confiável (Google s2 ou origin/favicon.ico)
    const isFonteConfiavel =
      currentUrl &&
      (currentUrl.includes('google.com/s2/favicons') ||
        currentUrl.endsWith('/favicon.ico') ||
        currentUrl.endsWith('/favicon.png'));

    if (isFonteConfiavel && syncToken && faviconsDb[domain] !== currentUrl) {
      setFaviconDb(domain, currentUrl); // atualiza cache em memória imediatamente
      salvarFaviconDb(syncToken, domain, currentUrl); // persiste no banco (fire-and-forget)
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group flex flex-col items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onContextMenu={handleContextMenu}
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
              onLoad={handleImageLoad}
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
            className="p-2 bg-amber-500 border border-amber-600 rounded-xl text-white hover:bg-amber-600 transition-all hover:scale-110 shadow-lg"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={handleDelete}
            className="p-2 bg-red-500 border border-red-600 rounded-xl text-white hover:bg-red-600 transition-all hover:scale-110 shadow-lg"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
