import React, { useEffect, useState } from 'react';
import { hasSupabaseEnv, supabase } from '../supabaseClient';
import { Order, OrderItem, Recipe } from '../types';

interface UiOrder extends Order {
  itemSummary: string;
}

const Ventas: React.FC = () => {
  const [orders, setOrders] = useState<UiOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'preventas' | 'realizadas'>('all');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      if (hasSupabaseEnv && supabase) {
        // Fetch recipes for item names
        const recRes = await supabase.from('recipes').select('id,name');
        if (recRes.error) throw new Error(recRes.error.message);
        const recipeMap = new Map<string, string>();
        (recRes.data || []).forEach((r: any) => recipeMap.set(r.id, r.name));

        // Fetch orders
        let ordersData: any[] = [];
        try {
          const ordersRes = await supabase
            .from('orders')
            .select('id,order_number,client_name,order_date,delivery_date,status,production_batch,payment_status,delivery_status')
            .order('order_date', { ascending: false });
          
          if (ordersRes.error) {
             // If column doesn't exist, fallback to simpler query
             if (ordersRes.error.message.includes('payment_status')) {
               const fallbackRes = await supabase
                 .from('orders')
                 .select('id,order_number,client_name,order_date,delivery_date,status,production_batch')
                 .order('order_date', { ascending: false });
               if (fallbackRes.error) throw new Error(fallbackRes.error.message);
               ordersData = fallbackRes.data || [];
             } else {
               throw new Error(ordersRes.error.message);
             }
          } else {
            ordersData = ordersRes.data || [];
          }
        } catch (err: any) {
           throw new Error(err.message);
        }

        // Fetch order items
        const itemsRes = await supabase
          .from('order_items')
          .select('id,order_id,recipe_id,quantity,unit');
        if (itemsRes.error) throw new Error(itemsRes.error.message);

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

        const mappedOrders: UiOrder[] = ordersData.map((o: any) => {
          const orderItems = itemsByOrder.get(o.id) || [];
          const summary =
            orderItems.length === 0
              ? 'Sin productos'
              : orderItems
                  .map(i => {
                    const name = recipeMap.get(i.recipeId) || 'Producto';
                    return `${name} (${i.quantity} ${i.unit})`;
                  })
                  .join(', ');
          
          return {
            id: o.id,
            orderNumber: o.order_number,
            clientName: o.client_name,
            orderDate: o.order_date,
            deliveryDate: o.delivery_date ?? null,
            status: o.status,
            paymentStatus: o.payment_status || 'pendiente',
            deliveryStatus: o.delivery_status || 'pendiente',
            productionBatch: o.production_batch,
            items: orderItems,
            itemSummary: summary,
          };
        });

        setOrders(mappedOrders);
      } else {
        // Mock data
        setOrders([
          {
            id: '1',
            orderNumber: 'PED-001',
            clientName: 'Cliente Ejemplo',
            orderDate: '2025-02-26',
            deliveryDate: null,
            status: 'pendiente',
            paymentStatus: 'pendiente',
            deliveryStatus: 'pendiente',
            items: [],
            itemSummary: 'Yogur Griego (10 L)',
          }
        ]);
      }
    } catch (e: any) {
      setError(e.message || 'Error al cargar ventas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (orderId: string, field: 'payment_status' | 'delivery_status', value: string) => {
    try {
      if (hasSupabaseEnv && supabase) {
        const { error } = await supabase
          .from('orders')
          .update({ [field]: value })
          .eq('id', orderId);
        
        if (error) throw error;
        
        // Update local state
        setOrders(prev => prev.map(o => 
          o.id === orderId 
            ? { ...o, [field === 'payment_status' ? 'paymentStatus' : 'deliveryStatus']: value }
            : o
        ));
      }
    } catch (e: any) {
      alert('Error al actualizar estado: ' + e.message);
    }
  };

  const getStatusBadge = (order: UiOrder) => {
    const isPaid = order.paymentStatus === 'pagado';
    const isDelivered = order.deliveryStatus === 'entregado';

    if (isDelivered && isPaid) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">DESPACHADO Y CANCELADO</span>;
    }
    if (isDelivered && !isPaid) {
      return <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-bold">DESPACHADO POR CANCELAR</span>;
    }
    if (!isDelivered && isPaid) {
      return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">PREPAGADO</span>;
    }
    return <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">PENDIENTE</span>;
  };

  const filteredOrders = orders.filter(o => {
    if (filter === 'preventas') return o.deliveryStatus !== 'entregado';
    if (filter === 'realizadas') return o.deliveryStatus === 'entregado';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-brand">Ventas y Despachos</h2>
          <p className="text-slate-500">Gestión de entregas y cobros</p>
        </div>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === 'all' ? 'bg-white shadow-sm text-brand' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('preventas')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === 'preventas' ? 'bg-white shadow-sm text-brand' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Preventas (Pendientes)
          </button>
          <button
            onClick={() => setFilter('realizadas')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === 'realizadas' ? 'bg-white shadow-sm text-brand' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Ventas Realizadas (Entregadas)
          </button>
        </div>
      </div>

      {loading && <div className="p-8 text-center text-slate-500">Cargando ventas...</div>}
      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}

      {!loading && !error && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Pedido #</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Productos</th>
                <th className="px-6 py-4 text-center">Estado General</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No hay ventas registradas en esta categoría.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-brand">{order.orderNumber}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{order.clientName}</td>
                    <td className="px-6 py-4 text-slate-500">{order.orderDate}</td>
                    <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={order.itemSummary}>
                      {order.itemSummary}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(order)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        {order.deliveryStatus !== 'entregado' && (
                          <button
                            onClick={() => updateStatus(order.id, 'delivery_status', 'entregado')}
                            className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                            title="Marcar como Despachado"
                          >
                            DESPACHAR
                          </button>
                        )}
                        {order.paymentStatus !== 'pagado' ? (
                          <button
                            onClick={() => updateStatus(order.id, 'payment_status', 'pagado')}
                            className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-bold hover:bg-green-100 transition-colors"
                            title="Marcar como Pagado/Cancelado"
                          >
                            PAGAR
                          </button>
                        ) : (
                          <span className="px-3 py-1.5 text-green-600 text-xs font-bold flex items-center gap-1">
                            ✓ PAGADO
                          </span>
                        )}
                        {order.deliveryStatus === 'entregado' && order.paymentStatus !== 'pagado' && (
                           <span className="text-[10px] text-orange-500 font-bold self-center px-2">PENDIENTE PAGO</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Ventas;
