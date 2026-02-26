# Skill: Sistema de Configuracion

**Proposito**: Guia para el sistema centralizado de configuracion de TareaLog: defaults, validacion, export/import JSON, migracion de versiones y sincronizacion con GAS.

**Version**: 1.2.0 | **Ultima actualizacion**: 2026-02-25

---

## Contexto del Proyecto

La configuracion de TareaLog vive en `chrome.storage.local` (clave `tarealog_config`). Incluye: fases, estados, reglas, alertas, resumen matutino, recordatorios, secuencias, reporte, robustez, y `estadoInicial`. Ciertos valores se sincronizan con GAS via `PropertiesService`.

### Archivos Relevantes

| Archivo | Rol |
|---------|-----|
| `src/extension/config.js` | Logica pura: defaults, validacion, cargar/guardar, export/import |
| `src/extension/config-ui.js` | UI: formulario, fases, estados, spreadsheet, gmail query, estado inicial |
| `src/extension/config-rules-ui.js` | UI: reglas de acciones (modal, lista, select dinamico) |
| `src/extension/constants.js` | Constantes globales (umbrales, timeouts, DEFAULT_PREFS_REJILLA) |
| `src/gas/Configuracion.js` | Config GAS: PropertiesService (SPREADSHEET_ID, GMAIL_QUERY, ESTADO_INICIAL, HORARIO_LABORAL) |
| `tests/TDD/unit/test_config.js` | Tests unitarios |

---

## Implementacion Principal

### Estructura de getDefaults()

```javascript
function getDefaults() {
  return {
    gasUrl: '',
    estadoInicial: 'NUEVO',           // Sincronizado con GAS
    intervaloMinutos: 15,
    emailsPorMinuto: 10,
    rutaCsvErp: '',
    patrones: { codcarAdjunto: '...', keywordsAdmin: '...' },
    ventana: { width: 800, height: 600, left: null, top: null },
    fases: _getDefaultFases(),         // Desde fases-config.js
    estados: _getDefaultEstados(),     // Desde estados-config.js
    alertas: { activado, silencioUmbralH, estancamientoMaxH, docsUmbralDias, cooldownMs },
    resumenMatutino: { activado: true, hora: '08:00' },
    recordatorios: { sugerenciasActivadas: true },
    secuencias: { activado: true, evaluacionMinutos: 15 },
    reporteTurno: { activado: true, hora: '18:00' },
    robustez: { timeoutBarridoMs, limiteLoteProcesamiento, tamanoTandaEnvio },
    reglasAcciones: _generarReglasDefault()  // Desde action-rules.js
  };
}
```

### DEFAULT_PREFS_REJILLA (constants.js)

Preferencias predeterminadas para la tabla Tabulator (orden, anchos, visibilidad de columnas). Se usa como fallback cuando no hay preferencias guardadas en storage.

```javascript
var DEFAULT_PREFS_REJILLA = {
  columns: [
    { field: 'codCar', width: 80, visible: true },
    { field: 'fase', width: 65, visible: true },
    // ... orden y anchos predefinidos para 20+ columnas
  ]
};
```

### Auto-migracion en cargar()

Al cargar config guardada, se fusiona con defaults para inyectar campos nuevos:

```javascript
async function cargar() {
  const defaults = getDefaults();
  const guardada = result[STORAGE_KEY_CONFIG];
  if (!guardada) return defaults;

  const config = { ...defaults, ...guardada,
    patrones: { ...defaults.patrones, ...(guardada.patrones || {}) },
    ventana: { ...defaults.ventana, ...(guardada.ventana || {}) }
  };

  // Auto-migracion por seccion (spread doble)
  if (!guardada.alertas) config.alertas = defaults.alertas;
  else config.alertas = { ...defaults.alertas, ...guardada.alertas };
  // ... idem para cada seccion anidada
}
```

**Regla clave**: Al agregar un campo nuevo a `getDefaults()`, la auto-migracion lo inyecta automaticamente. No se necesita codigo de migracion explicito si el campo es primitivo al nivel raiz.

---

## Patrones Recomendados

### Patron 1: Agregar Campo Nuevo (Checklist)

