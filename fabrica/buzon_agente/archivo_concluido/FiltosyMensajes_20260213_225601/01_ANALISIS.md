# 01 - ANALISIS

**Fase:** Analisis Detallado
**Expediente:** FiltosyMensajes_20260213_225601
**Camino:** MINI_PROYECTO

---

## 1.1 Resumen Ejecutivo

La extension Chrome "LogiTask Orchestrator" necesita evolucionar de un visor pasivo de registros a una herramienta interactiva de gestion de correos logisticos. Se requieren filtros avanzados, multiples fuentes GAS, agrupacion por hilos, respuesta masiva con plantillas y ayuda contextual.

## 1.2 Situacion Actual (AS-IS)

### Interfaz actual (panel.html + panel.js)
- **1 select** de filtro global por `tipoTarea` (OPERATIVO/ADMINISTRATIVA/SIN_CLASIFICAR)
- **headerFilter** tipo `input` en columnas: CODCAR, Transportista, Email
- **headerFilter** tipo `list` en columna Estado
- Sin filtro de fechas
- Sin agrupacion por hilo
- Sin respuesta a correos
- Sin plantillas de respuesta
- Sin panel de ayuda
- 1 sola URL GAS configurable (sin alias, sin multiples)
- Tabla Tabulator con 7 columnas, redimensionables y reordenables
- Persistencia de preferencias de columna en chrome.storage.local

## 1.3 Situacion Deseada (TO-BE)

1. Panel de filtros avanzados colapsable encima de la tabla
2. Filtro de rango de fechas (desde/hasta)
3. Baterias de filtros predefinidos con un click
4. Selector de multiples URLs GAS con alias
5. Agrupacion por threadId con colapso/expansion
6. Seleccion multiple de filas + respuesta masiva
7. Editor de plantillas HTML con variables y previsualizacion
8. Panel de ayuda contextual colapsable

## 1.4 GAP Analysis

| Aspecto | AS-IS | TO-BE | GAP |
|---------|-------|-------|-----|
| Filtros | 1 select + headerFilter basico | Panel avanzado colapsable + fechas + baterias | Modulo filtros completo |
| URLs GAS | 1 URL fija | Multiple con alias | Modulo config URLs |
| Hilos | Sin agrupacion | groupBy threadId | Modulo agrupacion |
| Respuestas | Sin capacidad | Masiva con plantillas | Modulo respuestas + plantillas |
| Ayuda | Inexistente | Panel contextual | Modulo ayuda |

## 1.5 Historias de Usuario

### HU-01: Filtros avanzados colapsables

COMO operador de cargas
QUIERO un panel de filtros avanzados que pueda colapsar/expandir
PARA buscar registros especificos sin ocupar espacio permanente en pantalla

**Criterios de Aceptacion:**
- CA-01.1 (caso feliz): DADO que el panel esta colapsado CUANDO hago click en "Filtros" ENTONCES se expande mostrando controles de filtrado
- CA-01.2 (caso feliz): DADO que selecciono campo "Email" y operador "contiene" y escribo "gmail" CUANDO aplico ENTONCES la tabla muestra solo registros cuyo email contiene "gmail"
- CA-01.3 (caso AND): DADO que tengo un filtro activo CUANDO agrego otro filtro ENTONCES ambos se aplican con operador AND
- CA-01.4 (caso limpiar): DADO que hay filtros activos CUANDO hago click en "Limpiar filtros" ENTONCES se eliminan todos y la tabla muestra todos los registros

### HU-02: Filtro por rango de fechas

COMO operador de cargas
QUIERO filtrar registros entre dos fechas
PARA ver solo los correos de un periodo especifico

**Criterios de Aceptacion:**
- CA-02.1 (caso feliz): DADO que selecciono fecha inicio "01/02/2026" y fecha fin "15/02/2026" CUANDO aplico ENTONCES solo se muestran registros con fechaCorreo en ese rango
- CA-02.2 (solo inicio): DADO que solo selecciono fecha inicio CUANDO aplico ENTONCES muestra registros desde esa fecha hasta hoy
- CA-02.3 (combinacion): DADO que el filtro de fechas esta activo CUANDO agrego otro filtro por campo ENTONCES ambos se combinan con AND

### HU-03: Baterias de filtros predefinidos

COMO operador de cargas
QUIERO filtros predefinidos como "Alertas activas" o "Sin vincular"
PARA acceder rapido a vistas frecuentes sin configurar filtros manualmente

**Criterios de Aceptacion:**
- CA-03.1: DADO que hago click en "Alertas activas" ENTONCES la tabla muestra solo registros con estado=ALERTA
- CA-03.2: DADO que hago click en "Sin vincular" ENTONCES muestra registros con vinculacion=SIN_VINCULAR
- CA-03.3: DADO que hago click en "Operativos recientes" ENTONCES muestra OPERATIVO de ultimos 7 dias
- CA-03.4: DADO que un filtro predefinido esta activo CUANDO hago click en otro ENTONCES reemplaza el anterior

### HU-04: Selector multiple de URLs GAS

