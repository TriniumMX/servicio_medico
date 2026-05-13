# Plan: Prueba de Flujo Completa en Producción + Reset

## Objetivo
Ejecutar una prueba de flujo real sobre `servicio_medico_produccion`, validar que todo funciona correctamente y luego limpiar todos los datos generados dejando las tablas transaccionales vacías con IDs reiniciados desde 1.

---

## FASE 1 — Preparación antes de probar

### 1.1 Apuntar la app a producción
En `.env.local`, cambiar:
```env
PGDATABASE=servicio_medico_produccion
```
Reiniciar el servidor: `npm run dev`

### 1.2 Tomar snapshot del estado inicial (opcional pero recomendado)
Antes de cualquier prueba, guardar un respaldo limpio de producción:
```bash
bash database/backup-produccion.sh
```
> ⚠️ Este script aún no existe — crearlo será el primer paso de la tarea.

---

## FASE 2 — Flujo de prueba a cubrir

Ejecutar el flujo completo en orden, igual que lo haría un usuario real:

### Módulo 1 — Consulta médica
- [ ] Registrar una consulta para un beneficiario real del padrón
- [ ] Capturar signos vitales
- [ ] Agregar diagnóstico CIE-11
- [ ] Finalizar consulta (estatus = 2)

### Módulo 2 — Recetas y Farmacia
- [ ] Emitir una receta con 2-3 medicamentos desde la consulta anterior
- [ ] Surtir parcialmente una receta (simular sin stock)
- [ ] Surtir completamente otra receta
- [ ] Verificar que el inventario descuenta correctamente

### Módulo 3 — Incapacidades
- [ ] Crear incapacidad desde la consulta
- [ ] Aprobar la incapacidad desde el módulo coordinador
- [ ] Verificar PDF generado

### Módulo 4 — Estudios de Laboratorio
- [ ] Solicitar 2 estudios desde la consulta
- [ ] Autorizar estudios desde coordinación
- [ ] Marcar como entregados

### Módulo 5 — Referencias a Especialista
- [ ] Crear referencia desde la consulta
- [ ] Autorizar referencia desde coordinador
- [ ] Asignar médico especialista en hospital
- [ ] Registrar consulta de seguimiento

### Módulo 6 — Estadísticas
- [ ] Verificar que los KPIs reflejan los datos generados
- [ ] Verificar que las gráficas muestran la nueva información
- [ ] Probar exportar Excel

---

## FASE 3 — Reset completo post-prueba

### 3.1 Tablas a limpiar (con TRUNCATE + reinicio de secuencias)

El script de reset debe limpiar en orden inverso a las dependencias FK:

```
Nivel 4 (sin dependientes):
  - surtimientos_receta
  - historial_inventario
  - notificaciones_leidas
  - notificaciones_destinatarios
  - diagnosticos_consulta
  - consulta_estudios
  - usuario_acciones → NO limpiar (son permisos reales)

Nivel 3:
  - detalle_receta
  - contrareferencias
  - incapacidades
  - notificaciones
  - avisos
  - firmas_digitales
  - agenda_medico

Nivel 2:
  - recetas
  - referencias_especialidad

Nivel 1 (raíz transaccional):
  - consulta
```

### 3.2 Tablas que NO se tocan en el reset

| Tabla | Razón |
|---|---|
| `tiposusuarios` | Catálogo fijo |
| `especialidades` | Catálogo fijo |
| `parentesco` | Catálogo fijo |
| `hospitales` | Catálogo fijo |
| `cat_acciones` | Catálogo fijo |
| `unidades_medida` | Catálogo fijo |
| `reglas_generales` | Configuración |
| `estatus_consulta` | Catálogo fijo |
| `cat_estudios_laboratorio` | Catálogo fijo |
| `cat_etiquetas_avisos` | Catálogo fijo |
| `alertas_fondos_correos` | Configuración |
| `enfermedades_cronicas` | Catálogo fijo |
| `enfermedades_kpis` | Catálogo fijo |
| `usuarios` | Usuarios reales |
| `usuario_acciones` | Permisos reales |
| `medicamentos` | Catálogo real |
| `inventario_medicamentos` | Restaurar existencia_actual a 0 |
| `beneficiario` | Padrón real de empleados |
| `proveedores` | Especialistas registrados |

### 3.3 Script a crear: `reset-tablas-transaccionales.sh`

El script debe:
1. Conectarse a `servicio_medico_produccion`
2. Pedir confirmación con texto exacto `RESET` antes de ejecutar
3. Ejecutar `TRUNCATE ... RESTART IDENTITY CASCADE` en el orden correcto
4. Restaurar `inventario_medicamentos.existencia_actual = 0`
5. Mostrar conteo de todas las tablas al final para confirmar que están en 0

---

## FASE 4 — Verificación post-reset

Confirmar que:
- [ ] Todas las tablas transaccionales tienen 0 registros
- [ ] Los SERIAL/BIGSERIAL de todas las tablas reinician desde 1
- [ ] El inventario tiene existencia_actual = 0 en todos los medicamentos
- [ ] Los catálogos y usuarios siguen intactos
- [ ] La app inicia sin errores apuntando a producción

---

## Entregables de esta tarea

1. `database/backup-produccion.sh` — Backup rápido antes de probar
2. `database/reset-tablas-transaccionales.sh` — Reset completo post-prueba
3. Checklist de prueba completado (marcar cada paso de Fase 2)
