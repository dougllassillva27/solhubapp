import { Filter } from 'lucide-react'
import useStore from '../store/useStore'

const categoryLabels = {
  all: 'Todos',
  dev: 'Dev',
  trabalho: 'Trabalho',
  social: 'Social',
  entretenimento: 'Entretenimento',
}

export default function CategoryFilter() {
  const { categories, activeCategory, setActiveCategory } = useStore()

  const allCategories = ['all', ...categories]

  return (
    <div className="w-full max-w-6xl mx-auto px-4 mb-6 animate-fadeIn">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <Filter size={18} className="text-muted flex-shrink-0" />
        
        {allCategories.map(cat => {
          const isActive = activeCategory === cat
          const label = categoryLabels[cat] || cat.charAt(0).toUpperCase() + cat.slice(1)
          
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-accent text-bg'
                  : 'bg-card border border-border text-muted hover:text-text hover:border-accent'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
