# 02 - INVESTIGACION

**Fase:** Investigacion del Codebase + Opciones Tecnicas
**Expediente:** Heredar_dehilos_20260226_135823
**Camino:** PROYECTO_COMPLETO
**Fecha:** 2026-02-26

---

## 2.1 Mapa de Impacto

| Archivo | Lineas afectadas | Tipo cambio | Descripcion |
|---------|-----------------|-------------|-------------|
| `src/gas/AdaptadorHojas.js` | final (~404) | crear | +obtenerUltimoRegistroPorThread() ~20 lineas |
| `src/gas/Main.js` | 44-84 | modificar | +herencia fase/estado en processMessage ~15 lineas |
| `src/extension/action-rules.js` | 6-15, 17-26, 113-136, 138-204 | modificar | +HEREDAR_DEL_HILO tipo + validacion + regla default |
| `src/extension/panel.js` | 650-740 | modificar | +case HEREDAR_DEL_HILO en ejecutarAccionRegla |
| `src/extension/config-rules-ui.js` | 209-292 | modificar | +renderParams para HEREDAR_DEL_HILO |
| `tests/TDD/unit/test_action_rules.js` | final | modificar | +tests nuevo tipo |
| `tests/TDD/unit/test_herencia_hilos.js` | nuevo | crear | Tests processMessage con herencia |

Lineas estimadas a crear/modificar: ~120

---

## 2.2 Patrones Existentes

### Patron 1: Busqueda por campo en hoja (reutilizar)
```javascript
// AdaptadorHojas.js - actualizarCodCarPorThread (linea 349-374)
// Patron: iterar datos[i] buscando threadId, leer headers con indexOf
var idxThread = headers.indexOf('threadId');
for (var i = 1; i < datos.length; i++) {
  if (datos[i][idxThread] === threadId) { /* ... */ }
}
```

### Patron 2: Tipos de accion en motor reglas (reutilizar)
```javascript
// action-rules.js - TIPOS_ACCION_REGLA (linea 6-15)
var TIPOS_ACCION_REGLA = {
  PROPAGAR_HILO: 'PROPAGAR_HILO',
  // ... agregar HEREDAR_DEL_HILO aqui
};
```

### Patron 3: Case en ejecutarAccionRegla (panel.js linea 650+)
```javascript
switch (accion.tipo) {
  case 'SUGERIR_RECORDATORIO': /* ... */ break;
  case 'CAMBIAR_FASE': /* ... */ break;
  // ... agregar case 'HEREDAR_DEL_HILO' aqui
}
```

### Antipatrones a evitar
- Usar `!valor` para fase vacia ('' es valido, usar `=== null`)
- Llamar SpreadsheetApp extra (reutilizar datos ya leidos)

---

## 2.3 Analisis de Tests Existentes

- **Tests relacionados:** `test_action_rules.js` (59 tests, linea 1-432)
- **Tests processMessage:** No existen (test_main.js no existe)
- **Cobertura zona afectada:** action-rules 100%, Main.js 0% (sin tests)
- **Tests que podrian romperse:**
  - `test_action_rules.js: 'contiene los 8 tipos definidos'` → debe cambiar a 9
  - `test_action_rules.js: 'genera 7 reglas'` → debe cambiar a 8 (si se agrega default)

---

## 2.4 Spike Tecnico

No necesario. La solucion sigue patrones ya probados en el codebase.

---

## 2.5 Opciones Evaluadas

### Opcion 1: Herencia en processMessage via SEGUIMIENTO (propuesta en expediente)
- **Descripcion:** Nueva funcion `obtenerUltimoRegistroPorThread()` en AdaptadorHojas.js, llamada desde processMessage
- **Pros:** Logica centralizada en backend, funciona para cualquier cliente (extension, PWA)
- **Cons:** Lee hoja SEGUIMIENTO completa (ya se hace en procesarCorreos, no es overhead extra)
- **Complejidad:** S

### Opcion 2: Herencia solo en extension (client-side)
- **Descripcion:** La extension busca en su cache local de registros el ultimo del hilo
- **Pros:** No toca backend GAS
- **Cons:** Solo funciona si la extension tiene cache actualizado, no funciona en PWA, herencia no se refleja en Sheets
- **Complejidad:** S

### Opcion 3: Herencia via DB_HILOS ampliado
- **Descripcion:** Agregar campos fase/estado a DB_HILOS y actualizar ThreadManager
- **Pros:** Cache dedicado, busqueda rapida
- **Cons:** Modificar ThreadManager (mas riesgo), duplicar datos, sincronizacion compleja
- **Complejidad:** L

---

## 2.6 Criterios de Decision

| Criterio | Peso | Opcion 1 | Opcion 2 | Opcion 3 |
|----------|------|----------|----------|----------|
| Riesgo regresion | Alto | Bajo (nueva funcion) | Bajo | Alto (modifica TM) |
| Cobertura clientes | Alto | Todos | Solo extension | Todos |
| Complejidad | Medio | S | S | L |
| Consistencia datos | Alto | Si (en Sheets) | No | Si |

---

## 2.7 Decision (ADR)

**Opcion seleccionada:** Opcion 1 — Herencia en processMessage via SEGUIMIENTO

**Justificacion:** Es la opcion propuesta en el expediente, tiene el menor riesgo de regresion (nueva funcion, no modifica existentes), funciona para todos los clientes, y los datos quedan consistentes en Sheets desde el procesamiento. La complejidad es S y sigue patrones ya probados en el codebase.

---

## Puerta de Validacion 2

- [x] Mapa de impacto completo (archivos + rutas exactas)
- [x] Patrones existentes identificados con codigo real
- [x] Tests existentes analizados (que podria romperse)
- [x] Spike resuelto (no necesario)
- [x] Al menos 2 opciones evaluadas con pros/cons
- [x] Decision justificada

---

**Estado:** COMPLETADO
