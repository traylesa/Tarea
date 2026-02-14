# 00 - ESTRATEGIA

**Fase:** Definicion Estrategica
**Expediente:** FiltosyMensajes_20260213_225601
**Camino:** MINI_PROYECTO

---

## OBJETIVO

**Que:** Dotar a la extension Chrome "LogiTask Orchestrator" de un sistema completo de filtros avanzados, gestion de multiples URLs GAS, agrupacion por hilos, respuesta masiva con plantillas editables y panel de ayuda contextual.

**Por que:** La version actual solo tiene un filtro basico por tipo de tarea (select). Los usuarios necesitan buscar informacion especifica entre cientos de registros de correo, comparar datos entre hilos, y responder eficientemente usando plantillas predefinidas. Sin estas capacidades, el sistema es solo de consulta pasiva.

---

## ALCANCE

### QUE SI

1. **Filtros avanzados colapsables:** Panel desplegable con filtros por campo (contiene/no contiene), combinados con operador AND
2. **Filtro por rango de fechas:** Selector de fecha inicio/fin para `fechaCorreo`
3. **Filtros en cabecera de columna:** Input en cada columna para filtrado rapido (ya parcialmente implementado con Tabulator headerFilter)
4. **Baterias de filtros predefinidos:** Filtros inteligentes por contexto (alertas activas, sin vincular, operativos recientes, etc.)
5. **Selector multiple de URLs GAS:** Configuracion con alias legibles para el usuario
6. **Agrupacion/colapso por hilo:** Agrupar registros por `threadId` con expansion/colapso
7. **Respuesta masiva:** Seleccion multiple de correos + envio usando plantillas
8. **Plantillas de respuesta editables:** Editor HTML con variables, previsualizacion y firma basica
9. **Etiqueta de ayuda:** Panel colapsable con instrucciones de manejo

### QUE NO

- No se modifica el backend GAS (solo se consumen endpoints existentes + nuevos si necesario)
- No se implementa autenticacion de usuarios
- No se migra a framework SPA (se mantiene vanilla JS + Tabulator)
- No se cambia el manifest_version ni permisos existentes

---

## CRITERIOS DE EXITO

1. El usuario puede filtrar registros por cualquier campo con "contiene" y "no contiene"
2. El filtro de fechas permite rango inicio-fin y se combina con otros filtros (AND)
3. Existen al menos 5 baterias de filtros predefinidos accesibles con un click
4. El usuario puede configurar multiples URLs GAS con alias descriptivos
5. Los registros se pueden agrupar/colapsar por `threadId`
6. Se pueden seleccionar multiples correos y enviar respuesta masiva
7. Las plantillas de respuesta son editables en HTML con variables interpolables
8. Existe un panel de ayuda accesible con informacion de manejo
9. Todos los tests unitarios pasan (>= 80% cobertura del codigo nuevo)

---

## RESTRICCIONES

- **Tecnologicas:** Vanilla JS, Tabulator.js, Chrome Extension Manifest V3
- **Compatibilidad:** Chrome 120+ (Manifest V3 estable)
- **UX:** Interfaz consistente con panel.css existente (colores #1a73e8, tipografia Segoe UI)
- **Rendimiento:** Filtrado < 100ms para 1000 registros
- **Almacenamiento:** chrome.storage.local (limite 10MB, plantillas incluidas)

---

## RIESGOS

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| Tabulator no soporta agrupacion nativa por hilo | BAJA | ALTO | Tabulator tiene `groupBy`, verificar compatibilidad con version incluida |
| Limite chrome.storage.local para plantillas HTML | BAJA | MEDIO | Comprimir plantillas, limitar a 20 plantillas max |
| Envio masivo de correos requiere endpoint GAS nuevo | ALTA | MEDIO | Definir interfaz fetch minima, mockear para desarrollo |
| Filtros combinados degradan rendimiento con muchos registros | BAJA | MEDIO | Usar Tabulator filters nativos, no filtrado manual |
| Editor HTML XSS en plantillas | MEDIA | ALTO | Sanitizar variables al interpolar, no ejecutar scripts |

---

## SALIDAS

- [x] Objetivo claro del expediente
- [x] Criterios de exito definidos
- [x] Restricciones identificadas
- [x] Riesgos principales listados

## CHECKLIST

- [x] Objetivo documentado (que y por que)
- [x] Alcance definido (que SI y que NO)
- [x] Stakeholders identificados (usuario operador de cargas)
- [x] Restricciones tecnicas/negocio claras
- [x] Riesgos principales evaluados

---

**Estado:** COMPLETADO
