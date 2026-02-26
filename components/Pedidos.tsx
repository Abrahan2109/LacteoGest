import React, { useEffect, useState } from 'react';
import { hasSupabaseEnv, supabase } from '../supabaseClient';
import { Order, OrderItem, Recipe } from '../types';

interface UiOrder extends Order {
  itemSummary: string;
}

const Pedidos: React.FC = () => {
  const [orders, setOrders] = useState<UiOrder[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [clientName, setClientName] = useState<string>('');
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(0);
  const [unit, setUnit] = useState<string>('L');

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editClientName, setEditClientName] = useState<string>('');
  const [editDeliveryDate, setEditDeliveryDate] = useState<string>('');
  const [editRecipeId, setEditRecipeId] = useState<string>('');
  const [editQuantity, setEditQuantity] = useState<number>(0);
  const [editUnit, setEditUnit] = useState<string>('L');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (hasSupabaseEnv && supabase) {
          const recRes = await supabase
            .from('recipes')
            .select('id,name,recipe_ingredients(id,material_name,amount_per_liter,unit)');
          if (recRes.error) throw new Error(recRes.error.message);
          const mappedRecipes: Recipe[] = (recRes.data || []).map((r: any) => ({
            id: r.id,
            name: r.name,
            baseMilk: 1,
            ingredients: (r.recipe_ingredients || []).map((ing: any) => ({
              materialId: ing.material_id || '',
              materialName: ing.material_name || '',
              amountPerLiter: Number(ing.amount_per_liter || 0),
              unit: ing.unit || '',
            })),
            notes: '',
          }));
          setRecipes(mappedRecipes);
          if (!selectedRecipeId && mappedRecipes[0]?.id) {
            setSelectedRecipeId(mappedRecipes[0].id);
          }

          const ordersRes = await supabase
            .from('orders')
            .select('id,order_number,client_name,order_date,delivery_date,status,production_batch');
          if (ordersRes.error) throw new Error(ordersRes.error.message);

          const itemsRes = await supabase
            .from('order_items')
            .select('id,order_id,recipe_id,quantity,unit');
          if (itemsRes.error) throw new Error(itemsRes.error.message);

          const recipeMap = new Map<string, string>();
          mappedRecipes.forEach(r => recipeMap.set(r.id, r.name));

          const itemsByOrder = new Map<string, OrderItem[]>();
          (itemsRes.data || []).forEach((row: any) => {
            const item: OrderItem = {
              id: row.id,
              orderId: row.order_id,
              recipeId: row.recipe_id,
              quantity: Number(row.quantity || 0),
              unit: row.unit || '',
            };
            const existing = itemsByOrder.get(item.orderId) || [];
            existing.push(item);
            itemsByOrder.set(item.orderId, existing);
          });

          const mappedOrders: UiOrder[] = (ordersRes.data || []).map((o: any) => {
            const orderItems = itemsByOrder.get(o.id) || [];
            const summary =
              orderItems.length === 0
                ? 'Sin productos cargados'
                : orderItems
                    .map(i => {
                      const name = recipeMap.get(i.recipeId) || 'Producto';
                      return `${name} · ${i.quantity} ${i.unit}`;
                    })
                    .join(' | ');
            const order: Order = {
              id: o.id,
              orderNumber: o.order_number,
              clientName: o.client_name,
              orderDate: o.order_date,
              deliveryDate: o.delivery_date ?? null,
              status: o.status,
              productionBatch: o.production_batch ?? null,
              items: orderItems,
            };
            return {
              ...order,
              itemSummary: summary,
            };
          });

          setOrders(mappedOrders.sort((a, b) => (a.orderDate < b.orderDate ? 1 : -1)));
        } else {
          setRecipes([]);
          setOrders([]);
        }
      } catch (e: any) {
        setError(e.message || 'Error cargando pedidos');
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateOrderNumber = () => {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(Math.random() * 900) + 100;
    return `PED-${datePart}-${rand}`;
  };

  const generateBatchNumber = () => {
    const now = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
    return `OP-${now}`;
  };

  const handleCreateOrder = async () => {
    if (!hasSupabaseEnv || !supabase) return;
    if (!clientName.trim() || !selectedRecipeId || quantity <= 0) {
      setError('Completa cliente, producto y cantidad para generar el pedido');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const orderNumber = generateOrderNumber();
      const orderPayload = {
        order_number: orderNumber,
        client_name: clientName.trim(),
        order_date: new Date().toISOString().slice(0, 10),
        delivery_date: deliveryDate || null,
        status: 'pendiente',
      };
      const orderRes = await supabase
        .from('orders')
        .insert(orderPayload)
        .select('id')
        .single();
      if (orderRes.error) throw new Error(orderRes.error.message);
      const orderId = orderRes.data.id;

      const itemPayload = {
        order_id: orderId,
        recipe_id: selectedRecipeId,
        quantity,
        unit,
      };
      const itemRes = await supabase.from('order_items').insert(itemPayload).select('id').single();
      if (itemRes.error) throw new Error(itemRes.error.message);

      const recipeName = recipes.find(r => r.id === selectedRecipeId)?.name || 'Producto';
      const newItem: OrderItem = {
        id: itemRes.data.id,
        orderId,
        recipeId: selectedRecipeId,
        quantity,
        unit,
      };
      const newOrder: UiOrder = {
        id: orderId,
        orderNumber,
        clientName: clientName.trim(),
        orderDate: orderPayload.order_date,
        deliveryDate: deliveryDate || null,
        status: 'pendiente',
        productionBatch: null,
        items: [newItem],
        itemSummary: `${recipeName} · ${quantity} ${unit}`,
      };
      setOrders(prev => [newOrder, ...prev]);
      setClientName('');
      setDeliveryDate('');
      setQuantity(0);
      setSelectedOrderId(orderId);
    } catch (e: any) {
      setError(e.message || 'No se pudo crear el pedido');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateProductionOrder = async (order: UiOrder) => {
    if (!hasSupabaseEnv || !supabase) return;
    if (!order.items[0]) return;
    setSaving(true);
    setError(null);
    try {
      const batch = generateBatchNumber();
      const item = order.items[0];
      const payload = {
        recipe_id: item.recipeId,
        date: new Date().toISOString().slice(0, 10),
        batch,
        status: 'en_proceso',
        milk_volume: item.quantity,
        quantity_produced: 0,
        waste: 0,
      };
      const prodRes = await supabase.from('production_orders').insert(payload);
      if (prodRes.error) throw new Error(prodRes.error.message);

      const upd = await supabase
        .from('orders')
        .update({ production_batch: batch, status: 'en_proceso' })
        .eq('id', order.id);
      if (upd.error) throw new Error(upd.error.message);

      setOrders(prev =>
        prev.map(o =>
          o.id === order.id
            ? {
                ...o,
                status: 'en_proceso',
                productionBatch: batch,
              }
            : o
        )
      );
    } catch (e: any) {
      setError(e.message || 'No se pudo generar la orden de producción');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = (order: UiOrder) => {
    setSelectedOrderId(order.id);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleStartEditOrder = (order: UiOrder) => {
    const item = order.items[0];
    setEditingOrderId(order.id);
    setEditClientName(order.clientName);
    setEditDeliveryDate(order.deliveryDate || '');
    setEditRecipeId(item?.recipeId || recipes[0]?.id || '');
    setEditQuantity(item?.quantity || 0);
    setEditUnit(item?.unit || 'L');
  };

  const handleCancelEditOrder = () => {
    setEditingOrderId(null);
  };

  const handleSaveOrder = async (order: UiOrder) => {
    if (!hasSupabaseEnv || !supabase) return;
    if (!editClientName.trim() || !editRecipeId || editQuantity <= 0) {
      setError('Completa cliente, producto y cantidad para actualizar el pedido');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const orderUpdate = {
        client_name: editClientName.trim(),
        delivery_date: editDeliveryDate || null,
      };
      const updOrder = await supabase
        .from('orders')
        .update(orderUpdate)
        .eq('id', order.id);
      if (updOrder.error) throw new Error(updOrder.error.message);

      const existingItem = order.items[0];
      if (existingItem) {
        const updItem = await supabase
          .from('order_items')
          .update({
            recipe_id: editRecipeId,
            quantity: editQuantity,
            unit: editUnit,
          })
          .eq('id', existingItem.id);
        if (updItem.error) throw new Error(updItem.error.message);
      } else {
        const insItem = await supabase
          .from('order_items')
          .insert({
            order_id: order.id,
            recipe_id: editRecipeId,
            quantity: editQuantity,
            unit: editUnit,
          })
          .select('id')
          .single();
        if (insItem.error) throw new Error(insItem.error.message);
        const newItem: OrderItem = {
          id: insItem.data.id,
          orderId: order.id,
          recipeId: editRecipeId,
          quantity: editQuantity,
          unit: editUnit,
        };
        order.items = [newItem];
      }

      const recipeName = recipes.find(r => r.id === editRecipeId)?.name || 'Producto';
      const newSummary = `${recipeName} · ${editQuantity} ${editUnit}`;

      setOrders(prev =>
        prev.map(o =>
          o.id === order.id
            ? {
                ...o,
                clientName: editClientName.trim(),
                deliveryDate: editDeliveryDate || null,
                items: [
                  {
                    id: o.items[0]?.id || order.items[0]?.id || '',
                    orderId: order.id,
                    recipeId: editRecipeId,
                    quantity: editQuantity,
                    unit: editUnit,
                  },
                ],
                itemSummary: newSummary,
              }
            : o
        )
      );
      setEditingOrderId(null);
    } catch (e: any) {
      setError(e.message || 'No se pudo actualizar el pedido');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOrder = async (order: UiOrder) => {
    if (!hasSupabaseEnv || !supabase) return;
    if (order.productionBatch) {
      setError('No se puede eliminar un pedido con orden de producción generada');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await supabase.from('orders').delete().eq('id', order.id);
      if (res.error) throw new Error(res.error.message);
      setOrders(prev => prev.filter(o => o.id !== order.id));
      if (selectedOrderId === order.id) setSelectedOrderId(null);
      if (editingOrderId === order.id) setEditingOrderId(null);
    } catch (e: any) {
      setError(e.message || 'No se pudo eliminar el pedido');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-brand">Gestión de Pedidos</h2>
          <p className="text-slate-500">Registro de pedidos y órdenes de producción enlazadas</p>
        </div>
      </div>

      {loading && (
        <div className="p-4 bg-white rounded-2xl border text-sm">Cargando…</div>
      )}
      {!loading && error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl border-2 border-brand/10 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-brand uppercase tracking-widest flex items-center">
          <span className="mr-2">📋</span> Nuevo Pedido
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Cliente</label>
            <input
              className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-sm"
              placeholder="Nombre del cliente"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">
              Fecha de entrega
            </label>
            <input
              type="date"
              className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-sm"
              value={deliveryDate}
              onChange={e => setDeliveryDate(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">
              Producto / Fórmula
            </label>
            <select
              className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-sm"
              value={selectedRecipeId}
              onChange={e => setSelectedRecipeId(e.target.value)}
            >
              {recipes.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">
              Cantidad a producir
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                className="flex-1 bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-sm"
                placeholder="Ej: 50"
                value={quantity || ''}
                onChange={e => setQuantity(Number(e.target.value))}
              />
              <select
                className="w-20 bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs"
                value={unit}
                onChange={e => setUnit(e.target.value)}
              >
                <option value="L">L</option>
                <option value="kg">kg</option>
                <option value="u">u</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            disabled={saving || !hasSupabaseEnv}
            onClick={handleCreateOrder}
            className="bg-brand text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-brand/20 hover:bg-black transition-all disabled:bg-slate-300 uppercase"
          >
            {saving ? 'Guardando…' : 'Registrar Pedido'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {orders.map(order => {
          const isSelected = selectedOrderId === order.id;
          const isEditing = editingOrderId === order.id;
          return (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
            >
              <div className="p-5 border-b border-slate-100 bg-slate-900 text-white flex justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-accent">Pedido</p>
                  <h3 className="text-lg font-black tracking-widest">{order.orderNumber}</h3>
                </div>
                <div className="text-right text-[10px]">
                  <p className="font-bold uppercase">Cliente</p>
                  <p className="font-medium">{order.clientName}</p>
                  <p className="mt-1 text-[9px] text-slate-300">
                    Pedido: {order.orderDate}
                    {order.deliveryDate ? ` · Entrega: ${order.deliveryDate}` : ''}
                  </p>
                </div>
              </div>
              <div className="p-5 flex-1 space-y-3">
                <div className="text-[11px] text-slate-600">
                  <p className="uppercase font-bold text-slate-400 mb-1">Detalle</p>
                  <p>{order.itemSummary}</p>
                </div>
                <div className="text-[11px] text-slate-600">
                  <p className="uppercase font-bold text-slate-400 mb-1">Estado</p>
                  <p className="font-semibold">
                    {order.status}
                    {order.productionBatch
                      ? ` · OP: ${order.productionBatch}`
                      : ' · Sin orden de producción'}
                  </p>
                </div>
              </div>
              <div className="p-4 bg-slate-50 flex gap-2">
                <button
                  className="flex-1 bg-white border border-slate-200 text-slate-700 text-[11px] font-bold py-2 rounded-lg hover:bg-slate-100 transition-colors uppercase"
                  onClick={() => setSelectedOrderId(order.id)}
                >
                  Ver Detalle
                </button>
                <button
                  disabled={saving || !hasSupabaseEnv || !!order.productionBatch}
                  onClick={() => handleGenerateProductionOrder(order)}
                  className="flex-1 bg-brand text-white text-[11px] font-bold py-2 rounded-lg hover:bg-black transition-colors uppercase disabled:bg-slate-300"
                >
                  Generar OP
                </button>
                <button
                  onClick={() => handlePrint(order)}
                  className="flex-1 bg-white border border-slate-200 text-slate-700 text-[11px] font-bold py-2 rounded-lg hover:bg-slate-100 transition-colors uppercase"
                >
                  Imprimir
                </button>
              </div>
              {isSelected && (
                <div className="p-5 border-t border-slate-100 text-xs bg-white">
                  <p className="uppercase font-bold text-slate-400 mb-2">
                    Orden de producción asociada
                  </p>
                  <p>
                    Fecha emisión:{' '}
                    {new Date().toISOString().slice(0, 10)} · Hora:{' '}
                    {new Date().toTimeString().slice(0, 5)}
                  </p>
                  <p>Cliente: {order.clientName}</p>
                  <p>Pedido: {order.orderNumber}</p>
                  {order.productionBatch && <p>Nro OP / Lote: {order.productionBatch}</p>}
                  <p>Detalle: {order.itemSummary}</p>
                  <div className="mt-4 border-t border-slate-100 pt-3 space-y-3">
                    <p className="uppercase font-bold text-slate-400">
                      Edición de pedido y producto
                    </p>
                    {isEditing ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">
                              Cliente
                            </label>
                            <input
                              className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs"
                              value={editClientName}
                              onChange={e => setEditClientName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">
                              Fecha de entrega
                            </label>
                            <input
                              type="date"
                              className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs"
                              value={editDeliveryDate}
                              onChange={e => setEditDeliveryDate(e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">
                              Producto / Fórmula
                            </label>
                            <select
                              className="w-full bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs"
                              value={editRecipeId}
                              onChange={e => setEditRecipeId(e.target.value)}
                            >
                              {recipes.map(r => (
                                <option key={r.id} value={r.id}>
                                  {r.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">
                              Cantidad
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                className="flex-1 bg-slate-50 border border-slate-200 p-2 rounded-lg text-xs"
                                value={editQuantity || ''}
                                onChange={e => setEditQuantity(Number(e.target.value))}
                              />
                              <select
                                className="w-20 bg-slate-50 border border-slate-200 p-2 rounded-lg text-[10px]"
                                value={editUnit}
                                onChange={e => setEditUnit(e.target.value)}
                              >
                                <option value="L">L</option>
                                <option value="kg">kg</option>
                                <option value="u">u</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <button
                            disabled={saving}
                            onClick={() => handleSaveOrder(order)}
                            className="bg-brand text-white text-[11px] font-bold px-4 py-2 rounded-lg uppercase disabled:bg-slate-300"
                          >
                            Guardar cambios
                          </button>
                          <button
                            disabled={saving}
                            onClick={handleCancelEditOrder}
                            className="bg-white border border-slate-200 text-slate-700 text-[11px] font-bold px-4 py-2 rounded-lg uppercase"
                          >
                            Cancelar
                          </button>
                          <button
                            disabled={saving || !!order.productionBatch}
                            onClick={() => handleDeleteOrder(order)}
                            className="bg-red-600 text-white text-[11px] font-bold px-4 py-2 rounded-lg uppercase disabled:bg-slate-300"
                          >
                            Eliminar pedido
                          </button>
                        </div>
                      </>
                    ) : (
                      <button
                        disabled={saving || !hasSupabaseEnv}
                        onClick={() => handleStartEditOrder(order)}
                        className="mt-1 bg-white border border-slate-200 text-slate-700 text-[11px] font-bold px-4 py-2 rounded-lg uppercase hover:bg-slate-50"
                      >
                        Editar pedido / producto
                      </button>
                    )}
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

export default Pedidos;
