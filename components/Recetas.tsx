
import React, { useEffect, useState } from 'react';
import { hasSupabaseEnv, supabase } from '../supabaseClient';

interface UiIngredient {
  id: string;
  materialName: string;
  amountPerLiter: number;
  unit: string;
  deleted?: boolean;
  presentation?: string;
  brand?: string;
  packageQuantity?: number;
  packageCost?: number;
}

interface UiRecipe {
  id: string;
  name: string;
  ingredients: UiIngredient[];
  notes: string;
}

const Recetas: React.FC = () => {
  const [formulas, setFormulas] = useState<UiRecipe[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (hasSupabaseEnv && supabase) {
          const res = await supabase
            .from('recipes')
            .select('id,name,notes,recipe_ingredients(id,material_name,amount_per_liter,unit,presentation,brand,package_quantity,package_cost)');
          if (res.error) throw new Error(res.error.message);
          const mapped: UiRecipe[] = (res.data || []).map((r: any) => ({
            id: r.id,
            name: r.name,
            ingredients: (r.recipe_ingredients || []).map((ing: any) => ({
              id: ing.id,
              materialName: ing.material_name || '',
              amountPerLiter: Number(ing.amount_per_liter || 0),
              unit: ing.unit || '',
              deleted: false,
              presentation: ing.presentation || '',
              brand: ing.brand || '',
              packageQuantity: ing.package_quantity ? Number(ing.package_quantity) : 0,
              packageCost: ing.package_cost ? Number(ing.package_cost) : 0,
            })),
            notes:
              (r as any).notes ??
              (r.name === 'Yogur Griego Base'
                ? 'Incubación a 42°C por 8 horas. Desuerado lento.'
                : r.name === 'Yogur Café Gourmet'
                ? 'Añadir el café después del proceso de fermentación.'
                : ''),
          }));
          setFormulas(mapped);
        } else {
          const fallback: UiRecipe[] = [
            {
              id: '1',
              name: 'Yogur Griego Base',
              ingredients: [
                { id: 'i1', materialName: 'Cultivo Láctico', amountPerLiter: 0.05, unit: 'Sobres' },
                { id: 'i2', materialName: 'Leche en Polvo (Refuerzo)', amountPerLiter: 30, unit: 'gr' },
                { id: 'i3', materialName: 'Vainilla Natural', amountPerLiter: 2, unit: 'ml' },
              ],
              notes: 'Incubación a 42°C por 8 horas. Desuerado lento.',
            },
            {
              id: '2',
              name: 'Yogur Café Gourmet',
              ingredients: [
                { id: 'i4', materialName: 'Cultivo Láctico', amountPerLiter: 0.05, unit: 'Sobres' },
                { id: 'i5', materialName: 'Extracto Café Abba', amountPerLiter: 15, unit: 'ml' },
                { id: 'i6', materialName: 'Azúcar Orgánica', amountPerLiter: 40, unit: 'gr' },
              ],
              notes: 'Añadir el café después del proceso de fermentación.',
            },
          ];
          setFormulas(fallback);
        }
      } catch (e: any) {
        setError(e.message || 'No se pudieron cargar las fórmulas');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChangeAmount = (recipeId: string, ingredientId: string, value: string) => {
    const num = Number(value);
    setFormulas(prev =>
      prev.map(r =>
        r.id !== recipeId
          ? r
          : {
              ...r,
              ingredients: r.ingredients.map(ing =>
                ing.id === ingredientId ? { ...ing, amountPerLiter: isNaN(num) ? 0 : num } : ing
              ),
            }
      )
    );
  };

  const handleChangeIngredientField = (
    recipeId: string,
    ingredientId: string,
    field: 'materialName' | 'unit',
    value: string
  ) => {
    setFormulas(prev =>
      prev.map(r =>
        r.id !== recipeId
          ? r
          : {
              ...r,
              ingredients: r.ingredients.map(ing =>
                ing.id === ingredientId ? { ...ing, [field]: value } : ing
              ),
            }
      )
    );
  };

  const handleToggleDeleteIngredient = (recipeId: string, ingredientId: string) => {
    setFormulas(prev =>
      prev.map(r =>
        r.id !== recipeId
          ? r
          : {
              ...r,
              ingredients: r.ingredients.map(ing =>
                ing.id === ingredientId ? { ...ing, deleted: !ing.deleted } : ing
              ),
            }
      )
    );
  };

  const handleAddIngredient = (recipeId: string) => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setFormulas(prev =>
      prev.map(r =>
        r.id !== recipeId
          ? r
          : {
              ...r,
              ingredients: [
                ...r.ingredients,
                {
                  id: tempId,
                  materialName: '',
                  amountPerLiter: 0,
                  unit: '',
                  deleted: false,
                },
              ],
            }
      )
    );
  };

  const handleChangeNotes = (recipeId: string, value: string) => {
    setFormulas(prev =>
      prev.map(r => (r.id === recipeId ? { ...r, notes: value } : r))
    );
  };

  const handleChangePriceField = (
    recipeId: string,
    ingredientId: string,
    field: 'presentation' | 'brand' | 'packageQuantity' | 'packageCost',
    value: string
  ) => {
    setFormulas(prev =>
      prev.map(r =>
        r.id !== recipeId
          ? r
          : {
              ...r,
              ingredients: r.ingredients.map(ing =>
                ing.id === ingredientId
                  ? {
                      ...ing,
                      [field]:
                        field === 'packageQuantity' || field === 'packageCost'
                          ? Number(value)
                          : value,
                    }
                  : ing
              ),
            }
      )
    );
  };

  const handleSaveRecipe = async (recipeId: string) => {
    const recipe = formulas.find(r => r.id === recipeId);
    if (!recipe) return;
    setSaving(true);
    setError(null);
    try {
      if (hasSupabaseEnv && supabase) {
        const existing = recipe.ingredients.filter(
          ing => !ing.id.startsWith('temp-')
        );
        const toUpdate = existing.filter(ing => !ing.deleted);
        const toDelete = existing.filter(ing => ing.deleted);
        const toInsert = recipe.ingredients.filter(
          ing => ing.id.startsWith('temp-') && !ing.deleted && ing.materialName.trim()
        );

        await Promise.all([
          ...toUpdate.map(ing =>
            supabase
              .from('recipe_ingredients')
              .update({
                material_name: ing.materialName,
                amount_per_liter: ing.amountPerLiter,
                unit: ing.unit,
                presentation: ing.presentation || null,
                brand: ing.brand || null,
                package_quantity: ing.packageQuantity || null,
                package_cost: ing.packageCost || null,
              })
              .eq('id', ing.id)
          ),
          ...toDelete.map(ing =>
            supabase.from('recipe_ingredients').delete().eq('id', ing.id)
          ),
          ...toInsert.map(ing =>
            supabase.from('recipe_ingredients').insert({
              recipe_id: recipe.id,
              material_name: ing.materialName,
              amount_per_liter: ing.amountPerLiter,
              unit: ing.unit,
              presentation: ing.presentation || null,
              brand: ing.brand || null,
              package_quantity: ing.packageQuantity || null,
              package_cost: ing.packageCost || null,
            })
          ),
          supabase
            .from('recipes')
            .update({ notes: recipe.notes })
            .eq('id', recipe.id),
        ]);
      }
      if (hasSupabaseEnv && supabase) {
        const res = await supabase
          .from('recipes')
          .select('id,name,notes,recipe_ingredients(id,material_name,amount_per_liter,unit,presentation,brand,package_quantity,package_cost)');
        if (res.error) throw new Error(res.error.message);
        const mapped: UiRecipe[] = (res.data || []).map((r: any) => ({
          id: r.id,
          name: r.name,
          ingredients: (r.recipe_ingredients || []).map((ing: any) => ({
            id: ing.id,
            materialName: ing.material_name || '',
            amountPerLiter: Number(ing.amount_per_liter || 0),
            unit: ing.unit || '',
            deleted: false,
            presentation: ing.presentation || '',
            brand: ing.brand || '',
            packageQuantity: ing.package_quantity ? Number(ing.package_quantity) : 0,
            packageCost: ing.package_cost ? Number(ing.package_cost) : 0,
          })),
          notes: (r as any).notes ?? '',
        }));
        setFormulas(mapped);
      }
      setEditingRecipeId(recipeId);
    } catch (e: any) {
      setError(e.message || 'No se pudieron guardar los cambios de la fórmula');
    } finally {
      setSaving(false);
    }
  };

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

      {loading && (
        <div className="p-4 bg-white rounded-2xl border text-sm">Cargando…</div>
      )}
      {!loading && error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {formulas.map(recipe => {
          const isEditing = editingRecipeId === recipe.id;
          const costPerLiter = recipe.ingredients.reduce((acc, ing) => {
            const qty = ing.packageQuantity || 0;
            const cost = ing.packageCost || 0;
            if (!qty || !cost) return acc;
            const costPerUnit = cost / qty;
            return acc + ing.amountPerLiter * costPerUnit;
          }, 0);
          return (
          <div key={recipe.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 bg-brand text-white">
              <h3 className="text-lg font-bold">{recipe.name}</h3>
              <p className="text-[10px] uppercase font-bold text-accent italic">Coeficientes por Litro</p>
            </div>
            <div className="p-5 flex-1 space-y-4">
              <div className="flex justify-between items-center text-[11px] text-slate-200 bg-brand/80 px-3 py-2 rounded-xl mb-2">
                <span className="uppercase font-bold tracking-widest">Costo producción unitario</span>
                <span className="font-black text-lg">
                  {costPerLiter > 0 ? costPerLiter.toFixed(4) : '—'} <span className="text-[9px] font-bold uppercase">$/L</span>
                </span>
              </div>
              <div className="space-y-2">
                {recipe.ingredients.filter(ing => !ing.deleted).map((ing) => (
                  <div key={ing.id} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded-lg border border-slate-100 gap-3">
                    {isEditing ? (
                      <>
                        <div className="flex-1">
                          <input
                            className="w-full bg-white border border-slate-200 p-2 rounded-lg text-sm text-slate-700"
                            placeholder="Nombre del componente"
                            value={ing.materialName}
                            onChange={e =>
                              handleChangeIngredientField(
                                recipe.id,
                                ing.id,
                                'materialName',
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            className="w-20 bg-white border border-slate-200 p-2 rounded-lg text-right font-mono text-sm"
                            value={ing.amountPerLiter}
                            onChange={e =>
                              handleChangeAmount(recipe.id, ing.id, e.target.value)
                            }
                          />
                          <input
                            className="w-16 bg-white border border-slate-200 p-2 rounded-lg text-xs text-center"
                            placeholder="Unidad"
                            value={ing.unit}
                            onChange={e =>
                              handleChangeIngredientField(
                                recipe.id,
                                ing.id,
                                'unit',
                                e.target.value
                              )
                            }
                          />
                          <button
                            type="button"
                            className="text-[10px] uppercase font-bold text-red-600"
                            onClick={() => handleToggleDeleteIngredient(recipe.id, ing.id)}
                          >
                            Quitar
                          </button>
                        </div>
                        <div className="w-full mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                          <div>
                            <p className="uppercase font-bold text-[9px] mb-1">Presentación / Marca</p>
                            <input
                              className="w-full bg-white border border-slate-200 p-2 rounded-lg text-xs"
                              placeholder="Ej: Bolsa 1kg, Marca"
                              value={ing.presentation || ''}
                              onChange={e =>
                                handleChangePriceField(
                                  recipe.id,
                                  ing.id,
                                  'presentation',
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="grid grid-cols-[1fr,1fr] gap-2">
                            <div>
                              <p className="uppercase font-bold text-[9px] mb-1">Cant. presentación</p>
                              <input
                                type="number"
                                className="w-full bg-white border border-slate-200 p-2 rounded-lg text-xs"
                                placeholder="Ej: 1000"
                                value={ing.packageQuantity ?? ''}
                                onChange={e =>
                                  handleChangePriceField(
                                    recipe.id,
                                    ing.id,
                                    'packageQuantity',
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                            <div>
                              <p className="uppercase font-bold text-[9px] mb-1">Costo presentación</p>
                              <input
                                type="number"
                                className="w-full bg-white border border-slate-200 p-2 rounded-lg text-xs"
                                placeholder="Ej: 5.50"
                                value={ing.packageCost ?? ''}
                                onChange={e =>
                                  handleChangePriceField(
                                    recipe.id,
                                    ing.id,
                                    'packageCost',
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="text-slate-600 font-medium">{ing.materialName}</span>
                        <span className="font-mono font-bold text-brand">
                          {ing.amountPerLiter} {ing.unit}
                        </span>
                      </>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <button
                    type="button"
                    className="mt-2 text-[11px] font-bold text-brand uppercase"
                    onClick={() => handleAddIngredient(recipe.id)}
                  >
                    + Añadir componente
                  </button>
                )}
              </div>
              <div className="pt-4 border-t border-slate-50">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Notas Técnicas</p>
                {isEditing ? (
                  <textarea
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs text-slate-700 leading-relaxed"
                    rows={3}
                    placeholder="Escribe aquí las notas técnicas para esta fórmula…"
                    value={recipe.notes}
                    onChange={e => handleChangeNotes(recipe.id, e.target.value)}
                  />
                ) : (
                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    {recipe.notes ? `"${recipe.notes}"` : 'Sin notas técnicas definidas.'}
                  </p>
                )}
              </div>
            </div>
            <div className="p-4 bg-slate-50 flex gap-2">
              {!isEditing && (
                <button
                  className="flex-1 bg-white border border-slate-200 text-brand text-xs font-bold py-2 rounded-lg hover:bg-slate-100 transition-colors uppercase"
                  onClick={() => setEditingRecipeId(recipe.id)}
                >
                  Edición
                </button>
              )}
              {isEditing && (
                <>
                  <button
                    disabled={saving}
                    onClick={() => handleSaveRecipe(recipe.id)}
                    className="flex-1 bg-brand text-white text-xs font-bold py-2 rounded-lg hover:bg-black transition-colors uppercase disabled:bg-slate-300"
                  >
                    Guardar
                  </button>
                  <button
                    disabled={saving}
                    onClick={() => setEditingRecipeId(null)}
                    className="flex-1 bg-white border border-slate-200 text-slate-600 text-xs font-bold py-2 rounded-lg hover:bg-slate-100 transition-colors uppercase"
                  >
                    Cancelar
                  </button>
                </>
              )}
            </div>
          </div>
        );})}
      </div>
    </div>
  );
};

export default Recetas;
