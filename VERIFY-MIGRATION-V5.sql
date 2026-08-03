-- Optional post-migration verification for the Lo-Key D1 vehicle catalogue.
SELECT COUNT(*) AS vehicle_rows FROM vehicles;
SELECT COUNT(*) AS soul_ev_rows
FROM vehicles
WHERE year = 2016 AND make_normalized = 'kia' AND model_normalized = 'soul ev';
SELECT year, make, model, status, battery_sizes, confidence, source
FROM vehicles
WHERE year = 2016 AND make_normalized = 'kia' AND model_normalized = 'soul ev';
SELECT name
FROM sqlite_master
WHERE type = 'table' AND name = 'compatibility_records';
