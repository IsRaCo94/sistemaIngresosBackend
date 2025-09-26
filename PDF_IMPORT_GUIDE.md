# Guía de Importación de PDF - Sistema de Ingresos

## Descripción
El sistema ahora permite importar datos de archivos PDF directamente a la base de datos de ingresos. El sistema detecta automáticamente si el PDF contiene formularios (AcroForm) o es texto plano, y extrae los datos correspondientes.

## Endpoint de Extracción de Datos

### GET `/api/ingresos/import-pdf`

**Descripción:** Extrae datos de un archivo PDF sin guardarlos en la base de datos. Ideal para llenar formularios en el frontend.

**Parámetros:**
- `file` (multipart/form-data): Archivo PDF a procesar

**Respuesta:**
- `200`: Datos extraídos exitosamente (objeto con los campos extraídos)
- `400`: Error en el archivo o datos faltantes
- `500`: Error interno del servidor

**Uso:** Este endpoint solo extrae los datos del PDF y los devuelve para que el frontend los use en un formulario. Para guardar los datos, usar el endpoint `POST /api/ingresos` con los datos extraídos.

## Flujo de Trabajo con Frontend

### 1. Extraer Datos del PDF
```javascript
// Usuario selecciona archivo PDF
const fileInput = document.getElementById('pdfFile');
const file = fileInput.files[0];

// Extraer datos del PDF
const formData = new FormData();
formData.append('file', file);

fetch('/api/ingresos/import-pdf', {
  method: 'GET',
  body: formData
})
.then(response => response.json())
.then(data => {
  // Llenar formulario con datos extraídos
  fillFormWithExtractedData(data);
})
.catch(error => console.error('Error:', error));
```

### 2. Llenar Formulario
```javascript
function fillFormWithExtractedData(data) {
  // Mapear datos extraídos a campos del formulario
  document.getElementById('num_factura').value = data.num_factura || '';
  document.getElementById('fecha').value = formatDateForInput(data.fecha) || '';
  document.getElementById('nit').value = data.nit || '';
  document.getElementById('proveedor').value = data.proveedor || '';
  document.getElementById('monto').value = data.monto || '';
  document.getElementById('lugar').value = data.lugar || '';
  document.getElementById('detalle').value = data.detalle || '';
  // ... otros campos según necesidad
}

function formatDateForInput(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
}
```

### 3. Guardar Datos (cuando el usuario confirme)
```javascript
// Usuario revisa y modifica los datos en el formulario
// Luego envía el formulario para guardar
const formData = new FormData(formElement);

fetch('/api/ingresos', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => {
  console.log('Ingreso guardado:', data);
  // Mostrar mensaje de éxito
})
.catch(error => console.error('Error:', error));
```

## Tipos de PDF Soportados

### 1. PDF con Formularios (AcroForm)
El sistema busca campos con los siguientes nombres (case-insensitive):

**Campos Básicos:**
- `LUGAR`, `lugar` → se guarda en `lugar`
- `NOMBRE`, `RAZON_SOCIAL`, `PROVEEDOR` → se guarda en `proveedor`
- `DETALLE`, `detalle`, `CONCEPTO` → se guarda en `detalle`
- `TIPO_INGRESO`, `tipo_ingres`, `TIPO` → se guarda en `tipo_ingres`
- `SERVICIO`, `servicio` → se guarda en `servicio`
- `NOMBRE`, `RAZON_SOCIAL` → se guarda en `nombre`

**Campos Numéricos:**
- `MONTO_A_PAGAR`, `MONTO`, `monto`, `IMPORTE` → se guarda en `monto`
- `IMPORTE_TOTAL`, `importe_total`, `TOTAL` → se guarda en `importe_total`
- `NUM_RECIBO`, `num_recibo`, `RECIBO` → se guarda en `num_recibo`
- `NUM_DEPO`, `num_depo`, `DEPOSITO` → se guarda en `num_depo`
- `FACTURA_N`, `FACTURA`, `num_factura`, `FACTURA_NUMERO` → se guarda en `num_factura`
- `NIT`, `CI`, `CEX`, `NIT_CI_CEX`, `nit` → se guarda en `nit`

**Campos de Fecha:**
- `FECHA`, `fecha` → se guarda en `fecha`

**Campos Adicionales:**
- `COD_PROVE`, `cod_prove`, `CODIGO` → se guarda en `cod_prove`
- `CUENTA`, `cuenta` → se guarda en `cuenta`

### 2. PDF de Texto Plano
El sistema usa expresiones regulares para extraer datos del texto:

