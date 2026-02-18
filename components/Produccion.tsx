
import React, { useState, useMemo } from 'react';
import { ProductionOrder, Recipe, RawMaterial } from '../types';

const Produccion: React.FC = () => {
  const [milkVolume, setMilkVolume] = useState<number>(0);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('1');

  // Datos de stock para comparación (Mock)
  const stock: RawMaterial[] = [
    { id: 'm1', name: 'Cultivo Láctico', provider: 'BioDairy', quantity: 3, unit: 'Sobres', expiryDate: '2025', type: 'insumo', minThreshold: 5 },
    { id: 'm2', name: 'Leche en Polvo', provider: 'DairyGold', quantity: 5000, unit: 'gr', expiryDate: '2025', type: 'insumo', minThreshold: 1000 },
    { id: 'm10', name: 'Leche Cruda', provider: 'Hacienda', quantity: 150, unit: 'L', expiryDate: '2025', type: 'leche', minThreshold: 50 }
  ];

  const formulas: Recipe[] = [
    {
      id: '1',
      name: 'Yogur Griego Base',
      baseMilk: 1,
      ingredients: [
        { materialId: 'm1', materialName: 'Cultivo Láctico', amountPerLiter: 0.05, unit: 'Sobres' },
        { materialId: 'm2', materialName: 'Leche en Polvo (Refuerzo)', amountPerLiter: 30, unit: 'gr' }
      ],
      notes: ''
    }
  ];

  const currentRecipe = useMemo(() => formulas.find(f => f.id === selectedRecipeId), [selectedRecipeId]);

  const requirements = useMemo(() => {
    if (!currentRecipe || milkVolume <= 0) return [];
    return currentRecipe.ingredients.map(ing => {
      const needed = ing.amountPerLiter * milkVolume;
      const available = stock.find(s => s.id === ing.materialId)?.quantity || 0;
      return {
        ...ing,
        totalNeeded: needed,
        available,
        isShort: available < needed
      };
    });
  }, [currentRecipe, milkVolume]);

  const milkInStock = stock.find(s => s.type === 'leche')?.quantity || 0;
  const isMilkShort = milkInStock < milkVolume;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-brand">Planta de Proceso</h2>
          <p className="text-slate-500">Órdenes de Producción</p>
        </div>
      </div>

      {/* Calculadora de Requerimientos */}
      <div className="bg-white p-6 rounded-2xl border-2 border-brand/10 shadow-sm space-y-6">
        <h3 className="text-sm font-black text-brand uppercase tracking-widest flex items-center">
          <span className="mr-2">🧪</span> Calculador de Insumos Automático
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Seleccionar Fórmula</label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-dark font-bold focus:ring-2 focus:ring-brand outline-none"
              value={selectedRecipeId}
              onChange={(e) => setSelectedRecipeId(e.target.value)}
            >
              {formulas.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Litros de Leche a Procesar</label>
            <input 
              type="number"
              className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-dark font-bold focus:ring-2 focus:ring-brand outline-none"
              placeholder="Ej: 50"
              value={milkVolume || ''}
              onChange={(e) => setMilkVolume(Number(e.target.value))}
            />
          </div>
        </div>

        {milkVolume > 0 && (
          <div className="pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-4 tracking-tighter">Reporte de Requerimientos Totales</h4>
            
            <div className="space-y-3">
              {/* Requerimiento de Leche */}
              <div className={`p-4 rounded-xl border flex justify-between items-center ${isMilkShort ? 'bg-red-50 border-red-200' : 'bg-brand/5 border-brand/10'}`}>
                <div>
                  <p className="text-sm font-bold text-dark italic">Leche Cruda Necesaria</p>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">En stock: {milkInStock} L</p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-black ${isMilkShort ? 'text-red-600' : 'text-brand'}`}>{milkVolume} L</p>
                  {isMilkShort && <p className="text-[10px] font-bold text-red-600 uppercase">Stock Insuficiente</p>}
                </div>
              </div>

              {/* Insumos */}
              {requirements.map((req, idx) => (
                <div key={idx} className={`p-4 rounded-xl border flex justify-between items-center ${req.isShort ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
                  <div>
                    <p className="text-sm font-bold text-dark italic">{req.materialName}</p>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">En stock: {req.available} {req.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-black ${req.isShort ? 'text-red-600' : 'text-brand'}`}>
                      {req.totalNeeded.toFixed(2)} <span className="text-[10px] uppercase">{req.unit}</span>
                    </p>
                    {req.isShort && <p className="text-[10px] font-bold text-red-600 uppercase">Stock Insuficiente</p>}
                  </div>
                </div>
              ))}
            </div>

            <button 
              disabled={isMilkShort || requirements.some(r => r.isShort)}
              className="w-full mt-6 bg-brand text-white font-bold py-4 rounded-2xl shadow-xl shadow-brand/20 hover:bg-black transition-all disabled:bg-slate-300 disabled:shadow-none uppercase tracking-widest text-sm"
            >
              Lanzar Orden de Producción
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Produccion;
