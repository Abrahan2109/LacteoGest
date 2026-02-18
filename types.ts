
export enum AppTab {
  DASHBOARD = 'DASHBOARD',
  MATERIA_PRIMA = 'MATERIA_PRIMA',
  RECETAS = 'RECETAS',
  PRODUCCION = 'PRODUCCION',
  STOCK = 'STOCK',
  PEDIDOS = 'PEDIDOS',
  VENTAS = 'VENTAS'
}

export interface RawMaterial {
  id: string;
  name: string;
  provider: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  type: 'leche' | 'insumo' | 'empaque';
  minThreshold: number;
}

export interface RecipeIngredient {
  materialId: string;
  materialName: string;
  amountPerLiter: number; // Cantidad necesaria por cada 1 litro de leche
  unit: string;
}

export interface Recipe {
  id: string;
  name: string;
  baseMilk: 1; // Siempre 1 litro
  ingredients: RecipeIngredient[];
  notes: string;
}

export interface ProductionOrder {
  id: string;
  recipeId: string;
  date: string;
  batch: string;
  status: 'en_proceso' | 'terminado';
  milkVolume: number; // Litros de leche a procesar
  quantityProduced: number;
  waste: number;
}
