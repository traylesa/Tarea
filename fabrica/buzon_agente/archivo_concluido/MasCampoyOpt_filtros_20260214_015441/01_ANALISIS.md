# 01 - ANÁLISIS

**Fase:** Análisis Detallado
**Expediente:** MasCampoyOpt_filtros_20260214_015441
**Camino:** MINI_PROYECTO
**Estado:** COMPLETADO

---

## 1.1 Resumen Ejecutivo

La extensión Chrome LogiTask Orchestrator muestra registros de seguimiento logístico en una rejilla Tabulator. Actualmente faltan campos logísticos clave (fechas carga/entrega, zonas) y el sistema de filtrado es básico. Se necesita ampliar el modelo de datos con 7 campos de PEDCLI, implementar filtros inteligentes (temporales, geográficos, por fase), edición masiva y operadores lógicos avanzados.

---

## 1.2 Situación Actual (AS-IS)

- **Modelo de datos:** Registros con campos: messageId, threadId, codCar, codTra, nombreTransportista, emailRemitente, emailErp, asunto, fechaCorreo, tipoTarea, estado, alerta, vinculacion, fase, procesadoAt
- **Campo fase:** Ya existe en el modelo y en la rejilla (con editor list y FASES_TRANSPORTE), pero no hay campos de fechas logísticas ni zonas
- **Filtros:** Sistema de filtros personalizados con 3 operadores (contiene, no_contiene, igual), rango de fechas de correo, baterías predefinidas y búsqueda global limitada a 8 campos
- **Edición:** Individual por celda (Estado y Fase como ComboBox inline)
- **Búsqueda global:** Busca en CAMPOS_BUSCABLES = ['estado', 'fase', 'codCar', 'nombreTransportista', 'emailRemitente', 'asunto', 'tipoTarea', 'vinculacion']
- **Columnas:** 9 columnas con gestor de visibilidad via headerMenu

---

## 1.3 Situación Deseada (TO-BE)

- **Modelo ampliado:** +6 campos nuevos: fCarga, hCarga, fEntrega, hEntrega, zona, zDest (fase ya existe)
- **Filtros temporales:** Checkboxes para "Rango Carga" (hoy→mañana) y "Rango Descarga" (ayer→hoy) con fechas por defecto reactivas
- **Filtros geográficos:** Zona y ZDest filtran por "contiene", con comodín `*` por defecto
- **Búsqueda global ampliada:** Busca en TODAS las columnas incluyendo las nuevas
- **Selectores de fase:** Cards interactivas que filtran por fases seleccionadas, con "Marcar/Desmarcar Todas"
- **Edición masiva:** Panel superior con checkboxes de selección + ComboBox para Fase y Estado + botón "Aplicar" que persiste cambios
- **Operadores lógicos:** 7 operadores: contiene, no_contiene, igual, <, <=, >, >=
- **Case insensitivity:** Garantizado en todas las búsquedas

---

## 1.4 GAP Analysis

| Aspecto | AS-IS | TO-BE | GAP |
|---------|-------|-------|-----|
| Campos rejilla | 9 columnas (sin fechas logísticas ni zonas) | 15 columnas (+ fCarga, hCarga, fEntrega, hEntrega, zona, zDest) | Agregar 6 columnas a crearColumnas() |
| Filtros temporales | Solo rango de fechaCorreo manual | Checkboxes con rangos carga/descarga con fechas por defecto | Crear UI checkboxes + lógica filtrado por fCarga/fEntrega |
| Operadores filtro | 3 (contiene, no_contiene, igual) | 7 (+<, <=, >, >=) | Ampliar construirFiltros() y select HTML |
| Búsqueda global | 8 campos fijos | Todos los campos de la rejilla | Ampliar CAMPOS_BUSCABLES |
| Selección fase | headerFilter list estándar | Cards interactivas con marcar/desmarcar todas | Crear componente cards de fase |
| Edición masiva | Solo individual por celda | Selección múltiple + aplicar cambios en bloque | Crear panel bulk edit + lógica persistencia |
| Filtro "Todo" | No existe | Opción que deshabilita filtro individual | Agregar opción en campos clave |

---

## 1.5 Historias de Usuario

### HU-1: Visualizar campos logísticos en la rejilla

```
COMO gestor de tráfico
QUIERO ver las fechas de carga, entrega y zonas directamente en la rejilla
PARA no tener que consultar el ERP para información básica de cada carga
```

**Criterios de Aceptación:**
- CA-1.1 (caso feliz):
  DADO un registro con fCarga="2026-02-15" y zona="MADRID" CUANDO se renderiza la rejilla ENTONCES se muestran las columnas FCarga y Zona con esos valores formateados
- CA-1.2 (caso campo vacío):
  DADO un registro sin campo fCarga (undefined) CUANDO se renderiza ENTONCES la celda muestra "--"
- CA-1.3 (caso formato fecha):
  DADO un registro con hCarga="14:30" CUANDO se renderiza ENTONCES la hora se muestra en formato legible

### HU-2: Filtrar por rango de fechas de carga/entrega

```
COMO gestor de tráfico
QUIERO activar filtros temporales con un checkbox para ver cargas de hoy o entregas de ayer
PARA encontrar rápidamente las cargas urgentes sin configurar fechas manualmente
```

