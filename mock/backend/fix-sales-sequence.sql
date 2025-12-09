-- Script para resetear la secuencia de IDs de la tabla sales
-- Ejecutar este script en PostgreSQL para solucionar el error de ID duplicado

-- Resetear la secuencia al máximo ID actual + 1
SELECT setval(pg_get_serial_sequence('sales', 'id'), COALESCE((SELECT MAX(id) FROM sales), 0) + 1, false);

-- Verificar el próximo valor de la secuencia
SELECT currval(pg_get_serial_sequence('sales', 'id'));
