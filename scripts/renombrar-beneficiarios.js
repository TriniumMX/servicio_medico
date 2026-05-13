// Script para renombrar la carpeta beneficiarios a Beneficiarios
const fs = require('fs');
const path = require('path');

const publicDir = path.join(process.cwd(), 'public');
const carpetaActual = path.join(publicDir, 'beneficiarios');
const carpetaNueva = path.join(publicDir, 'Beneficiarios');

console.log('🔄 Renombrando carpeta beneficiarios → Beneficiarios...\n');

// Verificar si existe beneficiarios (minúsculas)
if (fs.existsSync(carpetaActual)) {
  try {
    // En Windows, necesitamos renombrar a un nombre temporal primero
    const carpetaTemporal = path.join(publicDir, 'beneficiarios_temp');

    console.log('📁 Paso 1: Renombrando a temporal...');
    fs.renameSync(carpetaActual, carpetaTemporal);

    console.log('📁 Paso 2: Renombrando a Beneficiarios...');
    fs.renameSync(carpetaTemporal, carpetaNueva);

    console.log('✅ ¡Carpeta renombrada exitosamente!');
    console.log(`   De: ${carpetaActual}`);
    console.log(`   A:  ${carpetaNueva}`);
  } catch (error) {
    console.error('❌ Error al renombrar:', error.message);
    process.exit(1);
  }
} else if (fs.existsSync(carpetaNueva)) {
  console.log('✅ La carpeta "Beneficiarios" ya existe (correcto)');
} else {
  console.log('⚠️  No se encontró ninguna carpeta. Creando estructura...');
  fs.mkdirSync(carpetaNueva, { recursive: true });
  fs.mkdirSync(path.join(carpetaNueva, 'Fotos'), { recursive: true });
  fs.mkdirSync(path.join(carpetaNueva, 'Documentos'), { recursive: true });
  console.log('✅ Estructura creada correctamente');
}

console.log('\n✨ ¡Listo! Ahora las fotos deberían cargarse correctamente.');
