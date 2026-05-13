# Estructura de Archivos para Beneficiarios

Este documento explica cómo están organizados los archivos (fotos y documentos) de los beneficiarios.

## 📁 Estructura de Carpetas

```
public/
└── Beneficiarios/
    ├── Fotos/
    │   └── [no_nomina]/
    │       └── [parentesco]/
    │           └── [NOMBRE_APELLIDO]/
    │               └── foto_[timestamp].jpg
    │
    └── Documentos/
        ├── Curps/
        ├── ActasNacimiento/
        ├── INEs/
        ├── Constancias/
        ├── Concubinatos/
        ├── ActasMatrimonio/
        ├── NoISSTEs/
        ├── Incapacidades/
        └── DependenciasEconomicas/
            └── [no_nomina]/
                └── [parentesco]/
                    └── [NOMBRE_APELLIDO]/
                        └── [tipo]_[timestamp].pdf
```

## 🎯 Ejemplo Real

Para un beneficiario llamado **JULIA DORANTES PEREZ**, con número de nómina **187**, parentesco **Esposo(a)**:

**Foto:**
```
/Beneficiarios/Fotos/187/Esposo(a)/JULIA_DORANTES_PEREZ/foto_1747234371786.jpg
```

**CURP:**
```
/Beneficiarios/Documentos/Curps/187/Esposo(a)/JULIA_DORANTES_PEREZ/curp_1747234299814.pdf
```

## ⚙️ Configuración Automática

### 1. Ejecutar Script de Verificación

Para crear automáticamente todas las carpetas necesarias:

```bash
node scripts/verificar-estructura-beneficiarios.js
```

Este script:
- ✅ Verifica qué carpetas ya existen
- 📁 Crea las carpetas faltantes
- 📊 Muestra un resumen de la operación

### 2. Permisos de Escritura

Asegúrate de que el servidor tiene permisos de escritura en la carpeta `public/Beneficiarios/`:

**Linux/Mac:**
```bash
chmod -R 755 public/Beneficiarios
```

**Windows:**
- Click derecho en la carpeta `public/Beneficiarios`
- Propiedades → Seguridad
- Asegurar que el usuario tiene permisos de "Control total"

## 🔍 Verificar Archivos Existentes

### Base de Datos

Las URLs de los archivos se guardan en la tabla `beneficiarios`:

```sql
SELECT
    id_beneficiario,
    no_nomina,
    nombre,
    foto_url,
    url_curp,
    url_acta_nac,
    url_ine
FROM beneficiarios
WHERE foto_url IS NOT NULL OR url_curp IS NOT NULL;
```

### Sistema de Archivos

Para verificar si los archivos físicos existen:

```bash
# Windows
dir public\Beneficiarios\Fotos /s

# Linux/Mac
ls -R public/Beneficiarios/Fotos
```

## 🛠️ Solución de Problemas

### Problema: Fotos/Documentos no se muestran

**Causa posible:** Las carpetas no existen o tienen permisos incorrectos.

**Solución:**
1. Ejecutar el script de verificación: `node scripts/verificar-estructura-beneficiarios.js`
2. Verificar permisos de escritura
3. Revisar que las URLs en la BD coincidan con los archivos físicos

### Problema: Error "ENOENT: no such file or directory"

**Causa:** La carpeta padre no existe cuando se intenta guardar un archivo.

**Solución:**
El código ya incluye `{ recursive: true }` en `mkdir()`, pero verifica que:
1. La ruta no tenga caracteres especiales problemáticos
2. El servidor tenga permisos para crear carpetas

### Problema: URLs en base de datos con formato incorrecto

**Ejemplo incorrecto:**
```
/beneficiarios/fotos/187/...  ❌ (minúsculas)
```

**Formato correcto:**
```
/Beneficiarios/Fotos/187/...  ✅ (mayúsculas)
```

**Solución:**
Las APIs ahora usan el formato correcto automáticamente. Para archivos antiguos:

```sql
-- Script para corregir URLs antiguas (usar con precaución)
UPDATE beneficiarios
SET foto_url = REPLACE(foto_url, '/beneficiarios/', '/Beneficiarios/')
WHERE foto_url LIKE '/beneficiarios/%';

UPDATE beneficiarios
SET foto_url = REPLACE(foto_url, '/fotos/', '/Fotos/')
WHERE foto_url LIKE '%/fotos/%';

-- Repetir para cada campo URL_*
```

## 📊 Monitoreo

Para verificar cuántos beneficiarios tienen archivos:

```sql
SELECT
    COUNT(*) as total_beneficiarios,
    COUNT(foto_url) as con_foto,
    COUNT(url_curp) as con_curp,
    COUNT(url_acta_nac) as con_acta
FROM beneficiarios
WHERE activo = 'A';
```

## 🔒 Seguridad

**IMPORTANTE:** Los archivos están en la carpeta `public/`, lo que significa que son accesibles públicamente a través de la URL.

Si necesitas proteger estos archivos:
1. Moverlos fuera de `public/`
2. Crear una API route que verifique autenticación
3. Servir los archivos a través de la API

**Ejemplo de ruta protegida:**
```typescript
// src/app/api/beneficiarios/archivo/[...path]/route.ts
export async function GET(request: NextRequest) {
  // Verificar autenticación
  // Leer archivo del sistema de archivos
  // Retornar con headers apropiados
}
```

## 📝 Notas Adicionales

- Los nombres de archivo incluyen un timestamp para evitar duplicados
- Los nombres de carpeta se construyen en MAYÚSCULAS sin espacios (usando `_`)
- Las extensiones de archivo se preservan del archivo original
- Las carpetas se crean automáticamente si no existen (`mkdir recursive: true`)
