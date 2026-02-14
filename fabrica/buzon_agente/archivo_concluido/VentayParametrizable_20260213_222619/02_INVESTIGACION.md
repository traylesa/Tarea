# 02 - INVESTIGACION

**Fase:** Investigacion del Codebase + Opciones Tecnicas
**Expediente:** VentayParametrizable_20260213_222619
**Estado:** COMPLETADO

---

## 2.1 Mapa de Impacto

| Archivo | Lineas afectadas | Tipo cambio | Descripcion |
|---------|-----------------|-------------|-------------|
| `src/extension/manifest.json` | 11-19 | MODIFICAR | Quitar default_popup, anadir permiso si necesario |
| `src/extension/background.js` | 1-42 (todo) | MODIFICAR | Abrir ventana al clic icono, leer config de storage |
| `src/extension/popup.html` | todo | RENOMBRAR | Renombrar a panel.html, anadir tabs |
| `src/extension/popup.js` | 1, 209 | MODIFICAR | Leer GAS_URL de config, adaptar altura tabla |
| `src/extension/popup.css` | 1-10 | MODIFICAR | Quitar width fijo, anadir estilos tabs y config |
| `src/extension/config.js` | nuevo | CREAR | Modulo de configuracion (carga, guardado, validacion, defaults) |
| `src/extension/config-ui.js` | nuevo | CREAR | UI del panel de configuracion |

Lineas estimadas a crear/modificar: ~350

## 2.2 Patrones Existentes a Reutilizar

**Patron 1: Persistencia con chrome.storage.local** (popup.js:140-166)
```javascript
async function guardarPreferencias() {
  const prefs = { columnas: cols, sorters };
  await chrome.storage.local.set({ [STORAGE_KEY_PREFS]: prefs });
}
async function cargarPreferencias() {
  const result = await chrome.storage.local.get(STORAGE_KEY_PREFS);
  return result[STORAGE_KEY_PREFS] || null;
}
```
Reutilizar este patron para la configuracion parametrizable.

**Patron 2: Debounce para guardar** (popup.js:26-32)
```javascript
function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
```

**Antipatrones a evitar:**
- GAS_URL hardcodeado como constante global en multiples archivos
- Altura de tabla fija (320px) sin adaptacion al contenedor

## 2.3 Analisis de Tests Existentes

- Tests existentes: **Ninguno** (no hay carpeta tests/)
- Cobertura actual: **0%**
- Tests que podrian romperse: **Ninguno** (no hay tests)

Esto simplifica: solo hay que crear tests nuevos, sin riesgo de romper existentes.

## 2.4 Spike Tecnico

**Pregunta:** Puede `chrome.windows.create()` abrir extension pages en MV3?

**Resultado:** SI. En Manifest V3, `chrome.windows.create({ url: 'panel.html', type: 'popup' })` abre una ventana independiente con la pagina de la extension. No requiere permisos adicionales mas alla de los existentes. El tipo "popup" crea ventana sin barra de navegacion.

**Spike resuelto:** VIABLE sin restricciones.

## 2.5 Opciones Evaluadas

### Opcion 1: Ventana independiente con chrome.windows.create

- **Descripcion:** Reemplazar popup por ventana via `chrome.windows.create()`. El background.js intercepta clic en icono y abre/enfoca ventana.
- **Pros:** Ventana movible y redimensionable nativa, no necesita permisos extra, patron estandar de Chrome
- **Cons:** No se puede anclar como side panel
- **Complejidad:** S

### Opcion 2: Chrome Side Panel API

- **Descripcion:** Usar `chrome.sidePanel` para abrir panel lateral anclado al navegador
- **Pros:** Panel siempre visible sin tapar pagina, integrado nativamente
- **Cons:** Solo lateral (no movible libremente), requiere Chrome 114+, API mas nueva con menos documentacion, NO cumple requisito de "movible y redimensionable"
- **Complejidad:** M

### Opcion 3: Content script con iframe flotante

- **Descripcion:** Inyectar iframe flotante en paginas web via content script
- **Pros:** Visible en cualquier pagina, maxima flexibilidad visual
- **Cons:** Complejidad alta, conflictos CSS con paginas, requiere permisos host, frágil
- **Complejidad:** L

## 2.6 Criterios de Decision

| Criterio | Peso | Opcion 1 | Opcion 2 | Opcion 3 |
|----------|------|----------|----------|----------|
| Cumple requisitos | Alto | 10 | 5 | 8 |
| Simplicidad | Alto | 9 | 7 | 3 |
| Estabilidad API | Medio | 10 | 7 | 5 |
| Permisos minimos | Medio | 10 | 8 | 3 |
| **Total** | | **39** | **27** | **19** |

## 2.7 Decision (ADR)

**Opcion seleccionada:** Opcion 1 - Ventana independiente con chrome.windows.create

**Justificacion:** Cumple todos los requisitos (movible, redimensionable), es la solucion mas simple, usa API estable de Chrome, no requiere permisos adicionales, y es el patron mas documentado. Las opciones 2 y 3 no cumplen el requisito principal de ventana movible/redimensionable.

---

## PUERTA DE VALIDACION 2: SUPERADA

- [x] Mapa de impacto completo (archivos + rutas exactas)
- [x] Patrones existentes identificados con codigo real
- [x] Tests existentes analizados (0 tests, sin riesgo)
- [x] Spike resuelto (chrome.windows.create viable)
- [x] 3 opciones evaluadas con pros/cons
- [x] Decision justificada
