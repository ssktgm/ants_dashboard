import React from 'react';
import { Menu, X } from 'lucide-react';

const Header = ({ onMenuToggle, isMenuOpen, navItems, activeTab, onNavClick }) => {
  return (
    <header className="bg-blue-800 shadow-sm flex items-center justify-between p-4 border-b z-20">
      <div className="flex items-center">
        <h1 className="text-xl font-bold text-white">⚾️ ありんこアントス Dashboard</h1>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center space-x-2">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavClick(item.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === item.id
                ? 'bg-blue-900 text-white'
                : 'text-blue-100 hover:bg-blue-700'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <button onClick={onMenuToggle} className="text-white hover:text-gray-200">
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </header>
  );
};

export default Header;