COMO operador de cargas
QUIERO configurar multiples URLs de servicio GAS con alias descriptivos
PARA cambiar entre diferentes entornos o servicios sin recordar URLs largas

**Criterios de Aceptacion:**
- CA-04.1 (agregar): DADO que estoy en configuracion CUANDO agrego URL con alias "Produccion" ENTONCES aparece en la lista
- CA-04.2 (cambiar): DADO que tengo 3 servicios CUANDO selecciono "Testing" ENTONCES los datos se cargan desde esa URL
- CA-04.3 (eliminar): DADO que elimino un servicio CUANDO confirmo ENTONCES desaparece de lista y selector

### HU-05: Agrupacion por hilo

COMO operador de cargas
QUIERO agrupar registros por hilo de correo (threadId)
PARA ver la conversacion completa de un hilo junta y colapsar hilos revisados

**Criterios de Aceptacion:**
- CA-05.1: DADO que activo "Agrupar por hilo" CUANDO la tabla se recarga ENTONCES registros con mismo threadId aparecen agrupados
- CA-05.2: DADO que un grupo esta expandido CUANDO hago click en cabecera ENTONCES se colapsa
- CA-05.3: DADO que la agrupacion esta activa CUANDO aplico filtros ENTONCES los filtros aplican dentro de los grupos

### HU-06: Respuesta masiva a correos

COMO operador de cargas
QUIERO seleccionar multiples correos y enviar una respuesta a todos
PARA gestionar respuestas eficientemente sin abrir cada correo por separado

**Criterios de Aceptacion:**
- CA-06.1: DADO que selecciono 5 correos CUANDO hago click en "Responder seleccionados" ENTONCES se abre modal con 5 destinatarios
- CA-06.2: DADO que estoy en modal CUANDO selecciono plantilla "Confirmacion" ENTONCES el cuerpo se rellena
- CA-06.3: DADO que envio CUANDO completa ENTONCES registros se marcan como GESTIONADO
- CA-06.4 (error): DADO que el envio falla CUANDO GAS retorna error ENTONCES se muestra mensaje y registros no cambian estado

### HU-07: Plantillas de respuesta editables

COMO operador de cargas
QUIERO crear y editar plantillas de respuesta en HTML con variables
PARA estandarizar las respuestas y acelerar la comunicacion

**Criterios de Aceptacion:**
- CA-07.1: DADO que creo plantilla "Confirmacion" CUANDO guardo ENTONCES persiste en storage
- CA-07.2: DADO que plantilla tiene {{nombreTransportista}} CUANDO previsualizo con datos reales ENTONCES veo valor interpolado
- CA-07.3: DADO que hago click en "Variables disponibles" ENTONCES veo lista completa de variables
- CA-07.4 (edicion): DADO que edito plantilla existente CUANDO guardo ENTONCES cambios persisten entre sesiones

### HU-08: Panel de ayuda

COMO operador nuevo
QUIERO un panel de ayuda con instrucciones de manejo
PARA aprender a usar las funcionalidades sin soporte externo

**Criterios de Aceptacion:**
- CA-08.1: DADO que hago click en icono ayuda ENTONCES se abre panel con secciones por funcionalidad
- CA-08.2: DADO que cierro y reabro ayuda ENTONCES recuerda ultima seccion visitada
- CA-08.3: DADO que estoy en seccion filtros CUANDO hago click en "?" ENTONCES ayuda posiciona en filtros

## 1.6 Requisitos No Funcionales

| Requisito | Valor | Metrica |
|-----------|-------|---------|
| Rendimiento filtrado | < 100ms | Para 1000 registros |
| Tiempo respuesta UI | < 200ms | Apertura paneles/modales |
| Almacenamiento plantillas | < 2MB | chrome.storage.local |
| Compatibilidad | Chrome 120+ | Manifest V3 |
| Accesibilidad basica | Teclado navegable | Tab/Enter en controles |

## 1.7 Analisis de Riesgos

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| Tabulator groupBy no compatible | BAJA | ALTO | Verificar version, fallback a CSS grouping |
| Limite storage para plantillas | BAJA | MEDIO | Limitar 20 plantillas, comprimir |
| Endpoint GAS envio no existe | ALTA | MEDIO | Mockear, definir interfaz minima |
| XSS en plantillas HTML | MEDIA | ALTO | Sanitizar variables, no ejecutar scripts |

## 1.8 Dependencias

- **Depende de:** Tabulator.js (incluida), chrome.storage API, endpoints GAS existentes
- **Dependido por:** Ningun otro expediente actualmente

## 1.9 Preguntas Abiertas

- Ninguna bloqueante. El endpoint GAS para envio se mockeara hasta estar disponible.

---

## PUERTA DE VALIDACION 1

- [x] AS-IS y TO-BE documentados
- [x] Todas las HU tienen formato COMO/QUIERO/PARA
- [x] Cada HU tiene minimo 3 criterios de aceptacion
- [x] Riesgos identificados con mitigacion
- [x] Sin preguntas abiertas bloqueantes

---

**Estado:** COMPLETADO
