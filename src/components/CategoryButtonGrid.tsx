import type { Category } from '@/types/database'

interface CategoryButtonGridProps {
  categories: Category[]
  selected: string
  onSelect: (id: string) => void
  suggested?: string | null
}

export function CategoryButtonGrid({ categories, selected, onSelect, suggested }: CategoryButtonGridProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-2">Categoría</label>
      <div className="grid grid-cols-3 gap-2">
        {categories.map((cat) => {
          const isSelected = selected === cat.id
          const isSuggested = suggested === cat.name && !isSelected
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelect(cat.id)}
              className={`
                flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 text-xs font-medium transition-all active:scale-95
                ${isSelected
                  ? 'border-primary bg-primary text-white shadow-md'
                  : isSuggested
                  ? 'border-accent bg-accent/10 text-primary'
                  : 'border-gray-200 bg-white text-gray-700'
                }
              `}
              style={isSelected ? { backgroundColor: cat.color, borderColor: cat.color } : undefined}
            >
              <span className="text-xl">{cat.icon}</span>
              <span className="leading-tight text-center">{cat.name}</span>
              {isSuggested && (
                <span className="text-[10px] text-primary font-bold">✨ IA</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
