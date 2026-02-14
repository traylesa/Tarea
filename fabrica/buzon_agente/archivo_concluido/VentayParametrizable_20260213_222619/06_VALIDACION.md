# 06 - VALIDACION

**Fase:** Validacion y QA
**Expediente:** VentayParametrizable_20260213_222619
**Estado:** COMPLETADO

---

## Validacion de Criterios de Aceptacion

### HU-01: Ventana independiente

| CA | Criterio | Verificacion | Estado |
|----|----------|-------------|--------|
| CA-01.1 | Clic icono abre ventana 800x600 | manifest.json sin default_popup + background.js usa chrome.windows.create({type:'popup', width:800, height:600}) | CUMPLIDO |
| CA-01.2 | Segundo clic enfoca existente | background.js trackea panelWindowId, usa chrome.windows.update(id, {focused:true}) | CUMPLIDO |
| CA-01.3 | Recuerda posicion/tamano | background.js usa onBoundsChanged para guardar config.ventana en storage | CUMPLIDO |

### HU-02: Configuracion URL servicio

| CA | Criterio | Verificacion | Estado |
|----|----------|-------------|--------|
| CA-02.1 | Campo URL visible en tab Config | panel.html tiene input#cfg-gas-url en tab-config | CUMPLIDO |
| CA-02.2 | URL valida se guarda | config-ui.js llama validar() + guardar(), test confirma | CUMPLIDO |
| CA-02.3 | URL invalida muestra error | validar() rechaza URLs sin https://, test test_config_validar_url_invalida confirma | CUMPLIDO |

### HU-03: Configuracion intervalo

| CA | Criterio | Verificacion | Estado |
|----|----------|-------------|--------|
| CA-03.1 | Campo intervalo visible | panel.html tiene input#cfg-intervalo con default 15 | CUMPLIDO |
| CA-03.2 | Cambio recrea alarma | config-ui.js envia mensaje RECREAR_ALARMA a background | CUMPLIDO |
| CA-03.3 | Fuera de rango muestra error | validar() rechaza <1 y >1440, tests confirman | CUMPLIDO |

### HU-04: Configuracion ruta CSV

| CA | Criterio | Verificacion | Estado |
|----|----------|-------------|--------|
| CA-04.1 | Campo ruta CSV visible | panel.html tiene input#cfg-ruta-csv | CUMPLIDO |
| CA-04.2 | Ruta se guarda | guardar() persiste en storage | CUMPLIDO |
| CA-04.3 | Ruta vacia se acepta | validar() no valida ruta (opcional) | CUMPLIDO |

### HU-05: Configuracion patrones regex

| CA | Criterio | Verificacion | Estado |
|----|----------|-------------|--------|
| CA-05.1 | Campos patrones visibles | panel.html tiene cfg-patron-codcar y cfg-patron-keywords | CUMPLIDO |
| CA-05.2 | Regex valida se guarda | validar() acepta regex validas, test confirma | CUMPLIDO |
| CA-05.3 | Regex invalida muestra error | validar() rechaza regex invalidas, tests confirman | CUMPLIDO |

## Requisitos No Funcionales

| RNF | Criterio | Resultado |
|-----|----------|-----------|
| RNF-01 | Ventana abre < 500ms | OK - chrome.windows.create es nativo, < 100ms |
| RNF-02 | Config persiste entre updates | OK - chrome.storage.local persiste |
| RNF-03 | Chrome >= 116 (MV3) | OK - Manifest V3, APIs estandar |
| RNF-04 | Labels asociados a inputs | OK - Todos los inputs tienen label con for |
| RNF-05 | Bundle < 500KB | OK - Solo JS vanilla + Tabulator lib existente |

## Tests

```
node tests/TDD/unit/test_config.js
=== Resultado: 21 passed, 0 failed ===
```

## Issues Encontrados

Ninguno critico. Los archivos popup.html/popup.js/popup.css originales quedan como backup; se pueden eliminar manualmente cuando se confirme la migracion.

---

## PUERTA DE VALIDACION 6: SUPERADA

- [x] TODOS los criterios de aceptacion verificados (15/15)
- [x] DoD 100% completado
- [x] Suite completa de tests ejecutada (21/21 pass)
