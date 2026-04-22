import { useState, useMemo, useEffect } from 'react';
import { X, CheckSquare, Square, Folder, Link as LinkIcon } from 'lucide-react';
import useStore from '../store/useStore';

export default function ImportBookmarksModal() {
  const { importBookmarksOpen, closeImportBookmarks, pendingBookmarks, categories, importBookmarksBatch } = useStore();
  const [selectedUrls, setSelectedUrls] = useState(new Set());
  const [targetCategory, setTargetCategory] = useState('all');
  const [newCategoryName, setNewCategoryName] = useState('');

  const groupedBookmarks = useMemo(() => {
    const groups = {};
    pendingBookmarks.forEach((bm) => {
      if (!groups[bm.folder]) groups[bm.folder] = [];
      groups[bm.folder].push(bm);
    });
    return groups;
  }, [pendingBookmarks]);

  useEffect(() => {
    if (importBookmarksOpen) {
      const allUrls = new Set(pendingBookmarks.map((b) => b.url));
      setSelectedUrls(allUrls);
      setTargetCategory('all');
      setNewCategoryName('');
    }
  }, [importBookmarksOpen, pendingBookmarks]);

  if (!importBookmarksOpen) return null;

  const handleToggleUrl = (url) => {
    const next = new Set(selectedUrls);
    if (next.has(url)) next.delete(url);
    else next.add(url);
    setSelectedUrls(next);
  };

  const handleToggleFolder = (folder) => {
    const urls = groupedBookmarks[folder].map((b) => b.url);
    const allSelected = urls.every((url) => selectedUrls.has(url));
    const next = new Set(selectedUrls);

    urls.forEach((url) => {
      if (allSelected) next.delete(url);
      else next.add(url);
    });
    setSelectedUrls(next);
  };

  const handleImport = () => {
    const toImport = pendingBookmarks.filter((b) => selectedUrls.has(b.url));
    const finalCategory = targetCategory === 'new' ? newCategoryName : targetCategory;
    importBookmarksBatch(toImport, finalCategory);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center modal-backdrop"
      onClick={closeImportBookmarks}
    >
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-7xl h-[85vh] mx-4 flex flex-col animate-slideIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-text">Importar Favoritos</h2>
            <p className="text-sm text-muted mt-1">
              {pendingBookmarks.length} links encontrados. Selecione quais deseja importar.
            </p>
          </div>
          <button onClick={closeImportBookmarks} className="text-muted hover:text-text transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content - Folders & Links */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 content-start">
          {Object.entries(groupedBookmarks).map(([folder, bookmarks]) => {
            const allSelected = bookmarks.every((b) => selectedUrls.has(b.url));
            const someSelected = bookmarks.some((b) => selectedUrls.has(b.url));

            return (
              <div key={folder} className="space-y-2">
                <div
                  className="flex items-center gap-2 cursor-pointer group"
                  onClick={() => handleToggleFolder(folder)}
                >
                  <button className="text-muted group-hover:text-accent transition-colors">
                    {allSelected ? (
                      <CheckSquare size={18} className="text-accent" />
                    ) : someSelected ? (
                      <CheckSquare size={18} className="text-accent opacity-50" />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>
                  <Folder size={18} className="text-accent" />
                  <h3 className="font-medium text-text">{folder}</h3>
                  <span className="text-xs text-muted">({bookmarks.length})</span>
                </div>
                <div className="pl-6 space-y-1">
                  {bookmarks.map((bm, i) => (
                    <div
                      key={`${bm.url}-${i}`}
                      className="flex items-center gap-3 p-2 hover:bg-bg rounded-lg cursor-pointer transition-colors"
                      onClick={() => handleToggleUrl(bm.url)}
                    >
                      <button className="text-muted">
                        {selectedUrls.has(bm.url) ? (
                          <CheckSquare size={16} className="text-accent" />
                        ) : (
                          <Square size={16} />
                        )}
                      </button>
                      <LinkIcon size={14} className="text-muted flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-text truncate">{bm.name}</p>
                        <p className="text-xs text-muted truncate">{bm.url}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer - Target Category & Actions */}
        <div className="p-6 border-t border-border bg-bg rounded-b-2xl">
          <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between">
            <div className="w-full sm:w-auto flex-1 max-w-md">
              <label className="block text-sm text-muted mb-2">Categoria de Destino</label>
              <div className="flex gap-2">
                <select
                  value={targetCategory}
                  onChange={(e) => setTargetCategory(e.target.value)}
                  className="flex-1 px-3 py-2 bg-bg border border-border rounded-lg text-text focus:border-accent transition-colors text-sm"
                >
                  <option value="all">Todos (Sem categoria)</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="new">+ Criar Nova Categoria</option>
                </select>
                {targetCategory === 'new' && (
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Nome da categoria"
                    className="flex-1 px-3 py-2 bg-bg border border-border rounded-lg text-text focus:border-accent transition-colors text-sm animate-fadeIn"
                    autoFocus
                  />
                )}
              </div>
            </div>
            <div className="flex gap-3 w-full sm:w-auto mt-4 sm:mt-0">
              <button
                onClick={closeImportBookmarks}
                className="flex-1 sm:flex-none px-4 py-2 bg-card border border-border rounded-lg text-muted hover:text-text transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleImport}
                disabled={selectedUrls.size === 0 || (targetCategory === 'new' && !newCategoryName.trim())}
                className="flex-1 sm:flex-none px-6 py-2 bg-accent text-[#1a1a1a] rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Importar ({selectedUrls.size})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