**Criterios de Aceptación:**
- CA-2.1 (caso feliz):
  DADO que activo el checkbox "Rango Carga" CUANDO el campo se habilita ENTONCES filtra automáticamente registros con fCarga entre hoy y mañana
- CA-2.2 (caso desactivar):
  DADO que desactivo el checkbox "Rango Carga" CUANDO se deshabilita ENTONCES el filtro se elimina y se muestran todos los registros
- CA-2.3 (caso sin datos):
  DADO que activo "Rango Descarga" CUANDO no hay registros con fEntrega en el rango ENTONCES se muestra "Sin registros" y el conteo es 0

### HU-3: Filtrar por fases con cards interactivas

```
COMO gestor de tráfico
QUIERO seleccionar fases mediante tarjetas visuales con opción de marcar/desmarcar todas
PARA ver rápidamente el estado operativo de las cargas
```

**Criterios de Aceptación:**
- CA-3.1 (caso feliz):
  DADO las cards de fase visibles CUANDO hago click en "11 En Carga" y "12 Cargando" ENTONCES la rejilla muestra solo registros con esas fases
- CA-3.2 (caso marcar todas):
  DADO que hago click en "Marcar Todas" CUANDO se seleccionan todas las cards ENTONCES se eliminan los filtros de fase y se muestran todos los registros
- CA-3.3 (caso desmarcar todas):
  DADO que hago click en "Desmarcar Todas" CUANDO se deseleccionan todas las cards ENTONCES la rejilla queda vacía (0 registros coinciden)

### HU-4: Editar fase y estado de múltiples registros a la vez

```
COMO gestor de tráfico
QUIERO seleccionar varios registros y cambiar su fase o estado en bloque
PARA actualizar rápidamente el estado de múltiples cargas sin editar una por una
```

**Criterios de Aceptación:**
- CA-4.1 (caso feliz):
  DADO 5 registros seleccionados con checkbox CUANDO elijo fase "19 Cargado" y pulso "Aplicar" ENTONCES los 5 registros se actualizan a fase "19" en la rejilla y en storage
- CA-4.2 (caso sin selección):
  DADO 0 registros seleccionados CUANDO intento aplicar cambio masivo ENTONCES el botón "Aplicar" está deshabilitado
- CA-4.3 (caso persistencia):
  DADO que aplico cambio masivo CUANDO los registros se actualizan ENTONCES se persisten en chrome.storage y se envían al backend GAS

### HU-5: Usar operadores lógicos avanzados en filtros

```
COMO gestor de tráfico
QUIERO filtrar registros usando operadores como <, >, >=, <= en campos numéricos y de fecha
PARA encontrar registros con CODCAR mayor que un valor o con fechas anteriores a una referencia
```

**Criterios de Aceptación:**
- CA-5.1 (caso feliz):
  DADO un filtro personalizado con campo "codCar", operador ">" y valor "168000" CUANDO aplico el filtro ENTONCES solo se muestran registros con codCar > 168000
- CA-5.2 (caso operador fecha):
  DADO un filtro con campo "fCarga", operador ">=" y valor "2026-02-15" CUANDO aplico ENTONCES se muestran solo cargas a partir del 15/02
- CA-5.3 (caso operador con texto):
  DADO un filtro con campo "nombreTransportista", operador "<" y valor "M" CUANDO aplico ENTONCES se muestran transportistas cuyo nombre es alfabéticamente anterior a "M"

---

## 1.6 Requisitos No Funcionales

- **Rendimiento:** Filtrado < 100ms con hasta 1000 registros; debounce 300ms en búsqueda global
- **Compatibilidad:** Chrome 90+ (extensión Chrome)
- **Usabilidad:** Case insensitive en toda búsqueda; filtros temporales se inicializan con fecha del sistema al abrir
- **Mantenibilidad:** Lógica pura (sin DOM) en filters.js; DOM solo en panel.js
- **Tolerancia:** Campos nuevos opcionales (null/undefined → "--")

---

## 1.7 Análisis de Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Backend no envía campos nuevos | ALTA | MEDIO | Tolerancia a undefined en formatters |
| Muchas cards de fase saturan espacio | BAJA | BAJO | Layout flex-wrap, scroll si necesario |
| Edición masiva conflicto concurrencia | BAJA | MEDIO | Optimistic update local primero |
| Operadores < > en texto producen resultados confusos | MEDIA | BAJO | Documentar en ayuda que < > son para valores numéricos/fecha |

---

## 1.8 Dependencias

- **Depende de:** FASES_TRANSPORTE en panel.js (ya existe), Tabulator library, construirFiltros en filters.js
- **Dependientes:** Futura implementación backend GAS consumirá estos campos

---

## 1.9 Preguntas Abiertas

- Ninguna. El spec del expediente es suficientemente detallado para proceder.

---

## PUERTA DE VALIDACIÓN 1: APROBADA

- [x] AS-IS y TO-BE documentados
- [x] Todas las HU tienen formato COMO/QUIERO/PARA
- [x] Cada HU tiene mínimo 3 criterios de aceptación (caso feliz + error + borde)
- [x] Riesgos identificados con mitigación
- [x] Sin preguntas abiertas
