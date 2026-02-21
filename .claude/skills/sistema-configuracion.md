# Skill: Sistema de Configuracion

**Proposito**: Guia para el sistema centralizado de configuracion de TareaLog: defaults, validacion, export/import JSON, migracion de versiones y sincronizacion con GAS.

**Version**: 1.1.0 | **Ultima actualizacion**: 2026-02-21

---

## Contexto del Proyecto

La configuracion de TareaLog vive en `chrome.storage.local` (clave `tarealog_config`). Incluye: fases, estados, reglas, alertas, resumen matutino, recordatorios, secuencias, reporte, robustez, y el nuevo `estadoInicial`. Ademas, ciertos valores se sincronizan con GAS via `PropertiesService`.

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

  // Auto-migracion por seccion
  if (!guardada.alertas) config.alertas = defaults.alertas;
  else config.alertas = { ...defaults.alertas, ...guardada.alertas };
  // ... idem para cada seccion
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

// config-ui.js — leerFormulario() DEBE incluir todos los campos
// para que la config exportada sea completa
```

### Patron 3: Sincronizacion Config Local vs GAS

| Campo | Storage local | GAS PropertiesService | Sync |
|-------|--------------|----------------------|------|
| gasUrl | config.gasUrl | -- | Solo local |
| estadoInicial | config.estadoInicial | ESTADO_INICIAL | Bidireccional |
| spreadsheetId | tarealog_spreadsheet | SPREADSHEET_ID | Al configurar |
| gmailQuery | tarealog_gmail_query | GMAIL_QUERY | Al configurar |
| horarioLaboral | -- | HORARIO_LABORAL | Solo GAS (configurable) |
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
  // ...
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

---

## Consideraciones para Agentes

1. **Antes de modificar**: Leer `getDefaults()` para entender estructura completa
2. **Durante implementacion**: Mantener dual-compat, no romper auto-migracion
3. **Despues de cambios**: Verificar export/import round-trip (exportar → importar → verificar valores)
4. **Precauciones**: No cambiar `STORAGE_KEY_CONFIG` ni `CONFIG_VERSION` sin motivo

---

## Tests

```bash
npx jest tests/TDD/unit/test_config.js --no-coverage
```

Cubren: defaults, validacion, export/import, migracion.

---

## Referencias

- **Diccionario dominio**: `docs/DICCIONARIO_DOMINIO.md` (nombres campos, tipos)
- **Fases**: `src/extension/fases-config.js`
- **Estados**: `src/extension/estados-config.js`
- **Reglas**: `.claude/skills/motor-reglas-acciones.md`
- **Referente**: Kent Beck — "Make it work, make it right, make it fast" (migracion progresiva)

---

**Generada automaticamente por /genera-skills**
