import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, Route, DollarSign, Building2,
  Truck, Users, LogOut, Menu, X
} from 'lucide-react';

const navItems = [
  { to: '/',         label: 'Dashboard', icon: LayoutDashboard },
  { to: '/rotas',    label: 'Rotas',     icon: Route           },
  { to: '/custos',   label: 'Custos',    icon: DollarSign      },
  { to: '/agencias', label: 'Agências',  icon: Building2       },
  { to: '/veiculos', label: 'Veículos',  icon: Truck           },
  { to: '/usuarios', label: 'Usuários',  icon: Users           },
];

function Sidebar({ onLogout, darkMode, onToggleDarkMode }) {
  const [open, setOpen] = useState(true);

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`
          ${open ? 'w-56' : 'w-16'}
          bg-yellow-300 text-black flex flex-col p-3
          transition-all duration-300 overflow-hidden
        `}
      >
        {/* Header: hamburger + nome */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => setOpen(!open)}
            className="p-1 rounded hover:bg-sky-400 hover:dark:bg-sky-600 shrink-0"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          {open && <h1 className="text-xl font-bold whitespace-nowrap">SCACE</h1>}
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-3 hover:bg-sky-400 hover:dark:bg-sky-600 px-2 py-2 rounded"
              title={!open ? label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {open && <span className="whitespace-nowrap">{label}</span>}
            </Link>
          ))}
        </nav>

        {/* Rodapé: tema + sair */}
        <div className="flex flex-col gap-2 mt-2">
          <button
            onClick={onToggleDarkMode}
            className="flex items-center gap-3 hover:bg-slate-950 hover:dark:bg-slate-100 px-2 py-2 rounded w-full text-left hover:dark:text-black hover:text-white"
            title={!open ? (darkMode ? 'Tema claro' : 'Tema escuro') : undefined}
          >
            <span className="text-lg shrink-0">{darkMode ? '☀️' : '🌙'}</span>
            {open && <span className="whitespace-nowrap">{darkMode ? 'Tema claro' : 'Tema escuro'}</span>}
          </button>

          <button
            onClick={onLogout}
            className="flex items-center gap-3 hover:bg-red-400 px-2 py-2 rounded w-full text-left"
            title={!open ? 'Sair' : undefined}
          >
            <LogOut size={18} className="shrink-0" />
            {open && <span className="whitespace-nowrap">Sair</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;