import React from 'react';
import { BarChart2, LineChartIcon, Users, Database, Menu, X } from 'lucide-react';

const Sidebar = ({ activeTab, onNavClick, isMenuOpen, onMenuToggle, navItems }) => {

  const sidebarClasses = `
    bg-white border-r border-gray-200 flex-col
    transition-all duration-300 ease-in-out
    hidden md:flex 
    ${isMenuOpen ? 'w-64' : 'w-20'}
  `;

  return (
    <aside className={sidebarClasses}>
      <div className="flex items-center justify-center h-16 border-b shrink-0">
        <img src="/logo.png" alt="Ants" className={`transition-all duration-300 ${isMenuOpen ? 'h-10' : 'h-8'}`} />
      </div>
      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavClick(item.id)}
            className={`w-full flex items-center p-3 rounded-lg transition-colors ${activeTab === item.id ? 'bg-primary-100 text-primary-600' : 'text-gray-600 hover:bg-gray-100'}`}
            title={isMenuOpen ? '' : item.label}
          >
            <item.icon size={20} className="shrink-0" />
            {isMenuOpen && <span className="ml-4 font-semibold">{item.label}</span>}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t shrink-0">
        <button
          onClick={onMenuToggle}
          className="w-full flex items-center p-3 rounded-lg text-gray-600 hover:bg-gray-100 justify-center"
          title={isMenuOpen ? '折りたたむ' : '展開する'}
        >
          {isMenuOpen 
            ? <X size={20} className="shrink-0" /> 
            : <Menu size={20} className="shrink-0" />
          }
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
