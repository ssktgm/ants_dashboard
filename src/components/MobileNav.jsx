import React from 'react';

const MobileNav = ({ isOpen, onClose, onNavClick, activeTab, navItems }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
      onClick={onClose}
    >
      <div 
        className="fixed top-0 left-0 w-64 h-full bg-white shadow-xl z-50 p-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-center h-16 border-b">
            <img src="/logo.png" alt="Ants" className="h-10" />
        </div>
        <nav className="mt-4">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => onNavClick(item.id)}
              className={`w-full flex items-center p-3 my-1 rounded-lg text-left transition-colors ${
                activeTab === item.id
                  ? 'bg-primary-100 text-primary-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <item.icon size={20} className="mr-4" />
              <span className="font-semibold">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default MobileNav;
