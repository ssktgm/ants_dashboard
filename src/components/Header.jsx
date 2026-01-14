import React from 'react';
import { Menu, X } from 'lucide-react';

const Header = ({ title, isMenuOpen, onMenuToggle }) => {
  return (
    <header className="bg-white shadow-sm flex items-center justify-between p-4 border-b z-20 md:hidden">
      <div className="flex items-center">
        <img src="/logo.png" alt="Ants" className="h-8" />
        <h1 className="text-xl font-bold text-gray-800 ml-4">{title}</h1>
      </div>
      <button onClick={onMenuToggle} className="text-gray-600 hover:text-gray-900">
        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
    </header>
  );
};

export default Header;
