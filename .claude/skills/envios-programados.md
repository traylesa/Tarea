# Skill: Envios Programados

**Proposito**: Guia para el sistema de cola de envios programados: creacion, edicion, reactivacion de errores, envio manual/automatico, horario laboral y sincronizacion con GAS.

**Version**: 1.2.0 | **Ultima actualizacion**: 2026-02-25

---

## Contexto del Proyecto

TareaLog permite programar envios de email para una fecha/hora futura. Los envios se almacenan en hoja PROGRAMADOS de Google Sheets y se procesan automaticamente por un trigger GAS cada 5 minutos (solo en horario laboral).

### Archivos Relevantes

| Archivo | Rol |
|---------|-----|
| `src/extension/scheduled.js` | Logica pura: estados, filtrado, ordenacion, validacion, esEditable (sin DOM) |
| `src/extension/panel-programados.js` | UI extension: panel colapsable, tabla, modal edicion, horario |
| `src/extension/panel.js` | Integra boton programados + icono en columna tabla |
| `src/movil/js/views/programados.js` | UI PWA movil: lista, editor BottomSheet, retry |
| `src/gas/Codigo.js` | Endpoints: programarEnvio, cancelar, editar, enviarAhora, getProgramados |
| `src/gas/AdaptadorHojas.js` | CRUD hoja PROGRAMADOS (guardar, leer, actualizar) |
| `src/gas/AdaptadorGmail.js` | enviarRespuesta: prioriza destinatarios.to explicito |
| `src/gas/Configuracion.js` | HEADERS_PROGRAMADOS, HOJA_PROGRAMADOS, horario laboral |
| `tests/TDD/unit/test_scheduled.js` | Tests unitarios logica pura |

### Referencia: `docs/DICCIONARIO_DOMINIO.md`

Consultar seccion **programados** para campos y estados.

---

## Implementacion Principal

### Ciclo de Vida de un Envio Programado

```
PENDIENTE → ENVIADO    (trigger automatico o "Enviar ahora")
PENDIENTE → CANCELADO  (usuario cancela)
PENDIENTE → ERROR      (fallo de envio: destinatario no resuelto, timeout, etc.)
ERROR     → PENDIENTE  (reactivacion automatica al guardar cambios)
ERROR     → ENVIADO    (envio directo con "Enviar ahora")
```

**PENDIENTE y ERROR son editables**. Al guardar cambios en un ERROR, el backend lo reactiva automaticamente a PENDIENTE.

### Editabilidad (scheduled.js)

```javascript
function esEditable(prog) {
  return !!(prog && (prog.estado === 'PENDIENTE' || prog.estado === 'ERROR'));
}
```

### Estructura de Registro (hoja PROGRAMADOS)

```javascript
// Configuracion.js
const HEADERS_PROGRAMADOS = [
  'id', 'threadId', 'interlocutor', 'asunto', 'cuerpo',
  'cc', 'bcc', 'fechaProgramada', 'estado',
  'fechaEnvio', 'errorDetalle', 'creadoPor', 'creadoAt'
];
```

### Endpoints GAS

| Metodo | Action | Descripcion |
|--------|--------|-------------|
| GET | `getProgramados` | Lista todos los programados |
| GET | `getHorarioLaboral` | Horario laboral actual |
| POST | `programarEnvio` | Crea nuevo programado |
| POST | `cancelarProgramado` | Cancela (solo PENDIENTE) |
| POST | `actualizarProgramadoCampos` | Edita campos (PENDIENTE o ERROR). ERROR → PENDIENTE auto |
| POST | `enviarProgramadoAhora` | Envio inmediato (PENDIENTE o ERROR) |
| POST | `guardarHorarioLaboral` | Configura dias y horas |

### Horario Laboral

```javascript
var HORARIO_LABORAL_DEFAULT = {
  dias: [1, 2, 3, 4, 5],  // lunes=1 a viernes=5
  horaInicio: 7,
  horaFin: 21
};
```

El trigger `ejecutarBarridoProgramado` (cada 5 min) llama a `_procesarColaProgramados()` que verifica `estaEnHorarioLaboral()` antes de enviar.

---

## UI Extension Chrome (panel-programados.js)

### Tabla de programados

- PENDIENTE: boton "Cancelar" en fila
- ERROR: boton "Editar" en fila (abre modal editable)
- Click en cualquier fila abre modal detalle

### Modal detalle/edicion

