
import React from 'react';
import { AppTab } from '../types';

interface NavProps {
  currentTab: AppTab;
  setTab: (tab: AppTab) => void;
}

const Navigation: React.FC<NavProps> = ({ currentTab, setTab }) => {
  const menuItems = [
    { id: AppTab.DASHBOARD, label: 'Inicio', icon: '📊' },
    { id: AppTab.MATERIA_PRIMA, label: 'Insumos', icon: '🥛' },
    { id: AppTab.RECETAS, label: 'Recetas', icon: '📝' },
    { id: AppTab.PRODUCCION, label: 'Planta', icon: '🏭' },
    { id: AppTab.STOCK, label: 'Stock', icon: '📦' },
    { id: AppTab.PEDIDOS, label: 'Pedidos', icon: '📋' },
    { id: AppTab.VENTAS, label: 'Ventas', icon: '💰' },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center h-16 px-2 z-50">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`flex flex-col items-center justify-center flex-1 transition-colors ${
              currentTab === item.id ? 'text-brand' : 'text-slate-400'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[10px] font-bold uppercase mt-0.5">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0">
        <div className="p-6 border-b border-slate-100 bg-brand">
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase">ABBA FOODS</h1>
          <p className="text-[10px] text-accent font-bold uppercase tracking-widest leading-none mt-1">Gourmet Dairy System</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`w-full flex items-center px-6 py-3 transition-all ${
                currentTab === item.id
                  ? 'bg-orange-50 text-brand border-r-4 border-brand font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="text-xl mr-4">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-brand font-bold">A</div>
            <div>
              <p className="text-xs font-bold text-brand">Admin ABBA</p>
              <p className="text-[10px] text-slate-500 uppercase">Planta Principal</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Navigation;
