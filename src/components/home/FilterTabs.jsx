export default function FilterTabs({ active, onChange }) {
  const tabs = [
    { key: 'new',      label: '🆕 New' },
    { key: 'hot',      label: '🔥 Hot' },
    { key: 'trending', label: '📈 Trending' },
    { key: 'graduating', label: '🎓 Graduating' },
  ]

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none mb-4">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold whitespace-nowrap
                      transition-all duration-150 flex-shrink-0
                      ${active === tab.key
                        ? 'bg-pi-lime text-pi-bg shadow-lime'
                        : 'bg-pi-card border border-pi-border text-pi-muted hover:text-pi-text hover:border-pi-purple/30'
                      }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
