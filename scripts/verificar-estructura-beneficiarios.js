// Script para verificar y crear la estructura de carpetas para beneficiarios
// Ejecutar con: node scripts/verificar-estructura-beneficiarios.js

const fs = require('fs');
const path = require('path');

// NOTA: Las carpetas usan MAYÚSCULAS para coincidir con los datos en la BD
// Carpetas principales
const carpetasPrincipales = [
  'public/Beneficiarios',
  'public/Beneficiarios/Fotos',
  'public/Beneficiarios/Documentos',
];

// Subcarpetas de documentos
const carpetasDocumentos = [
  'public/Beneficiarios/Documentos/Curps',
  'public/Beneficiarios/Documentos/ActasNacimiento',
  'public/Beneficiarios/Documentos/INEs',
  'public/Beneficiarios/Documentos/Constancias',
  'public/Beneficiarios/Documentos/Concubinatos',
  'public/Beneficiarios/Documentos/ActasMatrimonio',
  'public/Beneficiarios/Documentos/NoISSTEs',
  'public/Beneficiarios/Documentos/Incapacidades',
  'public/Beneficiarios/Documentos/DependenciasEconomicas',
];

const todasLasCarpetas = [...carpetasPrincipales, ...carpetasDocumentos];

console.log('🔍 Verificando estructura de carpetas para Beneficiarios...\n');

let carpetasCreadas = 0;
let carpetasExistentes = 0;

todasLasCarpetas.forEach((carpeta) => {
  const rutaCompleta = path.join(process.cwd(), carpeta);

  if (fs.existsSync(rutaCompleta)) {
    console.log(`✅ Existe: ${carpeta}`);
    carpetasExistentes++;
  } else {
    try {
      fs.mkdirSync(rutaCompleta, { recursive: true });
      console.log(`📁 Creada: ${carpeta}`);
      carpetasCreadas++;
    } catch (error) {
      console.error(`❌ Error al crear ${carpeta}:`, error.message);
    }
  }
});

console.log('\n📊 Resumen:');
console.log(`   ✅ Carpetas existentes: ${carpetasExistentes}`);
console.log(`   📁 Carpetas creadas: ${carpetasCreadas}`);
console.log(`   📂 Total: ${todasLasCarpetas.length}`);

if (carpetasCreadas > 0) {
  console.log('\n✨ Estructura de carpetas creada exitosamente!');
} else {
  console.log('\n✅ Todas las carpetas ya existían!');
}
