# 04 - DISEÑO TÉCNICO

**Fase:** Diseño Detallado
**Expediente:** OPTIMIZA_TareaLog_Copiloto_5Sprint_20260215_191208

---

## Arquitectura

```
panel.html (script tags)
  ├── dashboard.js      ← NUEVO: lógica pura KPIs
  ├── action-log.js     ← NUEVO: lógica pura historial
  ├── sequences.js      ← NUEVO: lógica pura secuencias
  ├── shift-report.js   ← NUEVO: lógica pura reporte
  ├── action-bar.js     ← EXISTENTE (integrar en UI)
  ├── notes.js          ← EXISTENTE (integrar en UI)
  └── panel.js          ← MOD: hooks a módulos nuevos

background.js
  ├── importScripts('sequences.js')
  ├── importScripts('shift-report.js')
  ├── ALARM_SECUENCIAS (15 min, reutiliza barrido)
  └── ALARM_REPORTE (60 min, reutiliza matutino)
```

---

## Modelo de Datos (DICCIONARIO_DOMINIO)

### ENTRADA_HISTORIAL (NUEVA)
Entrada de acción en el historial de una carga.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | ID único (hist_timestamp_random) |
| `codCar` | number | Código de carga |
| `tipo` | enum(TIPO_ACCION) | Tipo de acción |
| `descripcion` | string | Texto descriptivo |
| `fechaCreacion` | string (ISO) | Timestamp |

### TIPO_ACCION (NUEVO enum)
- `EMAIL` - Email enviado/recibido
- `FASE` - Cambio de fase
- `RECORDATORIO` - Recordatorio creado/completado
- `NOTA` - Nota añadida

### SECUENCIA_FOLLOWUP (NUEVA)
Secuencia de emails automática para reclamar documentos.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | string | ID único (seq_timestamp_random) |
| `codCar` | number | Código de carga |
| `threadId` | string | ID hilo Gmail |
| `nombre` | string | Nombre predefinido (ej: "Reclamar POD") |
| `estado` | enum(ESTADO_SECUENCIA) | Estado global |
| `pasos` | array(PASO_SECUENCIA) | Pasos de la secuencia (max 3) |
| `fechaCreacion` | string (ISO) | Timestamp |

### PASO_SECUENCIA (NUEVO)
Paso individual de una secuencia de follow-up.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `orden` | number | 1, 2 o 3 |
| `plantilla` | string | Alias plantilla a usar |
| `horasEspera` | number | Horas desde inicio secuencia |
| `estado` | enum(ESTADO_PASO) | PENDIENTE/EJECUTADO/DETENIDO/CANCELADO |
| `fechaProgramada` | string (ISO) | Fecha para ejecutar |

### ESTADO_SECUENCIA (NUEVO enum)
- `ACTIVA` - Secuencia en curso
- `COMPLETADA` - Todos los pasos ejecutados
- `DETENIDA` - Detenida por respuesta recibida
- `CANCELADA` - Cancelada manualmente

### ESTADO_PASO (NUEVO enum)
- `PENDIENTE` - Esperando ejecución
- `EJECUTADO` - Email enviado
- `DETENIDO` - Detenido por respuesta
- `CANCELADO` - Cancelado por usuario

### DATOS_REPORTE_TURNO (NUEVO)
Estructura retornada por generarDatosReporte.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `fecha` | string (ISO) | Fecha del reporte |
| `cargasGestionadas` | number | Cargas con estado GESTIONADO hoy |
| `incidenciasActivas` | number | Cargas con fase 05/25 |
| `recordatoriosPendientes` | number | Recordatorios para mañana |
| `kpis` | object | { cerradas, emailsEnviados } |

### Storage Keys Nuevas

| Clave | Tipo | Descripción |
|-------|------|-------------|
| `tarealog_historial` | object | Mapa `{ [codCar]: ENTRADA_HISTORIAL[] }` |
| `tarealog_secuencias` | array(SECUENCIA_FOLLOWUP) | Secuencias activas |

### Secuencias Predefinidas

