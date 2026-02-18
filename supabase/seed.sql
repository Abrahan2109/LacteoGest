insert into materials (name, provider, quantity, unit, expiry_date, type, min_threshold)
values
('Leche Cruda','Hacienda La Gloria',8,'L','2025-12-31','leche',10),
('Cuajo Líquido','BioDairy S.A.',2.5,'L','2025-12-31','insumo',1),
('Cultivo Láctico','BioDairy S.A.',3,'Sobres','2025-12-31','insumo',5),
('Envase Yogurt 1L','PackMaster',500,'Uds',null,'empaque',100)
on conflict do nothing;
with r as (
  insert into recipes (name, base_milk) values ('Yogur Griego Base',1) returning id
)
insert into recipe_ingredients (recipe_id, material_name, amount_per_liter, unit)
select r.id,'Cultivo Láctico',0.05,'Sobres' from r
union all
select r.id,'Leche en Polvo (Refuerzo)',30,'gr' from r
union all
select r.id,'Vainilla Natural',2,'ml' from r;
with r as (
  insert into recipes (name, base_milk) values ('Yogur Café Gourmet',1) returning id
)
insert into recipe_ingredients (recipe_id, material_name, amount_per_liter, unit)
select r.id,'Cultivo Láctico',0.05,'Sobres' from r
union all
select r.id,'Extracto Café Abba',15,'ml' from r
union all
select r.id,'Azúcar Orgánica',40,'gr' from r;
