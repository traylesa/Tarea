# Skill: Productividad Avanzada (Recordatorios, Secuencias, Dashboard)

**Proposito**: Modulos de productividad del operador: recordatorios con snooze, secuencias de follow-up automaticas, dashboard KPIs, historial de acciones, notas por carga, acciones contextuales y reporte de turno.

**Version**: 1.2.0 | **Ultima actualizacion**: 2026-02-25

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

**Tests** (`tests/TDD/unit/`): test_reminders, test_sequences, test_dashboard, test_action_log, test_shift_report, test_notes, test_action_bar — Parte de los 878 tests totales (38 suites)

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

### Storage y Background

- `tarealog_recordatorios`: Array de recordatorios activos
- `tarealog_recordatorios_vencidos`: Temporal para vencidos pendientes de notificacion
- `ALARM_RECORDATORIOS`: Cada 1 minuto, llama `verificarRecordatorios` en background.js

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

### Storage y Background

- `tarealog_secuencias`: Array de secuencias
- `ALARM_SECUENCIAS`: Cada 15 minutos, llama `verificarSecuencias` en background.js

---

## 3. Dashboard (dashboard.js)

### API Publica

| Funcion | Parametros | Retorna |
|---------|-----------|---------|
| `calcularKPIsTurno` | registros, alertas, recordatorios, ahora | KPIs completos |
| `calcularGraficoSemanal` | registros, ahora | Array 7 dias `{dia, fecha, conteo}` |
| `calcularCargasPorGrupo` | registros | Mapa grupo→conteo |

### Grupos de Fase (compartido con action-bar.js y kanban.js)

```javascript
{ '00-02': 'espera', '05,25': 'incidencia', '11-12': 'carga',
  '19': 'en_ruta', '21-22': 'descarga', '29': 'vacio' }
```

Cerrado: `estado === 'GESTIONADO' && fase === '30'`

---

## 4. Historial (action-log.js)

| Funcion | Parametros | Retorna |
|---------|-----------|---------|
| `registrarAccion` | tipo, codCar, descripcion, almacen, ahora | `{almacen, entrada}` |
| `obtenerHistorial` | codCar, almacen | Array ordenado desc por fecha |
| `filtrarPorTipo` | historial, tipo | Array filtrado |
| `rotarHistorial` | almacen, diasMax, ahora | Almacen sin entradas antiguas |

Tipos: `['EMAIL', 'FASE', 'RECORDATORIO', 'NOTA']`. Storage: `tarealog_historial`.

---

## 5. Notas (notes.js)

| Funcion | Parametros | Retorna |
|---------|-----------|---------|
| `crearNota` | texto, codCar, almacen, ahora | `{almacen, nota}` (inmutable) |
| `obtenerNotas` | codCar, almacen | Array ordenado desc |
| `eliminarNota` | id, codCar, almacen | Nuevo almacen |
| `contarNotas` | codCar, almacen | Numero |
| `tieneNotas` | codCar, almacen | Boolean |

Storage: `tarealog_notas` (mapa `{codCar: [nota, ...]}`). Patron inmutable.

---

## 6. Acciones Contextuales (action-bar.js)

| Grupo | Acciones |
|-------|----------|
| espera | Confirmar hora carga, Retrasar carga |
| carga | Solicitar posicion, Avisar destino |
| en_ruta | Verificar ETA, Avisar destino |
| descarga | Confirmar descarga (→fase 29) |
| vacio | Reclamar POD, Marcar documentado (→fase 30) |
| incidencia | Solicitar detalle, Escalar responsable |

Cada accion: `{etiqueta, faseSiguiente, plantilla}`. Acciones sin `faseSiguiente` ni `plantilla` muestran boton "Fase" en detalle movil.

---

## 7. Reporte de Turno (shift-report.js)

| Funcion | Parametros | Retorna |
|---------|-----------|---------|
| `generarDatosReporte` | registros, alertas, recordatorios, ahora | Datos completos |
| `calcularKPIsDia` | registros, ahora | `{cerradas, emailsEnviados}` |
| `esMismoDia` | fecha1, fecha2 | Boolean |

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
8. **Sincronizar PWA**: Copiar cambios a `src/movil/lib/`

---

## Coordinacion con Otros Skills

| Necesitas... | Consulta skill... |
|---|---|
| Alertas proactivas (R2-R6) | `alertas-proactivas.md` |
| Kanban (grupos fase compartidos) | `kanban-tablero.md` |
| Config defaults y auto-migracion | `sistema-configuracion.md` |
| Motor reglas (evaluar al cambiar fase) | `motor-reglas-acciones.md` |
| Patron dual-compat | `dual-compat-modules.md` |
| Sincronizar modulos PWA | `pwa-mobile-development.md` |
| Deploy background.js | `gas-deploy.md` (no aplica, es extension) |
| Diccionario campos | `docs/DICCIONARIO_DOMINIO.md` |

---

**Actualizada**: 2026-02-25 (v1.2.0: 878 tests/38 suites, coordinacion skills)
