import { create } from 'zustand';
import { storage, defaultSites, defaultCategories, defaultNewsTopics } from '../utils/storage';
import { applyTheme } from '../themes/themes';
import { encrypt, decrypt } from '../utils/crypto';
import { getDomain } from '../utils/favicon';
import { carregarFaviconsDb as fetchFaviconsDb, deletarFaviconDb } from '../utils/faviconDb';

const searchProviders = [
  { name: 'Google', url: 'https://google.com/search?q=', color: '#4285F4', icon: 'G', type: 'search' },
  // { name: 'Bing', url: 'https://bing.com/search?q=', color: '#00B4F0', icon: 'B', type: 'search' },
  { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=', color: '#DE5833', icon: 'D', type: 'search' },
  { name: 'YouTube', url: 'https://youtube.com/results?search_query=', color: '#FF0000', icon: 'Y', type: 'search' },
  // { name: 'Brave', url: 'https://search.brave.com/search?q=', color: '#FB542B', icon: 'Br', type: 'search' },
  { name: 'Ecosia', url: 'https://ecosia.org/search?q=', color: '#4A9C5D', icon: 'E', type: 'search' },
  { name: 'AI Chat', url: '', color: '#00D4AA', icon: 'AI', type: 'ai' },
].filter(Boolean);

const getSessionCategory = () => {
  try {
    return sessionStorage.getItem('sp_active_category');
  } catch {
    return null;
  }
};

const setSessionCategory = (cat) => {
  try {
    sessionStorage.setItem('sp_active_category', cat);
  } catch {}
};

const useStore = create((set, get) => ({
  // Sites
  sites: storage.get('sites') || defaultSites,

  // Tela Inicial Configs
  homeSortMethod: storage.get('home_sort_method') || 'manual',

  // Favicons do banco (domain -> favicon_url)
  faviconsDb: {},

  // Categories
  categories: storage.get('categories') || defaultCategories,
  defaultCategory: storage.get('default_category') || 'all',
  activeCategory: getSessionCategory() || storage.get('default_category') || 'all',

  // Theme
  theme: storage.get('theme') || 'minimal-dark',

  // Search
  searchProvider: Math.min(storage.get('search_provider') || 0, searchProviders.length - 1),
  searchQuery: '',

  // News
  newsProvider: storage.get('news_provider') || 'rss',
  newsApiKey: storage.get('news_apikey') || '',
  newsTopics: storage.get('news_topics') || defaultNewsTopics,
  newsItems: [],
  newsLoading: false,

  // AI Chat
  openAiApiKey: decrypt(storage.get('openai_apikey'), storage.get('sync_token') || '') || '',
  chatOpen: false,
  chatMessages: [],
  chatLoading: false,
  initialChatMessage: null,

  // UI State
  settingsOpen: false,
  addSiteOpen: false,
  editingSite: null,
  deleteConfirmId: null,

  // Cloud Sync
  syncToken: storage.get('sync_token') || '',
  autoSync: storage.get('auto_sync') || false,

  // Widgets
  notesContent: storage.get('notes_content') || '',
  weatherCity: storage.get('weather_city') || '',

  // Bookmarks Import
  importBookmarksOpen: false,
  pendingBookmarks: [],

  // Actions
  setSites: (sites) => {
    storage.set('sites', sites);
    set({ sites });
    get().triggerAutoSync();
  },

  addSite: (site) => {
    const sites = get().sites;
    const newSite = {
      ...site,
      id: Date.now().toString(),
      order: sites.length,
    };
    const updatedSites = [...sites, newSite];
    storage.set('sites', updatedSites);
    set({ sites: updatedSites });
    get().triggerAutoSync();
  },

  updateSite: (id, updates, skipSync = false) => {
    const siteAtual = get().sites.find((s) => s.id === id);
    const sites = get().sites.map((s) => (s.id === id ? { ...s, ...updates } : s));
    storage.set('sites', sites);
    set({ sites });
    // Se URL mudou, gerencia favicon do domínio antigo
    if (updates.url && siteAtual && updates.url !== siteAtual.url) {
      const dominioAntigo = getDomain(siteAtual.url);
      const dominioNovo = getDomain(updates.url);
      if (dominioAntigo !== dominioNovo) {
        const token = get().syncToken;
        const aindaUsado = sites.some((s) => s.id !== id && getDomain(s.url) === dominioAntigo);
        if (!aindaUsado && token) {
          deletarFaviconDb(token, dominioAntigo).catch(() => {});
        }
        // Remove domínio antigo do cache em memória para forar re-resolução
        const faviconsDb = { ...get().faviconsDb };
        delete faviconsDb[dominioAntigo];
        set({ faviconsDb });
      }
    }
    if (!skipSync) get().triggerAutoSync();
  },

  removeSite: (id) => {
    const siteRemovido = get().sites.find((s) => s.id === id);
    const sites = get().sites.filter((s) => s.id !== id);
    storage.set('sites', sites);
    set({ sites });
    // Remove favicon do banco se o domínio não for mais usado por outros sites
    if (siteRemovido) {
      const dominio = getDomain(siteRemovido.url);
      const aindaUsado = sites.some((s) => getDomain(s.url) === dominio);
      const token = get().syncToken;
      if (!aindaUsado && token) {
        deletarFaviconDb(token, dominio).catch(() => {});
        const faviconsDb = { ...get().faviconsDb };
        delete faviconsDb[dominio];
        set({ faviconsDb });
      }
    }
    get().triggerAutoSync();
  },

  setPendingBookmarks: (bookmarks) => set({ pendingBookmarks: bookmarks }),
  openImportBookmarks: () => set({ importBookmarksOpen: true }),
  closeImportBookmarks: () => set({ importBookmarksOpen: false, pendingBookmarks: [] }),

  importBookmarksBatch: (bookmarksToImport, targetCategory) => {
    const state = get();
    let finalCategory = targetCategory.trim();
    if (!finalCategory) finalCategory = 'all';

    let updatedCategories = [...state.categories];
    if (finalCategory !== 'all' && !updatedCategories.includes(finalCategory)) {
      updatedCategories.push(finalCategory);
      storage.set('categories', updatedCategories);
    }

    const currentSitesLength = state.sites.length;
    const newSites = bookmarksToImport.map((bm, index) => ({
      id: Date.now().toString() + index,
      name: bm.name,
      url: bm.url,
      customIcon: '',
      category: finalCategory,
      order: currentSitesLength + index,
    }));

    const updatedSites = [...state.sites, ...newSites];
    storage.set('sites', updatedSites);

    set({
      categories: updatedCategories,
      sites: updatedSites,
      importBookmarksOpen: false,
      pendingBookmarks: [],
    });
    get().triggerAutoSync();
  },

  reorderSites: (newOrder) => {
    const currentSites = [...get().sites].sort((a, b) => a.order - b.order);
    const reorderedVisibleSites = newOrder.map((id) => currentSites.find((site) => site.id === id)).filter(Boolean);

    if (reorderedVisibleSites.length === 0) return;

    const reorderedVisibleIds = new Set(newOrder);
    let reorderedIndex = 0;

    const mergedSites = currentSites.map((site) => {
      if (!reorderedVisibleIds.has(site.id)) {
        return site;
      }

      const reorderedSite = reorderedVisibleSites[reorderedIndex];
      reorderedIndex += 1;
      return reorderedSite;
    });

    const sites = mergedSites.map((site, index) => ({
      ...site,
      order: index,
    }));

    storage.set('sites', sites);
    set({ sites });
    get().triggerAutoSync();
  },

  setCategories: (categories) => {
    storage.set('categories', categories);
    set({ categories });
    get().triggerAutoSync();
  },

  reorderCategories: (newOrder) => {
    storage.set('categories', newOrder);
    set({ categories: newOrder });
    get().triggerAutoSync();
  },

  setDefaultCategory: (category) => {
    storage.set('default_category', category);
    set({ defaultCategory: category });
  },

  addCategory: (category) => {
    const categories = get().categories;
    if (!categories.includes(category)) {
      const updated = [...categories, category];
      storage.set('categories', updated);
      set({ categories: updated });
      get().triggerAutoSync();
    }
  },

  updateCategory: (oldCategory, newCategory) => {
    const categories = get().categories;
    if (oldCategory === newCategory) return;
    if (categories.includes(newCategory)) return;

    const updatedCategories = categories.map((c) => (c === oldCategory ? newCategory : c));
    storage.set('categories', updatedCategories);

    const updatedSites = get().sites.map((s) => (s.category === oldCategory ? { ...s, category: newCategory } : s));
    storage.set('sites', updatedSites);

    const updates = { categories: updatedCategories, sites: updatedSites };

    if (get().defaultCategory === oldCategory) {
      storage.set('default_category', newCategory);
      updates.defaultCategory = newCategory;
    }
    if (get().activeCategory === oldCategory) {
      setSessionCategory(newCategory);
      updates.activeCategory = newCategory;
    }

    set(updates);
    get().triggerAutoSync();
  },

  removeCategory: (category) => {
    const categories = get().categories.filter((c) => c !== category);
    storage.set('categories', categories);
    set({ categories });

    // Move sites from removed category to 'all'
    const sites = get().sites.map((s) => (s.category === category ? { ...s, category: 'all' } : s));
    storage.set('sites', sites);
    set({ sites });

    if (get().defaultCategory === category) {
      get().setDefaultCategory('all');
    }
    if (get().activeCategory === category) {
      get().setActiveCategory('all');
    }
    get().triggerAutoSync();
  },

  setActiveCategory: (category) => {
    setSessionCategory(category);
    set({ activeCategory: category });
  },

  setTheme: (theme) => {
    storage.set('theme', theme);
    applyTheme(theme);
    set({ theme });
  },

  // Favicons do banco
  setFaviconDb: (domain, url) => {
    set((state) => ({ faviconsDb: { ...state.faviconsDb, [domain]: url } }));
  },

  carregarFaviconsDb: async () => {
    const token = get().syncToken;
    if (!token) return;
    const favicons = await fetchFaviconsDb(token);
    set({ faviconsDb: favicons });
  },

  setSearchProvider: (provider) => {
    storage.set('search_provider', provider);
    set({ searchProvider: provider });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  cycleSearchProvider: () => {
    const current = get().searchProvider;
    const next = (current + 1) % searchProviders.length;
    storage.set('search_provider', next);
    set({ searchProvider: next });
    return next;
  },

  setNewsProvider: (provider) => {
    storage.set('news_provider', provider);
    set({ newsProvider: provider });
  },

  setNewsApiKey: (key) => {
    storage.set('news_apikey', key);
    set({ newsApiKey: key });
  },

  setNewsTopics: (topics) => {
    storage.set('news_topics', topics);
    set({ newsTopics: topics });
  },

  setNewsItems: (items) => {
    set({ newsItems: items });
  },

  setNewsLoading: (loading) => {
    set({ newsLoading: loading });
  },

  setNotesContent: (content) => {
    storage.set('notes_content', content);
    set({ notesContent: content });
    get().triggerAutoSync();
  },

  setWeatherCity: (city) => {
    storage.set('weather_city', city);
    set({ weatherCity: city });
    get().triggerAutoSync();
  },

  // AI Chat Actions
  setOpenAiApiKey: (key) => {
    const token = get().syncToken;
    if (token) {
      storage.set('openai_apikey', encrypt(key, token));
    }
    set({ openAiApiKey: key });
  },

  openChat: () => set({ chatOpen: true }),
  closeChat: () => set({ chatOpen: false }),

  setInitialChatMessage: (message) => {
    set({ initialChatMessage: message });
  },

  clearInitialChatMessage: () => {
    set({ initialChatMessage: null });
  },

  addChatMessage: (message) => {
    const messages = [...get().chatMessages, message];
    set({ chatMessages: messages });
    return messages;
  },

  setChatLoading: (loading) => {
    set({ chatLoading: loading });
  },

  clearChat: () => {
    set({ chatMessages: [] });
  },

  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),

  openAddSite: () => set({ addSiteOpen: true }),
  closeAddSite: () => set({ addSiteOpen: false }),

  setEditingSite: (site) => set({ editingSite: site }),

  confirmDeleteSite: (id) => set({ deleteConfirmId: id }),
  cancelDeleteSite: () => set({ deleteConfirmId: null }),

  setSyncToken: (token) => {
    const currentKey = get().openAiApiKey;
    storage.set('sync_token', token);
    set({ syncToken: token });
    if (currentKey && token) {
      storage.set('openai_apikey', encrypt(currentKey, token));
    } else if (!token) {
      storage.remove('openai_apikey');
    }
  },

  setAutoSync: (autoSync) => {
    storage.set('auto_sync', autoSync);
    set({ autoSync });
  },

  setHomeSortMethod: (method) => {
    storage.set('home_sort_method', method);
    set({ homeSortMethod: method });
  },

  registerSiteVisit: (id) => {
    const sites = get().sites.map((s) => (s.id === id ? { ...s, lastAccessed: Date.now() } : s));
    storage.set('sites', sites);
    set({ sites });
  },

  exportData: () => {
    return storage.exportAll();
  },

  importData: (data) => {
    const success = storage.importAll(data);
    if (success) {
      // Reload state from storage
      set({
        sites: storage.get('sites') || defaultSites,
        categories: storage.get('categories') || defaultCategories,
        theme: storage.get('theme') || 'minimal-dark',
        searchProvider: storage.get('search_provider') || 0,
        newsProvider: storage.get('news_provider') || 'rss',
        newsApiKey: storage.get('news_apikey') || '',
        newsTopics: storage.get('news_topics') || defaultNewsTopics,
        notesContent: storage.get('notes_content') || '',
        weatherCity: storage.get('weather_city') || '',
        homeSortMethod: storage.get('home_sort_method') || 'manual',
        defaultCategory: storage.get('default_category') || 'all',
        activeCategory: getSessionCategory() || storage.get('default_category') || 'all',
        syncToken: storage.get('sync_token') || '',
        autoSync: storage.get('auto_sync') || false,
      });
      set({ openAiApiKey: decrypt(storage.get('openai_apikey'), get().syncToken) || '' });
      applyTheme(get().theme);
    }
    return success;
  },

  triggerAutoSync: () => {
    if (get().autoSync && get().syncToken) {
      get()
        .pushToCloud()
        .catch((err) => console.error('Auto-sync push falhou:', err));
    }
  },

  pushToCloud: async () => {
    const token = get().syncToken;
    if (!token) throw new Error('Token ausente');
    const data = get().exportData();
    // resolvedIcon é cache efêmero de cliente — não deve ser persistido na nuvem
    const dadosSanitizados = { ...data };
    if (Array.isArray(dadosSanitizados.sp_sites)) {
      dadosSanitizados.sp_sites = dadosSanitizados.sp_sites.map(({ resolvedIcon, ...site }) => site);
    }
    const response = await fetch('/.netlify/functions/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-sync-token': token },
      body: JSON.stringify({ data: dadosSanitizados }),
    });
    if (!response.ok) throw new Error('Falha no sync');
    return true;
  },

  pullFromCloud: async () => {
    const token = get().syncToken;
    if (!token) throw new Error('Token ausente');
    const response = await fetch('/.netlify/functions/sync', {
      method: 'GET',
      headers: { 'x-sync-token': token },
    });
    if (!response.ok) throw new Error('Falha no sync');
    const json = await response.json();
    if (json.data) {
      // Sanitiza dados da nuvem: remove resolvedIcons DDG (backwards compat com dados já corrompidos)
      const dadosRecebidos = { ...json.data };
      if (Array.isArray(dadosRecebidos.sp_sites)) {
        dadosRecebidos.sp_sites = dadosRecebidos.sp_sites.map((site) => ({
          ...site,
          resolvedIcon: site.resolvedIcon?.includes('duckduckgo') ? null : site.resolvedIcon,
        }));
      }
      get().importData(dadosRecebidos);
      return true;
    }
    return false;
  },
}));

export { searchProviders };
export default useStore;
