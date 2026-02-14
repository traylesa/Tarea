# 01 - ANALISIS

**Fase:** Analisis de Requisitos
**Expediente:** FiltosyMensajes_20260214_000831
**Camino:** MINI_PROYECTO

---

## AS-IS (Estado Actual)

La extension ya tiene implementado:

1. **Filtros avanzados colapsables** (filters.js): Panel con filtros personalizados (campo + operador + valor), rango de fechas, baterias predefinidas
2. **headerFilters en columnas**: Estado (list), CODCAR (input), Transportista (input), Email (input), Tipo (list)
3. **Plantillas de respuesta** (templates.js): CRUD, interpolacion {{var}}, sanitizacion HTML, previsualizacion
4. **Respuesta masiva** (bulk-reply.js): Seleccion multiple, modal con plantilla seleccionable, envio via GAS
5. **Servicios GAS multi-URL** (gas-services.js): CRUD servicios con alias
6. **Agrupacion por hilos** (thread-grouping.js): Toggle agrupar por threadId
7. **Ayuda** (help-content.js): Panel con secciones navegables

### Gaps identificados

- No hay filtro global (buscar texto libre en todos los campos)
- Columnas "Asunto" y "Vinculacion" no tienen headerFilter
- No hay indicador visual de filtros activos
- En el modal de respuesta no se puede previsualizar el HTML antes de enviar
- La firma en el modal de respuesta es un textarea libre, no se puede elegir firma de plantilla
- El boton "Limpiar filtros" solo limpia filtros avanzados, no headerFilters

---

## TO-BE (Estado Deseado)

1. Input de busqueda global sobre la tabla que filtra en TODOS los campos simultaneamente
2. Todas las columnas con headerFilter (anadir a Asunto y columna de Acciones/Vinculacion)
3. Badge/contador que muestra cuantos filtros estan activos
4. Boton maestro "Limpiar todo" que resetea: filtro global + filtros avanzados + headerFilters + rango fechas
5. En modal de respuesta: seccion de previsualizacion HTML renderizada
6. En modal de respuesta: selector de firma (de plantilla guardada o personalizada)

---

## Historias de Usuario

### HU-1: Busqueda global rapida

**COMO** operador de logistica
**QUIERO** escribir texto en un campo de busqueda global y que filtre en todos los campos de la tabla
**PARA** encontrar rapidamente un correo sin saber en que columna esta la informacion

**Criterios de Aceptacion:**

1. DADO que escribo "Garcia" en el campo de busqueda global, CUANDO la tabla se filtra, ENTONCES muestra solo filas donde alguna columna contiene "Garcia" (case insensitive)
2. DADO que tengo filtro global activo y tambien filtros avanzados, CUANDO ambos aplican, ENTONCES se combinan con AND (solo filas que cumplen ambos)
3. DADO que borro el texto del campo global, CUANDO queda vacio, ENTONCES el filtro global se desactiva (los demas filtros siguen)
4. DADO que escribo rapido multiples caracteres, CUANDO el input cambia, ENTONCES se aplica con debounce de 300ms para no bloquear UI

### HU-2: HeaderFilters completos

**COMO** operador de logistica
**QUIERO** poder filtrar por la columna Asunto directamente desde la cabecera de la tabla
**PARA** buscar correos por tema sin usar el panel de filtros avanzados

**Criterios de Aceptacion:**

1. DADO que la tabla se renderiza, CUANDO veo la cabecera, ENTONCES la columna "Asunto" tiene un input de headerFilter
2. DADO que escribo en el headerFilter de Asunto, CUANDO aplico, ENTONCES filtra filas cuyo asunto contiene el texto
3. DADO que uso headerFilter y filtro global simultaneamente, CUANDO ambos aplican, ENTONCES se combinan con AND

### HU-3: Contador de filtros activos

**COMO** operador de logistica
**QUIERO** ver cuantos filtros tengo activos en un indicador visual
**PARA** saber si estoy viendo datos filtrados o la tabla completa

**Criterios de Aceptacion:**

1. DADO que no hay filtros activos, CUANDO veo la barra de controles, ENTONCES no se muestra ningun badge
2. DADO que aplico 3 filtros (1 global + 2 avanzados), CUANDO veo los controles, ENTONCES muestra badge "3 filtros"
3. DADO que limpio todos los filtros, CUANDO veo los controles, ENTONCES el badge desaparece

### HU-4: Limpiar todos los filtros

**COMO** operador de logistica
**QUIERO** un unico boton que limpie ABSOLUTAMENTE todos los filtros
**PARA** volver al estado completo de la tabla con un solo click

**Criterios de Aceptacion:**

1. DADO que tengo filtro global + filtros avanzados + headerFilters + rango fechas activos, CUANDO click "Limpiar todo", ENTONCES todos se resetean
2. DADO que limpio todo, CUANDO la tabla se actualiza, ENTONCES muestra todos los registros y el conteo es total
3. DADO que limpio todo, CUANDO miro los inputs, ENTONCES el campo global, los headerFilters y los campos de fecha estan vacios

### HU-5: Previsualizacion en modal de respuesta

**COMO** operador de logistica
**QUIERO** ver una previsualizacion del HTML renderizado en el modal de respuesta masiva antes de enviar
**PARA** verificar que el mensaje se ve correctamente con los datos interpolados

**Criterios de Aceptacion:**

1. DADO que estoy en el modal de respuesta con plantilla seleccionada, CUANDO click "Previsualizar", ENTONCES veo el HTML renderizado con datos del primer registro seleccionado
2. DADO que edito el cuerpo manualmente, CUANDO click "Previsualizar", ENTONCES la previsualizacion se actualiza
3. DADO que el HTML contiene scripts, CUANDO previsualizo, ENTONCES los scripts son eliminados (sanitizarHtml)

### HU-6: Firma elegible en respuesta

**COMO** operador de logistica
**QUIERO** poder elegir la firma de una plantilla guardada o escribir una personalizada al responder
**PARA** usar diferentes firmas segun la situacion sin tener que reescribirlas

**Criterios de Aceptacion:**

1. DADO que abro el modal de respuesta, CUANDO veo el campo firma, ENTONCES hay un selector: "Sin firma", "Personalizada" y las firmas de cada plantilla guardada
2. DADO que selecciono firma de plantilla "Confirmacion", CUANDO se aplica, ENTONCES el campo firma se rellena con la firma de esa plantilla
3. DADO que selecciono "Personalizada", CUANDO escribo en el textarea, ENTONCES esa firma se usa al enviar

---

## Requisitos No Funcionales

| ID | Requisito | Metrica |
|----|-----------|---------|
| RNF-1 | Debounce en filtro global | 300ms |
| RNF-2 | No regresiones en tests existentes | 0 tests rotos |
| RNF-3 | Cobertura tests nuevos | >= 80% |
| RNF-4 | Compatible con Tabulator 6.3.x | Sin cambios en version |
| RNF-5 | Sanitizacion HTML en previsualizacion | XSS protegido |

---

## Dependencias

- Tabulator.js 6.3.x (ya instalado)
- Modulos existentes: filters.js, templates.js, bulk-reply.js
- chrome.storage.local para persistencia

---

## CHECKLIST

- [x] AS-IS documentado
- [x] TO-BE documentado
- [x] Requisitos completos

## PUERTA DE VALIDACION 1

- [x] Todas las HU tienen formato COMO/QUIERO/PARA
- [x] Cada HU tiene minimo 3 criterios de aceptacion
- [x] Riesgos identificados con mitigacion (ver 00_ESTRATEGIA)
- [x] Sin preguntas abiertas

---

**Estado:** COMPLETADO
