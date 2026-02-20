# Skill: Productividad Avanzada (Recordatorios, Secuencias, Dashboard)

**Proposito**: Modulos de productividad del operador: recordatorios con snooze, secuencias de follow-up automaticas, dashboard KPIs, historial de acciones, notas por carga, acciones contextuales y reporte de turno.

**Version**: 1.0.0 | **Ultima actualizacion**: 2026-02-16

---

## Archivos Relevantes

| Archivo | Rol | Lineas |
|---------|-----|--------|
| `src/extension/reminders.js` | Recordatorios con snooze (logica pura) | ~140 |
| `src/extension/sequences.js` | Secuencias follow-up (logica pura) | ~185 |
| `src/extension/dashboard.js` | KPIs turno y grafico semanal (logica pura) | ~115 |
| `src/extension/action-log.js` | Historial acciones por carga (logica pura) | ~97 |
| `src/extension/shift-report.js` | Reporte fin de turno (logica pura) | ~76 |
| `src/extension/notes.js` | Notas rapidas por carga (logica pura) | ~90 |
| `src/extension/action-bar.js` | Acciones contextuales por fase (logica pura) | ~70 |
| `src/extension/background.js` | Orquestador: alarmas Chrome, evaluacion periodica | - |

**Tests** (`tests/TDD/unit/`): test_reminders (42), test_sequences (26), test_dashboard (10), test_action_log (15), test_shift_report (11), test_notes (30), test_action_bar (27) — Total: 161 tests

---

## Patron Comun: Logica Pura Dual-Compat

Todos los modulos siguen el mismo patron:
- Sin DOM, sin Chrome API, sin dependencias externas
- Funciones puras que reciben datos y retornan resultados
- Exportacion dual GAS/Node: `if (typeof module !== 'undefined') module.exports = {...}`
- Constantes temporales desde `constants.js` (MS_POR_HORA, MS_POR_DIA, etc.)
- Fechas desde `date-utils.js` (esMismoDia, inicioDelDia, mananaPorLaManana, etc.)

## 1. Recordatorios (reminders.js)

### API Publica

| Funcion | Parametros | Retorna |
|---------|-----------|---------|
| `crearRecordatorio` | texto, codCar, preset, ahora, listaExistente | Objeto recordatorio |
| `eliminarRecordatorio` | id, lista | Lista filtrada |
| `completarRecordatorio` | id, lista | Lista filtrada (alias eliminar) |
| `obtenerActivos` | lista, ahora | Lista ordenada por fechaDisparo (futuros) |
| `aplicarSnooze` | id, preset, lista, ahora | Lista con fechaDisparo recalculada |
| `evaluarPendientes` | lista, ahora | Lista de vencidos (fechaDisparo <= ahora) |
| `generarSugerencia` | fase, config | `{texto, horasAntes}` o null |
| `aceptarSugerencia` | sugerencia, codCar, ahora | Objeto recordatorio con origen='sugerido' |
| `calcularFechaDisparo` | preset, ahora | ISO string |

### Presets y Sugerencias

- **PRESETS**: `15min(15), 30min(30), 1h(60), 2h(120), 4h(240), manana(-1→mananaPorLaManana())`
- **SUGERENCIAS_POR_FASE**: `'19'→{Verificar descarga, 8h}`, `'29'→{Reclamar POD, 24h}`
- Activacion: `config.recordatorios.sugerenciasActivadas = true`

### Estructura Recordatorio

```javascript
{ id: 'rec_...', codCar: '12345', texto: 'Verificar descarga',
  fechaCreacion: ISO, fechaDisparo: ISO, snoozeCount: 0, origen: 'manual'|'sugerido' }
```

### Storage y Background

- `tarealog_recordatorios`: Array de recordatorios activos
- `tarealog_recordatorios_vencidos`: Temporal para vencidos pendientes de notificacion
- `ALARM_RECORDATORIOS`: Cada 1 minuto, llama `verificarRecordatorios` en background.js
- Limite: `MAX_RECORDATORIOS` (desde constants.js)

## 2. Secuencias (sequences.js)

### API Publica

| Funcion | Parametros | Retorna |
|---------|-----------|---------|
| `crearSecuencia` | codCar, threadId, nombre, pasos, ahora | Objeto secuencia |
| `evaluarPasos` | almacen, ahora | Array de `{secuenciaId, codCar, threadId, paso}` listos |
| `detenerSecuencia` | seq | Secuencia con estado DETENIDA |
| `cancelarSecuencia` | seq | Secuencia con estado CANCELADA |
| `obtenerSecuenciasActivas` | almacen | Array filtrado por ACTIVA |
| `obtenerPredefinida` | nombre | `{pasos: [...]}` o null |

### Secuencias Predefinidas

| Nombre | Paso 1 (0h) | Paso 2 | Paso 3 |
|--------|-------------|--------|--------|
| Reclamar POD | Solicitud docs descarga | Recordatorio (72h) | Escalado (168h) |
| Confirmar carga | Consulta hora carga | Recordatorio (24h) | Urgente (48h) |
| Seguimiento incidencia | Solicitar detalle | Recordatorio (24h) | Escalar (72h) |

### Estados

```javascript
var ESTADOS_SECUENCIA = { ACTIVA, COMPLETADA, DETENIDA, CANCELADA };
var ESTADOS_PASO = { PENDIENTE, EJECUTADO, DETENIDO, CANCELADO };
```

### Storage y Background

- `tarealog_secuencias`: Array de secuencias
- `ALARM_SECUENCIAS`: Cada 15 minutos, llama `verificarSecuencias` en background.js
- Validaciones: codCar numerico, threadId obligatorio, max `MAX_PASOS_SECUENCIA` pasos

