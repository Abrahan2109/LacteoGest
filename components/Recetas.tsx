
import React from 'react';
import { Recipe } from '../types';

const Recetas: React.FC = () => {
  const formulas: Recipe[] = [
    {
      id: '1',
      name: 'Yogur Griego Base',
      baseMilk: 1,
      ingredients: [
        { materialId: 'm1', materialName: 'Cultivo Láctico', amountPerLiter: 0.05, unit: 'Sobres' },
        { materialId: 'm2', materialName: 'Leche en Polvo (Refuerzo)', amountPerLiter: 30, unit: 'gr' },
        { materialId: 'm3', materialName: 'Vainilla Natural', amountPerLiter: 2, unit: 'ml' }
      ],
      notes: 'Incubación a 42°C por 8 horas. Desuerado lento.'
    },
    {
      id: '2',
      name: 'Yogur Café Gourmet',
      baseMilk: 1,
      ingredients: [
        { materialId: 'm1', materialName: 'Cultivo Láctico', amountPerLiter: 0.05, unit: 'Sobres' },
        { materialId: 'm4', materialName: 'Extracto Café Abba', amountPerLiter: 15, unit: 'ml' },
        { materialId: 'm5', materialName: 'Azúcar Orgánica', amountPerLiter: 40, unit: 'gr' }
      ],
      notes: 'Añadir el café después del proceso de fermentación.'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-brand">Formulaciones</h2>
          <p className="text-slate-500">Unidad Base: 1 Litro de Leche</p>
        </div>
        <button className="bg-brand text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-brand/20 hover:bg-black transition-all">
          + Nueva Fórmula
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {formulas.map(recipe => (
          <div key={recipe.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 bg-brand text-white">
              <h3 className="text-lg font-bold">{recipe.name}</h3>
              <p className="text-[10px] uppercase font-bold text-accent italic">Coeficientes por Litro</p>
            </div>
            <div className="p-5 flex-1 space-y-4">
              <div className="space-y-2">
                {recipe.ingredients.map((ing, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-600 font-medium">{ing.materialName}</span>
                    <span className="font-mono font-bold text-brand">{ing.amountPerLiter} {ing.unit}</span>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-slate-50">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Notas Técnicas</p>
                <p className="text-xs text-slate-600 leading-relaxed italic">"{recipe.notes}"</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 flex gap-2">
              <button className="flex-1 bg-white border border-slate-200 text-brand text-xs font-bold py-2 rounded-lg hover:bg-slate-100 transition-colors uppercase">Editar Coeficientes</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Recetas;
