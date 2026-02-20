
import React, { useEffect, useState } from 'react';
import { RawMaterial } from '../types';
import { supabase, hasSupabaseEnv } from '../supabaseClient';

interface UiPresentation {
  id: string;
  presentation: string;
  brand: string;
  packageQuantity: number;
  packageUnit: string;
  packageCost: number;
  availablePackages: number;
  deleted?: boolean;
  transportCost?: number;
}

const MateriaPrima: React.FC = () => {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [editMaterial, setEditMaterial] = useState<RawMaterial | null>(null);
  const [editQuantity, setEditQuantity] = useState<string>('');
  const [editMinThreshold, setEditMinThreshold] = useState<string>('');
  const [editSaving, setEditSaving] = useState<boolean>(false);
   const [editName, setEditName] = useState<string>('');
   const [editProvider, setEditProvider] = useState<string>('');
  const [presentations, setPresentations] = useState<Record<string, UiPresentation[]>>({});
  const [hasPresentationsTable, setHasPresentationsTable] = useState<boolean>(true);
  const [detailMaterialId, setDetailMaterialId] = useState<string | null>(null);
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
        const matsRes = await supabase
          .from('materials')
          .select('id,name,provider,quantity,unit,expiry_date,type,min_threshold')
          .order('name', { ascending: true });
        if (matsRes.error) throw new Error(matsRes.error.message);
        const mapped: RawMaterial[] = (matsRes.data || []).map((m: any) => ({
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
        try {
          const presRes = await supabase
            .from('material_presentations')
            .select('id,material_id,presentation,brand,package_quantity,package_unit,package_cost,available_packages,transport_cost');
          if (presRes.error) {
            const msg = presRes.error.message || '';
            if (msg.includes('material_presentations')) {
              setHasPresentationsTable(false);
            } else {
              throw new Error(msg);
            }
          } else {
            const byMaterial: Record<string, UiPresentation[]> = {};
            (presRes.data || []).forEach((p: any) => {
              const materialId = p.material_id;
              if (!byMaterial[materialId]) byMaterial[materialId] = [];
              byMaterial[materialId].push({
                id: p.id,
                presentation: p.presentation || '',
                brand: p.brand || '',
                packageQuantity: p.package_quantity ? Number(p.package_quantity) : 0,
                packageUnit: p.package_unit || '',
                packageCost: p.package_cost ? Number(p.package_cost) : 0,
                availablePackages: p.available_packages ? Number(p.available_packages) : 0,
                deleted: false,
                transportCost: p.transport_cost ? Number(p.transport_cost) : 0,
              });
            });
            setPresentations(byMaterial);
          }
        } catch (e: any) {
          const msg = e?.message || String(e || '');
          if (msg.includes('material_presentations')) {
            setHasPresentationsTable(false);
          } else {
            setError(msg);
          }
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

  const handleChangePresentationField = (
    materialId: string,
    presentationId: string,
    field: keyof Omit<UiPresentation, 'id' | 'deleted'>,
    value: string
  ) => {
    setPresentations(prev => {
      const current = prev[materialId] || [];
      const updated = current.map(p =>
        p.id === presentationId
          ? {
              ...p,
              [field]:
                field === 'packageQuantity' ||
                field === 'packageCost' ||
                field === 'availablePackages' ||
                field === 'transportCost'
                  ? Number(value)
                  : value,
            }
          : p
      );
      return { ...prev, [materialId]: updated };
    });
  };

  const handleAddPresentation = (materialId: string) => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setPresentations(prev => {
      const current = prev[materialId] || [];
      const updated: UiPresentation[] = [
        ...current,
        {
          id: tempId,
          presentation: '',
          brand: '',
          packageQuantity: 0,
          packageUnit: '',
          packageCost: 0,
          availablePackages: 0,
          deleted: false,
        },
      ];
      return { ...prev, [materialId]: updated };
    });
  };

  const handleToggleDeletePresentation = (materialId: string, presentationId: string) => {
    setPresentations(prev => {
      const current = prev[materialId] || [];
      const updated = current.map(p =>
        p.id === presentationId ? { ...p, deleted: !p.deleted } : p
      );
      return { ...prev, [materialId]: updated };
    });
  };

  const handleDeleteMaterial = async (material: RawMaterial) => {
    if (!window.confirm('¿Eliminar este insumo y todas sus presentaciones?')) return;
    setEditSaving(true);
    setError(null);
    try {
      if (hasSupabaseEnv && supabase) {
        const res = await supabase.from('materials').delete().eq('id', material.id);
        if (res.error) throw new Error(res.error.message);
      }
      setMaterials(prev => prev.filter(m => m.id !== material.id));
      setPresentations(prev => {
        const copy = { ...prev };
        delete copy[material.id];
        return copy;
      });
      if (detailMaterialId === material.id) {
        setDetailMaterialId(null);
      }
      if (editMaterial?.id === material.id) {
        setEditMaterial(null);
        setEditQuantity('');
        setEditMinThreshold('');
        setEditName('');
        setEditProvider('');
      }
    } catch (e: any) {
      setError(e.message || 'No se pudo eliminar');
    } finally {
      setEditSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editMaterial) return;
    setEditSaving(true);
    setError(null);
    const quantity = Number(editQuantity || 0);
    const minThreshold = Number(editMinThreshold || 0);
    try {
      if (hasSupabaseEnv && supabase) {
        const matsRes = await supabase
          .from('materials')
          .update({
            name: editName.trim() || editMaterial.name,
            provider: editProvider.trim() || null,
            quantity,
            min_threshold: minThreshold,
          })
          .eq('id', editMaterial.id);
        if (matsRes.error) throw new Error(matsRes.error.message);
        if (hasPresentationsTable) {
          const current = presentations[editMaterial.id] || [];
          const existing = current.filter(p => !p.id.startsWith('temp-'));
          const toUpdate = existing.filter(p => !p.deleted);
          const toDelete = existing.filter(p => p.deleted);
          const toInsert = current.filter(
            p => p.id.startsWith('temp-') && !p.deleted && p.presentation.trim()
          );
          try {
            await Promise.all([
              ...toUpdate.map(p =>
                supabase
                  .from('material_presentations')
                  .update({
                    presentation: p.presentation || null,
                    brand: p.brand || null,
                    package_quantity: p.packageQuantity || null,
                    package_unit: p.packageUnit || null,
                    package_cost: p.packageCost || null,
                    available_packages: p.availablePackages ?? 0,
                    transport_cost: p.transportCost || null,
                  })
                  .eq('id', p.id)
              ),
              ...toDelete.map(p =>
                supabase
                  .from('material_presentations')
                  .delete()
                  .eq('id', p.id)
              ),
              ...toInsert.map(p =>
                supabase.from('material_presentations').insert({
                  material_id: editMaterial.id,
                  presentation: p.presentation,
                  brand: p.brand || null,
                  package_quantity: p.packageQuantity || null,
                  package_unit: p.packageUnit || null,
                  package_cost: p.packageCost || null,
                  available_packages: p.availablePackages ?? 0,
                  transport_cost: p.transportCost || null,
                })
              ),
            ]);
            const presRes = await supabase
              .from('material_presentations')
              .select('id,material_id,presentation,brand,package_quantity,package_unit,package_cost,available_packages,transport_cost')
              .eq('material_id', editMaterial.id);
            if (presRes.error) {
              const msg = presRes.error.message || '';
              if (msg.includes('material_presentations')) {
                setHasPresentationsTable(false);
              } else {
                throw new Error(msg);
              }
            } else {
              const list: UiPresentation[] = (presRes.data || []).map((p: any) => ({
                id: p.id,
                presentation: p.presentation || '',
                brand: p.brand || '',
                packageQuantity: p.package_quantity ? Number(p.package_quantity) : 0,
                packageUnit: p.package_unit || '',
                packageCost: p.package_cost ? Number(p.package_cost) : 0,
                availablePackages: p.available_packages ? Number(p.available_packages) : 0,
                deleted: false,
                transportCost: p.transport_cost ? Number(p.transport_cost) : 0,
              }));
              setPresentations(prev => ({ ...prev, [editMaterial.id]: list }));
            }
          } catch (e: any) {
            const msg = e?.message || String(e || '');
            if (msg.includes('material_presentations')) {
              setHasPresentationsTable(false);
              setPresentations(prev => {
                const currentLocal = prev[editMaterial.id] || [];
                const filtered = currentLocal.filter(
                  p => !p.deleted && p.presentation.trim()
                );
                return { ...prev, [editMaterial.id]: filtered };
              });
            } else {
              throw e;
            }
          }
        } else {
          setPresentations(prev => {
            const currentLocal = prev[editMaterial.id] || [];
            const filtered = currentLocal.filter(
              p => !p.deleted && p.presentation.trim()
            );
            return { ...prev, [editMaterial.id]: filtered };
          });
        }
      } else {
        setPresentations(prev => {
          const current = prev[editMaterial.id] || [];
          const filtered = current.filter(p => !p.deleted && p.presentation.trim());
          return { ...prev, [editMaterial.id]: filtered };
        });
      }
      setMaterials(prev =>
        prev.map(m =>
          m.id === editMaterial.id
            ? {
                ...m,
                name: editName.trim() || editMaterial.name,
                provider: editProvider.trim() || m.provider,
                quantity,
                minThreshold,
              }
            : m
        )
      );
      setEditMaterial(null);
      setEditQuantity('');
      setEditMinThreshold('');
      setEditName('');
      setEditProvider('');
    } catch (e: any) {
      setError(e.message || 'No se pudo actualizar');
    } finally {
      setEditSaving(false);
    }
  };

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
              const isEditing = editMaterial?.id === m.id;
              const presList = (presentations[m.id] || []).filter(p => !p.deleted);
              const totalRealQuantity = presList.reduce(
                (acc, p) =>
                  acc +
                  (p.availablePackages || 0) * (p.packageQuantity || 0),
                0
              );
              const hasRealQuantity = presList.length > 0 && totalRealQuantity > 0;
              const realUnit =
                presList[0]?.packageUnit || m.unit;
              const totalPackages = presList.reduce(
                (acc, p) => acc + (p.availablePackages || 0),
                0
              );
              const isDetailOpen = detailMaterialId === m.id;
              return (
                <React.Fragment key={m.id}>
                  <tr className={`hover:bg-slate-50 transition-colors ${isLowStock ? 'bg-red-50/30' : ''}`}>
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
                      <div className="flex flex-col items-center gap-0.5">
                        <span>
                          {hasRealQuantity ? totalRealQuantity : m.quantity}{' '}
                          {hasRealQuantity ? realUnit : m.unit}
                        </span>
                        {hasRealQuantity && (
                          <span className="text-[10px] font-normal text-slate-400">
                            {totalPackages} presentaciones
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-slate-400 font-mono text-xs">
                      {m.minThreshold} {m.unit}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs font-medium">
                      {m.expiryDate}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="text-[10px] font-bold uppercase text-slate-400 hover:text-brand"
                          onClick={() =>
                            setDetailMaterialId(isDetailOpen ? null : m.id)
                          }
                        >
                          {isDetailOpen ? 'Ocultar detalle' : 'Ver detalle'}
                        </button>
                        <button
                          className="text-accent hover:text-brand font-bold uppercase text-[10px]"
                          onClick={() => {
                          setEditMaterial(m);
                          setEditQuantity(String(m.quantity));
                          setEditMinThreshold(String(m.minThreshold));
                          setEditName(m.name);
                          setEditProvider(m.provider);
                          }}
                        >
                          {isEditing ? 'Cerrar' : 'Gestionar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {isDetailOpen && (
                    <tr className="bg-slate-50/60">
                      <td colSpan={6} className="px-6 pb-4 pt-0">
                        <div className="border-t border-slate-200 pt-3 mt-1 space-y-2">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">
                            Detalle de presentaciones disponibles
                          </p>
                          {presList.filter(p => (p.availablePackages || 0) > 0).length === 0 ? (
                            <p className="text-xs text-slate-400">
                              Sin presentaciones con stock disponible.
                            </p>
                          ) : (
                            <div className="space-y-1">
                              {presList
                                .filter(p => (p.availablePackages || 0) > 0)
                                .map(p => (
                                  <div
                                    key={p.id}
                                    className="text-xs text-slate-700 flex justify-between items-center bg-white border border-slate-200 rounded-lg px-3 py-2"
                                  >
                                    <div className="flex-1">
                                      <p className="font-semibold">
                                        {p.presentation || 'Sin nombre'}
                                      </p>
                                      <p className="text-[10px] text-slate-400">
                                        {p.packageQuantity || 0}{' '}
                                        {p.packageUnit || realUnit} por presentación
                                      </p>
                                    </div>
                                    <div className="text-right text-[11px]">
                                      <p className="font-bold text-brand">
                                        {p.availablePackages || 0} disp.
                                      </p>
                                      <p className="text-[10px] text-slate-400">
                                        Total:{' '}
                                        {(
                                          (p.availablePackages || 0) *
                                          (p.packageQuantity || 0)
                                        ).toFixed(2)}{' '}
                                        {p.packageUnit || realUnit}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                  {isEditing && (
                    <tr className="bg-slate-50">
                      <td colSpan={6} className="px-6 pb-4 pt-0">
                        <div className="border-t border-slate-200 pt-3 mt-1 space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Título</p>
                              <input
                                className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-dark font-bold focus:ring-2 focus:ring-brand outline-none"
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                              />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Subtítulo</p>
                              <input
                                className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-[12px] focus:ring-2 focus:ring-brand outline-none"
                                value={editProvider}
                                onChange={e => setEditProvider(e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Cantidad disponible</p>
                              <input
                                type="number"
                                className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-dark font-bold focus:ring-2 focus:ring-brand outline-none"
                                value={editQuantity}
                                onChange={e => setEditQuantity(e.target.value)}
                              />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Stock mínimo</p>
                              <input
                                type="number"
                                className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-dark font-bold focus:ring-2 focus:ring-brand outline-none"
                                value={editMinThreshold}
                                onChange={e => setEditMinThreshold(e.target.value)}
                              />
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button
                                disabled={editSaving}
                                onClick={handleSaveEdit}
                                className="bg-brand text-white px-4 py-2 rounded-xl text-[11px] font-bold shadow-lg shadow-brand/20 hover:bg-black transition-all disabled:bg-slate-300"
                              >
                                Guardar
                              </button>
                              <button
                                disabled={editSaving}
                                onClick={() => {
                                  setEditMaterial(null);
                                  setEditQuantity('');
                                  setEditMinThreshold('');
                                  setEditName('');
                                  setEditProvider('');
                                }}
                                className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-[11px] font-bold border"
                              >
                                Cancelar
                              </button>
                              <button
                                disabled={editSaving}
                                onClick={() => editMaterial && handleDeleteMaterial(editMaterial)}
                                className="bg-red-600 text-white px-4 py-2 rounded-xl text-[11px] font-bold"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Presentaciones, cantidades y costos</p>
                            <div className="space-y-2">
                              {(presentations[m.id] || []).filter(p => !p.deleted).map(p => (
                                <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-3 grid grid-cols-1 md:grid-cols-[2fr,1.2fr,1.2fr,1fr,auto] gap-2 items-center">
                                  <input
                                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs"
                                    placeholder="Presentación / Marca"
                                    value={p.presentation}
                                    onChange={e =>
                                      handleChangePresentationField(
                                        m.id,
                                        p.id,
                                        'presentation',
                                        e.target.value
                                      )
                                    }
                                  />
                                  <div className="flex gap-2">
                                    <input
                                      type="number"
                                      className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs"
                                      placeholder="Cantidad presentación"
                                      value={p.packageQuantity || ''}
                                      onChange={e =>
                                        handleChangePresentationField(
                                          m.id,
                                          p.id,
                                          'packageQuantity',
                                          e.target.value
                                        )
                                      }
                                    />
                                    <input
                                      className="w-20 bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs text-center"
                                      placeholder="Unidad"
                                      value={p.packageUnit}
                                      onChange={e =>
                                        handleChangePresentationField(
                                          m.id,
                                          p.id,
                                          'packageUnit',
                                          e.target.value
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <input
                                      type="number"
                                      className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs"
                                      placeholder="Costo presentación"
                                      value={p.packageCost || ''}
                                      onChange={e =>
                                        handleChangePresentationField(
                                          m.id,
                                          p.id,
                                          'packageCost',
                                          e.target.value
                                        )
                                      }
                                    />
                                    <input
                                      type="number"
                                      className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs"
                                      placeholder="Costo transporte"
                                      value={p.transportCost || ''}
                                      onChange={e =>
                                        handleChangePresentationField(
                                          m.id,
                                          p.id,
                                          'transportCost',
                                          e.target.value
                                        )
                                      }
                                    />
                                    <p className="text-[10px] text-slate-500 font-semibold">
                                      Costo total: {((p.packageCost || 0) + (p.transportCost || 0)).toFixed(2)}
                                    </p>
                                  </div>
                                  <div className="space-y-1">
                                    <input
                                      type="number"
                                      className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs"
                                      placeholder="Cantidad disponible"
                                      value={p.availablePackages || ''}
                                      onChange={e =>
                                        handleChangePresentationField(
                                          m.id,
                                          p.id,
                                          'availablePackages',
                                          e.target.value
                                        )
                                      }
                                    />
                                    <p className="text-[10px] text-slate-500 font-semibold">
                                      Total stock: {((p.availablePackages || 0) * ((p.packageCost || 0) + (p.transportCost || 0))).toFixed(2)}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    className="text-[10px] font-bold uppercase text-red-600"
                                    onClick={() => handleToggleDeletePresentation(m.id, p.id)}
                                  >
                                    Quitar
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                className="mt-1 text-[11px] font-bold text-brand uppercase"
                                onClick={() => handleAddPresentation(m.id)}
                              >
                                + Añadir presentación
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile view cards */}
      <div className="grid grid-cols-1 gap-4 md:hidden pb-4">
        {materials.map((m) => {
          const isLowStock = m.quantity < m.minThreshold;
          const isEditing = editMaterial?.id === m.id;
          const presList = (presentations[m.id] || []).filter(p => !p.deleted);
          const totalRealQuantity = presList.reduce(
            (acc, p) =>
              acc +
              (p.availablePackages || 0) * (p.packageQuantity || 0),
            0
          );
          const hasRealQuantity = presList.length > 0 && totalRealQuantity > 0;
          const realUnit =
            presList[0]?.packageUnit || m.unit;
          const totalPackages = presList.reduce(
            (acc, p) => acc + (p.availablePackages || 0),
            0
          );
          const isDetailOpen = detailMaterialId === m.id;
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
                  <div className="flex flex-col items-end gap-0.5">
                    <span className={`font-bold text-lg ${isLowStock ? 'text-red-600' : 'text-brand'}`}>
                      {hasRealQuantity ? totalRealQuantity : m.quantity}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 ml-1">
                      {hasRealQuantity ? realUnit : m.unit}
                    </span>
                    {hasRealQuantity && (
                      <span className="text-[9px] text-slate-400">
                        {totalPackages} presentaciones
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-end border-t border-slate-50 pt-3 mt-1">
                <span className="text-[9px] text-slate-400 font-bold uppercase italic">Mínimo: {m.minThreshold} {m.unit}</span>
                <div className="flex items-center gap-2">
                  <button
                    className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-[10px] font-bold uppercase"
                    onClick={() =>
                      setDetailMaterialId(isDetailOpen ? null : m.id)
                    }
                  >
                    {isDetailOpen ? 'OCULTAR' : 'DETALLE'}
                  </button>
                  <button
                    className={`${isLowStock ? 'bg-red-600 text-white' : 'bg-accent/20 text-brand'} px-3 py-1 rounded-lg text-[10px] font-bold uppercase`}
                    onClick={() => {
                      setEditMaterial(m);
                      setEditQuantity(String(m.quantity));
                      setEditMinThreshold(String(m.minThreshold));
                      setEditName(m.name);
                      setEditProvider(m.provider);
                    }}
                  >
                    {isEditing ? 'CERRAR' : isLowStock ? 'REPONER' : 'EDITAR'}
                  </button>
                </div>
              </div>
              {isDetailOpen && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                  <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">
                    Detalle de presentaciones disponibles
                  </p>
                  {presList.filter(p => (p.availablePackages || 0) > 0).length === 0 ? (
                    <p className="text-[11px] text-slate-400">
                      Sin presentaciones con stock disponible.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {presList
                        .filter(p => (p.availablePackages || 0) > 0)
                        .map(p => (
                          <div
                            key={p.id}
                            className="bg-white border border-slate-200 rounded-xl p-3 flex justify-between items-center"
                          >
                            <div className="flex-1 pr-2">
                              <p className="text-[11px] font-semibold">
                                {p.presentation || 'Sin nombre'}
                              </p>
                              <p className="text-[9px] text-slate-400">
                                {p.packageQuantity || 0}{' '}
                                {p.packageUnit || realUnit} por presentación
                              </p>
                            </div>
                            <div className="text-right text-[10px]">
                              <p className="font-bold text-brand">
                                {p.availablePackages || 0} disp.
                              </p>
                              <p className="text-[9px] text-slate-400">
                                Total:{' '}
                                {(
                                  (p.availablePackages || 0) *
                                  (p.packageQuantity || 0)
                                ).toFixed(2)}{' '}
                                {p.packageUnit || realUnit}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
              {isEditing && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Título</p>
                      <input
                        className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-[12px] font-semibold focus:ring-2 focus:ring-brand outline-none"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                      />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Subtítulo</p>
                      <input
                        className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-[11px] focus:ring-2 focus:ring-brand outline-none"
                        value={editProvider}
                        onChange={e => setEditProvider(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Cantidad</p>
                      <input
                        type="number"
                        className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-dark font-bold focus:ring-2 focus:ring-brand outline-none"
                        value={editQuantity}
                        onChange={e => setEditQuantity(e.target.value)}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Mínimo</p>
                      <input
                        type="number"
                        className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-dark font-bold focus:ring-2 focus:ring-brand outline-none"
                        value={editMinThreshold}
                        onChange={e => setEditMinThreshold(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Presentaciones, cantidades y costos</p>
                    {(presentations[m.id] || []).filter(p => !p.deleted).map(p => (
                      <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                        <input
                          className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-[11px]"
                          placeholder="Presentación / Marca"
                          value={p.presentation}
                          onChange={e =>
                            handleChangePresentationField(
                              m.id,
                              p.id,
                              'presentation',
                              e.target.value
                            )
                          }
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Cant. presentación</p>
                            <input
                              type="number"
                              className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-[11px]"
                              placeholder="Ej: 1000"
                              value={p.packageQuantity || ''}
                              onChange={e =>
                                handleChangePresentationField(
                                  m.id,
                                  p.id,
                                  'packageQuantity',
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Unidad</p>
                            <input
                              className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-[11px]"
                              placeholder="Ej: gr, ml"
                              value={p.packageUnit}
                              onChange={e =>
                                handleChangePresentationField(
                                  m.id,
                                  p.id,
                                  'packageUnit',
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Costo presentación</p>
                            <input
                              type="number"
                              className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-[11px]"
                              placeholder="Ej: 5.50"
                              value={p.packageCost || ''}
                              onChange={e =>
                                handleChangePresentationField(
                                  m.id,
                                  p.id,
                                  'packageCost',
                                  e.target.value
                                )
                              }
                            />
                            <input
                              type="number"
                              className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-[11px]"
                              placeholder="Costo transporte"
                              value={p.transportCost || ''}
                              onChange={e =>
                                handleChangePresentationField(
                                  m.id,
                                  p.id,
                                  'transportCost',
                                  e.target.value
                                )
                              }
                            />
                            <p className="text-[9px] text-slate-500 font-semibold">
                              Costo total: {((p.packageCost || 0) + (p.transportCost || 0)).toFixed(2)}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Cantidad disponible</p>
                            <input
                              type="number"
                              className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-[11px]"
                              placeholder="Ej: 10"
                              value={p.availablePackages || ''}
                              onChange={e =>
                                handleChangePresentationField(
                                  m.id,
                                  p.id,
                                  'availablePackages',
                                  e.target.value
                                )
                              }
                            />
                            <p className="text-[9px] text-slate-500 font-semibold">
                              Total stock: {((p.availablePackages || 0) * ((p.packageCost || 0) + (p.transportCost || 0))).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="text-[10px] font-bold uppercase text-red-600"
                          onClick={() => handleToggleDeletePresentation(m.id, p.id)}
                        >
                          Quitar
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="mt-1 text-[10px] font-bold text-brand uppercase"
                      onClick={() => handleAddPresentation(m.id)}
                    >
                      + Añadir presentación
                    </button>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      disabled={editSaving}
                      onClick={handleSaveEdit}
                      className="bg-brand text-white px-4 py-2 rounded-xl text-[11px] font-bold shadow-lg shadow-brand/20 hover:bg-black transition-all disabled:bg-slate-300"
                    >
                      Guardar
                    </button>
                    <button
                      disabled={editSaving}
                      onClick={() => {
                        setEditMaterial(null);
                        setEditQuantity('');
                        setEditMinThreshold('');
                        setEditName('');
                        setEditProvider('');
                      }}
                      className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-[11px] font-bold border"
                    >
                      Cancelar
                    </button>
                    <button
                      disabled={editSaving}
                      onClick={() => editMaterial && handleDeleteMaterial(editMaterial)}
                      className="bg-red-600 text-white px-4 py-2 rounded-xl text-[11px] font-bold"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MateriaPrima;