1. Agregar default en `getDefaults()` de `config.js`
2. Agregar en `leerFormulario()` de `config-ui.js` (para export/import)
3. Agregar HTML en `panel.html` (input/select)
4. Si se sincroniza con GAS:
   - Agregar getter/setter en `Configuracion.js`
   - Agregar endpoints en `Codigo.js`
   - Agregar UI de carga/guardado en `config-ui.js`
5. Ejecutar tests: `npx jest tests/TDD/unit/test_config.js`

### Patron 2: Export/Import Completo

```javascript
// config.js — exportarConfigCompleta incluye:
// - config principal (todas las secciones)
// - extras opcionales: servicios, gmailQuery, spreadsheet, pieComun, preferenciasRejilla
```

### Patron 3: Sincronizacion Config Local vs GAS

| Campo | Storage local | GAS PropertiesService | Sync |
|-------|--------------|----------------------|------|
| gasUrl | config.gasUrl | -- | Solo local |
| estadoInicial | config.estadoInicial | ESTADO_INICIAL | Bidireccional (GET al cargar, POST al cambiar) |
| spreadsheetId | tarealog_spreadsheet | SPREADSHEET_ID | Al configurar |
| gmailQuery | tarealog_gmail_query | GMAIL_QUERY | Al configurar |
| horarioLaboral | -- | HORARIO_LABORAL | Solo GAS (configurable desde panel-programados) |
| emailsPorMinuto | config.emailsPorMinuto | EMAILS_POR_MINUTO | Al configurar |
| fases/estados/reglas | config.fases/estados/reglasAcciones | -- | Solo local |

---

## Errores Comunes a Evitar

### Error 1: Campo en defaults pero no en leerFormulario

```javascript
// config.js
estadoInicial: 'NUEVO',  // Agregado en defaults

// config-ui.js — OBLIGATORIO agregar tambien aqui:
return {
  estadoInicial: document.getElementById('config-estado-inicial').value || 'NUEVO',
};
// Si falta, al guardar se pierde el valor
```

### Error 2: Auto-migracion de secciones anidadas

```javascript
// Para secciones como alertas, usar spread doble:
if (!guardada.alertas) config.alertas = defaults.alertas;
else config.alertas = { ...defaults.alertas, ...guardada.alertas };
// NUNCA: config.alertas = guardada.alertas (perderia campos nuevos)
```

### Error 3: DEFAULT_PREFS_REJILLA como fallback

`cargarPreferencias()` en panel.js y popup.js usa `DEFAULT_PREFS_REJILLA` como fallback cuando no hay prefs guardadas. Al agregar columnas nuevas a la tabla, actualizar tambien este default en `constants.js`.

---

## Consideraciones para Agentes

1. **Antes de modificar**: Leer `getDefaults()` para entender estructura completa
2. **Durante implementacion**: Mantener dual-compat, no romper auto-migracion
3. **Despues de cambios**: Verificar export/import round-trip (exportar → importar → verificar valores)
4. **Precauciones**: No cambiar `STORAGE_KEY_CONFIG` ni `CONFIG_VERSION` sin motivo
5. **PWA movil**: Config movil usa `localStorage` via Store (no chrome.storage)

---

## Tests

```bash
npx jest tests/TDD/unit/test_config.js --no-coverage
```

Cubren: defaults, validacion, export/import, migracion.

---

## Coordinacion con Otros Skills

| Necesitas... | Consulta skill... |
|---|---|
| Reglas de acciones (select dinamico) | `motor-reglas-acciones.md` |
| Fases y estados disponibles | `docs/DICCIONARIO_DOMINIO.md` |
| Alertas config (umbrales) | `alertas-proactivas.md` |
| Programados (horario laboral) | `envios-programados.md` |
| Deploy cambios GAS config | `gas-deploy.md` |
| Patron dual-compat | `dual-compat-modules.md` |
| Config movil | `pwa-mobile-development.md` (Store, localStorage) |

---

**Actualizada**: 2026-02-25 (v1.2.0: DEFAULT_PREFS_REJILLA, sync bidireccional estadoInicial)
