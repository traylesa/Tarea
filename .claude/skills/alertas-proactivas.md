# Skill: Motor de Alertas Proactivas

**Proposito**: Sistema de reglas que evalua registros y genera alertas con niveles de prioridad, notificaciones Chrome, badge y resumen matutino.

**Version**: 1.0.0 | **Ultima actualizacion**: 2026-02-15

---

## Contexto del Proyecto

TareaLog monitoriza cargas logisticas. El motor de alertas evalua registros periodicamente (cada barrido) y notifica al operador de situaciones que requieren atencion: transportistas sin respuesta, fases estancadas, documentacion pendiente, incidencias y cargas sin orden.

### Archivos Relevantes

| Archivo | Rol |
|---------|-----|
| `src/extension/alerts.js` | Motor de reglas (logica pura, dual-compat) |
| `src/extension/alert-summary.js` | Logica resumen matutino (logica pura) |
| `src/extension/alert-summary.html` | Ventana de resumen visual |
| `src/extension/alert-summary.css` | Estilos del resumen |
| `src/extension/background.js` | Orquestador: evalua alertas tras barrido |
| `tests/TDD/unit/test_alerts.js` | Tests del motor |
| `tests/TDD/unit/test_alert_summary.js` | Tests del resumen |

---

## Arquitectura

```
[background.js]
    |
    | ejecutarBarridoPeriodico()
    |     fetch → GAS → registros
    |
    | _evaluarYNotificarAlertas(registros, config)
    |     evaluarAlertas()  ← alerts.js (logica pura)
    |     calcularBadge()
    |     generarNotificaciones()
    |     chrome.notifications.create()
    |     chrome.storage.local.set({ tarealog_alertas })
    |
    | verificarResumenMatutino()
    |     debeMostrarMatutino()  ← alert-summary.js
    |     abrirVentanaResumen()
```

---

## Reglas Implementadas

| Regla | Nombre | Nivel | Condicion |
|---|---|---|---|
| R2 | Sin respuesta | ALTO | Estado=ENVIADO, sin RECIBIDO en thread, >Nh |
| R3 | Fase estancada | MEDIO/ALTO | Fase con limite configurado, tiempo excedido |
| R4 | Docs pendientes | MEDIO/ALTO | Fase=29, >N dias sin documentar |
| R5 | Incidencia activa | CRITICO | Fase=05 o 25 |
| R6 | Carga HOY sin orden | ALTO/CRITICO | fCarga=hoy, sin estado ENVIADO |

### Niveles de Prioridad

```javascript
var NIVEL = { CRITICO: 'CRITICO', ALTO: 'ALTO', MEDIO: 'MEDIO', BAJO: 'BAJO' };
var PRIORIDAD_NIVEL = { CRITICO: 3, ALTO: 2, MEDIO: 1, BAJO: 0 };
```

---

## Patron: Regla como Funcion Pura

```javascript
function _reglaR5(registros) {
  var alertas = [];
  registros.forEach(function(reg) {
    if (reg.fase !== '05' && reg.fase !== '25') return;
    alertas.push({
      id: 'R5_' + (reg.codCar || reg.threadId),
      regla: 'R5',
      nivel: NIVEL.CRITICO,
      titulo: 'INCIDENCIA',
      mensaje: 'Carga ' + (reg.codCar || '?') + ' — ' + (reg.nombreTransportista || ''),
      codCar: reg.codCar || null,
      threadId: reg.threadId || null,
      timestamp: new Date().toISOString()
    });
  });
  return alertas;
}
```

**Estructura de alerta**:
- `id`: Unico para deduplicacion (`REGLA_codCar`)
- `regla`: Codigo de regla (R2-R6)
- `nivel`: CRITICO/ALTO/MEDIO/BAJO
- `titulo`: Texto corto para notificacion
- `mensaje`: Detalle descriptivo
- `codCar`, `threadId`: Para linking a registros
- `timestamp`: Para cooldown

---

## Deduplicacion con Cooldown

```javascript
function deduplicar(nuevas, previas, cooldownMs) {
  var mapaTimestamp = {};
  previas.forEach(function(p) { mapaTimestamp[p.id] = new Date(p.timestamp).getTime(); });

  return nuevas.filter(function(alerta) {
    var tsPrev = mapaTimestamp[alerta.id];
    if (!tsPrev) return true;
    return (new Date(alerta.timestamp).getTime() - tsPrev) >= cooldownMs;
  });
}
```

Evita notificar la misma alerta repetidamente. Cooldown configurable (default 1h).

---

## Configuracion (en config del usuario)

```javascript
config.alertas = {
  activado: true,
  silencioUmbralH: 4,        // R2: horas sin respuesta
  estancamientoMaxH: {       // R3: horas max por fase
    '01': 24,
    '10': 48,
    '29': 72
  },
  docsUmbralDias: 2,         // R4: dias sin documentar
  cooldownMs: 3600000         // 1 hora entre alertas iguales
};
```

---

## Anadir Nueva Regla

1. Crear funcion `_reglaRN(registros, cfg, ahora)` en `alerts.js`
2. Retornar array de alertas con estructura estandar
3. Anadir llamada en `evaluarAlertas()`: `alertas = alertas.concat(_reglaRN(...))`
4. Crear test en `tests/TDD/unit/test_alerts.js`
5. Documentar en tabla de reglas arriba

---

## Consideraciones para Agentes

1. **Logica pura**: `alerts.js` NO accede a Chrome API ni DOM
2. **Tests primero**: Escribir test de la regla antes de implementarla
3. **IDs unicos**: Formato `REGLA_codCar` para deduplicacion correcta
4. **Configuracion**: Umbrales siempre desde `config.alertas`, nunca hardcodeados
5. **Background.js**: Es el orquestador; no poner logica de reglas ahi
6. **Resumen matutino**: Se muestra una vez al dia, controlado por flag en storage

---

## Referencias

- **Diccionario**: `docs/DICCIONARIO_DOMINIO.md` §Estados, §Fases
- **Config alertas**: `src/extension/config.js` §alertas
- **Tests**: `tests/TDD/unit/test_alerts.js`, `test_alert_summary.js`

---

**Generada por /genera-skills**
