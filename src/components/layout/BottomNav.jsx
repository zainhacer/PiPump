import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

function HomeIcon({ active }) {
  return (
    <svg className={`w-5 h-5 ${active ? 'text-pi-lime' : 'text-pi-muted'}`}
         viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'}
         stroke="currentColor" strokeWidth="2">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9,22 9,12 15,12 15,22"/>
    </svg>
  )
}
function SearchIcon({ active }) {
  return (
    <svg className={`w-5 h-5 ${active ? 'text-pi-lime' : 'text-pi-muted'}`}
         viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  )
}
function PlusIcon() {
  return (
    <svg className="w-6 h-6 text-pi-bg" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2.5">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )
}
function UserIcon({ active }) {
  return (
    <svg className={`w-5 h-5 ${active ? 'text-pi-lime' : 'text-pi-muted'}`}
         viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'}
         stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}
function TrendingIcon({ active }) {
  return (
    <svg className={`w-5 h-5 ${active ? 'text-pi-lime' : 'text-pi-muted'}`}
         viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  )
}

export default function BottomNav() {
  const location = useLocation()
  const { user } = useAuth()
  const path = location.pathname

  const tabs = [
  { to: '/',              key: 'home',     label: 'Home',     Icon: HomeIcon },
  { to: '/?tab=trending', key: 'trending', label: 'Trending', Icon: TrendingIcon },
  { to: '/create',        key: 'create',   label: 'Create',   Icon: null, isCreate: true },
  { to: user ? '/profile' : '/', key: 'profile', label: 'Profile', Icon: UserIcon },
]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden
                    bg-pi-bg/95 backdrop-blur-md border-t border-pi-border bottom-nav">
      <div className="flex items-center justify-around px-2 pt-2">
        {tabs.map((tab) => {
          const isActive = path === tab.to || (tab.to !== '/' && path.startsWith(tab.to))

          if (tab.isCreate) {
            return (
              <Link key={tab.key} to={tab.to}
                    className="flex flex-col items-center -mt-5">
                <div className="w-12 h-12 rounded-2xl bg-pi-lime
                                flex items-center justify-center
                                shadow-lime active:scale-95 transition-transform">
                  <PlusIcon />
                </div>
                <span className="text-[10px] mt-1 text-pi-muted font-body">Create</span>
              </Link>
            )
          }

          return (
            <Link key={tab.to} to={tab.to}
                  className={`nav-item ${isActive ? 'active' : ''}`}>
              <tab.Icon active={isActive} />
              <span className={`text-[10px] font-body
                               ${isActive ? 'text-pi-lime' : 'text-pi-muted'}`}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
