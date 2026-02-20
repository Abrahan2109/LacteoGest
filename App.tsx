
import React, { useState } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import MateriaPrima from './components/MateriaPrima';
import Produccion from './components/Produccion';
import Recetas from './components/Recetas';
import Pedidos from './components/Pedidos';
import { AppTab } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);

  const renderContent = () => {
    switch (activeTab) {
      case AppTab.DASHBOARD:
        return <Dashboard />;
      case AppTab.MATERIA_PRIMA:
        return <MateriaPrima />;
      case AppTab.PRODUCCION:
        return <Produccion />;
      case AppTab.RECETAS:
        return <Recetas />;
      case AppTab.STOCK:
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-brand/30 text-center px-4">
            <span className="text-7xl mb-6">📦</span>
            <p className="text-xl font-bold text-brand italic">Inventario de Salida</p>
            <p className="text-sm text-slate-400 max-w-xs mt-2">Control de despacho y logística de productos ABBA FOODS.</p>
          </div>
        );
      case AppTab.PEDIDOS:
        return <Pedidos />;
      case AppTab.VENTAS:
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-brand/30 text-center px-4">
            <span className="text-7xl mb-6">💰</span>
            <p className="text-xl font-bold text-brand italic">Módulo de Ventas</p>
            <p className="text-sm text-slate-400 max-w-xs mt-2">Control de ingresos y flujo de caja ABBA FOODS.</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Navigation currentTab={activeTab} setTab={setActiveTab} />
      
      <main className="flex-1 p-4 md:p-10 pb-24 md:pb-10 max-w-6xl mx-auto w-full">
        <div className="md:hidden flex items-center justify-between mb-8">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-brand tracking-tighter uppercase leading-none">ABBA FOODS</h1>
            <span className="text-[10px] font-bold text-accent uppercase tracking-[0.2em] mt-1">Quality Dairy</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center text-white font-black shadow-lg shadow-brand/20">A</div>
          </div>
        </div>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