---

## 3. Dashboard (dashboard.js)

### API Publica

| Funcion | Parametros | Retorna |
|---------|-----------|---------|
| `calcularKPIsTurno` | registros, alertas, recordatorios, ahora | KPIs completos |
| `calcularGraficoSemanal` | registros, ahora | Array 7 dias `{dia, fecha, conteo}` |
| `calcularCargasPorGrupo` | registros | Mapa grupo→conteo |

### Estructura KPIs

```javascript
{ activas: N, porGrupo: {espera,carga,en_ruta,descarga,vacio,incidencia,sin_fase},
  alertasUrgentes: N, recordatoriosHoy: N, cerradasHoy: N, cerradasSemana: N }
```

### Grupos de Fase (compartido con action-bar.js)

```javascript
{ '00-02': 'espera', '05,25': 'incidencia', '11-12': 'carga',
  '19': 'en_ruta', '21-22': 'descarga', '29': 'vacio' }
```

Cerrado: `estado === 'GESTIONADO' && fase === '30'`

---

## 4. Historial (action-log.js)

### API Publica

| Funcion | Parametros | Retorna |
|---------|-----------|---------|
| `registrarAccion` | tipo, codCar, descripcion, almacen, ahora | `{almacen, entrada}` |
| `obtenerHistorial` | codCar, almacen | Array ordenado desc por fecha |
| `filtrarPorTipo` | historial, tipo | Array filtrado |
| `rotarHistorial` | almacen, diasMax, ahora | Almacen sin entradas antiguas |

### Tipos y Limites

```javascript
var TIPOS_ACCION = ['EMAIL', 'FASE', 'RECORDATORIO', 'NOTA'];
var MAX_ENTRADAS_POR_CARGA = 200;
```

### Storage

- `tarealog_historial`: Mapa `{ codCar: [entrada, entrada, ...] }`
- Patron inmutable: `registrarAccion` retorna `{almacen, entrada}` sin mutar original

---

## 5. Notas (notes.js)

### API Publica

| Funcion | Parametros | Retorna |
|---------|-----------|---------|
| `crearNota` | texto, codCar, almacen, ahora | `{almacen, nota}` (inmutable) |
| `obtenerNotas` | codCar, almacen | Array ordenado desc por fecha |
| `eliminarNota` | id, codCar, almacen | Nuevo almacen |
| `contarNotas` | codCar, almacen | Numero |
| `tieneNotas` | codCar, almacen | Boolean |

### Storage y Limites

- `tarealog_notas`: Mapa `{ codCar: [nota, nota, ...] }`
- Limite: `MAX_NOTAS_POR_CARGA = 50`
- Patron inmutable: crearNota copia almacen, no muta original

---

## 6. Acciones Contextuales (action-bar.js)

### API Publica

| Funcion | Parametros | Retorna |
|---------|-----------|---------|
| `obtenerAccionesPorFase` | codigoFase | Array de acciones o [] |
| `obtenerGrupoFase` | codigoFase | String grupo o null |

### Mapa Acciones por Grupo

| Grupo | Acciones |
|-------|----------|
| espera | Confirmar hora carga, Retrasar carga |
| carga | Solicitar posicion, Avisar destino |
| en_ruta | Verificar ETA, Avisar destino |
| descarga | Confirmar descarga (→fase 29) |
| vacio | Reclamar POD, Marcar documentado (→fase 30) |
| incidencia | Solicitar detalle, Escalar responsable |

Cada accion: `{etiqueta, faseSiguiente, plantilla}` — plantilla es nombre de plantilla de respuesta o null.

---

## 7. Reporte de Turno (shift-report.js)

### API Publica

| Funcion | Parametros | Retorna |
|---------|-----------|---------|
| `generarDatosReporte` | registros, alertas, recordatorios, ahora | Datos completos |
| `calcularKPIsDia` | registros, ahora | `{cerradas, emailsEnviados}` |
| `esMismoDia` | fecha1, fecha2 | Boolean |

### Estructura Reporte

```javascript
{ fecha: ISO, cargasGestionadas: N, incidenciasActivas: N,
  recordatoriosPendientes: N, kpis: {cerradas, emailsEnviados} }
```

Config: `config.reporteTurno = { activado: true, hora: '18:00' }`

---

## Consideraciones para Agentes

1. **Logica pura**: Ningun modulo accede a Chrome API ni DOM
2. **Tests primero**: TDD obligatorio. Tests en `tests/TDD/unit/`
3. **Inmutabilidad**: notes.js y action-log.js retornan `{almacen, dato}` sin mutar
4. **Constantes centralizadas**: Usar `constants.js` (MAX_*, MS_POR_*)
5. **Fechas centralizadas**: Usar `date-utils.js` (esMismoDia, inicioDelDia, etc.)
6. **Background.js**: Solo orquesta; no poner logica de negocio ahi
7. **Storage keys**: Prefijo `tarealog_` obligatorio para todo
8. **Validaciones**: codCar numerico, textos no vacios, limites respetados

---

## Referencias

- **Diccionario**: `docs/DICCIONARIO_DOMINIO.md` §Fases, §Estados
- **Alertas**: `.claude/skills/alertas-proactivas.md` (complementario)
- **Config defaults**: `src/extension/config.js` §recordatorios, §secuencias, §reporteTurno
- **Constantes**: `src/extension/constants.js`
- **Fechas**: `src/extension/date-utils.js`

---

**Generada por Claude Code**
