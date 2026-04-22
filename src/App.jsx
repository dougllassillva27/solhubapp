import { useEffect } from 'react';
import { Settings } from 'lucide-react';
import useStore from './store/useStore';
import { applyTheme } from './themes/themes';
import Clock from './components/Clock';
import SearchBar from './components/SearchBar';
import CategoryFilter from './components/CategoryFilter';
import SiteGrid from './components/SiteGrid';
import NewsFeed from './components/NewsFeed';
import SettingsModal from './components/SettingsModal';
import AddSiteModal from './components/AddSiteModal';
import ConfirmModal from './components/ConfirmModal';
import AIChatModal from './components/AIChatModal';
import StarCanvas from './components/StarCanvas';

export default function App() {
  const { theme, openSettings } = useStore();

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const { autoSync, syncToken, pullFromCloud } = useStore.getState();
    if (autoSync && syncToken) {
      pullFromCloud().catch((err) => console.error('Erro no auto-pull:', err));
    }
  }, []);

  return (
    <div className="min-h-screen relative">
      {/* Star canvas for space theme */}
      <StarCanvas />

      {/* Main content */}
      <div className="relative z-10">
        {/* Settings button */}
        <button
          onClick={openSettings}
          className="fixed top-4 right-4 p-3 bg-card border border-border rounded-xl text-muted hover:text-accent hover:border-accent transition-colors z-20"
          title="Configurações"
        >
          <Settings size={20} />
        </button>

        {/* Main layout */}
        <div className="container mx-auto px-4 flex flex-col min-h-[85vh]">
          <div className="flex-1 flex flex-col pt-8">
            <div className="text-center animate-fadeIn px-4 mt-2 sm:mt-4">
              <h1 className="text-xl md:text-2xl text-text mb-2 tracking-tight">
                <strong className="font-bold">Sol Hub</strong>{' '}
                <span className="opacity-80 font-normal">— sua página inicial pessoal, inteligente e organizada</span>
              </h1>
              <p className="text-sm md:text-base text-text opacity-60 max-w-2xl mx-auto">
                Acesse seus sites, organize por categorias, busque mais rápido, acompanhe notícias e use IA em um só
                lugar.
              </p>
            </div>
            <Clock />
            <SearchBar />
            <CategoryFilter />
            <SiteGrid />
          </div>
        </div>

        {/* News Section (peeking from bottom) */}
        <div className="container mx-auto px-4 pb-16 pt-8 border-t border-border">
          <NewsFeed />
        </div>

        {/* Footer */}
        <footer className="text-center py-6 text-muted text-sm">
          <p>Sol Hub · Sua página inicial personalizada</p>
        </footer>
      </div>

      {/* Modals */}
      <SettingsModal />
      <AddSiteModal />
      <ConfirmModal />
      <AIChatModal />
    </div>
  );
}
