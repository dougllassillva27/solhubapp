import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, Trash2, ExternalLink } from 'lucide-react'
import useStore from '../store/useStore'
import { getFaviconUrl, getDomain } from '../utils/favicon'

export default function SiteCard({ site }) {
  const { removeSite, openAddSite, setEditingSite } = useStore()
  const [showActions, setShowActions] = useState(false)
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: site.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleEdit = (e) => {
    e.stopPropagation()
    setEditingSite(site)
    openAddSite()
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    removeSite(site.id)
  }

  const handleClick = () => {
    window.open(site.url, '_blank')
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div
        onClick={handleClick}
        className="bg-card border border-border rounded-xl p-4 cursor-pointer card-hover flex items-center gap-4"
      >
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-muted hover:text-text"
        >
          <GripVertical size={18} />
        </button>
        
        {/* Favicon */}
        <div className="w-12 h-12 rounded-lg bg-bg flex items-center justify-center overflow-hidden flex-shrink-0">
          <img 
            src={getFaviconUrl(site.url)} 
            alt={site.name}
            className="w-8 h-8"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
          <span className="hidden w-8 h-8 items-center justify-center text-xs font-bold bg-accent text-bg rounded">
            {site.name[0].toUpperCase()}
          </span>
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-text truncate">{site.name}</h3>
          <p className="text-sm text-muted truncate">{getDomain(site.url)}</p>
        </div>
        
        {/* External Link Icon */}
        <ExternalLink size={16} className="text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      
      {/* Action Buttons */}
      {showActions && (
        <div className="absolute -top-2 -right-2 flex gap-1 animate-slideIn">
          <button
            onClick={handleEdit}
            className="p-1.5 bg-card border border-border rounded-lg text-muted hover:text-accent hover:border-accent transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 bg-card border border-border rounded-lg text-muted hover:text-red-500 hover:border-red-500 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
