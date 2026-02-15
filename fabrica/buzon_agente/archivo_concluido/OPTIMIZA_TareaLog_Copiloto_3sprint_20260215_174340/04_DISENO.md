# 04 - DISENO TECNICO

**Fase:** Diseno Detallado
**Expediente:** OPTIMIZA_TareaLog_Copiloto_3sprint_20260215_174340
**Fecha:** 2026-02-15

---

## Arquitectura

```
reminders.js (LOGICA PURA — sin DOM, sin Chrome API)
├── crearRecordatorio(texto, codCar, preset, ahora) → recordatorio
├── eliminarRecordatorio(id, lista) → lista
├── completarRecordatorio(id, lista) → lista
├── obtenerActivos(lista, ahora) → lista ordenada
├── aplicarSnooze(id, preset, lista, ahora) → lista
├── calcularFechaDisparo(preset, ahora) → ISO string
├── evaluarPendientes(lista, ahora) → vencidos[]
├── generarSugerencia(fase, config) → sugerencia|null
├── aceptarSugerencia(sugerencia, codCar, ahora) → recordatorio
├── PRESETS, MAX_RECORDATORIOS, SUGERENCIAS_POR_FASE
└── module.exports (dual-compat)

background.js (INTEGRACION Chrome API)
├── ALARM_RECORDATORIOS — chrome.alarms cada 1 min
├── onAlarm → evaluarPendientes → notificar
├── onNotificationButtonClicked → snooze/completar
└── importScripts('reminders.js')

panel.js (UI)
├── Boton "Recordar" en cada fila
├── Modal: texto + presets
├── Panel "Mis recordatorios" con countdown
└── Listener cambio fase → generarSugerencia

config.js (DEFAULTS)
└── recordatorios: { sugerenciasActivadas: true }
```

---

## Modelo de Datos

### RECORDATORIO (entidad en storage)

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| `id` | string | ID unico (rec_timestamp_random) |
| `codCar` | number/null | Codigo de carga asociado |
| `texto` | string | Texto del recordatorio |
| `fechaCreacion` | string (ISO) | Timestamp creacion |
| `fechaDisparo` | string (ISO) | Cuando debe dispararse |
| `snoozeCount` | number | Veces pospuesto (default 0) |
| `origen` | string | 'manual' o 'sugerido' |

### STORAGE_KEY: `tarealog_recordatorios`
Tipo: `array(RECORDATORIO)` — Lista de recordatorios activos

### PRESETS de tiempo

| Preset | Valor | Descripcion |
|--------|-------|-------------|
| `15min` | 15 min | Snooze corto |
| `30min` | 30 min | Media hora |
| `1h` | 60 min | Una hora |
| `2h` | 120 min | Dos horas |
| `4h` | 240 min | Medio turno |
| `manana` | Siguiente dia 09:00 | Manana a primera hora |

### SUGERENCIAS por fase

| Fase | Texto sugerido | Horas |
|------|---------------|-------|
| `19` (Cargado) | "Verificar descarga" | 8h |
| `29` (Vacio) | "Reclamar POD" | 24h |

---

## Interfaces Publicas (reminders.js)

```javascript
// CRUD
crearRecordatorio(texto, codCar, preset, ahora)
// → {id, codCar, texto, fechaCreacion, fechaDisparo, snoozeCount:0, origen:'manual'}
// Error si texto vacio o lista >= 50

eliminarRecordatorio(id, lista) → lista filtrada
completarRecordatorio(id, lista) → lista sin ese id
obtenerActivos(lista, ahora) → lista con fechaDisparo futuro, ordenada ASC

// Snooze
aplicarSnooze(id, preset, lista, ahora)
// → lista con fechaDisparo actualizado y snoozeCount+1

// Presets
calcularFechaDisparo(preset, ahora) → string ISO

// Evaluacion
evaluarPendientes(lista, ahora)
// → recordatorios con fechaDisparo <= ahora

// Sugerencias
generarSugerencia(fase, config) → {texto, horasAntes} | null
aceptarSugerencia(sugerencia, codCar, ahora) → recordatorio con origen='sugerido'
```

---

## Flujos de Ejecucion

### Flujo 1: Crear recordatorio manual
1. Operador pulsa "Recordar" en fila
2. Modal: escribe texto, selecciona preset "2h"
3. panel.js llama crearRecordatorio(texto, codCar, '2h', new Date())
4. Se persiste en chrome.storage.local tarealog_recordatorios
5. Se actualiza panel "Mis recordatorios"

### Flujo 2: Disparo de recordatorio
1. chrome.alarms dispara ALARM_RECORDATORIOS cada 1 min
2. background.js lee tarealog_recordatorios del storage
3. Llama evaluarPendientes(lista, new Date())
4. Por cada vencido: chrome.notifications.create con botones
5. Botones: [Snooze 15min] [Snooze 1h] [Hecho]

### Flujo 3: Snooze
1. Operador pulsa "Snooze 15min" en notificacion
2. background.js detecta onNotificationButtonClicked
3. Llama aplicarSnooze(id, '15min', lista, new Date())
4. Persiste lista actualizada

### Flujo 4: Sugerencia automatica
1. Operador cambia fase a "19" via editor inline
2. panel.js detecta cambio en cellEdited
3. Llama generarSugerencia('19', configActual)
4. Si retorna sugerencia, muestra toast/confirm
5. Si acepta: aceptarSugerencia → crearRecordatorio → persistir

---

## Checklist

- [x] Arquitectura clara y documentada
- [x] Nombres en DICCIONARIO_DOMINIO.md (propuesta lista)
- [x] Interfaces publicas definidas
- [x] Flujos criticos diagramados

**Estado:** COMPLETADO
