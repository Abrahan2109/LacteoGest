
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { RawMaterial } from '../types';

const Dashboard: React.FC = () => {
  // Simulación de datos de materiales para generar alertas dinámicas
  const materials: RawMaterial[] = [
    { id: '1', name: 'Leche Cruda', provider: 'Hacienda La Gloria', quantity: 8, unit: 'L', expiryDate: '2024-10-25', type: 'leche', minThreshold: 10 },
    { id: '3', name: 'Cultivo Láctico', provider: 'BioDairy S.A.', quantity: 3, unit: 'Sobres', expiryDate: '2025-02-20', type: 'insumo', minThreshold: 5 },
  ];

  const prodData = [
    { name: 'Lun', valor: 450 },
    { name: 'Mar', valor: 520 },
    { name: 'Mie', valor: 480 },
    { name: 'Jue', valor: 610 },
    { name: 'Vie', valor: 580 },
    { name: 'Sab', valor: 300 },
  ];

  const pieData = [
    { name: 'YG Neutro', value: 400 },
    { name: 'YG Café', value: 250 },
    { name: 'YG Cacao', value: 300 },
    { name: 'YG Vainilla', value: 350 },
  ];

  const BRAND_COLORS = ['#67291d', '#e1ad80', '#000000', '#c18b76'];

  // Lógica de alertas dinámicas
  const lowStockAlerts = materials.filter(m => m.quantity < m.minThreshold);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-brand">Resumen de Planta</h2>
        <p className="text-slate-500">Producción de Yogur Griego</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Leche Cruda', val: '8 L', color: 'bg-red-600', icon: '🥛' },
          { label: 'En Incubación', val: '4 Lotes', color: 'bg-accent', icon: '⚙️' },
          { label: 'Pedidos Hoy', val: '18', color: 'bg-brand', icon: '📦' },
          { label: 'Ventas Mes', val: '$38,200', color: 'bg-accent', icon: '💰' },
        ].map((stat, i) => (
          <div key={i} className={`bg-white p-4 rounded-2xl border shadow-sm flex items-center space-x-4 ${stat.color === 'bg-red-600' ? 'border-red-200 bg-red-50/30' : 'border-slate-200'}`}>
            <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center text-white text-xl shadow-lg`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{stat.label}</p>
              <p className={`text-lg font-bold ${stat.color === 'bg-red-600' ? 'text-red-600' : 'text-dark'}`}>{stat.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Alertas Automáticas Críticas */}
      {lowStockAlerts.length > 0 && (
        <div className="bg-red-50 p-4 rounded-2xl border border-red-200">
          <h3 className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-3 flex items-center">
            <span className="mr-2">🚨</span> Alertas Críticas de Inventario
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lowStockAlerts.map(m => (
              <div key={m.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-red-100 shadow-sm">
                <div>
                  <p className="text-sm font-bold text-dark">{m.name}</p>
                  <p className="text-[10px] text-red-500 font-medium italic">Stock actual: {m.quantity} {m.unit} (Mín: {m.minThreshold})</p>
                </div>
                <div className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded uppercase">Reponer</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-brand mb-4 uppercase tracking-tighter">Producción Semanal (Unidades)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={prodData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} />
                <Tooltip 
                  cursor={{ fill: '#fcfaf9' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(103,41,29,0.1)' }}
                />
                <Bar dataKey="valor" fill="#67291d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-brand mb-4 uppercase tracking-tighter">Popularidad por Sabor</h3>
          <div className="h-64 w-full flex flex-col items-center justify-center">
             <ResponsiveContainer width="100%" height="70%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BRAND_COLORS[index % BRAND_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
             </ResponsiveContainer>
             <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center text-[10px]">
                    <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: BRAND_COLORS[i] }} />
                    <span className="text-slate-600 font-semibold">{d.name}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
