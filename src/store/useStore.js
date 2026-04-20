import { create } from 'zustand'
import { storage, defaultSites, defaultCategories, defaultNewsTopics } from '../utils/storage'
import { applyTheme } from '../themes/themes'

const searchProviders = [
  { name: 'Google', url: 'https://google.com/search?q=', color: '#4285F4', icon: 'G' },
  { name: 'Bing', url: 'https://bing.com/search?q=', color: '#00B4F0', icon: 'B' },
  { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=', color: '#DE5833', icon: 'D' },
  { name: 'YouTube', url: 'https://youtube.com/results?search_query=', color: '#FF0000', icon: 'Y' },
  { name: 'Brave', url: 'https://search.brave.com/search?q=', color: '#FB542B', icon: 'Br' },
  { name: 'Ecosia', url: 'https://ecosia.org/search?q=', color: '#4A9C5D', icon: 'E' },
]

const useStore = create((set, get) => ({
  // Sites
  sites: storage.get('sites') || defaultSites,
  
  // Categories
  categories: storage.get('categories') || defaultCategories,
  activeCategory: storage.get('active_category') || 'all',
  
  // Theme
  theme: storage.get('theme') || 'minimal-dark',
  
  // Search
  searchProvider: storage.get('search_provider') || 0,
  searchQuery: '',
  
  // News
  newsProvider: storage.get('news_provider') || 'rss',
  newsApiKey: storage.get('news_apikey') || '',
  newsTopics: storage.get('news_topics') || defaultNewsTopics,
  newsItems: [],
  newsLoading: false,
  
  // UI State
  settingsOpen: false,
  addSiteOpen: false,
  editingSite: null,

  // Actions
  setSites: (sites) => {
    storage.set('sites', sites)
    set({ sites })
  },
  
  addSite: (site) => {
    const sites = get().sites
    const newSite = { 
      ...site, 
      id: Date.now().toString(),
      order: sites.length 
    }
    const updatedSites = [...sites, newSite]
    storage.set('sites', updatedSites)
    set({ sites: updatedSites })
  },
  
  updateSite: (id, updates) => {
    const sites = get().sites.map(s => s.id === id ? { ...s, ...updates } : s)
    storage.set('sites', sites)
    set({ sites })
  },
  
  removeSite: (id) => {
    const sites = get().sites.filter(s => s.id !== id)
    storage.set('sites', sites)
    set({ sites })
  },
  
  reorderSites: (newOrder) => {
    const reordered = newOrder.map((id, index) => {
      const site = get().sites.find(s => s.id === id)
      return { ...site, order: index }
    })
    storage.set('sites', reordered)
    set({ sites: reordered })
  },
  
  setCategories: (categories) => {
    storage.set('categories', categories)
    set({ categories })
  },
  
  addCategory: (category) => {
    const categories = get().categories
    if (!categories.includes(category)) {
      const updated = [...categories, category]
      storage.set('categories', updated)
      set({ categories: updated })
    }
  },
  
  removeCategory: (category) => {
    const categories = get().categories.filter(c => c !== category)
    storage.set('categories', categories)
    set({ categories })
    
    // Move sites from removed category to 'all'
    const sites = get().sites.map(s => 
      s.category === category ? { ...s, category: 'all' } : s
    )
    storage.set('sites', sites)
    set({ sites })
  },
  
  setActiveCategory: (category) => {
    storage.set('active_category', category)
    set({ activeCategory: category })
  },
  
  setTheme: (theme) => {
    storage.set('theme', theme)
    applyTheme(theme)
    set({ theme })
  },
  
  setSearchProvider: (provider) => {
    storage.set('search_provider', provider)
    set({ searchProvider: provider })
  },
  
  setSearchQuery: (query) => {
    set({ searchQuery: query })
  },
  
  cycleSearchProvider: () => {
    const current = get().searchProvider
    const next = (current + 1) % searchProviders.length
    storage.set('search_provider', next)
    set({ searchProvider: next })
    return next
  },
  
  setNewsProvider: (provider) => {
    storage.set('news_provider', provider)
    set({ newsProvider: provider })
  },
  
  setNewsApiKey: (key) => {
    storage.set('news_apikey', key)
    set({ newsApiKey: key })
  },
  
  setNewsTopics: (topics) => {
    storage.set('news_topics', topics)
    set({ newsTopics: topics })
  },
  
  setNewsItems: (items) => {
    set({ newsItems: items })
  },
  
  setNewsLoading: (loading) => {
    set({ newsLoading: loading })
  },
  
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
  
  openAddSite: () => set({ addSiteOpen: true }),
  closeAddSite: () => set({ addSiteOpen: false }),
  
  setEditingSite: (site) => set({ editingSite: site }),
  
  exportData: () => {
    return storage.exportAll()
  },
  
  importData: (data) => {
    const success = storage.importAll(data)
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
        activeCategory: storage.get('active_category') || 'all',
      })
      applyTheme(get().theme)
    }
    return success
  },
}))

export { searchProviders }
export default useStore
