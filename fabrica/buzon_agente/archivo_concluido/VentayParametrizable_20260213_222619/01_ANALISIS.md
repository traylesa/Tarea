# 01 - ANALISIS

**Fase:** Analisis de Requisitos
**Expediente:** VentayParametrizable_20260213_222619
**Estado:** COMPLETADO

---

## 1.1 Resumen Ejecutivo

La extension Chrome "LogiTask Orchestrator" actualmente usa un popup fijo de 700x400px con valores hardcodeados. Se requiere transformarla en ventana independiente movible/redimensionable y anadir un panel de configuracion parametrizable que permita al usuario ajustar URL del servicio, intervalos, rutas CSV y patrones regex sin tocar codigo.

## 1.2 Situacion Actual (AS-IS)

- **popup.html** se abre como popup fijo (700x400px) al hacer clic en icono
- El popup se cierra automaticamente al hacer clic fuera
- No se puede mover ni redimensionar
- Valores hardcodeados en codigo:
  - `GAS_URL = ''` en popup.js:1 y background.js:1
  - `DEFAULT_INTERVAL_MINUTES = 15` en background.js:3
  - `height: 320` para Tabulator en popup.js:209
- Sin panel de configuracion
- Manifest usa `default_popup: "popup.html"`

## 1.3 Situacion Deseada (TO-BE)

- **panel.html** se abre como ventana independiente via `chrome.windows.create()`
- Ventana movible, redimensionable, siempre accesible
- Interfaz con 2 tabs: **Datos** (tabla actual) y **Configuracion** (parametros)
- Toda configuracion en `chrome.storage.local` con clave `logitask_config`
- background.js lee configuracion dinamicamente de storage
- Tabulator se adapta al tamano de ventana con ResizeObserver

## 1.4 GAP Analysis

| Aspecto | AS-IS | TO-BE | GAP |
|---------|-------|-------|-----|
| Ventana | Popup fijo 700x400 | Ventana independiente movible | Cambiar manifest + background.js |
| GAS_URL | Hardcoded vacio | Configurable desde UI | Panel config + storage |
| Intervalo | Hardcoded 15min | Configurable 1-1440min | Panel config + recrear alarm |
| Ruta CSV | No existe | Configurable desde UI | Nuevo campo + storage |
| Regex | No existe en extension | Configurable desde UI | Nuevo campo + validacion |
| Tabla | Altura fija 320px | Adapta a ventana | ResizeObserver |

## 1.5 Historias de Usuario

### HU-01: Ventana independiente

```
COMO usuario de la extension
QUIERO que al hacer clic en el icono se abra una ventana independiente
PARA poder moverla, redimensionarla y mantenerla abierta mientras navego
```

**Criterios de Aceptacion:**
- CA-01.1 (caso feliz): DADO que hago clic en el icono CUANDO no hay ventana abierta ENTONCES se abre ventana nueva tipo "popup" (800x600 default)
- CA-01.2 (caso duplicado): DADO que ya hay ventana abierta CUANDO hago clic en el icono ENTONCES se enfoca la existente sin abrir duplicada
- CA-01.3 (caso persistencia): DADO que muevo/redimensiono la ventana CUANDO la cierro y reabro ENTONCES recuerda posicion y tamano

### HU-02: Configuracion URL del servicio

```
COMO usuario de la extension
QUIERO poder configurar la URL del servicio GAS desde la interfaz
PARA no tener que editar codigo fuente al desplegar el backend
```

**Criterios de Aceptacion:**
- CA-02.1 (caso feliz): DADO que abro tab Configuracion CUANDO veo campo "URL servicio" ENTONCES muestra valor actual o vacio
- CA-02.2 (guardado): DADO que introduzco URL valida (https://...) CUANDO pulso Guardar ENTONCES se persiste y usa en proximas peticiones
- CA-02.3 (validacion): DADO que introduzco URL invalida CUANDO pulso Guardar ENTONCES muestra error sin guardar

### HU-03: Configuracion intervalo de barrido

```
COMO usuario de la extension
QUIERO poder ajustar el intervalo de barrido automatico
PARA controlar la frecuencia de sincronizacion segun mis necesidades
```

**Criterios de Aceptacion:**
- CA-03.1 (caso feliz): DADO que abro Configuracion CUANDO veo "Intervalo barrido" ENTONCES muestra valor actual en minutos (default 15)
- CA-03.2 (cambio): DADO que cambio intervalo a 30min CUANDO pulso Guardar ENTONCES la alarma se recrea con nuevo intervalo
- CA-03.3 (validacion): DADO que introduzco valor <1 o >1440 CUANDO pulso Guardar ENTONCES muestra error

### HU-04: Configuracion ruta CSV del ERP

```
COMO usuario de la extension
QUIERO configurar la ruta de acceso a archivos CSV del ERP
PARA que el sistema sepa donde buscar datos del ERP
```

**Criterios de Aceptacion:**
- CA-04.1 (caso feliz): DADO que abro Configuracion CUANDO veo "Ruta CSV ERP" ENTONCES muestra ruta actual o placeholder
- CA-04.2 (guardado): DADO que introduzco ruta CUANDO pulso Guardar ENTONCES se persiste
- CA-04.3 (opcional): DADO que dejo ruta vacia CUANDO pulso Guardar ENTONCES se guarda sin error

### HU-05: Configuracion patrones regex

```
COMO usuario de la extension
QUIERO configurar los patrones regex para extraccion de valores
PARA adaptar la extraccion a diferentes formatos de documentos
```

**Criterios de Aceptacion:**
- CA-05.1 (caso feliz): DADO que abro Configuracion CUANDO veo "Patrones" ENTONCES veo patrones: codcar_adjunto y keywords_admin
- CA-05.2 (guardado): DADO que modifico regex CUANDO pulso Guardar ENTONCES valida que sea regex valida y guarda
- CA-05.3 (error): DADO que introduzco regex invalida CUANDO pulso Guardar ENTONCES muestra error indicando patron invalido

## 1.6 Requisitos No Funcionales

| ID | Requisito | Criterio |
|----|-----------|----------|
| RNF-01 | Performance | Ventana abre en < 500ms |
| RNF-02 | Persistencia | Config sobrevive actualizaciones de extension |
| RNF-03 | Compatibilidad | Chrome >= 116 (Manifest V3) |
| RNF-04 | Accesibilidad | Labels asociados a inputs, tab order logico |
| RNF-05 | Tamano | Bundle no excede 500KB |

## 1.7 Analisis de Riesgos

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| Tabulator no adapta a resize | Media | Alto | ResizeObserver + redraw |
| Config corrupta en storage | Baja | Medio | Defaults + validacion al cargar |
| Ventana duplicada | Baja | Bajo | Trackear windowId en background |

## 1.8 Dependencias

- Tabulator 6.x (ya incluida como lib local)
- Chrome Extensions API MV3: `chrome.windows`, `chrome.storage`, `chrome.alarms`
- Backend GAS sin cambios

## 1.9 Preguntas Abiertas

- Ninguna bloqueante. Todos los requisitos estan claros.

---

## PUERTA DE VALIDACION 1: SUPERADA

- [x] AS-IS y TO-BE documentados
- [x] Todas las HU tienen formato COMO/QUIERO/PARA
- [x] Cada HU tiene minimo 3 criterios de aceptacion
- [x] Riesgos identificados con mitigacion
- [x] Sin preguntas abiertas bloqueantes
