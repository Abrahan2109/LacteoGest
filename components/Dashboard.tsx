
import React, { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { RawMaterial } from '../types';
import { hasSupabaseEnv, supabase } from '../supabaseClient';

type ProdOrder = {
  id: string;
  recipe_id: string;
  date: string;
  status: 'en_proceso' | 'terminado';
  milk_volume: number;
  quantity_produced: number;
  waste: number;
};
type RecipeRow = { id: string; name: string };

const dayLabels = ['Dom','Lun','Mar','Mie','Jue','Vie','Sab'];
const formatDay = (d: Date) => dayLabels[d.getDay()];

const Dashboard: React.FC = () => {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [orders, setOrders] = useState<ProdOrder[]>([]);
  const [recipes, setRecipes] = useState<RecipeRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (hasSupabaseEnv && supabase) {
          const [matRes, ordRes, recRes] = await Promise.all([
            supabase.from('materials').select('id,name,provider,quantity,unit,expiry_date,type,min_threshold'),
            supabase.from('production_orders').select('id,recipe_id,date,status,milk_volume,quantity_produced,waste'),
            supabase.from('recipes').select('id,name')
          ]);
          if (matRes.error) throw new Error(matRes.error.message);
          if (ordRes.error) throw new Error(ordRes.error.message);
          if (recRes.error) throw new Error(recRes.error.message);
          const mappedMaterials: RawMaterial[] = (matRes.data ?? []).map((m: any) => ({
            id: m.id,
            name: m.name,
            provider: m.provider ?? '',
            quantity: Number(m.quantity ?? 0),
            unit: m.unit ?? '',
            expiryDate: m.expiry_date ? String(m.expiry_date) : 'N/A',
            type: m.type,
            minThreshold: Number(m.min_threshold ?? 0),
          }));
          setMaterials(mappedMaterials);
          setOrders((ordRes.data ?? []) as ProdOrder[]);
          setRecipes((recRes.data ?? []) as RecipeRow[]);
        } else {
          setMaterials([]);
          setOrders([]);
          setRecipes([]);
        }
      } catch (e: any) {
        setError(e.message ?? 'Error cargando datos');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const lecheTotal = useMemo(() => {
    return materials
      .filter(m => m.type === 'leche')
      .reduce((acc, m) => acc + (Number.isFinite(m.quantity) ? m.quantity : 0), 0);
  }, [materials]);

  const enProceso = useMemo(() => orders.filter(o => o.status === 'en_proceso').length, [orders]);
  const ordenesHoy = useMemo(() => {
    const today = new Date().toISOString().slice(0,10);
    return orders.filter(o => (o.date ?? '').slice(0,10) === today).length;
  }, [orders]);
  const produccionMes = useMemo(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    return orders
      .filter(o => (o.date ?? '').startsWith(ym))
      .reduce((acc, o) => acc + (Number.isFinite(o.quantity_produced) ? o.quantity_produced : 0), 0);
  }, [orders]);

  const prodData = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      map.set(formatDay(d), 0);
    }
    orders.forEach(o => {
      const d = new Date(o.date);
      const key = formatDay(d);
      if (map.has(key)) {
        map.set(key, (map.get(key) || 0) + (o.quantity_produced || 0));
      }
    });
    return Array.from(map.entries()).map(([name, valor]) => ({ name, valor }));
  }, [orders]);

  const pieData = useMemo(() => {
    if (recipes.length === 0 || orders.length === 0) return [];
    const nameById = new Map(recipes.map(r => [r.id, r.name]));
    const totals = new Map<string, number>();
    orders.forEach(o => {
      const n = nameById.get(o.recipe_id) || 'Otra';
      totals.set(n, (totals.get(n) || 0) + 1);
    });
    return Array.from(totals.entries()).map(([name, value]) => ({ name, value }));
  }, [recipes, orders]);

  const BRAND_COLORS = ['#67291d', '#e1ad80', '#000000', '#c18b76'];
  const lowStockAlerts = materials.filter(m => m.quantity < m.minThreshold);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-brand">Resumen de Planta</h2>
        <p className="text-slate-500">Producción en vivo</p>
        <div className="mt-2">
          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${hasSupabaseEnv ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {hasSupabaseEnv ? 'Supabase configurado' : 'Supabase sin configuración'}
          </span>
        </div>
      </header>

      {loading && (
        <div className="p-4 bg-white rounded-xl border text-sm">Cargando datos…</div>
      )}
      {!loading && error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Leche Total', val: `${lecheTotal} L`, color: lecheTotal === 0 ? 'bg-red-600' : 'bg-accent', icon: '🥛' },
          { label: 'En Proceso', val: `${enProceso} Lotes`, color: 'bg-accent', icon: '⚙️' },
          { label: 'Órdenes Hoy', val: `${ordenesHoy}`, color: 'bg-brand', icon: '📦' },
          { label: 'Producción Mes', val: `${produccionMes}`, color: 'bg-accent', icon: '💰' },
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
          {prodData.length === 0 ? (
            <div className="text-sm text-slate-500">Sin datos de producción recientes</div>
          ) : (
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
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-brand mb-4 uppercase tracking-tighter">Popularidad por Sabor</h3>
          {pieData.length === 0 ? (
            <div className="text-sm text-slate-500">Sin datos suficientes para agrupar por receta</div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
