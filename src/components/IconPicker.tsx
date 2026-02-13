import { useState } from 'react'
import { ICON_CATEGORIES } from '../lib/icons'

interface IconPickerProps {
  selected: string
  onSelect: (icon: string) => void
}

export function IconPicker({ selected, onSelect }: IconPickerProps) {
  const [activeCategory, setActiveCategory] = useState(Object.keys(ICON_CATEGORIES)[0])
  
  const categories = Object.keys(ICON_CATEGORIES)
  const icons = ICON_CATEGORIES[activeCategory as keyof typeof ICON_CATEGORIES] || []
  
  return (
    <div className="space-y-3">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-2 py-1 text-xs rounded-lg transition-all ${
              activeCategory === category
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {category}
          </button>
        ))}
      </div>
      
      {/* Icons Grid */}
      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
        {icons.map((icon, idx) => (
          <button
            key={idx}
            onClick={() => onSelect(icon)}
            className={`w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all ${
              selected === icon 
                ? 'bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-500 scale-110'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 hover:scale-105'
            }`}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  )
}
