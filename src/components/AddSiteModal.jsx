import { useState, useEffect } from 'react';
import { X, Plus, Pencil } from 'lucide-react';
import useStore from '../store/useStore';

export default function AddSiteModal() {
  const { addSiteOpen, closeAddSite, editingSite, updateSite, addSite, setEditingSite, categories } = useStore();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [customIcon, setCustomIcon] = useState('');
  const [category, setCategory] = useState('');
  const [urlError, setUrlError] = useState(false);

  useEffect(() => {
    if (editingSite) {
      setName(editingSite.name);
      setUrl(editingSite.url);
      setCustomIcon(editingSite.customIcon || '');
      setCategory(editingSite.category);
    } else {
      setName('');
      setUrl('');
      setCustomIcon('');
      setCategory(categories[0] || '');
    }
    setUrlError(false);
  }, [editingSite, addSiteOpen, categories]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!url.trim()) {
      setUrlError(true);
      return;
    }

    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    if (editingSite) {
      const hasIconChanged = editingSite.url !== finalUrl || (editingSite.customIcon || '') !== customIcon.trim();

      updateSite(editingSite.id, {
        name: name.trim(),
        url: finalUrl,
        customIcon: customIcon.trim(),
        category: category || categories[0] || 'all',
        ...(hasIconChanged ? { resolvedIcon: null } : {}),
      });
    } else {
      addSite({
        name: name.trim(),
        url: finalUrl,
        customIcon: customIcon.trim(),
        category: category || categories[0] || 'all',
      });
    }

    handleClose();
  };

  const handleClose = () => {
    setName('');
    setUrl('');
    setCustomIcon('');
    setCategory('');
    setUrlError(false);
    setEditingSite(null);
    closeAddSite();
  };

  if (!addSiteOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop" onClick={handleClose}>
      <div
        className="bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 animate-slideIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-text flex items-center gap-2">
            {editingSite ? <Pencil size={20} /> : <Plus size={20} />}
            {editingSite ? 'Editar Site' : 'Adicionar Site'}
          </h2>
          <button onClick={handleClose} className="text-muted hover:text-text transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-muted mb-1">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="GitHub"
              className="w-full px-4 py-3 bg-bg border border-border rounded-lg text-text placeholder-muted focus:border-accent transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">URL</label>
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setUrlError(false);
              }}
              placeholder="https://github.com"
              className={`w-full px-4 py-3 bg-bg border rounded-lg text-text placeholder-muted focus:border-accent transition-colors ${urlError ? 'border-red-500' : 'border-border'}`}
            />
            {urlError && <p className="text-xs text-red-500 mt-1">A URL é obrigatória para salvar o site.</p>}
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">Ícone Customizado (URL Opcional)</label>
            <input
              type="text"
              value={customIcon}
              onChange={(e) => setCustomIcon(e.target.value)}
              placeholder="https://exemplo.com/icon.png"
              className="w-full px-4 py-3 bg-bg border border-border rounded-lg text-text placeholder-muted focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm text-muted mb-1">Categoria</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3 bg-bg border border-border rounded-lg text-text focus:border-accent transition-colors"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 bg-bg border border-border rounded-lg text-muted hover:text-text transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-accent rounded-lg text-bg font-medium hover:opacity-90 transition-opacity"
            >
              {editingSite ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
