import React from 'react';
import { Menu, X } from 'lucide-react';

const Header = ({ onMenuToggle, isMenuOpen, navItems, activeTab, onNavClick }) => {
  return (
    <header className="bg-white shadow-sm flex items-center justify-between p-4 border-b z-20">
      <div className="flex items-center">
        <h1 className="text-xl font-bold text-gray-800">⚾️ ありんこアントス Dashboard</h1>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center space-x-2">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onNavClick(item.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === item.id
                ? 'bg-primary-100 text-primary-600'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <button onClick={onMenuToggle} className="text-gray-600 hover:text-gray-900">
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </header>
  );
};

export default Header;
