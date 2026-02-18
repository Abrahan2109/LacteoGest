
import React, { useEffect, useState } from 'react';
import { RawMaterial } from '../types';
import { supabase, hasSupabaseEnv } from '../supabaseClient';

const MateriaPrima: React.FC = () => {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [form, setForm] = useState({
    name: '',
    provider: '',
    quantity: '',
    unit: '',
    expiry_date: '',
    type: 'insumo',
    min_threshold: '',
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      if (hasSupabaseEnv && supabase) {
        const { data, error } = await supabase
          .from('materials')
          .select('id,name,provider,quantity,unit,expiry_date,type,min_threshold')
          .order('name', { ascending: true });
        if (error) {
          setError(error.message);
        } else {
          const mapped: RawMaterial[] = (data || []).map((m: any) => ({
            id: m.id,
            name: m.name,
            provider: m.provider ?? '',
            quantity: Number(m.quantity ?? 0),
            unit: m.unit ?? '',
            expiryDate: m.expiry_date ? String(m.expiry_date) : 'N/A',
            type: m.type,
            minThreshold: Number(m.min_threshold ?? 0),
          }));
          setMaterials(mapped);
        }
      } else {
        setMaterials([
          { id: '1', name: 'Leche Cruda', provider: 'Hacienda La Gloria', quantity: 8, unit: 'L', expiryDate: '2024-10-25', type: 'leche', minThreshold: 10 },
          { id: '2', name: 'Cuajo Líquido', provider: 'BioDairy S.A.', quantity: 2.5, unit: 'L', expiryDate: '2025-01-15', type: 'insumo', minThreshold: 1 },
          { id: '3', name: 'Cultivo Láctico', provider: 'BioDairy S.A.', quantity: 3, unit: 'Sobres', expiryDate: '2025-02-20', type: 'insumo', minThreshold: 5 },
          { id: '4', name: 'Envase Yogurt 1L', provider: 'PackMaster', quantity: 500, unit: 'Uds', expiryDate: 'N/A', type: 'empaque', minThreshold: 100 },
        ]);
      }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-brand">Materia Prima</h2>
          <p className="text-slate-500">Gestión de inventario e insumos</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-brand text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-brand/20 hover:bg-black transition-all"
        >
          + Nuevo Ingreso
        </button>
      </div>

      {loading && (
        <div className="p-4 bg-white rounded-xl border text-sm">Cargando…</div>
      )}
      {!loading && error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
      )}

      {showForm && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-brand mb-4 uppercase tracking-widest">Nuevo Ingreso</h3>
          {!hasSupabaseEnv && (
            <p className="text-[12px] text-red-600 mb-3">Configura SUPABASE_URL y SUPABASE_ANON_KEY para guardar en la nube.</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="bg-slate-50 border border-slate-200 p-3 rounded-xl" placeholder="Nombre"
              value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} />
            <input className="bg-slate-50 border border-slate-200 p-3 rounded-xl" placeholder="Proveedor"
              value={form.provider} onChange={(e)=>setForm({...form, provider: e.target.value})} />
            <div className="flex gap-2">
              <input className="bg-slate-50 border border-slate-200 p-3 rounded-xl w-full" placeholder="Cantidad"
                type="number" value={form.quantity} onChange={(e)=>setForm({...form, quantity: e.target.value})} />
              <input className="bg-slate-50 border border-slate-200 p-3 rounded-xl w-28" placeholder="Unidad"
                value={form.unit} onChange={(e)=>setForm({...form, unit: e.target.value})} />
            </div>
            <input className="bg-slate-50 border border-slate-200 p-3 rounded-xl" placeholder="Vencimiento (YYYY-MM-DD)"
              value={form.expiry_date} onChange={(e)=>setForm({...form, expiry_date: e.target.value})} />
            <select className="bg-slate-50 border border-slate-200 p-3 rounded-xl"
              value={form.type} onChange={(e)=>setForm({...form, type: e.target.value})}>
              <option value="leche">Leche</option>
              <option value="insumo">Insumo</option>
              <option value="empaque">Empaque</option>
            </select>
            <input className="bg-slate-50 border border-slate-200 p-3 rounded-xl" placeholder="Stock mínimo"
              type="number" value={form.min_threshold} onChange={(e)=>setForm({...form, min_threshold: e.target.value})} />
          </div>
          <div className="mt-4 flex gap-3">
            <button
              disabled={saving}
              onClick={async ()=>{
                setSaving(true);
                setError(null);
                try {
                  if (hasSupabaseEnv && supabase) {
                    const payload = {
                      name: form.name.trim(),
                      provider: form.provider.trim() || null,
                      quantity: Number(form.quantity || 0),
                      unit: form.unit.trim(),
                      expiry_date: form.expiry_date ? form.expiry_date : null,
                      type: form.type as any,
                      min_threshold: Number(form.min_threshold || 0),
                    };
                    const { error } = await supabase.from('materials').insert(payload);
                    if (error) throw new Error(error.message);
                    const { data } = await supabase
                      .from('materials')
                      .select('id,name,provider,quantity,unit,expiry_date,type,min_threshold')
                      .order('name', { ascending: true });
                    const mapped: RawMaterial[] = (data || []).map((m: any) => ({
                      id: m.id,
                      name: m.name,
                      provider: m.provider ?? '',
                      quantity: Number(m.quantity ?? 0),
                      unit: m.unit ?? '',
                      expiryDate: m.expiry_date ? String(m.expiry_date) : 'N/A',
                      type: m.type,
                      minThreshold: Number(m.min_threshold ?? 0),
                    }));
                    setMaterials(mapped);
                    setShowForm(false);
                    setForm({name:'',provider:'',quantity:'',unit:'',expiry_date:'',type:'insumo',min_threshold:''});
                  } else {
                    const id = String(Date.now());
                    const m: RawMaterial = {
                      id,
                      name: form.name,
                      provider: form.provider,
                      quantity: Number(form.quantity || 0),
                      unit: form.unit,
                      expiryDate: form.expiry_date || 'N/A',
                      type: form.type as any,
                      minThreshold: Number(form.min_threshold || 0),
                    };
                    setMaterials(prev => [m, ...prev]);
                    setShowForm(false);
                    setForm({name:'',provider:'',quantity:'',unit:'',expiry_date:'',type:'insumo',min_threshold:''});
                  }
                } catch (e:any) {
                  setError(e.message || 'No se pudo guardar');
                } finally {
                  setSaving(false);
                }
              }}
              className="bg-brand text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-brand/20 hover:bg-black transition-all"
            >
              Guardar
            </button>
            <button
              disabled={saving}
              onClick={()=>setShowForm(false)}
              className="bg-slate-100 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-bold border"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-brand font-bold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-6 py-4">Insumo</th>
              <th className="px-6 py-4">Tipo</th>
              <th className="px-6 py-4 text-center">Stock Actual</th>
              <th className="px-6 py-4 text-center">Mínimo</th>
              <th className="px-6 py-4">Vencimiento</th>
              <th className="px-6 py-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {materials.map((m) => {
              const isLowStock = m.quantity < m.minThreshold;
              return (
                <tr key={m.id} className={`hover:bg-slate-50 transition-colors ${isLowStock ? 'bg-red-50/30' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {isLowStock && <span title="Stock Bajo" className="text-red-600 animate-pulse text-lg">⚠️</span>}
                      <div>
                        <p className={`font-bold ${isLowStock ? 'text-red-700' : 'text-dark'}`}>{m.name}</p>
                        <p className="text-[10px] text-slate-500">{m.provider}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                      m.type === 'leche' ? 'bg-orange-50 text-brand border border-brand/10' :
                      m.type === 'insumo' ? 'bg-accent/20 text-brand' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {m.type}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-center font-mono font-bold ${isLowStock ? 'text-red-600 text-lg' : 'text-brand'}`}>
                    {m.quantity} {m.unit}
                  </td>
                  <td className="px-6 py-4 text-center text-slate-400 font-mono text-xs">
                    {m.minThreshold} {m.unit}
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs font-medium">
                    {m.expiryDate}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-accent hover:text-brand font-bold uppercase text-[10px]">Gestionar</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile view cards */}
      <div className="grid grid-cols-1 gap-4 md:hidden pb-4">
        {materials.map((m) => {
          const isLowStock = m.quantity < m.minThreshold;
          return (
            <div key={m.id} className={`bg-white p-4 rounded-2xl border shadow-sm border-l-4 ${isLowStock ? 'border-red-600 bg-red-50/10' : 'border-l-brand border-slate-200'}`}>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className={`font-bold leading-none ${isLowStock ? 'text-red-700' : 'text-dark'}`}>{m.name}</h4>
                    {isLowStock && <span className="text-xs bg-red-600 text-white px-1.5 rounded-full font-black animate-pulse">!</span>}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase font-semibold">{m.provider}</p>
                </div>
                <div className="text-right">
                  <span className={`font-bold text-lg ${isLowStock ? 'text-red-600' : 'text-brand'}`}>{m.quantity}</span>
                  <span className="text-[10px] font-medium text-slate-400 ml-1">{m.unit}</span>
                </div>
              </div>
              <div className="flex justify-between items-end border-t border-slate-50 pt-3 mt-1">
                <span className="text-[9px] text-slate-400 font-bold uppercase italic">Mínimo: {m.minThreshold} {m.unit}</span>
                <button className={`${isLowStock ? 'bg-red-600 text-white' : 'bg-accent/20 text-brand'} px-3 py-1 rounded-lg text-[10px] font-bold uppercase`}>
                  {isLowStock ? 'REPONER' : 'EDITAR'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MateriaPrima;