| Nombre | Paso 1 | Paso 2 | Paso 3 |
|--------|--------|--------|--------|
| Reclamar POD | "Solicitud docs descarga" (0h) | "Recordatorio docs pendientes" (72h) | "Escalado" (168h) |
| Confirmar carga | "Consulta hora carga" (0h) | "Recordatorio carga" (24h) | "Urgente: confirmar" (48h) |
| Seguimiento incidencia | "Solicitar detalle" (0h) | "Recordatorio incidencia" (24h) | "Escalar incidencia" (72h) |

---

## Interfaces Públicas

### dashboard.js
```javascript
calcularKPIsTurno(registros, alertas, recordatorios, ahora)
  → { activas, porGrupo, alertasUrgentes, recordatoriosHoy, cerradasHoy, cerradasSemana }

calcularGraficoSemanal(registros, ahora)
  → [{ dia, fecha, conteo }] // 7 elementos

calcularCargasPorGrupo(registros)
  → { espera, carga, en_ruta, descarga, vacio, incidencia }
```

### action-log.js
```javascript
registrarAccion(tipo, codCar, descripcion, almacen, ahora)
  → { almacen, entrada }  // Patrón inmutable como notes.js

obtenerHistorial(codCar, almacen)
  → ENTRADA_HISTORIAL[]  // Ordenado DESC

filtrarPorTipo(historial, tipo)
  → ENTRADA_HISTORIAL[]

rotarHistorial(almacen, diasMax, ahora)
  → almacen  // Sin entradas > diasMax
```

### sequences.js
```javascript
crearSecuencia(nombre, codCar, threadId, pasos, ahora)
  → SECUENCIA_FOLLOWUP

evaluarPasos(secuencia, ahora)
  → PASO_SECUENCIA[]  // Pasos que toca ejecutar

detenerSecuencia(secuencia)
  → SECUENCIA_FOLLOWUP  // Estado DETENIDA, pasos pendientes → DETENIDO

cancelarSecuencia(secuencia)
  → SECUENCIA_FOLLOWUP  // Estado CANCELADA

obtenerSecuenciasActivas(lista)
  → SECUENCIA_FOLLOWUP[]

obtenerPredefinida(nombre, ahora)
  → { nombre, pasos: PASO_SECUENCIA[] }

SECUENCIAS_PREDEFINIDAS  // Map nombre → config
MAX_PASOS = 3
```

### shift-report.js
```javascript
generarDatosReporte(registros, alertas, recordatorios, ahora)
  → DATOS_REPORTE_TURNO

calcularKPIsDia(registros, ahora)
  → { cerradas, emailsEnviados }

esMismoDia(fecha1, fecha2)
  → boolean
```

---

## Flujos de Ejecución

### Flujo Dashboard
1. panel.js carga registros → llama `calcularKPIsTurno()`
2. Renderiza KPIs + gráfico en widget colapsable
3. Botón "Empezar gestión" aplica filtro estado != GESTIONADO

### Flujo Historial
1. Cada acción en panel.js (email, fase, nota) llama `registrarAccion()`
2. Al expandir carga, llama `obtenerHistorial()` y renderiza cronología
3. background.js ejecuta `rotarHistorial()` periódicamente

### Flujo Secuencia
1. Operador selecciona predefinida y lanza secuencia
2. `crearSecuencia()` genera pasos con fechas
3. background.js evalúa pasos cada barrido
4. Si hay respuesta en threadId → `detenerSecuencia()`

### Flujo Reporte
1. Alarma matutina extendida para verificar hora reporte
2. `generarDatosReporte()` calcula datos
3. Ventana popup con datos formateados

---

## Checklist

- [x] Arquitectura clara y documentada
- [x] Todos los nombres definidos para DICCIONARIO_DOMINIO
- [x] Interfaces públicas definidas
- [x] Flujos críticos documentados
- [x] Validaciones especificadas (max pasos, rotación)

## PUERTA DE VALIDACIÓN 4: ✅ SUPERADA

- [x] Nombres preparados para docs/DICCIONARIO_DOMINIO.md
- [x] Modelos coherentes con arquitectura existente
- [x] Interfaces definidas

**Estado:** COMPLETADO
