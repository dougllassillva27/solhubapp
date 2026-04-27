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
  const { theme, settingsOpen, addSiteOpen, chatOpen, deleteConfirmId, importBookmarksOpen } = useStore();

  const [isFocusMode, setIsFocusMode] = useState(false);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const { autoSync, syncToken, pullFromCloud, carregarFaviconsDb } = useStore.getState();

    if (autoSync && syncToken) {
      pullFromCloud().catch((erro) => console.error('Erro no auto-pull:', erro));
    }

    carregarFaviconsDb();

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
      return;
    }

    document.body.style.overflow = 'unset';
  }, [settingsOpen, addSiteOpen, chatOpen, importBookmarksOpen, deleteConfirmId]);

  return (
    <div className="min-h-screen relative">
      <StarCanvas />

      <div className="relative z-10">
        <div
          className={`container mx-auto px-4 flex flex-col ${
            isFocusMode ? 'min-h-screen justify-center' : 'min-h-[85vh]'
          }`}
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

                <div className="relative w-screen left-1/2 right-1/2 -mx-[50vw] mt-6 mb-8">
                  <div className="md:hidden flex flex-col items-center gap-4 px-4">
                    <WeatherWidget />
                    <Clock />
                    <NotesWidget />
                  </div>

                  <div className="hidden md:block relative h-[220px]">
                    <div className="absolute left-1/4 top-1/2 -translate-x-1/2 -translate-y-1/2">
                      <WeatherWidget />
                    </div>

                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                      <Clock />
                    </div>

                    <div className="absolute left-3/4 top-1/2 -translate-x-1/2 -translate-y-1/2">
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

      <SettingsModal />
      <AddSiteModal />
      <ConfirmModal />
      <AIChatModal />
      <ImportBookmarksModal />
    </div>
  );
}
