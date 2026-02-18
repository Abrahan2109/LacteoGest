
import React, { useState, useMemo, useEffect } from 'react';
import { Recipe, RawMaterial } from '../types';
import { hasSupabaseEnv, supabase } from '../supabaseClient';

const Produccion: React.FC = () => {
  const [milkVolume, setMilkVolume] = useState<number>(0);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  const [stock, setStock] = useState<RawMaterial[]>([]);
  const [formulas, setFormulas] = useState<Recipe[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (hasSupabaseEnv && supabase) {
          const matsRes = await supabase.from('materials').select('id,name,provider,quantity,unit,expiry_date,type,min_threshold');
          if (matsRes.error) throw new Error(matsRes.error.message);
          const mappedMats: RawMaterial[] = (matsRes.data || []).map((m:any)=>({
            id: m.id,
            name: m.name,
            provider: m.provider ?? '',
            quantity: Number(m.quantity ?? 0),
            unit: m.unit ?? '',
            expiryDate: m.expiry_date ? String(m.expiry_date) : 'N/A',
            type: m.type,
            minThreshold: Number(m.min_threshold ?? 0),
          }));
          setStock(mappedMats);
          const recRes = await supabase.from('recipes').select('id,name,recipe_ingredients(id,material_name,amount_per_liter,unit)');
          if (recRes.error) throw new Error(recRes.error.message);
          const mappedRecipes: Recipe[] = (recRes.data || []).map((r:any)=>({
            id: r.id,
            name: r.name,
            baseMilk: 1,
            ingredients: (r.recipe_ingredients || []).map((ing:any)=>({
              materialId: ing.material_id || '',
              materialName: ing.material_name || '',
              amountPerLiter: Number(ing.amount_per_liter || 0),
              unit: ing.unit || '',
            })),
            notes: ''
          }));
          setFormulas(mappedRecipes);
          if (!selectedRecipeId && mappedRecipes[0]?.id) setSelectedRecipeId(mappedRecipes[0].id);
        } else {
          setStock([]);
          setFormulas([]);
        }
      } catch (e:any) {
        setError(e.message || 'Error cargando datos');
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      {loading && <div className="p-4 bg-white rounded-2xl border text-sm">Cargando…</div>}
      {!loading && error && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm">{error}</div>}

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
              disabled={saving || !hasSupabaseEnv || isMilkShort || requirements.some(r => r.isShort) || !currentRecipe}
              onClick={async ()=>{
                if (!hasSupabaseEnv || !supabase || !currentRecipe) return;
                setSaving(true);
                setError(null);
                try {
                  const batch = `BATCH-${new Date().toISOString().replace(/[-:T]/g,'').slice(0,12)}`;
                  const payload = {
                    recipe_id: currentRecipe.id,
                    date: new Date().toISOString().slice(0,10),
                    batch,
                    status: 'en_proceso',
                    milk_volume: milkVolume,
                    quantity_produced: 0,
                    waste: 0
                  };
                  const { error } = await supabase.from('production_orders').insert(payload);
                  if (error) throw new Error(error.message);
                } catch (e:any) {
                  setError(e.message || 'No se pudo crear la orden');
                } finally {
                  setSaving(false);
                }
              }}
              className="w-full mt-6 bg-brand text-white font-bold py-4 rounded-2xl shadow-xl shadow-brand/20 hover:bg-black transition-all disabled:bg-slate-300 disabled:shadow-none uppercase tracking-widest text-sm"
            >
              {saving ? 'Guardando…' : 'Lanzar Orden de Producción'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Produccion;
