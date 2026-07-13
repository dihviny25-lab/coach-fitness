import { NavLink } from 'react-router-dom'
import { Home, Dumbbell, Ruler, Apple, User, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/', label: 'Início', end: true, icon: Home },
  { to: '/treinos', label: 'Treino', icon: Dumbbell },
  { to: '/medidas', label: 'Medidas', icon: Ruler },
  { to: '/nutricao', label: 'Nutrição', icon: Apple },
  { to: '/perfil', label: 'Perfil', icon: User },
]

export default function NavBar() {
  const { signOut } = useAuth()

  return (
    <>
      <header className="hidden md:flex items-center justify-between border-b border-neutral-800 px-6 py-3 bg-neutral-950">
        <span className="flex items-center gap-2 font-extrabold text-white tracking-tight uppercase">
          <Dumbbell size={20} className="text-brand-500" />
          Coach Fitness
        </span>
        <nav className="flex gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  isActive ? 'bg-brand-500 text-white' : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-100'
                }`
              }
            >
              <l.icon size={16} />
              {l.label}
            </NavLink>
          ))}
        </nav>
        <button onClick={signOut} className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-100 transition">
          <LogOut size={16} />
          Sair
        </button>
      </header>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-neutral-950/95 backdrop-blur border-t border-neutral-800 flex justify-around py-2 z-20">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 text-[10px] font-medium px-2 py-1 rounded-lg transition ${
                isActive ? 'text-brand-400' : 'text-neutral-500'
              }`
            }
          >
            <l.icon size={20} />
            {l.label}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
