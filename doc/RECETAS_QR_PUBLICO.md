# 📱 Sistema de QR para Recetas Públicas

## 📋 Descripción

Sistema de visualización pública de recetas médicas mediante códigos QR. Permite a los pacientes acceder a la información completa de su receta (incluyendo estado de surtimientos) sin necesidad de autenticación, usando un token UUID seguro.

## 🔐 Seguridad

El sistema utiliza las siguientes medidas de seguridad:

- **Tokens UUID v4**: 122 bits de entropía, prácticamente imposible de adivinar
- **Expiración automática**: Los tokens expiran después de 12 meses
- **No enumerable**: Los tokens UUID no revelan IDs secuenciales
- **Revocable**: Los tokens pueden desactivarse manualmente si es necesario
- **Auditable**: Se registra cada visualización (contador de visitas)
- **No indexable**: Las páginas tienen `noindex, nofollow` para buscadores

## 🚀 Instalación

### 1. Ejecutar migración de base de datos

```bash
psql -h TU_HOST -U TU_USUARIO -d TU_BASE_DATOS -f database/CREATE_TABLE_recetas_acceso_publico.sql
```

### 2. Configurar variable de entorno

Agregar en tu archivo `.env.local`:

```env
NEXT_PUBLIC_BASE_URL=https://tu-dominio.com
```

**Importante**: En producción, usa tu dominio real. En desarrollo puedes usar `http://localhost:3000`.

### 3. Instalar dependencias (ya está hecho)

```bash
npm install qrcode @types/qrcode
```

## 📊 Estructura de la Base de Datos

### Tabla: `recetas_acceso_publico`

```sql
CREATE TABLE recetas_acceso_publico (
  id BIGSERIAL PRIMARY KEY,
  id_receta BIGINT NOT NULL REFERENCES recetas(id_receta),
  token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  fecha_expiracion TIMESTAMP WITH TIME ZONE NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  visitas INTEGER NOT NULL DEFAULT 0,
  ultima_visita TIMESTAMP WITH TIME ZONE
);
```

## 🔄 Flujo de Funcionamiento

### 1. Generación de Receta

Cuando se genera una receta PDF (endpoint `/api/recetas/generar-pdf/[id_receta]`):

1. Se crea automáticamente un token UUID en `recetas_acceso_publico`
2. Se genera la URL pública: `https://tudominio.com/r/{token}`
3. Se crea un código QR con esa URL
4. El QR se inserta en la copia de la receta para el PACIENTE (esquina inferior derecha)

### 2. Escaneo del QR

Cuando un paciente escanea el QR:

1. Se redirige a `/r/{token}`
2. El sistema valida el token (existe, activo, no expirado)
3. Se incrementa el contador de visitas
4. Se muestra la interfaz web con toda la información

### 3. Visualización

La página pública muestra:

- ✅ Información de la receta (folio, fecha)
- ✅ Datos del paciente (nombre, edad, fecha de consulta)
- ✅ Diagnóstico (código y descripción CIE-11)
- ✅ Lista completa de medicamentos
- ✅ Indicaciones y dosis de cada medicamento
- ✅ **Estado de surtimientos**:
  - Surtimientos completados (con fechas)
  - Próximo resurtimiento pendiente
  - Barra de progreso visual
  - Fecha aproximada del siguiente surtimiento

## 🎨 Características de la Interfaz

### Diseño Responsivo
- Optimizado para móviles (donde se escanea el QR)
- Gradientes modernos y profesionales
- Iconos intuitivos para cada sección

### Información de Surtimientos
- **Completados**: Fondo verde con ✅
- **Próximo pendiente**: Fondo amarillo con ⏳
- **Barra de progreso**: Visual del % completado
- **Fechas aproximadas**: Para planificar resurtimientos

### Seguridad Visual
- Watermark de confidencialidad
- Fecha de expiración del enlace
- Advertencia de no compartir

## 📁 Archivos Creados/Modificados

### Nuevos Archivos

1. **`database/CREATE_TABLE_recetas_acceso_publico.sql`**
   - Tabla para tokens de acceso público
   - Función para limpiar tokens expirados

2. **`src/lib/receta-token.ts`**
   - Funciones para generar tokens
   - Funciones para validar y obtener recetas
   - Funciones para desactivar tokens

3. **`src/app/r/[token]/page.tsx`**
   - Ruta pública (sin autenticación)
   - Server component para SSR
   - Metadata dinámica para SEO

4. **`src/app/r/[token]/not-found.tsx`**
   - Página 404 personalizada
   - Información útil sobre errores

5. **`src/components/recetas/RecetaPublicaView.tsx`**
   - Componente de visualización profesional
   - Interfaz moderna y responsiva
   - Gestión completa de surtimientos

### Archivos Modificados

1. **`src/lib/generar-receta-pdf.ts`**
   - Importación de librería QR
   - Función `generarCodigoQR()`
   - Interfaz `DatosConsulta` actualizada (campo `qrUrl`)
   - Lógica para dibujar QR en copia del paciente

2. **`src/app/api/recetas/generar-pdf/[id_receta]/route.ts`**
   - Generación automática de token
   - Construcción de URL del QR
   - Paso de URL al generador de PDF

3. **`package.json`**
   - Agregadas dependencias: `qrcode`, `@types/qrcode`

4. **`.env.local.example`**
   - Nueva variable: `NEXT_PUBLIC_BASE_URL`

## 🧪 Testing

### Probar flujo completo:

1. **Generar una receta**:
   ```
   GET /api/recetas/generar-pdf/[id_receta]
   ```

2. **Verificar que el PDF incluye el QR** en la copia del paciente

3. **Escanear el QR** con un celular o acceder directamente a la URL

4. **Verificar que muestra toda la información** correctamente

### Probar casos de error:

1. **Token inválido**:
   ```
   GET /r/token-invalido-123
   ```
   Debe mostrar página 404 personalizada

2. **Token expirado**:
   - Modificar manualmente `fecha_expiracion` en BD
   - Verificar que muestra 404

## 🔧 Mantenimiento

### Limpiar tokens expirados

Ejecutar periódicamente (ej: cron job mensual):

```sql
SELECT limpiar_tokens_expirados();
```

Esto desactiva (no elimina) tokens expirados para mantener auditoría.

### Consultar estadísticas

```sql
-- Total de tokens generados
SELECT COUNT(*) FROM recetas_acceso_publico;

-- Tokens activos
SELECT COUNT(*) FROM recetas_acceso_publico WHERE activo = true;

-- Tokens más visitados
SELECT id_receta, visitas, ultima_visita
FROM recetas_acceso_publico
ORDER BY visitas DESC
LIMIT 10;
```

### Desactivar un token manualmente

```sql
UPDATE recetas_acceso_publico
SET activo = false
WHERE token = 'uuid-del-token';
```

## 🎯 Roadmap Futuro (Opcional)

- [ ] Rate limiting por IP (evitar scraping)
- [ ] Notificación al médico cuando se visualiza
- [ ] Opción para imprimir desde la web
- [ ] Historial de visualizaciones detallado
- [ ] Traducción a otros idiomas

## 📞 Soporte

Para dudas o problemas, contactar al equipo de desarrollo.

---

**Sistema Médico SJR 2.0** • Generado el 19/12/2025
