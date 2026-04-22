import { create } from 'zustand';
import { storage, defaultSites, defaultCategories, defaultNewsTopics } from '../utils/storage';
import { applyTheme } from '../themes/themes';

const searchProviders = [
  { name: 'Google', url: 'https://google.com/search?q=', color: '#4285F4', icon: 'G', type: 'search' },
  // { name: 'Bing', url: 'https://bing.com/search?q=', color: '#00B4F0', icon: 'B', type: 'search' },
  { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=', color: '#DE5833', icon: 'D', type: 'search' },
  { name: 'YouTube', url: 'https://youtube.com/results?search_query=', color: '#FF0000', icon: 'Y', type: 'search' },
  // { name: 'Brave', url: 'https://search.brave.com/search?q=', color: '#FB542B', icon: 'Br', type: 'search' },
  { name: 'Ecosia', url: 'https://ecosia.org/search?q=', color: '#4A9C5D', icon: 'E', type: 'search' },
  { name: 'AI Chat', url: '', color: '#00D4AA', icon: 'AI', type: 'ai' },
].filter(Boolean);

const useStore = create((set, get) => ({
  // Sites
  sites: storage.get('sites') || defaultSites,

  // Categories
  categories: storage.get('categories') || defaultCategories,
  defaultCategory: storage.get('default_category') || 'all',
  activeCategory: storage.get('default_category') || 'all',

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
  deepseekApiKey: storage.get('deepseek_apikey') || '',
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

  updateSite: (id, updates) => {
    const sites = get().sites.map((s) => (s.id === id ? { ...s, ...updates } : s));
    storage.set('sites', sites);
    set({ sites });
    get().triggerAutoSync();
  },

  removeSite: (id) => {
    const sites = get().sites.filter((s) => s.id !== id);
    storage.set('sites', sites);
    set({ sites });
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
    set({ activeCategory: category });
  },

  setTheme: (theme) => {
    storage.set('theme', theme);
    applyTheme(theme);
    set({ theme });
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

  // AI Chat Actions
  setDeepseekApiKey: (key) => {
    storage.set('deepseek_apikey', key);
    set({ deepseekApiKey: key });
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
    storage.set('sync_token', token);
    set({ syncToken: token });
  },

  setAutoSync: (autoSync) => {
    storage.set('auto_sync', autoSync);
    set({ autoSync });
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
        defaultCategory: storage.get('default_category') || 'all',
        activeCategory: storage.get('default_category') || 'all',
        deepseekApiKey: storage.get('deepseek_apikey') || '',
        syncToken: storage.get('sync_token') || '',
        autoSync: storage.get('auto_sync') || false,
      });
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
    const response = await fetch('/.netlify/functions/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-sync-token': token },
      body: JSON.stringify({ data }),
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
      get().importData(json.data);
      return true;
    }
    return false;
  },
}));

export { searchProviders };
export default useStore;
