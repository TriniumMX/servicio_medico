// ─── Fundación multi-tenant ───────────────────────────────────────────────────
export * from './organizaciones';
export * from './usuarios';
export * from './pacientes';

// ─── Catálogos globales ───────────────────────────────────────────────────────
export * from './farmacia';          // unidades_medida, medicamentos, inventario_medicamentos
export * from './laboratorio';       // laboratorio_estudios, laboratorio_ordenes, laboratorio_orden_estudios

// ─── Núcleo clínico ───────────────────────────────────────────────────────────
export * from './consulta';          // consulta + ESTATUS_CONSULTA
export * from './diagnosticos_consulta';
export * from './recetas';           // recetas, detalle_receta, surtimientos_receta, control_resurtimientos
export * from './referencias';
export * from './contrareferencias';
export * from './certificados';

// ─── Soporte operativo ────────────────────────────────────────────────────────
export * from './firmas';
export * from './alertas_fondos';
export * from './reglas_generales';
export * from './historial_inventario';

// ─── Stubs de compatibilidad (eliminados en SaaS v1) ─────────────────────────
// ESTATUS_CONSULTA y EstatusConsultaValue ya se exportan desde ./consulta
// estatus_consulta.ts se mantiene para imports directos que aún no se migraron
// parentesco.ts — vacío, no exporta nada
