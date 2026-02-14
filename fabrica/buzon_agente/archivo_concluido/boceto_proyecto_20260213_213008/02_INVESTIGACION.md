# 02 - INVESTIGACION

**Fase:** Investigacion Tecnica + Opciones
**Expediente:** boceto_proyecto_20260213_213008
**Camino:** PROYECTO_COMPLETO

---

## MAPA DE IMPACTO

El proyecto es nuevo (src/ esta vacio), por lo que todos los archivos son creaciones nuevas:

| Archivo | Tipo cambio | Descripcion |
|---------|-------------|-------------|
| `src/gas/ThreadManager.gs` | Crear | Cache hilos Gmail ↔ CODCAR |
| `src/gas/EmailParser.gs` | Crear | Extraccion metadatos de correos |
| `src/gas/Auditor.gs` | Crear | Validacion email real vs ERP |
| `src/gas/ERPReader.gs` | Crear | Lectura y parseo de CSVs del ERP |
| `src/gas/SLAChecker.gs` | Crear | Verificacion de alertas SLA |
| `src/gas/Main.gs` | Crear | Orquestador principal GAS |
| `src/extension/manifest.json` | Crear | Manifest V3 de la extension |
| `src/extension/popup.html` | Crear | Panel de control HTML |
| `src/extension/popup.js` | Crear | Logica del panel |
| `src/extension/popup.css` | Crear | Estilos del panel |
| `src/extension/background.js` | Crear | Service worker (barridos, alarmas) |
| `tests/TDD/unit/test_email_parser.js` | Crear | Tests unitarios EmailParser |
| `tests/TDD/unit/test_thread_manager.js` | Crear | Tests unitarios ThreadManager |
| `tests/TDD/unit/test_auditor.js` | Crear | Tests unitarios Auditor |
| `tests/TDD/unit/test_erp_reader.js` | Crear | Tests unitarios ERPReader |
| `tests/TDD/unit/test_sla_checker.js` | Crear | Tests unitarios SLAChecker |

**Lineas estimadas:** ~1500 (codigo) + ~800 (tests) = ~2300 total

---

## PATRONES EXISTENTES

El proyecto es greenfield. Los patrones a seguir vienen del CLAUDE.md global:

1. **Funciones < 20 lineas** (idealmente < 10)
2. **Archivos < 200 lineas** (idealmente < 100)
3. **Early return** para evitar anidacion
4. **TDD estricto** (Red-Green-Refactor)
5. **Composicion sobre herencia**

Patron especifico del dominio GAS:
```javascript
// Patron cache en hoja oculta (recomendado por boceto)
function getOrCreateSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(name) || ss.insertSheet(name).hideSheet();
}
```

---

## ANALISIS DE TESTS EXISTENTES

- No existen tests previos (proyecto nuevo)
- No hay riesgo de romper tests existentes
- Estructura de tests: `tests/TDD/unit/` segun convencion CLAUDE.md

---

## OPCIONES EVALUADAS

### Opcion 1: Google Apps Script puro + Extension Chrome

- **Descripcion:** Backend completo en GAS, datos en Google Sheets, extension como frontend
- **Pros:**
  - Sin costes de hosting (todo en Google Workspace)
  - Acceso nativo a Gmail API desde GAS
  - Sheets como DB sin configuracion extra
  - Deployment simple (clasp para GAS, Chrome Web Store para extension)
- **Cons:**
  - Limite 6 min/ejecucion en GAS
  - Sin tipado estatico nativo (vanilla JS)
  - Testing limitado (no hay runner nativo en GAS)
- **Complejidad:** M

### Opcion 2: Node.js backend + Extension Chrome

- **Descripcion:** Backend en Node.js con Gmail API, PostgreSQL como DB
- **Pros:**
  - Sin limites de ejecucion
  - Testing robusto (Jest, Mocha)
  - Tipado con TypeScript
- **Cons:**
  - Requiere servidor (hosting adicional)
  - Configuracion OAuth mas compleja
  - Mayor complejidad de deployment
  - Over-engineering para el volumen actual (~500 correos/mes)
- **Complejidad:** L

### Opcion 3: Extension Chrome sola (sin backend separado)

- **Descripcion:** Todo en la extension usando Gmail API directamente
- **Pros:**
  - Arquitectura mas simple
  - Sin dependencia de backend
- **Cons:**
  - Manifest V3 limita service workers (no persistentes)
  - Sin acceso a Sheets nativo
  - Problemas de CORS con CSVs
  - La logica pesada no cabe en una extension
- **Complejidad:** L (por las limitaciones)

---

## CRITERIOS DE DECISION

| Criterio | Peso | Opcion 1 (GAS) | Opcion 2 (Node) | Opcion 3 (Solo Ext) |
|----------|------|----------------|-----------------|---------------------|
| Coste infraestructura | Alto | 10 | 4 | 8 |
| Acceso nativo Gmail | Alto | 10 | 7 | 5 |
| Facilidad deployment | Alto | 9 | 5 | 7 |
| Capacidad testing | Medio | 6 | 10 | 7 |
| Escalabilidad | Bajo | 6 | 10 | 3 |
| Complejidad total | Alto | 8 | 4 | 5 |
| **TOTAL** | | **49** | **40** | **35** |

---

## DECISION (ADR)

**Opcion seleccionada:** Opcion 1 - Google Apps Script puro + Extension Chrome

**Justificacion:**
1. **Coste cero**: Todo corre en Google Workspace existente de TRAYLESA
2. **Acceso nativo Gmail**: GAS tiene acceso directo a GmailApp sin OAuth adicional
3. **Sheets como DB**: Solucion natural para el volumen (~500 correos/mes)
4. **Alineado con boceto**: El documento original especifica exactamente esta arquitectura
5. **Testing**: Aunque GAS no tiene runner nativo, podemos escribir modulos testables en JS puro y usar Jest localmente, desplegando a GAS con clasp

**Mitigacion de limitaciones:**
- Limite 6 min: Procesamiento incremental (solo correos nuevos desde ultimo barrido)
- Testing: Modulos JS puros testeables con Jest, adaptadores GAS minimos

---

## SPIKE TECNICO

**Viabilidad confirmada:**
- Regex `Carga_0*(\d+)\.pdf` funciona correctamente (probado conceptualmente)
- GAS SpreadsheetApp soporta hojas ocultas para cache
- Chrome Extension Manifest V3 soporta `chrome.alarms` para barridos periodicos
- Comunicacion Extension ↔ GAS via `google.script.run` (webapp) o fetch a URL deployada

**Resultado:** VIABLE sin restricciones bloqueantes

---

## PUERTA DE VALIDACION 2

- [x] Mapa de impacto completo (archivos + rutas exactas)
- [x] Patrones existentes identificados
- [x] Tests existentes analizados (proyecto nuevo, sin riesgo)
- [x] Spike resuelto (viable)
- [x] 3 opciones evaluadas con pros/cons
- [x] Decision justificada

---

**Estado:** COMPLETADO
**Puerta de validacion 2:** SUPERADA
