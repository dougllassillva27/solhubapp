import { useEffect, useState } from 'react';
import useStore from './store/useStore';
import { applyTheme } from './themes/themes';
import Clock from './components/Clock';
import SearchBar from './components/SearchBar';
import CategoryFilter from './components/CategoryFilter';
import SiteGrid from './components/SiteGrid';
import WeatherWidget from './components/WeatherWidget';
import NotesWidget from './components/NotesWidget';
import BottomSection from './components/BottomSection';
import SettingsModal from './components/SettingsModal';
import AddSiteModal from './components/AddSiteModal';
import ConfirmModal from './components/ConfirmModal';
import AIChatModal from './components/AIChatModal';
import StarCanvas from './components/StarCanvas';
import ImportBookmarksModal from './components/ImportBookmarksModal';
import FloatingMenu from './components/FloatingMenu';

export default function App() {
  const { theme, openSettings, settingsOpen, addSiteOpen, chatOpen, deleteConfirmId, importBookmarksOpen } = useStore();
  const [isFocusMode, setIsFocusMode] = useState(false);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const { autoSync, syncToken, pullFromCloud, carregarFaviconsDb } = useStore.getState();
    if (autoSync && syncToken) {
      pullFromCloud().catch((err) => console.error('Erro no auto-pull:', err));
    }
    // Carrega favicons do banco em paralelo (independente do autoSync)
    carregarFaviconsDb();

    // Detecta se foi aberto via PWA (tela inicial do celular) ou com parâmetro de foco
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone ||
      new URLSearchParams(window.location.search).get('focus') === 'true'
    ) {
      setIsFocusMode(true);
    }
  }, []);

  useEffect(() => {
    if (settingsOpen || addSiteOpen || chatOpen || importBookmarksOpen || deleteConfirmId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [settingsOpen, addSiteOpen, chatOpen, importBookmarksOpen, deleteConfirmId]);

  return (
    <div className="min-h-screen relative">
      {/* Star canvas for space theme */}
      <StarCanvas />

      {/* Main content */}
      <div className="relative z-10">
        {/* Main layout */}
        <div
          className={`container mx-auto px-4 flex flex-col ${isFocusMode ? 'min-h-screen justify-center' : 'min-h-[85vh]'}`}
        >
          <div className={`flex-1 flex flex-col ${isFocusMode ? 'justify-center mb-20' : 'pt-8'}`}>
            {!isFocusMode && (
              <>
                <div className="text-center animate-fadeIn px-4 mt-2 sm:mt-4">
                  <h1 className="text-xl md:text-2xl text-text mb-2 tracking-tight">
                    <strong className="font-bold">Hubly</strong>{' '}
                    <span className="opacity-80 font-normal">
                      — sua página inicial pessoal, inteligente e organizada
                    </span>
                  </h1>
                  <p className="text-sm md:text-base text-text opacity-60 max-w-2xl mx-auto">
                    Acesse seus sites, organize por categorias, busque mais rápido, acompanhe notícias e use IA em um só
                    lugar.
                  </p>
                </div>

                <div className="w-full max-w-[1600px] mx-auto px-4 mt-6 mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
                    <div className="order-2 md:order-1 flex justify-center md:justify-start w-full">
                      <WeatherWidget />
                    </div>
                    <div className="order-1 md:order-2 flex justify-center w-full">
                      <Clock />
                    </div>
                    <div className="order-3 md:order-3 flex justify-center md:justify-end w-full h-full">
                      <NotesWidget />
                    </div>
                  </div>
                </div>
              </>
            )}

            <SearchBar />

            {!isFocusMode && (
              <>
                <CategoryFilter />
                <SiteGrid />
              </>
            )}
          </div>
        </div>

        {!isFocusMode && (
          <>
            <BottomSection />
            <footer className="text-center py-6 text-muted text-sm">
              <p>Hubly · Sua página inicial personalizada</p>
            </footer>
          </>
        )}
      </div>

      {!isFocusMode && <FloatingMenu />}

      {/* Modals */}
      <SettingsModal />
      <AddSiteModal />
      <ConfirmModal />
      <AIChatModal />
      <ImportBookmarksModal />
    </div>
  );
}
