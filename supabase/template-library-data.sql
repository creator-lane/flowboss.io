-- AUTO-GENERATED — do not edit by hand
-- Source: src/lib/projectTemplates.ts
-- Generator: scripts/generate-template-seed-sql.ts
-- Cascading delete from project_templates wipes phases/tasks/materials
-- in one shot, so re-runs apply edits and removals cleanly.

BEGIN;

DELETE FROM project_templates;

-- Bathroom Remodel (plumbing)
INSERT INTO project_templates (id, name, icon, category, trade, description, estimated_days, estimated_budget_low, estimated_budget_high, sort_order) VALUES ('bathroom_remodel', 'Bathroom Remodel', 'water', 'Remodel', 'plumbing', 'Full or partial bathroom gut and remodel including fixtures, tile, and plumbing.', 10, 8000, 18000, 0);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('bathroom_remodel__1', 'bathroom_remodel', 'Demo & Rough-In', 1, 2, 'Remove existing fixtures, tile, vanity. Rough in new drain and supply lines.', 'Rough-in plumbing inspection');
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('bathroom_remodel__1__t1', 'bathroom_remodel__1', 'Shut off water, drain lines', 1, false),
  ('bathroom_remodel__1__t2', 'bathroom_remodel__1', 'Remove toilet', 2, false),
  ('bathroom_remodel__1__t3', 'bathroom_remodel__1', 'Remove vanity & sink', 3, false),
  ('bathroom_remodel__1__t4', 'bathroom_remodel__1', 'Remove tub/shower', 4, false),
  ('bathroom_remodel__1__t5', 'bathroom_remodel__1', 'Demo tile (floor & walls)', 5, false),
  ('bathroom_remodel__1__t6', 'bathroom_remodel__1', 'Remove old drain lines', 6, false),
  ('bathroom_remodel__1__t7', 'bathroom_remodel__1', 'Rough-in new drain lines', 7, false),
  ('bathroom_remodel__1__t8', 'bathroom_remodel__1', 'Rough-in new supply lines (PEX)', 8, false),
  ('bathroom_remodel__1__t9', 'bathroom_remodel__1', 'Install new shut-off valves', 9, false),
  ('bathroom_remodel__1__t10', 'bathroom_remodel__1', 'Pressure test new lines', 10, false),
  ('bathroom_remodel__1__t11', 'bathroom_remodel__1', 'Call for rough-in inspection', 11, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('bathroom_remodel__1__m1', 'bathroom_remodel__1', 'PEX pipe 1/2" (50ft roll)', 45, 'Pipe', false, 1),
  ('bathroom_remodel__1__m2', 'bathroom_remodel__1', 'PEX pipe 3/4" (25ft roll)', 35, 'Pipe', false, 2),
  ('bathroom_remodel__1__m3', 'bathroom_remodel__1', 'SharkBite fittings assorted', 90, 'Fittings', false, 3),
  ('bathroom_remodel__1__m4', 'bathroom_remodel__1', 'ABS drain pipe & fittings', 65, 'Drain', false, 4),
  ('bathroom_remodel__1__m5', 'bathroom_remodel__1', 'Shut-off valves (4)', 56, 'Valves', false, 5),
  ('bathroom_remodel__1__m6', 'bathroom_remodel__1', 'Linear shower drain', 185, 'Drain', true, 6),
  ('bathroom_remodel__1__m7', 'bathroom_remodel__1', 'Demolition disposal', 200, 'Labor', false, 7);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('bathroom_remodel__2', 'bathroom_remodel', 'Shower Pan & Waterproofing', 2, 2, 'Build shower curb, install mud bed, waterproof membrane, flood test.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('bathroom_remodel__2__t1', 'bathroom_remodel__2', 'Build shower curb', 1, false),
  ('bathroom_remodel__2__t2', 'bathroom_remodel__2', 'Install pre-slope / mud bed', 2, false),
  ('bathroom_remodel__2__t3', 'bathroom_remodel__2', 'Apply waterproof membrane (Kerdi/RedGard)', 3, false),
  ('bathroom_remodel__2__t4', 'bathroom_remodel__2', 'Seal all seams and corners', 4, false),
  ('bathroom_remodel__2__t5', 'bathroom_remodel__2', 'Install drain assembly', 5, false),
  ('bathroom_remodel__2__t6', 'bathroom_remodel__2', 'Flood test (24 hours)', 6, false),
  ('bathroom_remodel__2__t7', 'bathroom_remodel__2', 'Take photos of waterproofing', 7, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('bathroom_remodel__2__m1', 'bathroom_remodel__2', 'Kerdi membrane (roll)', 145, 'Waterproofing', false, 1),
  ('bathroom_remodel__2__m2', 'bathroom_remodel__2', 'Kerdi-Band / seam tape', 32, 'Waterproofing', false, 2),
  ('bathroom_remodel__2__m3', 'bathroom_remodel__2', 'Deck mud (5 bags)', 45, 'Masonry', false, 3),
  ('bathroom_remodel__2__m4', 'bathroom_remodel__2', 'Concrete blocks (curb)', 18, 'Masonry', false, 4),
  ('bathroom_remodel__2__m5', 'bathroom_remodel__2', 'RedGard (1 gal)', 35, 'Waterproofing', true, 5);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('bathroom_remodel__3', 'bathroom_remodel', 'Tile Installation', 3, 3, 'Floor tile, shower wall tile, niche, accent details, grout and seal.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('bathroom_remodel__3__t1', 'bathroom_remodel__3', 'Layout floor tile pattern (dry fit)', 1, false),
  ('bathroom_remodel__3__t2', 'bathroom_remodel__3', 'Install floor tile', 2, false),
  ('bathroom_remodel__3__t3', 'bathroom_remodel__3', 'Install shower wall tile (day 1)', 3, false),
  ('bathroom_remodel__3__t4', 'bathroom_remodel__3', 'Install shower wall tile (day 2)', 4, false),
  ('bathroom_remodel__3__t5', 'bathroom_remodel__3', 'Install shower niche', 5, false),
  ('bathroom_remodel__3__t6', 'bathroom_remodel__3', 'Install accent strip / border', 6, true),
  ('bathroom_remodel__3__t7', 'bathroom_remodel__3', 'Let thinset cure (overnight)', 7, false),
  ('bathroom_remodel__3__t8', 'bathroom_remodel__3', 'Grout all tile', 8, false),
  ('bathroom_remodel__3__t9', 'bathroom_remodel__3', 'Seal grout', 9, false),
  ('bathroom_remodel__3__t10', 'bathroom_remodel__3', 'Clean up tile dust', 10, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('bathroom_remodel__3__m1', 'bathroom_remodel__3', 'Floor tile', 400, 'Tile', false, 1),
  ('bathroom_remodel__3__m2', 'bathroom_remodel__3', 'Wall tile (shower)', 250, 'Tile', false, 2),
  ('bathroom_remodel__3__m3', 'bathroom_remodel__3', 'Tile niche (prefab)', 65, 'Tile', false, 3),
  ('bathroom_remodel__3__m4', 'bathroom_remodel__3', 'Thinset mortar (4 bags)', 64, 'Adhesive', false, 4),
  ('bathroom_remodel__3__m5', 'bathroom_remodel__3', 'Grout (sanded, 2 bags)', 28, 'Grout', false, 5),
  ('bathroom_remodel__3__m6', 'bathroom_remodel__3', 'Tile spacers & levelers', 35, 'Tools', false, 6),
  ('bathroom_remodel__3__m7', 'bathroom_remodel__3', 'Accent strip / mosaic', 85, 'Tile', true, 7);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('bathroom_remodel__4', 'bathroom_remodel', 'Fixture Installation', 4, 2, 'Set toilet, install vanity, shower fixtures, accessories. Final connections.', 'Final plumbing inspection');
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('bathroom_remodel__4__t1', 'bathroom_remodel__4', 'Install vanity & countertop', 1, false),
  ('bathroom_remodel__4__t2', 'bathroom_remodel__4', 'Install vanity faucet & P-trap', 2, false),
  ('bathroom_remodel__4__t3', 'bathroom_remodel__4', 'Set toilet (wax ring, bolts, supply)', 3, false),
  ('bathroom_remodel__4__t4', 'bathroom_remodel__4', 'Install shower valve trim kit', 4, false),
  ('bathroom_remodel__4__t5', 'bathroom_remodel__4', 'Install shower head / rain head', 5, false),
  ('bathroom_remodel__4__t6', 'bathroom_remodel__4', 'Install handheld shower', 6, true),
  ('bathroom_remodel__4__t7', 'bathroom_remodel__4', 'Install glass shower door', 7, false),
  ('bathroom_remodel__4__t8', 'bathroom_remodel__4', 'Install mirror', 8, false),
  ('bathroom_remodel__4__t9', 'bathroom_remodel__4', 'Install towel bars, hooks, TP holder', 9, false),
  ('bathroom_remodel__4__t10', 'bathroom_remodel__4', 'Caulk all fixtures (silicone)', 10, false),
  ('bathroom_remodel__4__t11', 'bathroom_remodel__4', 'Test all fixtures — no leaks', 11, false),
  ('bathroom_remodel__4__t12', 'bathroom_remodel__4', 'Call for final inspection', 12, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('bathroom_remodel__4__m1', 'bathroom_remodel__4', 'Vanity w/ countertop', 800, 'Fixtures', false, 1),
  ('bathroom_remodel__4__m2', 'bathroom_remodel__4', 'Vanity faucet', 165, 'Fixtures', false, 2),
  ('bathroom_remodel__4__m3', 'bathroom_remodel__4', 'Toilet', 280, 'Fixtures', false, 3),
  ('bathroom_remodel__4__m4', 'bathroom_remodel__4', 'Shower valve (rough + trim)', 250, 'Fixtures', false, 4),
  ('bathroom_remodel__4__m5', 'bathroom_remodel__4', 'Shower head', 120, 'Fixtures', false, 5),
  ('bathroom_remodel__4__m6', 'bathroom_remodel__4', 'Glass shower door', 650, 'Fixtures', false, 6),
  ('bathroom_remodel__4__m7', 'bathroom_remodel__4', 'Mirror', 120, 'Fixtures', false, 7),
  ('bathroom_remodel__4__m8', 'bathroom_remodel__4', 'Accessory set (towel bar, hooks)', 85, 'Fixtures', false, 8),
  ('bathroom_remodel__4__m9', 'bathroom_remodel__4', 'Wax ring, supply lines, caulk', 35, 'Supplies', false, 9);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('bathroom_remodel__5', 'bathroom_remodel', 'Punch List & Cleanup', 5, 1, 'Customer walkthrough, fix punch list items, final cleanup, sign-off.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('bathroom_remodel__5__t1', 'bathroom_remodel__5', 'Walk bathroom with customer', 1, false),
  ('bathroom_remodel__5__t2', 'bathroom_remodel__5', 'Note any punch list items', 2, false),
  ('bathroom_remodel__5__t3', 'bathroom_remodel__5', 'Fix punch list items', 3, false),
  ('bathroom_remodel__5__t4', 'bathroom_remodel__5', 'Touch-up caulk where needed', 4, false),
  ('bathroom_remodel__5__t5', 'bathroom_remodel__5', 'Final cleanup', 5, false),
  ('bathroom_remodel__5__t6', 'bathroom_remodel__5', 'Take completion photos (before/after)', 6, false),
  ('bathroom_remodel__5__t7', 'bathroom_remodel__5', 'Get customer sign-off', 7, false),
  ('bathroom_remodel__5__t8', 'bathroom_remodel__5', 'Leave maintenance instructions', 8, false);

-- Whole-House Repipe (plumbing)
INSERT INTO project_templates (id, name, icon, category, trade, description, estimated_days, estimated_budget_low, estimated_budget_high, sort_order) VALUES ('whole_house_repipe', 'Whole-House Repipe', 'git-network', 'Repipe', 'plumbing', 'Replace all supply lines (copper/galvanized to PEX). Typical for older homes.', 5, 5000, 12000, 1);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('whole_house_repipe__1', 'whole_house_repipe', 'Assessment & Prep', 1, 1, 'Map existing pipes, plan new routing, mark access points, protect surfaces.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('whole_house_repipe__1__t1', 'whole_house_repipe__1', 'Walk entire house — map all fixtures', 1, false),
  ('whole_house_repipe__1__t2', 'whole_house_repipe__1', 'Check water pressure (gauge reading)', 2, false),
  ('whole_house_repipe__1__t3', 'whole_house_repipe__1', 'Identify pipe material (copper/galv/poly)', 3, false),
  ('whole_house_repipe__1__t4', 'whole_house_repipe__1', 'Plan new PEX routing (manifold vs trunk)', 4, false),
  ('whole_house_repipe__1__t5', 'whole_house_repipe__1', 'Mark wall/ceiling access points', 5, false),
  ('whole_house_repipe__1__t6', 'whole_house_repipe__1', 'Lay drop cloths, protect flooring', 6, false),
  ('whole_house_repipe__1__t7', 'whole_house_repipe__1', 'Shut off main water supply', 7, false),
  ('whole_house_repipe__1__t8', 'whole_house_repipe__1', 'Drain all lines', 8, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('whole_house_repipe__1__m1', 'whole_house_repipe__1', 'PEX manifold (hot + cold)', 120, 'Manifold', false, 1),
  ('whole_house_repipe__1__m2', 'whole_house_repipe__1', 'Drop cloths', 30, 'Protection', false, 2),
  ('whole_house_repipe__1__m3', 'whole_house_repipe__1', 'Pipe labels / tags', 15, 'Supplies', false, 3);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('whole_house_repipe__2', 'whole_house_repipe', 'Demolition & Access', 2, 1, 'Open walls/ceilings as needed, remove old pipe runs.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('whole_house_repipe__2__t1', 'whole_house_repipe__2', 'Cut access holes in drywall', 1, false),
  ('whole_house_repipe__2__t2', 'whole_house_repipe__2', 'Remove old supply lines (hot)', 2, false),
  ('whole_house_repipe__2__t3', 'whole_house_repipe__2', 'Remove old supply lines (cold)', 3, false),
  ('whole_house_repipe__2__t4', 'whole_house_repipe__2', 'Remove old shut-off valves', 4, false),
  ('whole_house_repipe__2__t5', 'whole_house_repipe__2', 'Cap any open drains (protect from debris)', 5, false),
  ('whole_house_repipe__2__t6', 'whole_house_repipe__2', 'Haul out old pipe', 6, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('whole_house_repipe__2__m1', 'whole_house_repipe__2', 'Drywall saw / oscillating tool blades', 25, 'Tools', false, 1),
  ('whole_house_repipe__2__m2', 'whole_house_repipe__2', 'Pipe caps (assorted)', 15, 'Fittings', false, 2);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('whole_house_repipe__3', 'whole_house_repipe', 'New PEX Installation', 3, 2, 'Run all new PEX supply lines from manifold to every fixture.', 'Rough-in plumbing inspection');
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('whole_house_repipe__3__t1', 'whole_house_repipe__3', 'Mount manifold (mechanical room / utility)', 1, false),
  ('whole_house_repipe__3__t2', 'whole_house_repipe__3', 'Run cold lines to all fixtures', 2, false),
  ('whole_house_repipe__3__t3', 'whole_house_repipe__3', 'Run hot lines to all fixtures', 3, false),
  ('whole_house_repipe__3__t4', 'whole_house_repipe__3', 'Install new shut-off valves at each fixture', 4, false),
  ('whole_house_repipe__3__t5', 'whole_house_repipe__3', 'Install new hose bibbs (exterior)', 5, false),
  ('whole_house_repipe__3__t6', 'whole_house_repipe__3', 'Support / strap all PEX runs', 6, false),
  ('whole_house_repipe__3__t7', 'whole_house_repipe__3', 'Pressure test entire system (100 PSI, 30 min)', 7, false),
  ('whole_house_repipe__3__t8', 'whole_house_repipe__3', 'Take photos of all runs before closing walls', 8, false),
  ('whole_house_repipe__3__t9', 'whole_house_repipe__3', 'Call for rough-in inspection', 9, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('whole_house_repipe__3__m1', 'whole_house_repipe__3', 'PEX 1/2" red (500ft)', 180, 'Pipe', false, 1),
  ('whole_house_repipe__3__m2', 'whole_house_repipe__3', 'PEX 1/2" blue (500ft)', 180, 'Pipe', false, 2),
  ('whole_house_repipe__3__m3', 'whole_house_repipe__3', 'PEX 3/4" (100ft)', 75, 'Pipe', false, 3),
  ('whole_house_repipe__3__m4', 'whole_house_repipe__3', 'PEX fittings assorted (crimp/SharkBite)', 150, 'Fittings', false, 4),
  ('whole_house_repipe__3__m5', 'whole_house_repipe__3', 'Shut-off valves (12-15)', 120, 'Valves', false, 5),
  ('whole_house_repipe__3__m6', 'whole_house_repipe__3', 'Pipe straps & supports', 40, 'Supports', false, 6),
  ('whole_house_repipe__3__m7', 'whole_house_repipe__3', 'Hose bibbs (2)', 35, 'Valves', false, 7);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('whole_house_repipe__4', 'whole_house_repipe', 'Connect & Test', 4, 1, 'Connect all fixtures, test every faucet/toilet/appliance, check for leaks.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('whole_house_repipe__4__t1', 'whole_house_repipe__4', 'Connect kitchen sink', 1, false),
  ('whole_house_repipe__4__t2', 'whole_house_repipe__4', 'Connect dishwasher', 2, false),
  ('whole_house_repipe__4__t3', 'whole_house_repipe__4', 'Connect all bathroom sinks', 3, false),
  ('whole_house_repipe__4__t4', 'whole_house_repipe__4', 'Connect all toilets', 4, false),
  ('whole_house_repipe__4__t5', 'whole_house_repipe__4', 'Connect all showers/tubs', 5, false),
  ('whole_house_repipe__4__t6', 'whole_house_repipe__4', 'Connect washing machine', 6, false),
  ('whole_house_repipe__4__t7', 'whole_house_repipe__4', 'Connect water heater', 7, false),
  ('whole_house_repipe__4__t8', 'whole_house_repipe__4', 'Connect ice maker / fridge', 8, true),
  ('whole_house_repipe__4__t9', 'whole_house_repipe__4', 'Turn on main — check for leaks at every joint', 9, false),
  ('whole_house_repipe__4__t10', 'whole_house_repipe__4', 'Run every fixture — check pressure & flow', 10, false),
  ('whole_house_repipe__4__t11', 'whole_house_repipe__4', 'Check water heater — hot to all fixtures', 11, false),
  ('whole_house_repipe__4__t12', 'whole_house_repipe__4', 'Call for final inspection', 12, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('whole_house_repipe__4__m1', 'whole_house_repipe__4', 'Supply lines (braided, assorted)', 60, 'Supplies', false, 1),
  ('whole_house_repipe__4__m2', 'whole_house_repipe__4', 'Teflon tape / pipe dope', 10, 'Supplies', false, 2);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('whole_house_repipe__5', 'whole_house_repipe', 'Patch & Finish', 5, 1, 'Patch drywall, cleanup, customer walkthrough.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('whole_house_repipe__5__t1', 'whole_house_repipe__5', 'Patch all drywall access holes', 1, false),
  ('whole_house_repipe__5__t2', 'whole_house_repipe__5', 'Mud, tape, sand patches (or schedule drywall crew)', 2, false),
  ('whole_house_repipe__5__t3', 'whole_house_repipe__5', 'Final leak check (24hr)', 3, false),
  ('whole_house_repipe__5__t4', 'whole_house_repipe__5', 'Clean up all work areas', 4, false),
  ('whole_house_repipe__5__t5', 'whole_house_repipe__5', 'Walk house with customer — demo all fixtures', 5, false),
  ('whole_house_repipe__5__t6', 'whole_house_repipe__5', 'Show customer manifold & shut-offs', 6, false),
  ('whole_house_repipe__5__t7', 'whole_house_repipe__5', 'Take completion photos', 7, false),
  ('whole_house_repipe__5__t8', 'whole_house_repipe__5', 'Get customer sign-off', 8, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('whole_house_repipe__5__m1', 'whole_house_repipe__5', 'Drywall patches', 25, 'Drywall', false, 1),
  ('whole_house_repipe__5__m2', 'whole_house_repipe__5', 'Joint compound & tape', 20, 'Drywall', false, 2);

-- Water Heater Replacement (plumbing)
INSERT INTO project_templates (id, name, icon, category, trade, description, estimated_days, estimated_budget_low, estimated_budget_high, sort_order) VALUES ('water_heater_replace', 'Water Heater Replacement', 'flame', 'Water Heater', 'plumbing', 'Remove old tank water heater, install new unit. Gas or electric.', 1, 1200, 2500, 2);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('water_heater_replace__1', 'water_heater_replace', 'Removal & Prep', 1, 1, 'Disconnect and remove old water heater, prep for new unit.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('water_heater_replace__1__t1', 'water_heater_replace__1', 'Shut off gas/electric to unit', 1, false),
  ('water_heater_replace__1__t2', 'water_heater_replace__1', 'Shut off water supply to heater', 2, false),
  ('water_heater_replace__1__t3', 'water_heater_replace__1', 'Connect hose, drain tank completely', 3, false),
  ('water_heater_replace__1__t4', 'water_heater_replace__1', 'Disconnect gas line / electrical', 4, false),
  ('water_heater_replace__1__t5', 'water_heater_replace__1', 'Disconnect water lines (hot & cold)', 5, false),
  ('water_heater_replace__1__t6', 'water_heater_replace__1', 'Disconnect T&P relief valve drain', 6, false),
  ('water_heater_replace__1__t7', 'water_heater_replace__1', 'Remove old unit (dolly)', 7, false),
  ('water_heater_replace__1__t8', 'water_heater_replace__1', 'Inspect flue / venting', 8, true),
  ('water_heater_replace__1__t9', 'water_heater_replace__1', 'Clean area, check drain pan', 9, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('water_heater_replace__1__m1', 'water_heater_replace__1', 'Garden hose (for drain)', 0, 'Tools', false, 1);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('water_heater_replace__2', 'water_heater_replace', 'Installation', 2, 1, 'Set new water heater, connect all lines, test.', 'Water heater permit inspection');
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('water_heater_replace__2__t1', 'water_heater_replace__2', 'Position new water heater in drain pan', 1, false),
  ('water_heater_replace__2__t2', 'water_heater_replace__2', 'Install new expansion tank', 2, false),
  ('water_heater_replace__2__t3', 'water_heater_replace__2', 'Connect cold water supply', 3, false),
  ('water_heater_replace__2__t4', 'water_heater_replace__2', 'Connect hot water outlet', 4, false),
  ('water_heater_replace__2__t5', 'water_heater_replace__2', 'Install new gas flex connector / wire electric', 5, false),
  ('water_heater_replace__2__t6', 'water_heater_replace__2', 'Install new T&P relief valve + drain line', 6, false),
  ('water_heater_replace__2__t7', 'water_heater_replace__2', 'Connect flue / venting', 7, false),
  ('water_heater_replace__2__t8', 'water_heater_replace__2', 'Fill tank — open hot faucet to bleed air', 8, false),
  ('water_heater_replace__2__t9', 'water_heater_replace__2', 'Check all connections for leaks', 9, false),
  ('water_heater_replace__2__t10', 'water_heater_replace__2', 'Light pilot / turn on power', 10, false),
  ('water_heater_replace__2__t11', 'water_heater_replace__2', 'Set temperature (120°F)', 11, false),
  ('water_heater_replace__2__t12', 'water_heater_replace__2', 'Test hot water at nearest fixture', 12, false),
  ('water_heater_replace__2__t13', 'water_heater_replace__2', 'Show customer controls & safety', 13, false),
  ('water_heater_replace__2__t14', 'water_heater_replace__2', 'Take completion photo', 14, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('water_heater_replace__2__m1', 'water_heater_replace__2', 'Water heater (40 or 50 gal)', 550, 'Equipment', false, 1),
  ('water_heater_replace__2__m2', 'water_heater_replace__2', 'Expansion tank', 45, 'Parts', false, 2),
  ('water_heater_replace__2__m3', 'water_heater_replace__2', 'Gas flex connector', 35, 'Parts', false, 3),
  ('water_heater_replace__2__m4', 'water_heater_replace__2', 'Water heater connectors (braided)', 24, 'Parts', false, 4),
  ('water_heater_replace__2__m5', 'water_heater_replace__2', 'T&P relief valve', 15, 'Parts', false, 5),
  ('water_heater_replace__2__m6', 'water_heater_replace__2', 'Drain pan', 12, 'Parts', false, 6),
  ('water_heater_replace__2__m7', 'water_heater_replace__2', 'Teflon tape, pipe dope', 8, 'Supplies', false, 7),
  ('water_heater_replace__2__m8', 'water_heater_replace__2', 'Permit fee', 75, 'Permits', true, 8);

-- Tankless Water Heater Install (plumbing)
INSERT INTO project_templates (id, name, icon, category, trade, description, estimated_days, estimated_budget_low, estimated_budget_high, sort_order) VALUES ('tankless_install', 'Tankless Water Heater Install', 'flash', 'Water Heater', 'plumbing', 'Install tankless (on-demand) water heater. May require gas line upgrade.', 2, 3000, 6000, 3);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('tankless_install__1', 'tankless_install', 'Remove Old & Prep', 1, 1, 'Remove existing tank heater, prep mounting location, assess gas line.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('tankless_install__1__t1', 'tankless_install__1', 'Shut off gas & water to old unit', 1, false),
  ('tankless_install__1__t2', 'tankless_install__1', 'Drain and remove old tank heater', 2, false),
  ('tankless_install__1__t3', 'tankless_install__1', 'Assess gas line size (3/4" min for tankless)', 3, false),
  ('tankless_install__1__t4', 'tankless_install__1', 'Plan venting route (direct vent/power vent)', 4, false),
  ('tankless_install__1__t5', 'tankless_install__1', 'Check electrical (needs dedicated outlet)', 5, false),
  ('tankless_install__1__t6', 'tankless_install__1', 'Mark mounting location', 6, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('tankless_install__1__m1', 'tankless_install__1', 'Tankless water heater unit', 1200, 'Equipment', false, 1);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('tankless_install__2', 'tankless_install', 'Gas & Venting', 2, 1, 'Upgrade gas line if needed, install venting.', 'Gas line inspection');
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('tankless_install__2__t1', 'tankless_install__2', 'Upgrade gas line to 3/4" (if needed)', 1, false),
  ('tankless_install__2__t2', 'tankless_install__2', 'Install gas shut-off valve', 2, false),
  ('tankless_install__2__t3', 'tankless_install__2', 'Run stainless steel venting to exterior', 3, false),
  ('tankless_install__2__t4', 'tankless_install__2', 'Install vent termination (exterior wall)', 4, false),
  ('tankless_install__2__t5', 'tankless_install__2', 'Seal all penetrations', 5, false),
  ('tankless_install__2__t6', 'tankless_install__2', 'Pressure test gas line', 6, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('tankless_install__2__m1', 'tankless_install__2', 'Gas pipe 3/4" (black iron)', 80, 'Gas', false, 1),
  ('tankless_install__2__m2', 'tankless_install__2', 'Gas fittings', 45, 'Gas', false, 2),
  ('tankless_install__2__m3', 'tankless_install__2', 'Stainless vent kit', 180, 'Venting', false, 3),
  ('tankless_install__2__m4', 'tankless_install__2', 'Vent termination', 35, 'Venting', false, 4);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('tankless_install__3', 'tankless_install', 'Mount & Connect', 3, 1, 'Mount unit, connect water, gas, electric. Commission and test.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('tankless_install__3__t1', 'tankless_install__3', 'Mount unit to wall (blocking if needed)', 1, false),
  ('tankless_install__3__t2', 'tankless_install__3', 'Connect cold water inlet', 2, false),
  ('tankless_install__3__t3', 'tankless_install__3', 'Connect hot water outlet', 3, false),
  ('tankless_install__3__t4', 'tankless_install__3', 'Connect gas line', 4, false),
  ('tankless_install__3__t5', 'tankless_install__3', 'Connect condensate drain', 5, false),
  ('tankless_install__3__t6', 'tankless_install__3', 'Connect electrical (120V outlet)', 6, false),
  ('tankless_install__3__t7', 'tankless_install__3', 'Turn on water — purge air', 7, false),
  ('tankless_install__3__t8', 'tankless_install__3', 'Turn on gas — test for leaks', 8, false),
  ('tankless_install__3__t9', 'tankless_install__3', 'Commission unit — set temp (120°F)', 9, false),
  ('tankless_install__3__t10', 'tankless_install__3', 'Test hot water at multiple fixtures', 10, false),
  ('tankless_install__3__t11', 'tankless_install__3', 'Verify flow rate & activation', 11, false),
  ('tankless_install__3__t12', 'tankless_install__3', 'Install recirculation pump', 12, true);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('tankless_install__3__m1', 'tankless_install__3', 'Isolation valves kit', 65, 'Valves', false, 1),
  ('tankless_install__3__m2', 'tankless_install__3', 'Water connectors (braided)', 24, 'Parts', false, 2),
  ('tankless_install__3__m3', 'tankless_install__3', 'Gas flex connector', 35, 'Parts', false, 3),
  ('tankless_install__3__m4', 'tankless_install__3', 'Condensate drain line', 15, 'Drain', false, 4),
  ('tankless_install__3__m5', 'tankless_install__3', 'Recirculation pump', 200, 'Equipment', true, 5),
  ('tankless_install__3__m6', 'tankless_install__3', 'Permit fee', 100, 'Permits', false, 6);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('tankless_install__4', 'tankless_install', 'Cleanup & Walkthrough', 4, 1, 'Final testing, customer education, cleanup.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('tankless_install__4__t1', 'tankless_install__4', 'Final leak check everywhere', 1, false),
  ('tankless_install__4__t2', 'tankless_install__4', 'Show customer how to adjust temperature', 2, false),
  ('tankless_install__4__t3', 'tankless_install__4', 'Explain maintenance (descale every 1-2 years)', 3, false),
  ('tankless_install__4__t4', 'tankless_install__4', 'Show customer shut-off locations', 4, false),
  ('tankless_install__4__t5', 'tankless_install__4', 'Register warranty', 5, false),
  ('tankless_install__4__t6', 'tankless_install__4', 'Clean up work area', 6, false),
  ('tankless_install__4__t7', 'tankless_install__4', 'Take before/after photos', 7, false),
  ('tankless_install__4__t8', 'tankless_install__4', 'Get customer sign-off', 8, false);

-- Sewer Line Replacement (plumbing)
INSERT INTO project_templates (id, name, icon, category, trade, description, estimated_days, estimated_budget_low, estimated_budget_high, sort_order) VALUES ('sewer_line_replace', 'Sewer Line Replacement', 'construct', 'Sewer', 'plumbing', 'Excavate and replace main sewer line. Traditional dig or trenchless.', 4, 6000, 15000, 4);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('sewer_line_replace__1', 'sewer_line_replace', 'Camera Inspection & Planning', 1, 1, 'Camera the existing line, locate problem areas, plan repair method.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('sewer_line_replace__1__t1', 'sewer_line_replace__1', 'Camera inspect existing sewer line', 1, false),
  ('sewer_line_replace__1__t2', 'sewer_line_replace__1', 'Record video & photos of damage', 2, false),
  ('sewer_line_replace__1__t3', 'sewer_line_replace__1', 'Locate line with transmitter', 3, false),
  ('sewer_line_replace__1__t4', 'sewer_line_replace__1', 'Mark line path on surface', 4, false),
  ('sewer_line_replace__1__t5', 'sewer_line_replace__1', 'Determine repair method (dig vs trenchless)', 5, false),
  ('sewer_line_replace__1__t6', 'sewer_line_replace__1', 'Call 811 (utility locate)', 6, false),
  ('sewer_line_replace__1__t7', 'sewer_line_replace__1', 'Pull permits', 7, false),
  ('sewer_line_replace__1__t8', 'sewer_line_replace__1', 'Discuss options & pricing with customer', 8, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('sewer_line_replace__1__m1', 'sewer_line_replace__1', 'Locator transmitter', 0, 'Tools', false, 1),
  ('sewer_line_replace__1__m2', 'sewer_line_replace__1', 'Marking paint', 8, 'Supplies', false, 2),
  ('sewer_line_replace__1__m3', 'sewer_line_replace__1', 'Permit fee', 150, 'Permits', false, 3);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('sewer_line_replace__2', 'sewer_line_replace', 'Excavation', 2, 1, 'Dig trench to expose sewer line. Protect landscaping where possible.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('sewer_line_replace__2__t1', 'sewer_line_replace__2', 'Set up work zone (barriers, signs)', 1, false),
  ('sewer_line_replace__2__t2', 'sewer_line_replace__2', 'Protect landscaping / hardscape', 2, false),
  ('sewer_line_replace__2__t3', 'sewer_line_replace__2', 'Excavate trench to sewer line', 3, false),
  ('sewer_line_replace__2__t4', 'sewer_line_replace__2', 'Expose entire damaged section', 4, false),
  ('sewer_line_replace__2__t5', 'sewer_line_replace__2', 'Shore trench if deeper than 4ft', 5, false),
  ('sewer_line_replace__2__t6', 'sewer_line_replace__2', 'Dewater trench if needed', 6, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('sewer_line_replace__2__m1', 'sewer_line_replace__2', 'Mini excavator rental (1 day)', 350, 'Equipment', false, 1),
  ('sewer_line_replace__2__m2', 'sewer_line_replace__2', 'Trench safety equipment', 0, 'Safety', false, 2),
  ('sewer_line_replace__2__m3', 'sewer_line_replace__2', 'Sump pump (dewater)', 0, 'Tools', false, 3);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('sewer_line_replace__3', 'sewer_line_replace', 'Pipe Replacement', 3, 1.5, 'Remove old pipe, install new sewer line, connect to main and house.', 'Sewer line inspection (before backfill)');
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('sewer_line_replace__3__t1', 'sewer_line_replace__3', 'Remove damaged pipe section', 1, false),
  ('sewer_line_replace__3__t2', 'sewer_line_replace__3', 'Install new sewer pipe (PVC / SDR-35)', 2, false),
  ('sewer_line_replace__3__t3', 'sewer_line_replace__3', 'Ensure proper slope (1/4" per foot min)', 3, false),
  ('sewer_line_replace__3__t4', 'sewer_line_replace__3', 'Connect to city main / cleanout', 4, false),
  ('sewer_line_replace__3__t5', 'sewer_line_replace__3', 'Connect to house stub', 5, false),
  ('sewer_line_replace__3__t6', 'sewer_line_replace__3', 'Install new cleanout (if none exists)', 6, false),
  ('sewer_line_replace__3__t7', 'sewer_line_replace__3', 'Glue all joints — let cure', 7, false),
  ('sewer_line_replace__3__t8', 'sewer_line_replace__3', 'Camera inspect new line', 8, false),
  ('sewer_line_replace__3__t9', 'sewer_line_replace__3', 'Water test (fill & hold)', 9, false),
  ('sewer_line_replace__3__t10', 'sewer_line_replace__3', 'Call for inspection before backfill', 10, false),
  ('sewer_line_replace__3__t11', 'sewer_line_replace__3', 'Take photos for inspection', 11, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('sewer_line_replace__3__m1', 'sewer_line_replace__3', 'PVC sewer pipe SDR-35 (per 10ft)', 45, 'Pipe', false, 1),
  ('sewer_line_replace__3__m2', 'sewer_line_replace__3', 'PVC fittings (wyes, bends, couplings)', 80, 'Fittings', false, 2),
  ('sewer_line_replace__3__m3', 'sewer_line_replace__3', 'Cleanout assembly', 35, 'Fittings', false, 3),
  ('sewer_line_replace__3__m4', 'sewer_line_replace__3', 'PVC cement & primer', 20, 'Supplies', false, 4),
  ('sewer_line_replace__3__m5', 'sewer_line_replace__3', 'Gravel bedding (1 yard)', 45, 'Fill', false, 5);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('sewer_line_replace__4', 'sewer_line_replace', 'Backfill & Restore', 4, 1, 'Backfill trench, compact, restore surface (sod/concrete/asphalt).', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('sewer_line_replace__4__t1', 'sewer_line_replace__4', 'Backfill trench in lifts (compact each)', 1, false),
  ('sewer_line_replace__4__t2', 'sewer_line_replace__4', 'Top off with clean fill', 2, false),
  ('sewer_line_replace__4__t3', 'sewer_line_replace__4', 'Replace sod / landscaping', 3, false),
  ('sewer_line_replace__4__t4', 'sewer_line_replace__4', 'Repair concrete / asphalt (if applicable)', 4, false),
  ('sewer_line_replace__4__t5', 'sewer_line_replace__4', 'Final camera inspection', 5, false),
  ('sewer_line_replace__4__t6', 'sewer_line_replace__4', 'Run water — verify flow & no leaks', 6, false),
  ('sewer_line_replace__4__t7', 'sewer_line_replace__4', 'Clean up site completely', 7, false),
  ('sewer_line_replace__4__t8', 'sewer_line_replace__4', 'Walk property with customer', 8, false),
  ('sewer_line_replace__4__t9', 'sewer_line_replace__4', 'Take completion photos', 9, false),
  ('sewer_line_replace__4__t10', 'sewer_line_replace__4', 'Get customer sign-off', 10, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('sewer_line_replace__4__m1', 'sewer_line_replace__4', 'Clean fill / topsoil (2 yards)', 80, 'Fill', false, 1),
  ('sewer_line_replace__4__m2', 'sewer_line_replace__4', 'Sod (patches)', 60, 'Landscape', false, 2),
  ('sewer_line_replace__4__m3', 'sewer_line_replace__4', 'Concrete patch', 45, 'Surface', true, 3);

-- Kitchen Remodel (Plumbing) (plumbing)
INSERT INTO project_templates (id, name, icon, category, trade, description, estimated_days, estimated_budget_low, estimated_budget_high, sort_order) VALUES ('kitchen_rough_in', 'Kitchen Remodel (Plumbing)', 'restaurant', 'Remodel', 'plumbing', 'Rough-in and finish plumbing for kitchen remodel — sink, dishwasher, ice maker, gas.', 3, 2000, 5000, 5);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('kitchen_rough_in__1', 'kitchen_rough_in', 'Demo & Rough-In', 1, 1, 'Remove existing fixtures, rough in new supply and drain lines.', 'Rough-in plumbing inspection');
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('kitchen_rough_in__1__t1', 'kitchen_rough_in__1', 'Shut off water & gas', 1, false),
  ('kitchen_rough_in__1__t2', 'kitchen_rough_in__1', 'Disconnect & remove old sink', 2, false),
  ('kitchen_rough_in__1__t3', 'kitchen_rough_in__1', 'Disconnect dishwasher', 3, false),
  ('kitchen_rough_in__1__t4', 'kitchen_rough_in__1', 'Disconnect gas line (if relocating range)', 4, false),
  ('kitchen_rough_in__1__t5', 'kitchen_rough_in__1', 'Remove old supply & drain lines', 5, false),
  ('kitchen_rough_in__1__t6', 'kitchen_rough_in__1', 'Rough-in new supply lines to new sink location', 6, false),
  ('kitchen_rough_in__1__t7', 'kitchen_rough_in__1', 'Rough-in new drain (if relocating)', 7, false),
  ('kitchen_rough_in__1__t8', 'kitchen_rough_in__1', 'Install new gas line (if relocating range)', 8, true),
  ('kitchen_rough_in__1__t9', 'kitchen_rough_in__1', 'Pressure test all new lines', 9, false),
  ('kitchen_rough_in__1__t10', 'kitchen_rough_in__1', 'Call for inspection', 10, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('kitchen_rough_in__1__m1', 'kitchen_rough_in__1', 'PEX pipe assorted', 60, 'Pipe', false, 1),
  ('kitchen_rough_in__1__m2', 'kitchen_rough_in__1', 'PEX fittings', 45, 'Fittings', false, 2),
  ('kitchen_rough_in__1__m3', 'kitchen_rough_in__1', 'ABS drain pipe & fittings', 40, 'Drain', false, 3),
  ('kitchen_rough_in__1__m4', 'kitchen_rough_in__1', 'Gas pipe & fittings', 55, 'Gas', true, 4);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('kitchen_rough_in__2', 'kitchen_rough_in', 'Fixture Installation', 2, 1.5, 'Install sink, faucet, disposal, dishwasher, ice maker line.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('kitchen_rough_in__2__t1', 'kitchen_rough_in__2', 'Install new kitchen sink', 1, false),
  ('kitchen_rough_in__2__t2', 'kitchen_rough_in__2', 'Install faucet & sprayer', 2, false),
  ('kitchen_rough_in__2__t3', 'kitchen_rough_in__2', 'Install garbage disposal', 3, false),
  ('kitchen_rough_in__2__t4', 'kitchen_rough_in__2', 'Connect P-trap & drain', 4, false),
  ('kitchen_rough_in__2__t5', 'kitchen_rough_in__2', 'Install dishwasher drain & supply', 5, false),
  ('kitchen_rough_in__2__t6', 'kitchen_rough_in__2', 'Install dishwasher air gap', 6, false),
  ('kitchen_rough_in__2__t7', 'kitchen_rough_in__2', 'Install ice maker line (fridge)', 7, true),
  ('kitchen_rough_in__2__t8', 'kitchen_rough_in__2', 'Install pot filler', 8, true),
  ('kitchen_rough_in__2__t9', 'kitchen_rough_in__2', 'Connect gas range', 9, false),
  ('kitchen_rough_in__2__t10', 'kitchen_rough_in__2', 'Test all fixtures — no leaks', 10, false),
  ('kitchen_rough_in__2__t11', 'kitchen_rough_in__2', 'Run dishwasher test cycle', 11, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('kitchen_rough_in__2__m1', 'kitchen_rough_in__2', 'Kitchen faucet', 185, 'Fixtures', false, 1),
  ('kitchen_rough_in__2__m2', 'kitchen_rough_in__2', 'Garbage disposal (3/4 HP)', 180, 'Fixtures', false, 2),
  ('kitchen_rough_in__2__m3', 'kitchen_rough_in__2', 'P-trap & tailpiece', 20, 'Drain', false, 3),
  ('kitchen_rough_in__2__m4', 'kitchen_rough_in__2', 'Dishwasher supply line', 12, 'Parts', false, 4),
  ('kitchen_rough_in__2__m5', 'kitchen_rough_in__2', 'Ice maker supply kit', 18, 'Parts', true, 5),
  ('kitchen_rough_in__2__m6', 'kitchen_rough_in__2', 'Gas flex connector', 35, 'Parts', false, 6),
  ('kitchen_rough_in__2__m7', 'kitchen_rough_in__2', 'Supply lines (braided)', 24, 'Parts', false, 7);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('kitchen_rough_in__3', 'kitchen_rough_in', 'Cleanup & Walkthrough', 3, 1, 'Final testing, cleanup, customer sign-off.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('kitchen_rough_in__3__t1', 'kitchen_rough_in__3', 'Final leak check all connections', 1, false),
  ('kitchen_rough_in__3__t2', 'kitchen_rough_in__3', 'Test hot/cold at sink', 2, false),
  ('kitchen_rough_in__3__t3', 'kitchen_rough_in__3', 'Run disposal — check for leaks under', 3, false),
  ('kitchen_rough_in__3__t4', 'kitchen_rough_in__3', 'Clean up all work areas', 4, false),
  ('kitchen_rough_in__3__t5', 'kitchen_rough_in__3', 'Walk kitchen with customer', 5, false),
  ('kitchen_rough_in__3__t6', 'kitchen_rough_in__3', 'Take completion photos', 6, false),
  ('kitchen_rough_in__3__t7', 'kitchen_rough_in__3', 'Get customer sign-off', 7, false);

-- Gas Line Installation (plumbing)
INSERT INTO project_templates (id, name, icon, category, trade, description, estimated_days, estimated_budget_low, estimated_budget_high, sort_order) VALUES ('gas_line_install', 'Gas Line Installation', 'bonfire', 'Gas', 'plumbing', 'Run new gas line for appliance (grill, fire pit, pool heater, generator, dryer).', 1, 800, 2500, 6);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('gas_line_install__1', 'gas_line_install', 'Plan & Install', 1, 1, 'Plan route, run new gas line, connect appliance.', 'Gas line inspection');
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('gas_line_install__1__t1', 'gas_line_install__1', 'Survey route from meter/manifold to appliance', 1, false),
  ('gas_line_install__1__t2', 'gas_line_install__1', 'Calculate BTU load (ensure meter can handle)', 2, false),
  ('gas_line_install__1__t3', 'gas_line_install__1', 'Determine pipe size needed', 3, false),
  ('gas_line_install__1__t4', 'gas_line_install__1', 'Shut off gas at meter', 4, false),
  ('gas_line_install__1__t5', 'gas_line_install__1', 'Install tee at existing line', 5, false),
  ('gas_line_install__1__t6', 'gas_line_install__1', 'Run new gas line (black iron / CSST)', 6, false),
  ('gas_line_install__1__t7', 'gas_line_install__1', 'Install shut-off valve at appliance', 7, false),
  ('gas_line_install__1__t8', 'gas_line_install__1', 'Install drip leg at appliance', 8, false),
  ('gas_line_install__1__t9', 'gas_line_install__1', 'Pressure test (15 PSI, 15 min)', 9, false),
  ('gas_line_install__1__t10', 'gas_line_install__1', 'Check all joints with leak detector', 10, false),
  ('gas_line_install__1__t11', 'gas_line_install__1', 'Call for inspection', 11, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('gas_line_install__1__m1', 'gas_line_install__1', 'Gas pipe (black iron or CSST)', 120, 'Pipe', false, 1),
  ('gas_line_install__1__m2', 'gas_line_install__1', 'Gas fittings assorted', 45, 'Fittings', false, 2),
  ('gas_line_install__1__m3', 'gas_line_install__1', 'Gas shut-off valve', 20, 'Valves', false, 3),
  ('gas_line_install__1__m4', 'gas_line_install__1', 'Pipe thread sealant', 10, 'Supplies', false, 4),
  ('gas_line_install__1__m5', 'gas_line_install__1', 'Permit fee', 75, 'Permits', false, 5);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('gas_line_install__2', 'gas_line_install', 'Connect & Test', 2, 1, 'Connect appliance, test operation, final inspection.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('gas_line_install__2__t1', 'gas_line_install__2', 'Connect gas flex to appliance', 1, false),
  ('gas_line_install__2__t2', 'gas_line_install__2', 'Turn on gas — test for leaks', 2, false),
  ('gas_line_install__2__t3', 'gas_line_install__2', 'Light appliance / test operation', 3, false),
  ('gas_line_install__2__t4', 'gas_line_install__2', 'Check CO levels in area', 4, false),
  ('gas_line_install__2__t5', 'gas_line_install__2', 'Clean up work area', 5, false),
  ('gas_line_install__2__t6', 'gas_line_install__2', 'Show customer shut-off valve location', 6, false),
  ('gas_line_install__2__t7', 'gas_line_install__2', 'Take photos of completed work', 7, false),
  ('gas_line_install__2__t8', 'gas_line_install__2', 'Get customer sign-off', 8, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('gas_line_install__2__m1', 'gas_line_install__2', 'Gas flex connector (appliance)', 35, 'Parts', false, 1),
  ('gas_line_install__2__m2', 'gas_line_install__2', 'Leak detection solution', 8, 'Supplies', false, 2);

-- AC System Install (hvac)
INSERT INTO project_templates (id, name, icon, category, trade, description, estimated_days, estimated_budget_low, estimated_budget_high, sort_order) VALUES ('ac_system_install', 'AC System Install', 'snow-outline', 'Cooling', 'hvac', 'Remove old AC system and install new condensing unit, evaporator coil, and thermostat.', 3, 5500, 7500, 7);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('ac_system_install__1', 'ac_system_install', 'Equipment Selection & Prep', 1, 1, 'Perform load calculation, select equipment, and prep the work site.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('ac_system_install__1__t1', 'ac_system_install__1', 'Perform Manual J load calculation', 1, false),
  ('ac_system_install__1__t2', 'ac_system_install__1', 'Select equipment (size & SEER rating)', 2, false),
  ('ac_system_install__1__t3', 'ac_system_install__1', 'Verify electrical circuit & breaker capacity', 3, false),
  ('ac_system_install__1__t4', 'ac_system_install__1', 'Inspect existing ductwork condition', 4, false),
  ('ac_system_install__1__t5', 'ac_system_install__1', 'Protect floors and landscaping', 5, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('ac_system_install__1__m1', 'ac_system_install__1', 'Condensing unit', 2200, 'Equipment', false, 1),
  ('ac_system_install__1__m2', 'ac_system_install__1', 'Evaporator coil', 800, 'Equipment', false, 2),
  ('ac_system_install__1__m3', 'ac_system_install__1', 'Concrete pad', 45, 'Supplies', false, 3);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('ac_system_install__2', 'ac_system_install', 'Old System Removal', 2, 1, 'Recover refrigerant and remove the old condenser, coil, and line set.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('ac_system_install__2__t1', 'ac_system_install__2', 'Recover refrigerant (EPA compliant)', 1, false),
  ('ac_system_install__2__t2', 'ac_system_install__2', 'Disconnect electrical to old condenser', 2, false),
  ('ac_system_install__2__t3', 'ac_system_install__2', 'Remove old condensing unit', 3, false),
  ('ac_system_install__2__t4', 'ac_system_install__2', 'Remove old evaporator coil', 4, false),
  ('ac_system_install__2__t5', 'ac_system_install__2', 'Remove old refrigerant lines', 5, false),
  ('ac_system_install__2__t6', 'ac_system_install__2', 'Clean up old pad area', 6, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('ac_system_install__2__m1', 'ac_system_install__2', 'Refrigerant recovery tank', 0, 'Tools', false, 1);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('ac_system_install__3', 'ac_system_install', 'New System Install', 3, 1, 'Set new condenser pad, install condenser and evaporator coil.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('ac_system_install__3__t1', 'ac_system_install__3', 'Level and set new concrete pad', 1, false),
  ('ac_system_install__3__t2', 'ac_system_install__3', 'Set new condensing unit on pad', 2, false),
  ('ac_system_install__3__t3', 'ac_system_install__3', 'Install new evaporator coil in plenum', 3, false),
  ('ac_system_install__3__t4', 'ac_system_install__3', 'Seal plenum around coil', 4, false),
  ('ac_system_install__3__t5', 'ac_system_install__3', 'Install condensate drain line', 5, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('ac_system_install__3__m1', 'ac_system_install__3', 'Refrigerant lines (line set)', 120, 'Refrigerant', false, 1),
  ('ac_system_install__3__m2', 'ac_system_install__3', 'Thermostat wire (50ft)', 25, 'Electrical', false, 2),
  ('ac_system_install__3__m3', 'ac_system_install__3', 'Disconnect box', 35, 'Electrical', false, 3);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('ac_system_install__4', 'ac_system_install', 'Ductwork Connection & Testing', 4, 1, 'Run refrigerant lines, connect thermostat, and pressure test the system.', 'Mechanical inspection');
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('ac_system_install__4__t1', 'ac_system_install__4', 'Braze refrigerant lines', 1, false),
  ('ac_system_install__4__t2', 'ac_system_install__4', 'Pressure test with nitrogen (500 PSI)', 2, false),
  ('ac_system_install__4__t3', 'ac_system_install__4', 'Pull vacuum on line set (500 microns)', 3, false),
  ('ac_system_install__4__t4', 'ac_system_install__4', 'Install new disconnect & whip', 4, false),
  ('ac_system_install__4__t5', 'ac_system_install__4', 'Run and connect thermostat wire', 5, false),
  ('ac_system_install__4__t6', 'ac_system_install__4', 'Connect condensate drain to P-trap', 6, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('ac_system_install__4__m1', 'ac_system_install__4', 'R-410A refrigerant', 85, 'Refrigerant', false, 1),
  ('ac_system_install__4__m2', 'ac_system_install__4', 'Nitrogen tank rental', 0, 'Tools', false, 2),
  ('ac_system_install__4__m3', 'ac_system_install__4', 'Condensate P-trap & fittings', 15, 'Drain', false, 3);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('ac_system_install__5', 'ac_system_install', 'Cleanup & Commissioning', 5, 1, 'Charge system, test all modes, customer walkthrough.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('ac_system_install__5__t1', 'ac_system_install__5', 'Charge system with refrigerant (weigh in)', 1, false),
  ('ac_system_install__5__t2', 'ac_system_install__5', 'Install and program thermostat', 2, false),
  ('ac_system_install__5__t3', 'ac_system_install__5', 'Test cooling mode — check supply/return temps', 3, false),
  ('ac_system_install__5__t4', 'ac_system_install__5', 'Test heating mode (heat pump) or fan only', 4, true),
  ('ac_system_install__5__t5', 'ac_system_install__5', 'Check amp draw vs nameplate', 5, false),
  ('ac_system_install__5__t6', 'ac_system_install__5', 'Clean up work area', 6, false),
  ('ac_system_install__5__t7', 'ac_system_install__5', 'Walk customer through thermostat & filter', 7, false),
  ('ac_system_install__5__t8', 'ac_system_install__5', 'Register warranty', 8, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('ac_system_install__5__m1', 'ac_system_install__5', 'Programmable thermostat', 85, 'Controls', false, 1),
  ('ac_system_install__5__m2', 'ac_system_install__5', 'Air filter', 15, 'Supplies', false, 2);

-- Furnace Install (hvac)
INSERT INTO project_templates (id, name, icon, category, trade, description, estimated_days, estimated_budget_low, estimated_budget_high, sort_order) VALUES ('furnace_install', 'Furnace Install', 'flame-outline', 'Heating', 'hvac', 'Remove old furnace and install new high-efficiency gas furnace with venting.', 2, 4000, 6000, 8);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('furnace_install__1', 'furnace_install', 'Assessment & Prep', 1, 1, 'Measure gas line, verify venting, plan installation.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('furnace_install__1__t1', 'furnace_install__1', 'Measure gas line size (verify adequate)', 1, false),
  ('furnace_install__1__t2', 'furnace_install__1', 'Check existing venting type & condition', 2, false),
  ('furnace_install__1__t3', 'furnace_install__1', 'Verify electrical (115V circuit)', 3, false),
  ('furnace_install__1__t4', 'furnace_install__1', 'Confirm furnace sizing for home', 4, false),
  ('furnace_install__1__t5', 'furnace_install__1', 'Protect work area & flooring', 5, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('furnace_install__1__m1', 'furnace_install__1', 'Gas furnace (80K-100K BTU)', 1800, 'Equipment', false, 1),
  ('furnace_install__1__m2', 'furnace_install__1', 'Drop cloths', 20, 'Protection', false, 2);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('furnace_install__2', 'furnace_install', 'Old Furnace Removal', 2, 1, 'Disconnect and remove old furnace, clean installation area.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('furnace_install__2__t1', 'furnace_install__2', 'Shut off gas at furnace valve', 1, false),
  ('furnace_install__2__t2', 'furnace_install__2', 'Disconnect electrical power', 2, false),
  ('furnace_install__2__t3', 'furnace_install__2', 'Disconnect gas line', 3, false),
  ('furnace_install__2__t4', 'furnace_install__2', 'Disconnect flue pipe from furnace', 4, false),
  ('furnace_install__2__t5', 'furnace_install__2', 'Disconnect supply & return plenums', 5, false),
  ('furnace_install__2__t6', 'furnace_install__2', 'Remove old furnace unit', 6, false),
  ('furnace_install__2__t7', 'furnace_install__2', 'Clean installation area', 7, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('furnace_install__2__m1', 'furnace_install__2', 'Pipe caps (temporary)', 10, 'Fittings', false, 1);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('furnace_install__3', 'furnace_install', 'New Furnace Install', 3, 1, 'Set new furnace, connect to ductwork, align plenums.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('furnace_install__3__t1', 'furnace_install__3', 'Position new furnace on platform/pad', 1, false),
  ('furnace_install__3__t2', 'furnace_install__3', 'Connect supply plenum', 2, false),
  ('furnace_install__3__t3', 'furnace_install__3', 'Connect return plenum', 3, false),
  ('furnace_install__3__t4', 'furnace_install__3', 'Seal all plenum connections with mastic', 4, false),
  ('furnace_install__3__t5', 'furnace_install__3', 'Install new filter rack', 5, false),
  ('furnace_install__3__t6', 'furnace_install__3', 'Connect condensate drain (high-efficiency)', 6, true);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('furnace_install__3__m1', 'furnace_install__3', 'Plenum transitions / adapters', 65, 'Ductwork', false, 1),
  ('furnace_install__3__m2', 'furnace_install__3', 'Duct mastic & foil tape', 25, 'Supplies', false, 2),
  ('furnace_install__3__m3', 'furnace_install__3', 'Filter rack', 30, 'Parts', false, 3);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('furnace_install__4', 'furnace_install', 'Venting & Electrical', 4, 0.25, 'Run flue pipe, connect gas line, wire thermostat.', 'Mechanical / gas inspection');
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('furnace_install__4__t1', 'furnace_install__4', 'Run new flue pipe to chimney or exterior', 1, false),
  ('furnace_install__4__t2', 'furnace_install__4', 'Seal all flue joints with screws & tape', 2, false),
  ('furnace_install__4__t3', 'furnace_install__4', 'Connect gas line with new flex connector', 3, false),
  ('furnace_install__4__t4', 'furnace_install__4', 'Leak test gas connection (soap bubbles)', 4, false),
  ('furnace_install__4__t5', 'furnace_install__4', 'Wire thermostat to new furnace', 5, false),
  ('furnace_install__4__t6', 'furnace_install__4', 'Connect electrical power', 6, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('furnace_install__4__m1', 'furnace_install__4', 'Flue pipe (B-vent or PVC)', 80, 'Venting', false, 1),
  ('furnace_install__4__m2', 'furnace_install__4', 'Gas flex connector', 35, 'Gas', false, 2),
  ('furnace_install__4__m3', 'furnace_install__4', 'Thermostat', 85, 'Controls', false, 3);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('furnace_install__5', 'furnace_install', 'Testing & Startup', 5, 0.25, 'Combustion analysis, system test, customer walkthrough.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('furnace_install__5__t1', 'furnace_install__5', 'Perform combustion analysis', 1, false),
  ('furnace_install__5__t2', 'furnace_install__5', 'Check gas pressure (manifold)', 2, false),
  ('furnace_install__5__t3', 'furnace_install__5', 'Verify temperature rise across furnace', 3, false),
  ('furnace_install__5__t4', 'furnace_install__5', 'Test all thermostat modes', 4, false),
  ('furnace_install__5__t5', 'furnace_install__5', 'Check for CO at register closest to furnace', 5, false),
  ('furnace_install__5__t6', 'furnace_install__5', 'Install new filter', 6, false),
  ('furnace_install__5__t7', 'furnace_install__5', 'Clean up work area', 7, false),
  ('furnace_install__5__t8', 'furnace_install__5', 'Show customer filter location & thermostat', 8, false),
  ('furnace_install__5__t9', 'furnace_install__5', 'Register warranty', 9, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('furnace_install__5__m1', 'furnace_install__5', 'Air filter', 15, 'Supplies', false, 1),
  ('furnace_install__5__m2', 'furnace_install__5', 'Permit fee', 75, 'Permits', true, 2);

-- Ductwork Install (hvac)
INSERT INTO project_templates (id, name, icon, category, trade, description, estimated_days, estimated_budget_low, estimated_budget_high, sort_order) VALUES ('ductwork_install', 'Ductwork Install', 'git-branch-outline', 'Ductwork', 'hvac', 'Design and install new ductwork system including trunk lines, branches, and registers.', 4, 4000, 8000, 9);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('ductwork_install__1', 'ductwork_install', 'Design & Layout', 1, 1, 'Design duct layout, calculate CFM per room, mark routing.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('ductwork_install__1__t1', 'ductwork_install__1', 'Calculate room-by-room CFM requirements', 1, false),
  ('ductwork_install__1__t2', 'ductwork_install__1', 'Design trunk & branch layout', 2, false),
  ('ductwork_install__1__t3', 'ductwork_install__1', 'Determine duct sizes per run', 3, false),
  ('ductwork_install__1__t4', 'ductwork_install__1', 'Mark routing through joists/framing', 4, false),
  ('ductwork_install__1__t5', 'ductwork_install__1', 'Identify any framing modifications needed', 5, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('ductwork_install__1__m1', 'ductwork_install__1', 'Sheet metal (assorted sizes)', 600, 'Ductwork', false, 1),
  ('ductwork_install__1__m2', 'ductwork_install__1', 'Flex duct (6" & 8" dia)', 250, 'Ductwork', false, 2);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('ductwork_install__2', 'ductwork_install', 'Trunk Line Install', 2, 1, 'Install main trunk lines from furnace/air handler.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('ductwork_install__2__t1', 'ductwork_install__2', 'Install supply trunk from furnace plenum', 1, false),
  ('ductwork_install__2__t2', 'ductwork_install__2', 'Install return trunk to furnace', 2, false),
  ('ductwork_install__2__t3', 'ductwork_install__2', 'Hang trunk lines with strapping', 3, false),
  ('ductwork_install__2__t4', 'ductwork_install__2', 'Install trunk-line takeoffs for branches', 4, false),
  ('ductwork_install__2__t5', 'ductwork_install__2', 'Seal all trunk joints with mastic', 5, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('ductwork_install__2__m1', 'ductwork_install__2', 'Duct hangers & strapping', 45, 'Supports', false, 1),
  ('ductwork_install__2__m2', 'ductwork_install__2', 'Duct mastic (1 gal)', 20, 'Sealant', false, 2),
  ('ductwork_install__2__m3', 'ductwork_install__2', 'Sheet metal screws', 12, 'Fasteners', false, 3);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('ductwork_install__3', 'ductwork_install', 'Branch Runs', 3, 1.5, 'Run individual branch ducts from trunk to each room.', 'Duct rough-in inspection');
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('ductwork_install__3__t1', 'ductwork_install__3', 'Run branch ducts to each room', 1, false),
  ('ductwork_install__3__t2', 'ductwork_install__3', 'Install boot fittings at register locations', 2, false),
  ('ductwork_install__3__t3', 'ductwork_install__3', 'Cut subfloor / wall openings for registers', 3, false),
  ('ductwork_install__3__t4', 'ductwork_install__3', 'Secure all branch connections to trunk', 4, false),
  ('ductwork_install__3__t5', 'ductwork_install__3', 'Install dampers at each takeoff', 5, false),
  ('ductwork_install__3__t6', 'ductwork_install__3', 'Seal all branch connections with mastic', 6, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('ductwork_install__3__m1', 'ductwork_install__3', 'Register boots (assorted)', 80, 'Fittings', false, 1),
  ('ductwork_install__3__m2', 'ductwork_install__3', 'Volume dampers', 60, 'Controls', false, 2),
  ('ductwork_install__3__m3', 'ductwork_install__3', 'Foil tape', 18, 'Sealant', false, 3);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('ductwork_install__4', 'ductwork_install', 'Sealing & Insulation', 4, 1, 'Seal all joints and insulate ductwork in unconditioned spaces.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('ductwork_install__4__t1', 'ductwork_install__4', 'Mastic-seal every joint and seam', 1, false),
  ('ductwork_install__4__t2', 'ductwork_install__4', 'Wrap ducts in unconditioned spaces with insulation', 2, false),
  ('ductwork_install__4__t3', 'ductwork_install__4', 'Insulate any exposed boots in exterior walls', 3, false),
  ('ductwork_install__4__t4', 'ductwork_install__4', 'Verify no air leaks with smoke test', 4, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('ductwork_install__4__m1', 'ductwork_install__4', 'Duct insulation (R-8 wrap)', 120, 'Insulation', false, 1),
  ('ductwork_install__4__m2', 'ductwork_install__4', 'Insulation tape', 15, 'Supplies', false, 2),
  ('ductwork_install__4__m3', 'ductwork_install__4', 'Additional mastic', 20, 'Sealant', false, 3);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('ductwork_install__5', 'ductwork_install', 'Register & Grille Install', 5, 1, 'Install all registers, return grilles, balance airflow.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('ductwork_install__5__t1', 'ductwork_install__5', 'Install supply registers in each room', 1, false),
  ('ductwork_install__5__t2', 'ductwork_install__5', 'Install return air grilles', 2, false),
  ('ductwork_install__5__t3', 'ductwork_install__5', 'Turn on system — check airflow at each register', 3, false),
  ('ductwork_install__5__t4', 'ductwork_install__5', 'Balance dampers for even airflow', 4, false),
  ('ductwork_install__5__t5', 'ductwork_install__5', 'Check temperature differential (supply vs return)', 5, false),
  ('ductwork_install__5__t6', 'ductwork_install__5', 'Clean up all work areas', 6, false),
  ('ductwork_install__5__t7', 'ductwork_install__5', 'Walk customer through system', 7, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('ductwork_install__5__m1', 'ductwork_install__5', 'Supply registers (assorted)', 120, 'Registers', false, 1),
  ('ductwork_install__5__m2', 'ductwork_install__5', 'Return air grilles (2-3)', 60, 'Registers', false, 2),
  ('ductwork_install__5__m3', 'ductwork_install__5', 'Filter grille (return)', 35, 'Registers', false, 3);

-- Heat Pump Install (hvac)
INSERT INTO project_templates (id, name, icon, category, trade, description, estimated_days, estimated_budget_low, estimated_budget_high, sort_order) VALUES ('heat_pump_install', 'Heat Pump Install', 'thermometer-outline', 'Heating & Cooling', 'hvac', 'Install a heat pump system with outdoor unit and indoor air handler for year-round comfort.', 3, 6000, 9000, 10);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('heat_pump_install__1', 'heat_pump_install', 'Site Prep', 1, 1, 'Prepare indoor and outdoor installation locations.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('heat_pump_install__1__t1', 'heat_pump_install__1', 'Perform load calculation', 1, false),
  ('heat_pump_install__1__t2', 'heat_pump_install__1', 'Select equipment (tonnage & SEER/HSPF)', 2, false),
  ('heat_pump_install__1__t3', 'heat_pump_install__1', 'Level and pour/set outdoor pad', 3, false),
  ('heat_pump_install__1__t4', 'heat_pump_install__1', 'Verify electrical panel capacity', 4, false),
  ('heat_pump_install__1__t5', 'heat_pump_install__1', 'Plan refrigerant line routing', 5, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('heat_pump_install__1__m1', 'heat_pump_install__1', 'Heat pump outdoor unit', 2800, 'Equipment', false, 1),
  ('heat_pump_install__1__m2', 'heat_pump_install__1', 'Concrete pad', 45, 'Supplies', false, 2);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('heat_pump_install__2', 'heat_pump_install', 'Outdoor Unit Install', 2, 1, 'Set outdoor heat pump unit, run electrical.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('heat_pump_install__2__t1', 'heat_pump_install__2', 'Set heat pump on pad (vibration pads)', 1, false),
  ('heat_pump_install__2__t2', 'heat_pump_install__2', 'Install electrical disconnect', 2, false),
  ('heat_pump_install__2__t3', 'heat_pump_install__2', 'Run electrical whip from disconnect to unit', 3, false),
  ('heat_pump_install__2__t4', 'heat_pump_install__2', 'Connect breaker in main panel', 4, false),
  ('heat_pump_install__2__t5', 'heat_pump_install__2', 'Secure unit with anchor brackets', 5, true);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('heat_pump_install__2__m1', 'heat_pump_install__2', 'Disconnect box (60A)', 40, 'Electrical', false, 1),
  ('heat_pump_install__2__m2', 'heat_pump_install__2', 'Electrical whip', 25, 'Electrical', false, 2),
  ('heat_pump_install__2__m3', 'heat_pump_install__2', 'Vibration isolation pads', 20, 'Supplies', false, 3);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('heat_pump_install__3', 'heat_pump_install', 'Indoor Air Handler', 3, 1, 'Install indoor air handler and connect to ductwork.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('heat_pump_install__3__t1', 'heat_pump_install__3', 'Position air handler in closet/utility', 1, false),
  ('heat_pump_install__3__t2', 'heat_pump_install__3', 'Connect supply & return plenums', 2, false),
  ('heat_pump_install__3__t3', 'heat_pump_install__3', 'Seal all plenum connections', 3, false),
  ('heat_pump_install__3__t4', 'heat_pump_install__3', 'Install condensate drain with P-trap', 4, false),
  ('heat_pump_install__3__t5', 'heat_pump_install__3', 'Install secondary drain pan with float switch', 5, false),
  ('heat_pump_install__3__t6', 'heat_pump_install__3', 'Install filter rack & filter', 6, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('heat_pump_install__3__m1', 'heat_pump_install__3', 'Air handler unit', 1400, 'Equipment', false, 1),
  ('heat_pump_install__3__m2', 'heat_pump_install__3', 'Condensate drain fittings', 25, 'Drain', false, 2),
  ('heat_pump_install__3__m3', 'heat_pump_install__3', 'Float switch (safety)', 18, 'Safety', false, 3);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('heat_pump_install__4', 'heat_pump_install', 'Refrigerant Lines & Electrical', 4, 1, 'Run line set, vacuum and charge, connect thermostat.', 'Mechanical inspection');
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('heat_pump_install__4__t1', 'heat_pump_install__4', 'Run refrigerant line set (insulated)', 1, false),
  ('heat_pump_install__4__t2', 'heat_pump_install__4', 'Braze line connections', 2, false),
  ('heat_pump_install__4__t3', 'heat_pump_install__4', 'Pressure test with nitrogen', 3, false),
  ('heat_pump_install__4__t4', 'heat_pump_install__4', 'Pull vacuum (500 microns or lower)', 4, false),
  ('heat_pump_install__4__t5', 'heat_pump_install__4', 'Release factory charge / weigh in refrigerant', 5, false),
  ('heat_pump_install__4__t6', 'heat_pump_install__4', 'Run thermostat wire', 6, false),
  ('heat_pump_install__4__t7', 'heat_pump_install__4', 'Install and wire thermostat', 7, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('heat_pump_install__4__m1', 'heat_pump_install__4', 'Line set (insulated, 25-50ft)', 150, 'Refrigerant', false, 1),
  ('heat_pump_install__4__m2', 'heat_pump_install__4', 'Thermostat (heat pump compatible)', 95, 'Controls', false, 2),
  ('heat_pump_install__4__m3', 'heat_pump_install__4', 'R-410A refrigerant', 85, 'Refrigerant', false, 3);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('heat_pump_install__5', 'heat_pump_install', 'Commissioning', 5, 1, 'System startup, test all modes, customer training.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('heat_pump_install__5__t1', 'heat_pump_install__5', 'Start system — test cooling mode', 1, false),
  ('heat_pump_install__5__t2', 'heat_pump_install__5', 'Test heating mode', 2, false),
  ('heat_pump_install__5__t3', 'heat_pump_install__5', 'Test emergency/auxiliary heat', 3, false),
  ('heat_pump_install__5__t4', 'heat_pump_install__5', 'Check superheat & subcooling', 4, false),
  ('heat_pump_install__5__t5', 'heat_pump_install__5', 'Verify defrost cycle operation', 5, false),
  ('heat_pump_install__5__t6', 'heat_pump_install__5', 'Check amp draws vs nameplate', 6, false),
  ('heat_pump_install__5__t7', 'heat_pump_install__5', 'Program thermostat schedule', 7, false),
  ('heat_pump_install__5__t8', 'heat_pump_install__5', 'Walk customer through operation', 8, false),
  ('heat_pump_install__5__t9', 'heat_pump_install__5', 'Register warranty', 9, false),
  ('heat_pump_install__5__t10', 'heat_pump_install__5', 'Clean up all work areas', 10, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('heat_pump_install__5__m1', 'heat_pump_install__5', 'Air filter', 15, 'Supplies', false, 1),
  ('heat_pump_install__5__m2', 'heat_pump_install__5', 'Permit fee', 100, 'Permits', true, 2);

-- Mini-Split Multi-Zone (hvac)
INSERT INTO project_templates (id, name, icon, category, trade, description, estimated_days, estimated_budget_low, estimated_budget_high, sort_order) VALUES ('mini_split_multi_zone', 'Mini-Split Multi-Zone', 'grid-outline', 'Heating & Cooling', 'hvac', 'Install multi-zone ductless mini-split system with 3-4 indoor heads.', 3, 8000, 12000, 11);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('mini_split_multi_zone__1', 'mini_split_multi_zone', 'Planning & Mounting', 1, 1, 'Plan indoor head locations, outdoor unit placement, and line routing.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('mini_split_multi_zone__1__t1', 'mini_split_multi_zone__1', 'Determine zones and head locations', 1, false),
  ('mini_split_multi_zone__1__t2', 'mini_split_multi_zone__1', 'Select wall/ceiling mount positions', 2, false),
  ('mini_split_multi_zone__1__t3', 'mini_split_multi_zone__1', 'Plan line set routing for each zone', 3, false),
  ('mini_split_multi_zone__1__t4', 'mini_split_multi_zone__1', 'Verify electrical panel for dedicated circuit', 4, false),
  ('mini_split_multi_zone__1__t5', 'mini_split_multi_zone__1', 'Install mounting plates for indoor heads', 5, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('mini_split_multi_zone__1__m1', 'mini_split_multi_zone__1', 'Multi-zone outdoor unit', 3200, 'Equipment', false, 1),
  ('mini_split_multi_zone__1__m2', 'mini_split_multi_zone__1', 'Wall brackets / mounting plates', 60, 'Mounts', false, 2);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('mini_split_multi_zone__2', 'mini_split_multi_zone', 'Outdoor Unit', 2, 1, 'Set outdoor unit, run electrical disconnect and power.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('mini_split_multi_zone__2__t1', 'mini_split_multi_zone__2', 'Set outdoor unit on pad or wall bracket', 1, false),
  ('mini_split_multi_zone__2__t2', 'mini_split_multi_zone__2', 'Install electrical disconnect', 2, false),
  ('mini_split_multi_zone__2__t3', 'mini_split_multi_zone__2', 'Run power from panel to disconnect', 3, false),
  ('mini_split_multi_zone__2__t4', 'mini_split_multi_zone__2', 'Run power from disconnect to outdoor unit', 4, false),
  ('mini_split_multi_zone__2__t5', 'mini_split_multi_zone__2', 'Core drill wall penetrations for each zone', 5, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('mini_split_multi_zone__2__m1', 'mini_split_multi_zone__2', 'Concrete pad or wall mount bracket', 55, 'Mounts', false, 1),
  ('mini_split_multi_zone__2__m2', 'mini_split_multi_zone__2', 'Disconnect box', 35, 'Electrical', false, 2),
  ('mini_split_multi_zone__2__m3', 'mini_split_multi_zone__2', 'Electrical wire (10/2)', 45, 'Electrical', false, 3);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('mini_split_multi_zone__3', 'mini_split_multi_zone', 'Indoor Head Install', 3, 1, 'Mount and connect each indoor head unit.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('mini_split_multi_zone__3__t1', 'mini_split_multi_zone__3', 'Mount indoor head #1 on plate', 1, false),
  ('mini_split_multi_zone__3__t2', 'mini_split_multi_zone__3', 'Mount indoor head #2 on plate', 2, false),
  ('mini_split_multi_zone__3__t3', 'mini_split_multi_zone__3', 'Mount indoor head #3 on plate', 3, false),
  ('mini_split_multi_zone__3__t4', 'mini_split_multi_zone__3', 'Mount indoor head #4 on plate', 4, true),
  ('mini_split_multi_zone__3__t5', 'mini_split_multi_zone__3', 'Connect communication wires to each head', 5, false),
  ('mini_split_multi_zone__3__t6', 'mini_split_multi_zone__3', 'Run condensate drains from each head', 6, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('mini_split_multi_zone__3__m1', 'mini_split_multi_zone__3', 'Indoor heads (3-4 units)', 2400, 'Equipment', false, 1),
  ('mini_split_multi_zone__3__m2', 'mini_split_multi_zone__3', 'Condensate pump (if gravity drain not possible)', 85, 'Drain', true, 2),
  ('mini_split_multi_zone__3__m3', 'mini_split_multi_zone__3', 'Line hide / cover (decorative)', 120, 'Trim', true, 3);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('mini_split_multi_zone__4', 'mini_split_multi_zone', 'Line Sets & Drain', 4, 1, 'Run refrigerant lines for each zone, connect condensate drains.', 'Mechanical inspection');
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('mini_split_multi_zone__4__t1', 'mini_split_multi_zone__4', 'Run line set for zone 1', 1, false),
  ('mini_split_multi_zone__4__t2', 'mini_split_multi_zone__4', 'Run line set for zone 2', 2, false),
  ('mini_split_multi_zone__4__t3', 'mini_split_multi_zone__4', 'Run line set for zone 3', 3, false),
  ('mini_split_multi_zone__4__t4', 'mini_split_multi_zone__4', 'Run line set for zone 4', 4, true),
  ('mini_split_multi_zone__4__t5', 'mini_split_multi_zone__4', 'Flare all connections (torque to spec)', 5, false),
  ('mini_split_multi_zone__4__t6', 'mini_split_multi_zone__4', 'Pressure test all lines with nitrogen', 6, false),
  ('mini_split_multi_zone__4__t7', 'mini_split_multi_zone__4', 'Pull vacuum on entire system', 7, false),
  ('mini_split_multi_zone__4__t8', 'mini_split_multi_zone__4', 'Connect all condensate drains', 8, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('mini_split_multi_zone__4__m1', 'mini_split_multi_zone__4', 'Line sets (pre-charged or field, per zone)', 360, 'Refrigerant', false, 1),
  ('mini_split_multi_zone__4__m2', 'mini_split_multi_zone__4', 'Condensate drain line & fittings', 30, 'Drain', false, 2),
  ('mini_split_multi_zone__4__m3', 'mini_split_multi_zone__4', 'Wall sleeves & sealant', 25, 'Supplies', false, 3);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('mini_split_multi_zone__5', 'mini_split_multi_zone', 'Startup & Programming', 5, 1, 'Charge system, configure zones, test all modes.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('mini_split_multi_zone__5__t1', 'mini_split_multi_zone__5', 'Release factory charge / add refrigerant', 1, false),
  ('mini_split_multi_zone__5__t2', 'mini_split_multi_zone__5', 'Power on system — run self-test', 2, false),
  ('mini_split_multi_zone__5__t3', 'mini_split_multi_zone__5', 'Test each zone independently (cool & heat)', 3, false),
  ('mini_split_multi_zone__5__t4', 'mini_split_multi_zone__5', 'Program remote controls for each zone', 4, false),
  ('mini_split_multi_zone__5__t5', 'mini_split_multi_zone__5', 'Set up Wi-Fi control app', 5, true),
  ('mini_split_multi_zone__5__t6', 'mini_split_multi_zone__5', 'Check amp draw on outdoor unit', 6, false),
  ('mini_split_multi_zone__5__t7', 'mini_split_multi_zone__5', 'Clean up all work areas', 7, false),
  ('mini_split_multi_zone__5__t8', 'mini_split_multi_zone__5', 'Train customer on remotes & filters', 8, false),
  ('mini_split_multi_zone__5__t9', 'mini_split_multi_zone__5', 'Register warranty', 9, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('mini_split_multi_zone__5__m1', 'mini_split_multi_zone__5', 'R-410A refrigerant (additional)', 85, 'Refrigerant', true, 1),
  ('mini_split_multi_zone__5__m2', 'mini_split_multi_zone__5', 'Permit fee', 100, 'Permits', true, 2);

-- Whole-System Replace (hvac)
INSERT INTO project_templates (id, name, icon, category, trade, description, estimated_days, estimated_budget_low, estimated_budget_high, sort_order) VALUES ('hvac_whole_system_replace', 'Whole-System Replace', 'swap-horizontal-outline', 'Full System', 'hvac', 'Complete HVAC system replacement — furnace, AC condenser, evaporator coil, thermostat, and ductwork modifications.', 5, 10000, 18000, 12);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('hvac_whole_system_replace__1', 'hvac_whole_system_replace', 'System Assessment', 1, 1, 'Full assessment of existing system, load calculation, and equipment selection.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('hvac_whole_system_replace__1__t1', 'hvac_whole_system_replace__1', 'Perform Manual J load calculation', 1, false),
  ('hvac_whole_system_replace__1__t2', 'hvac_whole_system_replace__1', 'Inspect existing ductwork (leaks, sizing)', 2, false),
  ('hvac_whole_system_replace__1__t3', 'hvac_whole_system_replace__1', 'Assess gas line capacity', 3, false),
  ('hvac_whole_system_replace__1__t4', 'hvac_whole_system_replace__1', 'Check electrical panel capacity', 4, false),
  ('hvac_whole_system_replace__1__t5', 'hvac_whole_system_replace__1', 'Select matched system (furnace + AC)', 5, false),
  ('hvac_whole_system_replace__1__t6', 'hvac_whole_system_replace__1', 'Pull permits', 6, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('hvac_whole_system_replace__1__m1', 'hvac_whole_system_replace__1', 'Gas furnace', 1800, 'Equipment', false, 1),
  ('hvac_whole_system_replace__1__m2', 'hvac_whole_system_replace__1', 'AC condensing unit', 2200, 'Equipment', false, 2),
  ('hvac_whole_system_replace__1__m3', 'hvac_whole_system_replace__1', 'Evaporator coil (matched)', 800, 'Equipment', false, 3);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('hvac_whole_system_replace__2', 'hvac_whole_system_replace', 'Old Equipment Removal', 2, 1, 'Remove old furnace, condenser, coil, and outdated ductwork.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('hvac_whole_system_replace__2__t1', 'hvac_whole_system_replace__2', 'Recover refrigerant (EPA compliant)', 1, false),
  ('hvac_whole_system_replace__2__t2', 'hvac_whole_system_replace__2', 'Disconnect and remove old condenser', 2, false),
  ('hvac_whole_system_replace__2__t3', 'hvac_whole_system_replace__2', 'Disconnect and remove old furnace', 3, false),
  ('hvac_whole_system_replace__2__t4', 'hvac_whole_system_replace__2', 'Remove old evaporator coil', 4, false),
  ('hvac_whole_system_replace__2__t5', 'hvac_whole_system_replace__2', 'Remove old refrigerant lines', 5, false),
  ('hvac_whole_system_replace__2__t6', 'hvac_whole_system_replace__2', 'Remove damaged/undersized ductwork sections', 6, false),
  ('hvac_whole_system_replace__2__t7', 'hvac_whole_system_replace__2', 'Clean installation areas', 7, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('hvac_whole_system_replace__2__m1', 'hvac_whole_system_replace__2', 'Refrigerant recovery tank', 0, 'Tools', false, 1),
  ('hvac_whole_system_replace__2__m2', 'hvac_whole_system_replace__2', 'Drop cloths', 20, 'Protection', false, 2);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('hvac_whole_system_replace__3', 'hvac_whole_system_replace', 'New Equipment Install', 3, 1.5, 'Install new furnace, condenser, and evaporator coil.', 'Mechanical rough-in inspection');
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('hvac_whole_system_replace__3__t1', 'hvac_whole_system_replace__3', 'Set new furnace in position', 1, false),
  ('hvac_whole_system_replace__3__t2', 'hvac_whole_system_replace__3', 'Connect gas line to furnace', 2, false),
  ('hvac_whole_system_replace__3__t3', 'hvac_whole_system_replace__3', 'Install new flue/venting', 3, false),
  ('hvac_whole_system_replace__3__t4', 'hvac_whole_system_replace__3', 'Set condenser on new pad', 4, false),
  ('hvac_whole_system_replace__3__t5', 'hvac_whole_system_replace__3', 'Install new evaporator coil', 5, false),
  ('hvac_whole_system_replace__3__t6', 'hvac_whole_system_replace__3', 'Run new refrigerant line set', 6, false),
  ('hvac_whole_system_replace__3__t7', 'hvac_whole_system_replace__3', 'Braze all refrigerant connections', 7, false),
  ('hvac_whole_system_replace__3__t8', 'hvac_whole_system_replace__3', 'Install new disconnect & electrical', 8, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('hvac_whole_system_replace__3__m1', 'hvac_whole_system_replace__3', 'Thermostat (smart/programmable)', 120, 'Controls', false, 1),
  ('hvac_whole_system_replace__3__m2', 'hvac_whole_system_replace__3', 'Line set (insulated)', 150, 'Refrigerant', false, 2),
  ('hvac_whole_system_replace__3__m3', 'hvac_whole_system_replace__3', 'Flue pipe', 80, 'Venting', false, 3),
  ('hvac_whole_system_replace__3__m4', 'hvac_whole_system_replace__3', 'Gas flex connector', 35, 'Gas', false, 4);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('hvac_whole_system_replace__4', 'hvac_whole_system_replace', 'Ductwork Modifications', 4, 1, 'Modify, repair, or replace ductwork as needed for new system.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('hvac_whole_system_replace__4__t1', 'hvac_whole_system_replace__4', 'Connect supply plenum to new furnace', 1, false),
  ('hvac_whole_system_replace__4__t2', 'hvac_whole_system_replace__4', 'Connect return plenum to new furnace', 2, false),
  ('hvac_whole_system_replace__4__t3', 'hvac_whole_system_replace__4', 'Replace any undersized trunk lines', 3, false),
  ('hvac_whole_system_replace__4__t4', 'hvac_whole_system_replace__4', 'Repair or replace damaged branch runs', 4, false),
  ('hvac_whole_system_replace__4__t5', 'hvac_whole_system_replace__4', 'Seal all duct connections with mastic', 5, false),
  ('hvac_whole_system_replace__4__t6', 'hvac_whole_system_replace__4', 'Add insulation where needed', 6, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('hvac_whole_system_replace__4__m1', 'hvac_whole_system_replace__4', 'Sheet metal ductwork (modifications)', 350, 'Ductwork', false, 1),
  ('hvac_whole_system_replace__4__m2', 'hvac_whole_system_replace__4', 'Duct mastic & foil tape', 40, 'Sealant', false, 2),
  ('hvac_whole_system_replace__4__m3', 'hvac_whole_system_replace__4', 'Duct insulation', 80, 'Insulation', false, 3);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('hvac_whole_system_replace__5', 'hvac_whole_system_replace', 'Commissioning & Training', 5, 1, 'Charge system, full testing, final inspection, customer training.', 'Final mechanical inspection');
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('hvac_whole_system_replace__5__t1', 'hvac_whole_system_replace__5', 'Pressure test refrigerant lines', 1, false),
  ('hvac_whole_system_replace__5__t2', 'hvac_whole_system_replace__5', 'Pull vacuum & charge system', 2, false),
  ('hvac_whole_system_replace__5__t3', 'hvac_whole_system_replace__5', 'Combustion analysis on furnace', 3, false),
  ('hvac_whole_system_replace__5__t4', 'hvac_whole_system_replace__5', 'Test cooling — check superheat/subcooling', 4, false),
  ('hvac_whole_system_replace__5__t5', 'hvac_whole_system_replace__5', 'Test heating — check temp rise', 5, false),
  ('hvac_whole_system_replace__5__t6', 'hvac_whole_system_replace__5', 'Check airflow at every register', 6, false),
  ('hvac_whole_system_replace__5__t7', 'hvac_whole_system_replace__5', 'Balance dampers', 7, false),
  ('hvac_whole_system_replace__5__t8', 'hvac_whole_system_replace__5', 'Program thermostat', 8, false),
  ('hvac_whole_system_replace__5__t9', 'hvac_whole_system_replace__5', 'Clean up entire work area', 9, false),
  ('hvac_whole_system_replace__5__t10', 'hvac_whole_system_replace__5', 'Full walkthrough with customer', 10, false),
  ('hvac_whole_system_replace__5__t11', 'hvac_whole_system_replace__5', 'Register all warranties', 11, false),
  ('hvac_whole_system_replace__5__t12', 'hvac_whole_system_replace__5', 'Get customer sign-off', 12, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('hvac_whole_system_replace__5__m1', 'hvac_whole_system_replace__5', 'R-410A refrigerant', 120, 'Refrigerant', false, 1),
  ('hvac_whole_system_replace__5__m2', 'hvac_whole_system_replace__5', 'Air filters (2)', 30, 'Supplies', false, 2),
  ('hvac_whole_system_replace__5__m3', 'hvac_whole_system_replace__5', 'Permit fee', 150, 'Permits', false, 3);

-- Panel Upgrade 200A (electrical)
INSERT INTO project_templates (id, name, icon, category, trade, description, estimated_days, estimated_budget_low, estimated_budget_high, sort_order) VALUES ('panel_upgrade_200a', 'Panel Upgrade 200A', 'flash-outline', 'Panel', 'electrical', 'Upgrade main electrical panel to 200A service including meter socket and grounding.', 2, 2500, 4000, 13);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('panel_upgrade_200a__1', 'panel_upgrade_200a', 'Permit & Assessment', 1, 0.25, 'Assess existing panel, pull permits, coordinate with utility for disconnect.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('panel_upgrade_200a__1__t1', 'panel_upgrade_200a__1', 'Assess existing panel & service size', 1, false),
  ('panel_upgrade_200a__1__t2', 'panel_upgrade_200a__1', 'Count existing circuits & loads', 2, false),
  ('panel_upgrade_200a__1__t3', 'panel_upgrade_200a__1', 'Pull electrical permit', 3, false),
  ('panel_upgrade_200a__1__t4', 'panel_upgrade_200a__1', 'Schedule utility disconnect (if needed)', 4, false),
  ('panel_upgrade_200a__1__t5', 'panel_upgrade_200a__1', 'Select new 200A panel & breakers', 5, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('panel_upgrade_200a__1__m1', 'panel_upgrade_200a__1', '200A main breaker panel', 350, 'Equipment', false, 1),
  ('panel_upgrade_200a__1__m2', 'panel_upgrade_200a__1', 'Breakers (assorted, 20-30)', 300, 'Breakers', false, 2),
  ('panel_upgrade_200a__1__m3', 'panel_upgrade_200a__1', 'Permit fee', 100, 'Permits', false, 3);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('panel_upgrade_200a__2', 'panel_upgrade_200a', 'Power Disconnect', 2, 0.25, 'Coordinate utility disconnect, de-energize existing panel.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('panel_upgrade_200a__2__t1', 'panel_upgrade_200a__2', 'Confirm utility has pulled meter', 1, false),
  ('panel_upgrade_200a__2__t2', 'panel_upgrade_200a__2', 'Verify panel is de-energized (test)', 2, false),
  ('panel_upgrade_200a__2__t3', 'panel_upgrade_200a__2', 'Label all existing circuits', 3, false),
  ('panel_upgrade_200a__2__t4', 'panel_upgrade_200a__2', 'Photograph existing wiring layout', 4, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('panel_upgrade_200a__2__m1', 'panel_upgrade_200a__2', 'Circuit labels / markers', 10, 'Supplies', false, 1);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('panel_upgrade_200a__3', 'panel_upgrade_200a', 'Panel Swap', 3, 1, 'Remove old panel, install new 200A panel and meter socket.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('panel_upgrade_200a__3__t1', 'panel_upgrade_200a__3', 'Remove old panel cover and breakers', 1, false),
  ('panel_upgrade_200a__3__t2', 'panel_upgrade_200a__3', 'Disconnect all circuit wires', 2, false),
  ('panel_upgrade_200a__3__t3', 'panel_upgrade_200a__3', 'Remove old panel box', 3, false),
  ('panel_upgrade_200a__3__t4', 'panel_upgrade_200a__3', 'Install new meter socket (if required)', 4, false),
  ('panel_upgrade_200a__3__t5', 'panel_upgrade_200a__3', 'Mount new 200A panel', 5, false),
  ('panel_upgrade_200a__3__t6', 'panel_upgrade_200a__3', 'Install new grounding rod & conductor', 6, false),
  ('panel_upgrade_200a__3__t7', 'panel_upgrade_200a__3', 'Connect grounding / bonding', 7, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('panel_upgrade_200a__3__m1', 'panel_upgrade_200a__3', 'Meter socket (200A)', 180, 'Equipment', true, 1),
  ('panel_upgrade_200a__3__m2', 'panel_upgrade_200a__3', 'Grounding rod (8ft)', 25, 'Grounding', false, 2),
  ('panel_upgrade_200a__3__m3', 'panel_upgrade_200a__3', '#4 copper ground wire (25ft)', 45, 'Wire', false, 3);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('panel_upgrade_200a__4', 'panel_upgrade_200a', 'Circuit Transfer', 4, 1, 'Transfer all existing circuits to new panel, add new circuits if needed.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('panel_upgrade_200a__4__t1', 'panel_upgrade_200a__4', 'Install breakers in new panel', 1, false),
  ('panel_upgrade_200a__4__t2', 'panel_upgrade_200a__4', 'Terminate each circuit wire to breaker', 2, false),
  ('panel_upgrade_200a__4__t3', 'panel_upgrade_200a__4', 'Torque all connections to spec', 3, false),
  ('panel_upgrade_200a__4__t4', 'panel_upgrade_200a__4', 'Connect neutral & ground bars', 4, false),
  ('panel_upgrade_200a__4__t5', 'panel_upgrade_200a__4', 'Install AFCI/GFCI breakers where required', 5, false),
  ('panel_upgrade_200a__4__t6', 'panel_upgrade_200a__4', 'Add any new circuits', 6, true);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('panel_upgrade_200a__4__m1', 'panel_upgrade_200a__4', 'AFCI breakers (bedrooms)', 120, 'Breakers', false, 1),
  ('panel_upgrade_200a__4__m2', 'panel_upgrade_200a__4', 'Wire nuts & connectors', 15, 'Supplies', false, 2),
  ('panel_upgrade_200a__4__m3', 'panel_upgrade_200a__4', 'Cable staples & ties', 10, 'Supplies', false, 3);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('panel_upgrade_200a__5', 'panel_upgrade_200a', 'Inspection & Energize', 5, 1, 'Final inspection, utility re-connect, test all circuits.', 'Electrical final inspection');
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('panel_upgrade_200a__5__t1', 'panel_upgrade_200a__5', 'Double-check all connections & torques', 1, false),
  ('panel_upgrade_200a__5__t2', 'panel_upgrade_200a__5', 'Install panel cover & circuit directory', 2, false),
  ('panel_upgrade_200a__5__t3', 'panel_upgrade_200a__5', 'Call for electrical inspection', 3, false),
  ('panel_upgrade_200a__5__t4', 'panel_upgrade_200a__5', 'Coordinate utility to set meter', 4, false),
  ('panel_upgrade_200a__5__t5', 'panel_upgrade_200a__5', 'Energize panel — test each circuit', 5, false),
  ('panel_upgrade_200a__5__t6', 'panel_upgrade_200a__5', 'Verify voltage at panel (240V/120V)', 6, false),
  ('panel_upgrade_200a__5__t7', 'panel_upgrade_200a__5', 'Test all GFCI/AFCI breakers', 7, false),
  ('panel_upgrade_200a__5__t8', 'panel_upgrade_200a__5', 'Walk customer through new panel', 8, false),
  ('panel_upgrade_200a__5__t9', 'panel_upgrade_200a__5', 'Clean up work area', 9, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('panel_upgrade_200a__5__m1', 'panel_upgrade_200a__5', 'Panel cover & directory card', 0, 'Included', false, 1);

-- Whole-House Rewire (electrical)
INSERT INTO project_templates (id, name, icon, category, trade, description, estimated_days, estimated_budget_low, estimated_budget_high, sort_order) VALUES ('whole_house_rewire', 'Whole-House Rewire', 'git-network-outline', 'Rewire', 'electrical', 'Complete rewire of home — replace old wiring (knob & tube, aluminum) with modern NM-B.', 7, 10000, 15000, 14);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('whole_house_rewire__1', 'whole_house_rewire', 'Planning & Permit', 1, 1, 'Map existing circuits, plan new layout, pull permits.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('whole_house_rewire__1__t1', 'whole_house_rewire__1', 'Map all existing circuits & outlets', 1, false),
  ('whole_house_rewire__1__t2', 'whole_house_rewire__1', 'Plan new circuit layout (NEC compliant)', 2, false),
  ('whole_house_rewire__1__t3', 'whole_house_rewire__1', 'Determine dedicated circuits (kitchen, bath, laundry)', 3, false),
  ('whole_house_rewire__1__t4', 'whole_house_rewire__1', 'Pull electrical permit', 4, false),
  ('whole_house_rewire__1__t5', 'whole_house_rewire__1', 'Order materials', 5, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('whole_house_rewire__1__m1', 'whole_house_rewire__1', 'NM-B 14/2 wire (1000ft)', 180, 'Wire', false, 1),
  ('whole_house_rewire__1__m2', 'whole_house_rewire__1', 'NM-B 12/2 wire (1000ft)', 250, 'Wire', false, 2),
  ('whole_house_rewire__1__m3', 'whole_house_rewire__1', 'NM-B 10/2 wire (100ft)', 65, 'Wire', false, 3),
  ('whole_house_rewire__1__m4', 'whole_house_rewire__1', 'Permit fee', 150, 'Permits', false, 4);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('whole_house_rewire__2', 'whole_house_rewire', 'Demo & Access', 2, 1, 'Cut access holes, remove old devices, prep for new wire runs.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('whole_house_rewire__2__t1', 'whole_house_rewire__2', 'Cut access holes in walls/ceilings', 1, false),
  ('whole_house_rewire__2__t2', 'whole_house_rewire__2', 'Remove old outlets, switches, & cover plates', 2, false),
  ('whole_house_rewire__2__t3', 'whole_house_rewire__2', 'Remove old junction boxes', 3, false),
  ('whole_house_rewire__2__t4', 'whole_house_rewire__2', 'Identify & mark joist/stud locations', 4, false),
  ('whole_house_rewire__2__t5', 'whole_house_rewire__2', 'Drill pathways through framing', 5, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('whole_house_rewire__2__m1', 'whole_house_rewire__2', 'New work boxes (30-40)', 80, 'Boxes', false, 1),
  ('whole_house_rewire__2__m2', 'whole_house_rewire__2', 'Old work (remodel) boxes (10-15)', 45, 'Boxes', false, 2),
  ('whole_house_rewire__2__m3', 'whole_house_rewire__2', 'Drywall saw / oscillating blades', 25, 'Tools', false, 3);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('whole_house_rewire__3', 'whole_house_rewire', 'New Wire Runs', 3, 3, 'Pull all new circuits from panel to each box location.', 'Rough-in electrical inspection');
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('whole_house_rewire__3__t1', 'whole_house_rewire__3', 'Run kitchen circuits (2x 20A small appliance)', 1, false),
  ('whole_house_rewire__3__t2', 'whole_house_rewire__3', 'Run bathroom circuits (20A GFCI each)', 2, false),
  ('whole_house_rewire__3__t3', 'whole_house_rewire__3', 'Run bedroom circuits (15A AFCI)', 3, false),
  ('whole_house_rewire__3__t4', 'whole_house_rewire__3', 'Run living/dining circuits', 4, false),
  ('whole_house_rewire__3__t5', 'whole_house_rewire__3', 'Run laundry circuit (20A dedicated)', 5, false),
  ('whole_house_rewire__3__t6', 'whole_house_rewire__3', 'Run garage/outdoor circuits', 6, false),
  ('whole_house_rewire__3__t7', 'whole_house_rewire__3', 'Staple & secure all wire runs', 7, false),
  ('whole_house_rewire__3__t8', 'whole_house_rewire__3', 'Call for rough-in inspection', 8, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('whole_house_rewire__3__m1', 'whole_house_rewire__3', 'Wire staples (box)', 15, 'Fasteners', false, 1),
  ('whole_house_rewire__3__m2', 'whole_house_rewire__3', 'Cable connectors / clamps', 20, 'Fittings', false, 2),
  ('whole_house_rewire__3__m3', 'whole_house_rewire__3', 'Drill bits (installer / flex bits)', 35, 'Tools', false, 3);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('whole_house_rewire__4', 'whole_house_rewire', 'Device Install', 4, 1, 'Install all outlets, switches, and cover plates.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('whole_house_rewire__4__t1', 'whole_house_rewire__4', 'Install standard outlets throughout', 1, false),
  ('whole_house_rewire__4__t2', 'whole_house_rewire__4', 'Install GFCI outlets (kitchen, bath, garage, outdoor)', 2, false),
  ('whole_house_rewire__4__t3', 'whole_house_rewire__4', 'Install switches (single, 3-way, dimmer)', 3, false),
  ('whole_house_rewire__4__t4', 'whole_house_rewire__4', 'Install cover plates', 4, false),
  ('whole_house_rewire__4__t5', 'whole_house_rewire__4', 'Install smoke/CO detectors (hardwired)', 5, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('whole_house_rewire__4__m1', 'whole_house_rewire__4', 'Outlets (tamper-resistant, 30-40)', 80, 'Devices', false, 1),
  ('whole_house_rewire__4__m2', 'whole_house_rewire__4', 'GFCI outlets (8-10)', 120, 'Devices', false, 2),
  ('whole_house_rewire__4__m3', 'whole_house_rewire__4', 'Switches (assorted, 15-20)', 60, 'Devices', false, 3),
  ('whole_house_rewire__4__m4', 'whole_house_rewire__4', 'Cover plates', 40, 'Trim', false, 4),
  ('whole_house_rewire__4__m5', 'whole_house_rewire__4', 'Wire nuts (assorted)', 15, 'Supplies', false, 5);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('whole_house_rewire__5', 'whole_house_rewire', 'Panel Termination', 5, 1, 'Terminate all new circuits at the panel.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('whole_house_rewire__5__t1', 'whole_house_rewire__5', 'Route wires into panel', 1, false),
  ('whole_house_rewire__5__t2', 'whole_house_rewire__5', 'Strip & terminate each circuit', 2, false),
  ('whole_house_rewire__5__t3', 'whole_house_rewire__5', 'Install appropriate breakers', 3, false),
  ('whole_house_rewire__5__t4', 'whole_house_rewire__5', 'Torque all connections', 4, false),
  ('whole_house_rewire__5__t5', 'whole_house_rewire__5', 'Label circuit directory', 5, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('whole_house_rewire__5__m1', 'whole_house_rewire__5', 'AFCI breakers (bedrooms)', 160, 'Breakers', false, 1),
  ('whole_house_rewire__5__m2', 'whole_house_rewire__5', 'Standard breakers (assorted)', 100, 'Breakers', false, 2);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('whole_house_rewire__6', 'whole_house_rewire', 'Patch & Inspection', 6, 1, 'Patch access holes, final inspection, test every circuit.', 'Final electrical inspection');
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('whole_house_rewire__6__t1', 'whole_house_rewire__6', 'Patch all drywall access holes', 1, false),
  ('whole_house_rewire__6__t2', 'whole_house_rewire__6', 'Mud, tape, sand patches', 2, false),
  ('whole_house_rewire__6__t3', 'whole_house_rewire__6', 'Test every outlet (polarity, ground)', 3, false),
  ('whole_house_rewire__6__t4', 'whole_house_rewire__6', 'Test all GFCI trips', 4, false),
  ('whole_house_rewire__6__t5', 'whole_house_rewire__6', 'Test all AFCI breakers', 5, false),
  ('whole_house_rewire__6__t6', 'whole_house_rewire__6', 'Call for final inspection', 6, false),
  ('whole_house_rewire__6__t7', 'whole_house_rewire__6', 'Clean up all work areas', 7, false),
  ('whole_house_rewire__6__t8', 'whole_house_rewire__6', 'Walk customer through new panel & circuits', 8, false),
  ('whole_house_rewire__6__t9', 'whole_house_rewire__6', 'Get customer sign-off', 9, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('whole_house_rewire__6__m1', 'whole_house_rewire__6', 'Drywall patches & compound', 40, 'Drywall', false, 1),
  ('whole_house_rewire__6__m2', 'whole_house_rewire__6', 'Outlet tester', 0, 'Tools', false, 2);

-- EV Charger Install (electrical)
INSERT INTO project_templates (id, name, icon, category, trade, description, estimated_days, estimated_budget_low, estimated_budget_high, sort_order) VALUES ('ev_charger_install', 'EV Charger Install', 'car-outline', 'EV', 'electrical', 'Install Level 2 EV charger with dedicated 50A circuit from panel to garage.', 1, 1000, 2000, 15);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('ev_charger_install__1', 'ev_charger_install', 'Site Assessment', 1, 0.25, 'Assess panel capacity, plan circuit route, verify charger location.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('ev_charger_install__1__t1', 'ev_charger_install__1', 'Check panel for available space & capacity', 1, false),
  ('ev_charger_install__1__t2', 'ev_charger_install__1', 'Plan wire route from panel to charger location', 2, false),
  ('ev_charger_install__1__t3', 'ev_charger_install__1', 'Measure wire run distance', 3, false),
  ('ev_charger_install__1__t4', 'ev_charger_install__1', 'Determine conduit vs NM-B routing', 4, false),
  ('ev_charger_install__1__t5', 'ev_charger_install__1', 'Verify charger mounting location with customer', 5, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('ev_charger_install__1__m1', 'ev_charger_install__1', 'Level 2 EV charger (40A)', 450, 'Equipment', true, 1),
  ('ev_charger_install__1__m2', 'ev_charger_install__1', '6/3 NM-B wire or THHN in conduit', 180, 'Wire', false, 2);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('ev_charger_install__2', 'ev_charger_install', 'Circuit Run', 2, 0.25, 'Run dedicated 50A circuit from panel to charger location.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('ev_charger_install__2__t1', 'ev_charger_install__2', 'Install 50A double-pole breaker in panel', 1, false),
  ('ev_charger_install__2__t2', 'ev_charger_install__2', 'Run wire/conduit from panel to garage', 2, false),
  ('ev_charger_install__2__t3', 'ev_charger_install__2', 'Secure wire with staples or mount conduit', 3, false),
  ('ev_charger_install__2__t4', 'ev_charger_install__2', 'Drill through walls/framing as needed', 4, false),
  ('ev_charger_install__2__t5', 'ev_charger_install__2', 'Pull wire through conduit (if applicable)', 5, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('ev_charger_install__2__m1', 'ev_charger_install__2', '50A double-pole breaker', 25, 'Breakers', false, 1),
  ('ev_charger_install__2__m2', 'ev_charger_install__2', 'Conduit & fittings (if required)', 60, 'Conduit', true, 2),
  ('ev_charger_install__2__m3', 'ev_charger_install__2', 'Cable staples / straps', 10, 'Fasteners', false, 3);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('ev_charger_install__3', 'ev_charger_install', 'Charger Mounting', 3, 0.25, 'Mount charger or outlet on wall.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('ev_charger_install__3__t1', 'ev_charger_install__3', 'Mount charger bracket to wall', 1, false),
  ('ev_charger_install__3__t2', 'ev_charger_install__3', 'Install NEMA 14-50 outlet (if plug-in charger)', 2, false),
  ('ev_charger_install__3__t3', 'ev_charger_install__3', 'Hardwire charger (if hardwired model)', 3, true),
  ('ev_charger_install__3__t4', 'ev_charger_install__3', 'Secure charger unit to bracket', 4, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('ev_charger_install__3__m1', 'ev_charger_install__3', 'NEMA 14-50 outlet & cover', 25, 'Devices', false, 1),
  ('ev_charger_install__3__m2', 'ev_charger_install__3', 'Mounting hardware (lag bolts)', 10, 'Hardware', false, 2);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('ev_charger_install__4', 'ev_charger_install', 'Connection & Test', 4, 0.25, 'Wire charger, energize circuit, test charging.', 'Electrical inspection');
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('ev_charger_install__4__t1', 'ev_charger_install__4', 'Terminate wires at charger/outlet', 1, false),
  ('ev_charger_install__4__t2', 'ev_charger_install__4', 'Terminate wires at panel breaker', 2, false),
  ('ev_charger_install__4__t3', 'ev_charger_install__4', 'Energize circuit — verify voltage (240V)', 3, false),
  ('ev_charger_install__4__t4', 'ev_charger_install__4', 'Plug in charger — verify indicator lights', 4, false),
  ('ev_charger_install__4__t5', 'ev_charger_install__4', 'Test charge with vehicle (if available)', 5, false),
  ('ev_charger_install__4__t6', 'ev_charger_install__4', 'Call for inspection', 6, false),
  ('ev_charger_install__4__t7', 'ev_charger_install__4', 'Clean up work area', 7, false),
  ('ev_charger_install__4__t8', 'ev_charger_install__4', 'Walk customer through charger operation', 8, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('ev_charger_install__4__m1', 'ev_charger_install__4', 'Wire nuts / connectors', 5, 'Supplies', false, 1),
  ('ev_charger_install__4__m2', 'ev_charger_install__4', 'Permit fee', 75, 'Permits', true, 2);

-- Generator Install (electrical)
INSERT INTO project_templates (id, name, icon, category, trade, description, estimated_days, estimated_budget_low, estimated_budget_high, sort_order) VALUES ('generator_install', 'Generator Install', 'power-outline', 'Generator', 'electrical', 'Install whole-home standby generator with automatic transfer switch and gas line.', 2, 7000, 12000, 16);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('generator_install__1', 'generator_install', 'Site Prep & Pad', 1, 1, 'Pour or set concrete pad, determine placement per code clearances.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('generator_install__1__t1', 'generator_install__1', 'Verify placement meets code clearances (5ft from openings)', 1, false),
  ('generator_install__1__t2', 'generator_install__1', 'Level ground for pad', 2, false),
  ('generator_install__1__t3', 'generator_install__1', 'Pour or set concrete pad', 3, false),
  ('generator_install__1__t4', 'generator_install__1', 'Allow pad to cure (or use prefab)', 4, false),
  ('generator_install__1__t5', 'generator_install__1', 'Pull permits (electrical + gas)', 5, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('generator_install__1__m1', 'generator_install__1', 'Standby generator (14-22kW)', 4500, 'Equipment', false, 1),
  ('generator_install__1__m2', 'generator_install__1', 'Concrete pad (prefab or poured)', 120, 'Foundation', false, 2),
  ('generator_install__1__m3', 'generator_install__1', 'Permit fees (electrical + gas)', 200, 'Permits', false, 3);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('generator_install__2', 'generator_install', 'Gas Line Run', 2, 1, 'Run dedicated gas line from meter to generator.', 'Gas line inspection');
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('generator_install__2__t1', 'generator_install__2', 'Determine gas line size per BTU rating', 1, false),
  ('generator_install__2__t2', 'generator_install__2', 'Tap into gas supply near meter', 2, false),
  ('generator_install__2__t3', 'generator_install__2', 'Run gas line to generator location', 3, false),
  ('generator_install__2__t4', 'generator_install__2', 'Install gas shut-off valve at generator', 4, false),
  ('generator_install__2__t5', 'generator_install__2', 'Pressure test gas line', 5, false),
  ('generator_install__2__t6', 'generator_install__2', 'Check all joints with leak detector', 6, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('generator_install__2__m1', 'generator_install__2', 'Gas pipe (black iron or CSST)', 180, 'Gas', false, 1),
  ('generator_install__2__m2', 'generator_install__2', 'Gas fittings & shut-off valve', 55, 'Gas', false, 2),
  ('generator_install__2__m3', 'generator_install__2', 'Pipe thread sealant', 10, 'Supplies', false, 3);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('generator_install__3', 'generator_install', 'Electrical Connection', 3, 1, 'Run power cable from generator to transfer switch location.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('generator_install__3__t1', 'generator_install__3', 'Run conduit from generator to house', 1, false),
  ('generator_install__3__t2', 'generator_install__3', 'Pull power wires through conduit', 2, false),
  ('generator_install__3__t3', 'generator_install__3', 'Connect wires at generator junction box', 3, false),
  ('generator_install__3__t4', 'generator_install__3', 'Set generator on pad', 4, false),
  ('generator_install__3__t5', 'generator_install__3', 'Connect gas line to generator', 5, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('generator_install__3__m1', 'generator_install__3', 'Conduit & fittings (outdoor rated)', 85, 'Conduit', false, 1),
  ('generator_install__3__m2', 'generator_install__3', 'THHN wire (per run)', 120, 'Wire', false, 2),
  ('generator_install__3__m3', 'generator_install__3', 'Weatherproof connectors', 20, 'Fittings', false, 3);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('generator_install__4', 'generator_install', 'Transfer Switch Install', 4, 0.25, 'Install automatic transfer switch adjacent to main panel.', 'Electrical inspection');
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('generator_install__4__t1', 'generator_install__4', 'Mount transfer switch next to main panel', 1, false),
  ('generator_install__4__t2', 'generator_install__4', 'Connect utility power feed through transfer switch', 2, false),
  ('generator_install__4__t3', 'generator_install__4', 'Connect generator feed to transfer switch', 3, false),
  ('generator_install__4__t4', 'generator_install__4', 'Connect load wires to selected circuits', 4, false),
  ('generator_install__4__t5', 'generator_install__4', 'Torque all connections to spec', 5, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('generator_install__4__m1', 'generator_install__4', 'Automatic transfer switch (200A)', 900, 'Equipment', false, 1),
  ('generator_install__4__m2', 'generator_install__4', 'Breakers for transfer switch', 80, 'Breakers', false, 2);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('generator_install__5', 'generator_install', 'Startup & Programming', 5, 0.25, 'Commission generator, program transfer switch, test automatic operation.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('generator_install__5__t1', 'generator_install__5', 'Start generator — verify operation', 1, false),
  ('generator_install__5__t2', 'generator_install__5', 'Program transfer switch (delay, exercise schedule)', 2, false),
  ('generator_install__5__t3', 'generator_install__5', 'Simulate power outage — test automatic transfer', 3, false),
  ('generator_install__5__t4', 'generator_install__5', 'Verify all selected circuits receive power', 4, false),
  ('generator_install__5__t5', 'generator_install__5', 'Test transfer back to utility power', 5, false),
  ('generator_install__5__t6', 'generator_install__5', 'Set weekly exercise schedule', 6, false),
  ('generator_install__5__t7', 'generator_install__5', 'Register warranty', 7, false),
  ('generator_install__5__t8', 'generator_install__5', 'Train customer on operation & maintenance', 8, false),
  ('generator_install__5__t9', 'generator_install__5', 'Clean up work area', 9, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('generator_install__5__m1', 'generator_install__5', 'Battery (if not included)', 45, 'Parts', true, 1);

-- Lighting Overhaul (electrical)
INSERT INTO project_templates (id, name, icon, category, trade, description, estimated_days, estimated_budget_low, estimated_budget_high, sort_order) VALUES ('lighting_overhaul', 'Lighting Overhaul', 'bulb-outline', 'Lighting', 'electrical', 'Complete lighting redesign — remove old fixtures, run new circuits, install recessed and LED lighting with dimmer controls.', 3, 3000, 6000, 17);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('lighting_overhaul__1', 'lighting_overhaul', 'Design & Layout', 1, 1, 'Design lighting layout, select fixtures, plan circuit requirements.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('lighting_overhaul__1__t1', 'lighting_overhaul__1', 'Walk rooms with customer — discuss needs', 1, false),
  ('lighting_overhaul__1__t2', 'lighting_overhaul__1', 'Design lighting layout (recessed, pendant, accent)', 2, false),
  ('lighting_overhaul__1__t3', 'lighting_overhaul__1', 'Mark fixture locations on ceiling', 3, false),
  ('lighting_overhaul__1__t4', 'lighting_overhaul__1', 'Plan switch locations & groupings', 4, false),
  ('lighting_overhaul__1__t5', 'lighting_overhaul__1', 'Calculate circuit loads', 5, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('lighting_overhaul__1__m1', 'lighting_overhaul__1', 'Recessed LED cans (12-20)', 360, 'Fixtures', false, 1),
  ('lighting_overhaul__1__m2', 'lighting_overhaul__1', 'LED fixtures (pendant / flush mount)', 400, 'Fixtures', false, 2);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('lighting_overhaul__2', 'lighting_overhaul', 'Old Fixture Removal', 2, 1, 'Remove existing fixtures, switches, and outdated wiring.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('lighting_overhaul__2__t1', 'lighting_overhaul__2', 'Turn off circuits at panel', 1, false),
  ('lighting_overhaul__2__t2', 'lighting_overhaul__2', 'Remove old ceiling fixtures', 2, false),
  ('lighting_overhaul__2__t3', 'lighting_overhaul__2', 'Remove old switches & dimmers', 3, false),
  ('lighting_overhaul__2__t4', 'lighting_overhaul__2', 'Cap existing wires safely', 4, false),
  ('lighting_overhaul__2__t5', 'lighting_overhaul__2', 'Remove any abandoned junction boxes', 5, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('lighting_overhaul__2__m1', 'lighting_overhaul__2', 'Wire nuts (assorted)', 10, 'Supplies', false, 1),
  ('lighting_overhaul__2__m2', 'lighting_overhaul__2', 'Blank cover plates (for abandoned boxes)', 8, 'Trim', false, 2);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('lighting_overhaul__3', 'lighting_overhaul', 'New Circuit Runs', 3, 1, 'Run new circuits for lighting zones.', 'Rough-in electrical inspection');
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('lighting_overhaul__3__t1', 'lighting_overhaul__3', 'Cut holes for recessed cans', 1, false),
  ('lighting_overhaul__3__t2', 'lighting_overhaul__3', 'Run new wire from panel for lighting circuits', 2, false),
  ('lighting_overhaul__3__t3', 'lighting_overhaul__3', 'Run switch legs to each lighting group', 3, false),
  ('lighting_overhaul__3__t4', 'lighting_overhaul__3', 'Install new junction boxes where needed', 4, false),
  ('lighting_overhaul__3__t5', 'lighting_overhaul__3', 'Pull wires to each fixture location', 5, false),
  ('lighting_overhaul__3__t6', 'lighting_overhaul__3', 'Call for rough-in inspection', 6, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('lighting_overhaul__3__m1', 'lighting_overhaul__3', 'NM-B 14/2 wire (250ft)', 55, 'Wire', false, 1),
  ('lighting_overhaul__3__m2', 'lighting_overhaul__3', 'Junction boxes (assorted)', 30, 'Boxes', false, 2),
  ('lighting_overhaul__3__m3', 'lighting_overhaul__3', 'Wire staples', 10, 'Fasteners', false, 3);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('lighting_overhaul__4', 'lighting_overhaul', 'Fixture Install', 4, 1, 'Install all new fixtures, make connections.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('lighting_overhaul__4__t1', 'lighting_overhaul__4', 'Install recessed cans & LED modules', 1, false),
  ('lighting_overhaul__4__t2', 'lighting_overhaul__4', 'Install pendant / flush-mount fixtures', 2, false),
  ('lighting_overhaul__4__t3', 'lighting_overhaul__4', 'Install under-cabinet lighting', 3, true),
  ('lighting_overhaul__4__t4', 'lighting_overhaul__4', 'Wire all fixture connections', 4, false),
  ('lighting_overhaul__4__t5', 'lighting_overhaul__4', 'Install trim rings on recessed cans', 5, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('lighting_overhaul__4__m1', 'lighting_overhaul__4', 'Trim rings / baffles', 60, 'Trim', false, 1),
  ('lighting_overhaul__4__m2', 'lighting_overhaul__4', 'Under-cabinet LED strips', 80, 'Fixtures', true, 2),
  ('lighting_overhaul__4__m3', 'lighting_overhaul__4', 'Mounting hardware', 15, 'Hardware', false, 3);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('lighting_overhaul__5', 'lighting_overhaul', 'Controls & Dimming', 5, 1, 'Install dimmers, smart switches, test all lighting zones.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('lighting_overhaul__5__t1', 'lighting_overhaul__5', 'Install dimmer switches', 1, false),
  ('lighting_overhaul__5__t2', 'lighting_overhaul__5', 'Install smart switches', 2, true),
  ('lighting_overhaul__5__t3', 'lighting_overhaul__5', 'Install cover plates (decorator style)', 3, false),
  ('lighting_overhaul__5__t4', 'lighting_overhaul__5', 'Test each lighting zone independently', 4, false),
  ('lighting_overhaul__5__t5', 'lighting_overhaul__5', 'Verify dimming range on all fixtures', 5, false),
  ('lighting_overhaul__5__t6', 'lighting_overhaul__5', 'Program smart switches / scenes', 6, true),
  ('lighting_overhaul__5__t7', 'lighting_overhaul__5', 'Clean up all work areas', 7, false),
  ('lighting_overhaul__5__t8', 'lighting_overhaul__5', 'Walk customer through switches & controls', 8, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('lighting_overhaul__5__m1', 'lighting_overhaul__5', 'Dimmer switches (6-10)', 180, 'Controls', false, 1),
  ('lighting_overhaul__5__m2', 'lighting_overhaul__5', 'Decorator cover plates', 35, 'Trim', false, 2),
  ('lighting_overhaul__5__m3', 'lighting_overhaul__5', 'Smart switches', 120, 'Controls', true, 3);

-- Smart Home Wiring (electrical)
INSERT INTO project_templates (id, name, icon, category, trade, description, estimated_days, estimated_budget_low, estimated_budget_high, sort_order) VALUES ('smart_home_wiring', 'Smart Home Wiring', 'wifi-outline', 'Low Voltage', 'electrical', 'Structured wiring for smart home — Cat6, coax, HDMI, network cabinet, and smart device install.', 4, 4000, 8000, 18);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('smart_home_wiring__1', 'smart_home_wiring', 'Planning & Scope', 1, 1, 'Plan network layout, identify drop locations, design cable runs.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('smart_home_wiring__1__t1', 'smart_home_wiring__1', 'Walk home with customer — identify drop locations', 1, false),
  ('smart_home_wiring__1__t2', 'smart_home_wiring__1', 'Plan network cabinet location', 2, false),
  ('smart_home_wiring__1__t3', 'smart_home_wiring__1', 'Design cable topology (home runs to cabinet)', 3, false),
  ('smart_home_wiring__1__t4', 'smart_home_wiring__1', 'Identify smart device locations (switches, cameras)', 4, false),
  ('smart_home_wiring__1__t5', 'smart_home_wiring__1', 'Order materials & specialty cables', 5, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('smart_home_wiring__1__m1', 'smart_home_wiring__1', 'Cat6 cable (1000ft box)', 180, 'Cable', false, 1),
  ('smart_home_wiring__1__m2', 'smart_home_wiring__1', 'RG6 coax cable (500ft)', 80, 'Cable', false, 2);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('smart_home_wiring__2', 'smart_home_wiring', 'Low-Voltage Runs', 2, 1.5, 'Run all low-voltage cabling from cabinet to each location.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('smart_home_wiring__2__t1', 'smart_home_wiring__2', 'Cut low-voltage bracket openings', 1, false),
  ('smart_home_wiring__2__t2', 'smart_home_wiring__2', 'Run Cat6 to each network drop (2 per room)', 2, false),
  ('smart_home_wiring__2__t3', 'smart_home_wiring__2', 'Run Cat6 to each WAP (wireless access point) location', 3, false),
  ('smart_home_wiring__2__t4', 'smart_home_wiring__2', 'Run coax to TV locations', 4, false),
  ('smart_home_wiring__2__t5', 'smart_home_wiring__2', 'Run HDMI / conduit for media locations', 5, true),
  ('smart_home_wiring__2__t6', 'smart_home_wiring__2', 'Label every cable at both ends', 6, false),
  ('smart_home_wiring__2__t7', 'smart_home_wiring__2', 'Secure and support all cable runs', 7, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('smart_home_wiring__2__m1', 'smart_home_wiring__2', 'HDMI cables / conduit for media', 60, 'Cable', true, 1),
  ('smart_home_wiring__2__m2', 'smart_home_wiring__2', 'Low-voltage brackets (20-30)', 40, 'Boxes', false, 2),
  ('smart_home_wiring__2__m3', 'smart_home_wiring__2', 'Cable ties & velcro straps', 20, 'Supplies', false, 3),
  ('smart_home_wiring__2__m4', 'smart_home_wiring__2', 'Cable labels / tags', 15, 'Supplies', false, 4);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('smart_home_wiring__3', 'smart_home_wiring', 'Network Cabinet', 3, 1, 'Install structured media cabinet, patch panels, and switch.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('smart_home_wiring__3__t1', 'smart_home_wiring__3', 'Mount network rack / cabinet to wall', 1, false),
  ('smart_home_wiring__3__t2', 'smart_home_wiring__3', 'Install patch panel', 2, false),
  ('smart_home_wiring__3__t3', 'smart_home_wiring__3', 'Terminate all Cat6 cables at patch panel', 3, false),
  ('smart_home_wiring__3__t4', 'smart_home_wiring__3', 'Install network switch', 4, false),
  ('smart_home_wiring__3__t5', 'smart_home_wiring__3', 'Install coax splitter / MoCA adapter', 5, true),
  ('smart_home_wiring__3__t6', 'smart_home_wiring__3', 'Organize & dress cables neatly', 6, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('smart_home_wiring__3__m1', 'smart_home_wiring__3', 'Network rack (small wall-mount)', 120, 'Equipment', false, 1),
  ('smart_home_wiring__3__m2', 'smart_home_wiring__3', 'Patch panel (24-port)', 45, 'Network', false, 2),
  ('smart_home_wiring__3__m3', 'smart_home_wiring__3', 'Network switch (managed, 24-port)', 150, 'Network', false, 3),
  ('smart_home_wiring__3__m4', 'smart_home_wiring__3', 'Patch cables (assorted)', 30, 'Network', false, 4);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('smart_home_wiring__4', 'smart_home_wiring', 'Device Install', 4, 1, 'Install wall plates, smart switches, WAPs, and cameras.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('smart_home_wiring__4__t1', 'smart_home_wiring__4', 'Terminate Cat6 at wall plates (keystones)', 1, false),
  ('smart_home_wiring__4__t2', 'smart_home_wiring__4', 'Install wall plates at each location', 2, false),
  ('smart_home_wiring__4__t3', 'smart_home_wiring__4', 'Mount wireless access points', 3, false),
  ('smart_home_wiring__4__t4', 'smart_home_wiring__4', 'Install smart switches (Lutron, etc.)', 4, true),
  ('smart_home_wiring__4__t5', 'smart_home_wiring__4', 'Install smart hub / controller', 5, false),
  ('smart_home_wiring__4__t6', 'smart_home_wiring__4', 'Mount cameras (if included)', 6, true);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('smart_home_wiring__4__m1', 'smart_home_wiring__4', 'Keystone jacks (Cat6)', 40, 'Network', false, 1),
  ('smart_home_wiring__4__m2', 'smart_home_wiring__4', 'Wall plates (1-4 port)', 35, 'Trim', false, 2),
  ('smart_home_wiring__4__m3', 'smart_home_wiring__4', 'Smart switches / dimmers', 300, 'Smart Home', true, 3),
  ('smart_home_wiring__4__m4', 'smart_home_wiring__4', 'Smart hub', 100, 'Smart Home', false, 4);
INSERT INTO template_phases (id, template_id, name, sort_order, estimated_days, description, inspection_required) VALUES ('smart_home_wiring__5', 'smart_home_wiring', 'Programming & Testing', 5, 1, 'Test every cable run, configure network, program smart devices.', NULL);
INSERT INTO template_tasks (id, phase_id, name, sort_order, optional) VALUES
  ('smart_home_wiring__5__t1', 'smart_home_wiring__5', 'Certify / test every Cat6 run', 1, false),
  ('smart_home_wiring__5__t2', 'smart_home_wiring__5', 'Test every coax run', 2, false),
  ('smart_home_wiring__5__t3', 'smart_home_wiring__5', 'Configure network switch & VLANs', 3, true),
  ('smart_home_wiring__5__t4', 'smart_home_wiring__5', 'Configure wireless access points', 4, false),
  ('smart_home_wiring__5__t5', 'smart_home_wiring__5', 'Pair & program smart devices', 5, false),
  ('smart_home_wiring__5__t6', 'smart_home_wiring__5', 'Test smart home scenes / automations', 6, false),
  ('smart_home_wiring__5__t7', 'smart_home_wiring__5', 'Clean up all work areas', 7, false),
  ('smart_home_wiring__5__t8', 'smart_home_wiring__5', 'Train customer on system', 8, false),
  ('smart_home_wiring__5__t9', 'smart_home_wiring__5', 'Provide network documentation', 9, false);
INSERT INTO template_materials (id, phase_id, name, estimated_cost, category, optional, sort_order) VALUES
  ('smart_home_wiring__5__m1', 'smart_home_wiring__5', 'Cable certifier / tester', 0, 'Tools', false, 1),
  ('smart_home_wiring__5__m2', 'smart_home_wiring__5', 'Conduit (spare runs for future)', 25, 'Conduit', true, 2);

COMMIT;