**Patrones Soportados:**
- `Lugar: [valor]` o `Ubicación: [valor]` → se guarda en `lugar`
- `Nombre: [valor]` o `Razón Social: [valor]` o `Proveedor: [valor]` o `Cliente: [valor]` → se guarda en `proveedor`
- `Detalle: [valor]` o `Concepto: [valor]` o `Descripción: [valor]` → se guarda en `detalle`
- `Tipo: [valor]` o `Categoría: [valor]` → se guarda en `tipo_ingres`
- `Servicio: [valor]` → se guarda en `servicio`
- `MONTO A PAGAR Bs: [valor]` o `Monto a Pagar: [valor]` o `Monto: [valor]` o `Importe: [valor]` o `Total: [valor]` → se guarda en `monto`
- `Recibo: [número]` o `Número: [número]` → se guarda en `num_recibo`
- `Depósito: [número]` → se guarda en `num_depo`
- `FACTURA N°: [número]` o `Factura N°: [número]` o `Factura: [número]` o `N°: [número]` → se guarda en `num_factura`
- `Fecha: [fecha]` → se guarda en `fecha`
- `Código: [valor]` → se guarda en `cod_prove`
- `NIT/CI/CEX: [número]` o `NIT: [número]` o `CI: [número]` o `CEX: [número]` → se guarda en `nit`
- `Cuenta: [valor]` → se guarda en `cuenta`

## Ejemplo de Uso

### Con cURL:
```bash
curl -X GET \
  http://localhost:3000/api/ingresos/import-pdf \
  -H 'Content-Type: multipart/form-data' \
  -F 'file=@documento.pdf'
```

### Con JavaScript/Fetch:
```javascript
const formData = new FormData();
formData.append('file', pdfFile);

fetch('/api/ingresos/import-pdf', {
  method: 'GET',
  body: formData
})
.then(response => response.json())
.then(data => {
  console.log('Datos extraídos:', data);
  // Llenar formulario con los datos extraídos
  fillFormWithData(data);
})
.catch(error => console.error('Error:', error));

// Función para llenar el formulario
function fillFormWithData(data) {
  document.getElementById('num_factura').value = data.num_factura || '';
  document.getElementById('fecha').value = data.fecha || '';
  document.getElementById('nit').value = data.nit || '';
  document.getElementById('proveedor').value = data.proveedor || '';
  document.getElementById('monto').value = data.monto || '';
  // ... otros campos
}
```

### Con Postman:
1. Seleccionar método GET
2. URL: `http://localhost:3000/api/ingresos/import-pdf`
3. En Body, seleccionar `form-data`
4. Agregar clave `file` de tipo `File`
5. Seleccionar el archivo PDF
6. Enviar la petición

## Validaciones

### Campos Requeridos:
- `lugar`
- `proveedor`
- `detalle`
- `monto`

### Validaciones Automáticas:
- Solo se aceptan archivos PDF (máximo 10MB)
- Los números se parsean automáticamente (soporta separadores de miles y comas decimales)
- Las fechas se parsean en múltiples formatos (DD/MM/YYYY, YYYY/MM/DD, etc.)
- Los campos faltantes se marcan como `undefined` en lugar de causar errores

## Valores por Defecto

Para importaciones de PDF, el sistema asigna automáticamente:
- `estado`: 'PENDIENTE'
- `cerrado`: 'N'
- `baja`: false
- `op_tipoemision`: false
- `tipo_emision`: 'DEPOSITO'
- `fecha_reg`: Fecha actual
- `fecha_edicion`: Fecha actual

## Manejo de Errores

### Errores Comunes:
- **"No se proporcionó archivo PDF"**: No se envió archivo o el campo está vacío
- **"El archivo debe ser un PDF"**: El archivo no es de tipo PDF
- **"Faltan campos requeridos"**: No se encontraron los campos obligatorios
- **"Error al procesar PDF"**: Error interno en el parseo del PDF

### Logs:
El sistema registra información detallada en la consola para debugging:
- Campos encontrados/no encontrados
- Errores de parseo específicos
- Tipo de PDF detectado (formulario vs texto)

## Limitaciones

1. **Tamaño máximo**: 10MB por archivo
2. **Formato de fecha**: Debe seguir patrones reconocidos
3. **Números**: Deben estar en formato numérico válido
4. **Texto**: Para PDFs de texto plano, el formato debe ser consistente

## Mejoras Futuras

- Soporte para OCR para PDFs escaneados
- Validación de campos específicos por tipo de ingreso
- Mapeo personalizable de campos
- Importación masiva de múltiples PDFs
- Preview de datos antes de guardar
