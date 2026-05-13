#!/bin/bash
# =============================================================================
#  MIGRACIÓN PARCIAL: solo tabla usuario_acciones
#  Ejecutar desde Git Bash: bash database/migrate-usuario-acciones.sh
# =============================================================================

HOST="sanjuandelrio.sytes.net"
PORT="5432"
USER="postgres"
export PGPASSWORD="AdminSJR@2025"

DB_ORIGEN="servicio-medico-pruebas"
DB_DESTINO="servicio_medico_produccion"

echo ""
echo "Migrando usuario_acciones: $DB_ORIGEN → $DB_DESTINO"
echo ""

pg_dump \
  -h "$HOST" -p "$PORT" -U "$USER" \
  --data-only \
  --disable-triggers \
  -t "usuario_acciones" \
  "$DB_ORIGEN" | \
psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DB_DESTINO" -q

COUNT=$(psql -h "$HOST" -p "$PORT" -U "$USER" -d "$DB_DESTINO" -tAc \
  "SELECT COUNT(*) FROM usuario_acciones;")

echo "✓ Listo — $COUNT permisos migrados"
echo ""
