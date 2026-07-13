import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/', label: 'Início', end: true },
  { to: '/treinos', label: 'Treino' },
  { to: '/medidas', label: 'Medidas' },
  { to: '/nutricao', label: 'Nutrição' },
  { to: '/perfil', label: 'Perfil' },
]

export default function NavBar() {
  const { signOut } = useAuth()

  return (
    <>
      <header className="hidden md:flex items-center justify-between border-b border-neutral-200 px-6 py-3 bg-white">
        <span className="font-bold text-neutral-900">Coach Fitness</span>
        <nav className="flex gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium ${isActive ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <button onClick={signOut} className="text-sm text-neutral-500 hover:text-neutral-900">
          Sair
        </button>
      </header>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 flex justify-around py-2 z-20">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              `flex flex-col items-center text-xs px-2 py-1 rounded-lg ${isActive ? 'text-neutral-900 font-semibold' : 'text-neutral-400'}`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
