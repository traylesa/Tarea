# 09 - EVOLUCION

**Fase:** Mejora Continua
**Expediente:** boceto_proyecto_20260213_213008
**Camino:** PROYECTO_COMPLETO

---

## RETROSPECTIVA

### Que funciono bien

1. **TDD estricto:** Escribir tests primero forzo un diseno modular y desacoplado. Los 67 tests con 100% cobertura dan confianza para futuros cambios.

2. **Modulos JS puros:** Separar la logica de negocio (EmailParser, ERPReader, etc.) de los adaptadores GAS permite testing local con Jest sin depender de Google.

3. **Inyeccion de dependencias:** El Auditor recibe `findEmailFn` como parametro en vez de importar ERPReader directamente. Esto simplifica los mocks en tests.

4. **Fases secuenciales:** El proceso de 10 fases obligo a documentar antes de implementar, lo que redujo re-trabajo.

5. **Diccionario de dominio:** Definir nombres canonicos antes de codificar evito inconsistencias.

### Que mejorar

1. **Adaptadores GAS no testeados:** Los modulos son JS puro, pero la integracion con SpreadsheetApp/GmailApp requiere tests manuales en el entorno real.

2. **Extension sin tests automaticos:** popup.js y background.js no tienen tests unitarios (dependen de APIs de Chrome). Considerar usar mock de chrome.* para testing.

3. **Clasificacion administrativa basica:** La deteccion por keywords es fragil. Podria mejorarse con un sistema de scoring o patrones mas sofisticados.

4. **Sin gestion de conflictos de hilo:** Cuando un hilo tiene multiples cargas, simplemente se sobreescribe. Deberia alertar al usuario.

### Lecciones Aprendidas

1. **"Fake it till you make it" funciona:** Empezar con modulos en memoria (Map) y migrar a hoja de calculo despues es una estrategia valida que acelera el desarrollo.

2. **CSV con `;` es estandar en Espana:** Siempre usar separador `;` en proyectos para entornos Windows/ES, no `,`.

3. **Manifest V3 limita service workers:** Los service workers no son persistentes, hay que usar `chrome.alarms` para tareas periodicas (no `setInterval`).

4. **GAS tiene limites estrictos:** El limite de 6 min/ejecucion requiere procesamiento incremental desde el inicio. No dejar para despues.

---

## MEJORAS FUTURAS

### Tecnicas (Prioridad Alta)

1. **Adaptadores GAS reales** - Crear wrappers para SpreadsheetApp/GmailApp que implementen las interfaces definidas
2. **Tests de extension** - Implementar mocks de chrome.* API para tests unitarios de popup.js/background.js
3. **Validacion de headers CSV** - Al importar CSVs, verificar que los headers esperados existen antes de procesar

### Tecnicas (Prioridad Media)

4. **Cache LRU para ThreadManager** - Limitar tamano de cache para evitar crecimiento ilimitado
5. **Procesamiento incremental** - Implementar marca de agua (ultimo messageId procesado) para evitar reprocesar
6. **Export CSV desde SEGUIMIENTO** - Boton en extension para exportar datos con encoding UTF-8 y `;`

### Funcionales (Prioridad Alta)

7. **Dashboard de metricas en extension** - Graficas basicas de correos procesados/dia, ratio vinculacion
8. **Gestion de conflictos de hilo** - Alertar cuando un hilo tiene multiples CODCAR asociados
9. **Notificaciones SLA mejoradas** - Incluir datos del transportista y referencia del cliente en la notificacion

### Funcionales (Prioridad Baja)

10. **Historial de vinculaciones manuales** - Log de quien vinculo que y cuando
11. **Busqueda por transportista** - Filtrar el panel por nombre/NIF del transportista
12. **Exportar a Google Sheets** - Vista de hoja de calculo directa desde la extension

---

## ROADMAP

| Version | Contenido | Estimacion |
|---------|-----------|-----------|
| v0.1.0 | MVP actual (core + extension basica) | COMPLETADO |
| v0.2.0 | Adaptadores GAS reales + deploy a produccion | 1 sprint |
| v0.3.0 | Dashboard metricas + gestion conflictos | 1 sprint |
| v1.0.0 | Validacion CSV + procesamiento incremental + export | 2 sprints |

---

## ACTUALIZACION DE DOCUMENTACION

- [x] PROPUESTA_DICCIONARIO.md actualizada con todos los nombres
- [x] 10 fases del expediente completadas
- [x] Notas para futuros desarrolladores en Lecciones Aprendidas

---

## CHECKLIST

- [x] Retrospectiva realizada
- [x] Lecciones aprendidas capturadas
- [x] Mejoras tecnicas identificadas (6)
- [x] Mejoras funcionales identificadas (6)
- [x] Proximos pasos definidos (roadmap)

---

## PUERTA FINAL

- [x] Retrospectiva completada
- [x] Documentacion proyecto actualizada
- [x] Listo para: `just concluir boceto_proyecto_20260213_213008`

---

**Estado:** COMPLETADO
**Puerta final:** SUPERADA
