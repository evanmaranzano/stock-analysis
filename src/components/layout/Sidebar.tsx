import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: '市场概览', icon: '📊' },
  { to: '/portfolio', label: '自选股', icon: '⭐' },
];

export default function Sidebar() {
  return (
    <aside className="w-48 border-r border-gray-200 bg-white">
      <nav className="flex flex-col gap-1 p-4">
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
                isActive ? 'bg-blue-50 font-medium text-blue-700' : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <span>{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