- Titulo cambia segun `esEditable()`: "Editar" vs "Detalle"
- Campos editables: asunto, cuerpo (textarea), cc, bcc, fechaProgramada
- Error visible: `prog-error-detalle` (fondo rojo con mensaje del error)
- Botones PENDIENTE/ERROR: Guardar | Enviar ahora | Cancelar envio
- Botones ENVIADO/CANCELADO: solo Cerrar (readonly)

### Reactivacion desde ERROR

1. Click "Editar" en tabla → modal editable con error visible
2. Corregir campos → "Guardar" → backend cambia estado a PENDIENTE
3. O directamente "Enviar ahora" → envio inmediato sin esperar trigger

## UI PWA Movil (views/programados.js)

- PENDIENTE: 3 botones (Editar | Enviar ya | X cancelar)
- ERROR: boton Reintentar + detalle error
- Editor via BottomSheet: asunto, cuerpo, fechaProgramada editables

---

## Patrones Recomendados

### Patron 1: Logica Pura en scheduled.js

```javascript
function validarEdicionProgramado(cambios) {
  var claves = Object.keys(cambios);
  for (var i = 0; i < claves.length; i++) {
    if (CAMPOS_EDITABLES_PROG.indexOf(claves[i]) === -1) {
      return { valido: false, error: 'Campo no editable: ' + claves[i] };
    }
  }
  return { valido: true };
}
// CAMPOS_EDITABLES_PROG = ['asunto', 'cuerpo', 'cc', 'bcc', 'fechaProgramada']
```

### Patron 2: Rate Limiting en Cola

```javascript
// Codigo.js — _procesarColaProgramados respeta rate limit
var epm = parseInt(props.getProperty('EMAILS_POR_MINUTO') || '10', 10);
var pausaMs = Math.ceil(60000 / Math.min(Math.max(epm, 1), 30));
```

### Patron 3: Reactivacion automatica en backend

```javascript
// Codigo.js — accionActualizarProgramadoCampos
var campos = body.campos;
if (prog.estado === 'ERROR') campos.estado = 'PENDIENTE';
actualizarProgramadoPorId(body.id, campos);
```

### Patron 4: Destinatarios explicitos (fix v0.4.0)

`enviarRespuesta` en AdaptadorGmail.js prioriza `destinatarios.to` explicito. Solo busca en thread si no hay TO explícito. Esto evita errores "retorno null" cuando el usuario fue el ultimo remitente.

---

## Errores Comunes a Evitar

### Error 1: Enviar fuera de horario

El trigger procesa solo en horario laboral. "Enviar ahora" NO verifica horario.

### Error 2: No verificar estado antes de editar

```javascript
// Backend acepta PENDIENTE y ERROR, rechaza el resto
if (prog.estado !== 'PENDIENTE' && prog.estado !== 'ERROR') {
  return respuestaError('Solo se pueden editar envios PENDIENTE o ERROR');
}
```

### Error 3: enviarRespuesta retorna null

Causa: destinatarios.to no contiene emails validos o todos son propios. Verificar que `interlocutor` se pasa correctamente al programar.

---

## Consideraciones para Agentes

1. **Antes de modificar**: Leer `scheduled.js` + `panel-programados.js` + endpoints en `Codigo.js`
2. **Durante implementacion**: Mantener dual-compat en `scheduled.js`, DOM solo en `panel-programados.js`
3. **Despues de cambios**: Ejecutar `npx jest tests/TDD/unit/test_scheduled.js`
4. **Precauciones**: No modificar `HEADERS_PROGRAMADOS` sin considerar auto-sync de headers en hoja
5. **Sincronizar movil**: Cambios en logica pura → copiar a `src/movil/lib/`

---

## Tests

```bash
npx jest tests/TDD/unit/test_scheduled.js --no-coverage
```

Cubren: estados, filtrado, ordenacion, validacion edicion, busqueda por thread, editabilidad ERROR.

---

## Coordinacion con Otros Skills

| Necesitas... | Consulta skill... |
|---|---|
| Desplegar cambios GAS | `gas-deploy.md` (clasp push/deploy) |
| CRUD hoja PROGRAMADOS | `sheets-database.md` (auto-sync headers) |
| Regla PRESELECCIONAR_PLANTILLA | `motor-reglas-acciones.md` (programarEnvio: true) |
| Config horario laboral | `sistema-configuracion.md` (sync GAS) |
| UI PWA movil | `pwa-mobile-development.md` (BottomSheet, feedback) |
| Patron module.exports | `dual-compat-modules.md` (scheduled.js) |

---

**Actualizada**: 2026-02-25 (v1.2.0: ERROR editable + reactivacion automatica)
