import { useState, useRef } from 'react';
import {
  X,
  Palette,
  Search,
  Newspaper,
  FolderOpen,
  Database,
  Plus,
  Trash2,
  Download,
  Upload,
  Check,
  AlertCircle,
  MessageSquare,
  GripVertical,
  Cloud,
  UploadCloud,
  DownloadCloud,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import useStore, { searchProviders } from '../store/useStore';
import { themeList } from '../themes/themes';

const tabs = [
  { id: 'appearance', label: 'Tema', icon: Palette },
  { id: 'search', label: 'Busca', icon: Search },
  { id: 'ai', label: 'Chat IA', icon: MessageSquare },
  { id: 'news', label: 'Notícias', icon: Newspaper },
  { id: 'categories', label: 'Categorias', icon: FolderOpen },
  { id: 'data', label: 'Dados', icon: Database },
];

const newsProviders = [
  { id: 'rss', name: 'RSS (Gratuito)', requiresKey: false },
  { id: 'gnews', name: 'GNews API', requiresKey: true },
];

const availableTopics = [
  { id: 'technology', label: 'Tecnologia' },
  { id: 'science', label: 'Ciência' },
  { id: 'entertainment', label: 'Entretenimento' },
  { id: 'business', label: 'Negócios' },
  { id: 'health', label: 'Saúde' },
  { id: 'sports', label: 'Esportes' },
];

function SortableCategoryItem({ cat, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cat });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 px-3 py-2 bg-bg border border-border rounded-lg relative"
    >
      <button
        type="button"
        className="text-muted hover:text-text cursor-grab active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={16} />
      </button>
      <span className="text-sm text-text flex-1">{cat}</span>
      <button
        onClick={() => onRemove(cat)}
        className="text-muted hover:text-red-500 transition-colors"
        title="Remover categoria"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

export default function SettingsModal() {
  const {
    settingsOpen,
    closeSettings,
    theme,
    setTheme,
    searchProvider,
    setSearchProvider,
    deepseekApiKey,
    setDeepseekApiKey,
    newsProvider,
    setNewsProvider,
    newsApiKey,
    setNewsApiKey,
    newsTopics,
    setNewsTopics,
    categories,
    defaultCategory,
    setDefaultCategory,
    addCategory,
    removeCategory,
    reorderCategories,
    exportData,
    importData,
    syncToken,
    setSyncToken,
    pushToCloud,
    pullFromCloud,
    autoSync,
    setAutoSync,
  } = useStore();

  const [activeTab, setActiveTab] = useState('appearance');
  const [newCategory, setNewCategory] = useState('');
  const [importStatus, setImportStatus] = useState(null);
  const [syncStatus, setSyncStatus] = useState({ loading: false, type: null, text: null });
  const fileInputRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = categories.indexOf(active.id);
      const newIndex = categories.indexOf(over.id);
      const newArray = [...categories];
      newArray.splice(oldIndex, 1);
      newArray.splice(newIndex, 0, active.id);
      reorderCategories(newArray);
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      addCategory(newCategory.trim().toLowerCase());
      setNewCategory('');
    }
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sol-hub-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        const success = importData(data);
        setImportStatus(success ? 'success' : 'error');
        setTimeout(() => setImportStatus(null), 3000);
      } catch {
        setImportStatus('error');
        setTimeout(() => setImportStatus(null), 3000);
      }
    };
    reader.readAsText(file);
  };

  const toggleTopic = (topicId) => {
    if (newsTopics.includes(topicId)) {
      setNewsTopics(newsTopics.filter((t) => t !== topicId));
    } else {
      setNewsTopics([...newsTopics, topicId]);
    }
  };

  const handlePushCloud = async () => {
    setSyncStatus({ loading: true, type: null, text: null });
    try {
      await pushToCloud();
      setSyncStatus({ loading: false, type: 'success', text: 'Salvo na nuvem com sucesso!' });
    } catch (e) {
      setSyncStatus({ loading: false, type: 'error', text: 'Erro ao salvar na nuvem.' });
    }
    setTimeout(() => setSyncStatus((s) => ({ ...s, text: null })), 3000);
  };

  const handlePullCloud = async () => {
    setSyncStatus({ loading: true, type: null, text: null });
    try {
      const hasData = await pullFromCloud();
      if (hasData) {
        setSyncStatus({ loading: false, type: 'success', text: 'Sincronizado da nuvem!' });
      } else {
        setSyncStatus({ loading: false, type: 'error', text: 'Nenhum backup encontrado.' });
      }
    } catch (e) {
      setSyncStatus({ loading: false, type: 'error', text: 'Erro ao buscar na nuvem.' });
    }
    setTimeout(() => setSyncStatus((s) => ({ ...s, text: null })), 3000);
  };

  if (!settingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop" onClick={closeSettings}>
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col animate-slideIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-text">Configurações</h2>
          <button onClick={closeSettings} className="text-muted hover:text-text transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Mobile Tabs (Dropdown) */}
        <div className="block sm:hidden px-6 py-4 border-b border-border">
          <div className="relative">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="w-full pl-4 pr-10 py-3 bg-bg border border-border rounded-lg text-text focus:border-accent transition-colors appearance-none cursor-pointer"
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={18}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
          </div>
        </div>

        {/* Desktop Tabs */}
        <div className="hidden sm:flex border-b border-border overflow-x-auto px-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id ? 'text-accent border-b-2 border-accent' : 'text-muted hover:text-text'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted mb-3">Tema</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {themeList.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`p-3 rounded-xl border transition-all ${
                        theme === t.id ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/50'
                      }`}
                    >
                      <span className="text-sm font-medium text-text">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Search Tab */}
          {activeTab === 'search' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted mb-3">Provedor Padrão</h3>
                <div className="grid grid-cols-2 gap-3">
                  {searchProviders
                    .filter((p) => p.type === 'search')
                    .map((provider, index) => {
                      const actualIndex = searchProviders.findIndex((p) => p.name === provider.name);
                      return (
                        <button
                          key={provider.name}
                          onClick={() => setSearchProvider(actualIndex)}
                          className={`p-3 rounded-xl border transition-all flex items-center gap-3 ${
                            searchProvider === actualIndex
                              ? 'border-accent bg-accent/10'
                              : 'border-border hover:border-accent/50'
                          }`}
                        >
                          <span
                            className="w-6 h-6 flex items-center justify-center rounded text-xs font-bold"
                            style={{ backgroundColor: provider.color, color: '#fff' }}
                          >
                            {provider.icon}
                          </span>
                          <span className="text-sm font-medium text-text">{provider.name}</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* AI Chat Tab */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted mb-3">DeepSeek API Key</h3>
                <input
                  type="password"
                  value={deepseekApiKey}
                  onChange={(e) => setDeepseekApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-4 py-3 bg-bg border border-border rounded-lg text-text placeholder-muted focus:border-accent transition-colors"
                />
                <p className="text-xs text-muted mt-2">
                  Obtenha uma chave em{' '}
                  <a
                    href="https://platform.deepseek.com"
                    target="_blank"
                    rel="noopener"
                    className="text-accent hover:underline"
                  >
                    platform.deepseek.com
                  </a>
                </p>
                <p className="text-xs text-muted mt-1">Sua chave fica salva apenas no navegador (localStorage).</p>
              </div>

              <div className="p-4 bg-bg rounded-lg border border-border">
                <h4 className="text-sm font-medium text-text mb-2">Como usar</h4>
                <ul className="text-xs text-muted space-y-1">
                  <li>
                    1. Pressione <kbd className="px-1 py-0.5 bg-border rounded">Tab</kbd> até chegar em "AI Chat"
                  </li>
                  <li>
                    2. Pressione <kbd className="px-1 py-0.5 bg-border rounded">Enter</kbd> para abrir o chat
                  </li>
                  <li>3. Digite sua pergunta e pressione Enter</li>
                </ul>
              </div>

              {deepseekApiKey && (
                <div className="flex items-center gap-2 text-green-500 text-sm">
                  <Check size={16} />
                  <span>API key configurada</span>
                </div>
              )}
            </div>
          )}

          {/* News Tab */}
          {activeTab === 'news' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted mb-3">Provedor de Notícias</h3>
                <div className="space-y-3">
                  {newsProviders.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => setNewsProvider(provider.id)}
                      className={`w-full p-3 rounded-xl border transition-all text-left ${
                        newsProvider === provider.id
                          ? 'border-accent bg-accent/10'
                          : 'border-border hover:border-accent/50'
                      }`}
                    >
                      <span className="text-sm font-medium text-text">{provider.name}</span>
                      {provider.requiresKey && <span className="text-xs text-muted ml-2">(requer API key)</span>}
                    </button>
                  ))}
                </div>
              </div>

              {newsProvider === 'gnews' && (
                <div>
                  <h3 className="text-sm font-medium text-muted mb-3">API Key do GNews</h3>
                  <input
                    type="text"
                    value={newsApiKey}
                    onChange={(e) => setNewsApiKey(e.target.value)}
                    placeholder="Cole sua API key aqui..."
                    className="w-full px-4 py-3 bg-bg border border-border rounded-lg text-text placeholder-muted focus:border-accent transition-colors"
                  />
                  <p className="text-xs text-muted mt-2">
                    Obtenha uma chave gratuita em{' '}
                    <a href="https://gnews.io" target="_blank" rel="noopener" className="text-accent hover:underline">
                      gnews.io
                    </a>
                  </p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-muted mb-3">Tópicos de Interesse</h3>
                <div className="flex flex-wrap gap-2">
                  {availableTopics.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => toggleTopic(topic.id)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        newsTopics.includes(topic.id)
                          ? 'bg-accent text-bg'
                          : 'bg-bg border border-border text-muted hover:text-text'
                      }`}
                    >
                      {topic.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted mb-3">Categoria Padrão ao Abrir</h3>
                <select
                  value={defaultCategory}
                  onChange={(e) => setDefaultCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-bg border border-border rounded-lg text-text focus:border-accent transition-colors"
                >
                  <option value="all">Todos</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted mt-2">
                  Esta categoria será carregada automaticamente toda vez que você abrir o Sol Hub.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted mb-3">Reordenar e Gerenciar</h3>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={categories} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-col gap-2">
                      {categories.map((cat) => (
                        <SortableCategoryItem key={cat} cat={cat} onRemove={removeCategory} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted mb-3">Adicionar Categoria</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                    placeholder="Nome da categoria..."
                    className="flex-1 px-4 py-3 bg-bg border border-border rounded-lg text-text placeholder-muted focus:border-accent transition-colors"
                  />
                  <button
                    onClick={handleAddCategory}
                    className="px-4 py-3 bg-accent rounded-lg text-bg font-medium hover:opacity-90 transition-opacity"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Data Tab */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-muted mb-3">Sincronização em Nuvem (Neon DB)</h3>
                <p className="text-sm text-muted mb-3">
                  Defina sua Senha Mestra para proteger e sincronizar seus sites na nuvem.
                </p>
                <div className="flex flex-col gap-3">
                  <input
                    type="password"
                    value={syncToken}
                    onChange={(e) => setSyncToken(e.target.value)}
                    placeholder="Senha mestra secreta..."
                    className="w-full px-4 py-3 bg-bg border border-border rounded-lg text-text placeholder-muted focus:border-accent transition-colors"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handlePushCloud}
                      disabled={!syncToken || syncStatus.loading}
                      className="flex-1 px-4 py-3 bg-accent rounded-lg text-bg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {syncStatus.loading ? (
                        <RefreshCw size={18} className="animate-spin" />
                      ) : (
                        <UploadCloud size={18} />
                      )}
                      Salvar na Nuvem
                    </button>
                    <button
                      onClick={handlePullCloud}
                      disabled={!syncToken || syncStatus.loading}
                      className="flex-1 px-4 py-3 bg-bg border border-border rounded-lg text-text font-medium hover:border-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {syncStatus.loading ? (
                        <RefreshCw size={18} className="animate-spin" />
                      ) : (
                        <DownloadCloud size={18} />
                      )}
                      Restaurar da Nuvem
                    </button>
                  </div>
                  {syncStatus.text && (
                    <div
                      className={`flex items-center gap-2 text-sm ${syncStatus.type === 'success' ? 'text-green-500' : 'text-red-500'}`}
                    >
                      {syncStatus.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                      {syncStatus.text}
                    </div>
                  )}

                  <label className="flex items-center gap-3 mt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoSync}
                      onChange={(e) => setAutoSync(e.target.checked)}
                      disabled={!syncToken}
                      className="w-4 h-4 rounded border-border bg-bg text-accent focus:ring-accent focus:ring-offset-bg transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <span className={`text-sm ${syncToken ? 'text-text' : 'text-muted'}`}>
                      Sincronização Automática (Eventos)
                    </span>
                  </label>
                </div>
              </div>

              <hr className="border-border my-6" />

              <div>
                <h3 className="text-sm font-medium text-muted mb-3">Exportar Configuração</h3>
                <p className="text-sm text-muted mb-3">
                  Exporte todas as suas configurações, sites e categorias para um arquivo JSON.
                </p>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-3 bg-accent rounded-lg text-bg font-medium hover:opacity-90 transition-opacity"
                >
                  <Download size={18} />
                  Exportar JSON
                </button>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted mb-3">Importar Configuração</h3>
                <p className="text-sm text-muted mb-3">
                  Importe um arquivo de configuração para restaurar suas preferências.
                </p>
                <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-3 bg-bg border border-border rounded-lg text-text font-medium hover:border-accent transition-colors"
                >
                  <Upload size={18} />
                  Importar JSON
                </button>

                {importStatus && (
                  <div
                    className={`flex items-center gap-2 mt-3 text-sm ${
                      importStatus === 'success' ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {importStatus === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                    {importStatus === 'success' ? 'Importado com sucesso!' : 'Erro ao importar arquivo'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
