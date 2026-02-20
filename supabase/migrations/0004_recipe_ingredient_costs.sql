alter table recipe_ingredients
  add column if not exists presentation text,
  add column if not exists brand text,
  add column if not exists package_quantity numeric,
  add column if not exists package_cost numeric;

