# 00 - ESTRATEGIA

**Fase:** Definicion Estrategica
**Expediente:** Heredar_dehilos_20260226_135823
**Camino:** PROYECTO_COMPLETO
**Fecha:** 2026-02-26

---

## Objetivo

**Que:** Implementar herencia automatica de fase/estado/codCar cuando llega un correo nuevo a un hilo ya clasificado en SEGUIMIENTO, y proporcionar un tipo de accion `HEREDAR_DEL_HILO` en el motor de reglas para excepciones configurables.

**Por que:** Actualmente `processMessage()` en Main.js solo hereda `codCar` via ThreadManager/DB_HILOS, pero `fase` y `estado` siempre se asignan con defaults (`''` y `NUEVO`). Esto causa que registros nuevos de hilos ya clasificados aparezcan "sin fase" en Kanban, obligando al operador a reclasificarlos manualmente — perdida de tiempo y contexto operativo.

---

## Alcance

### QUE SI
1. Backend GAS: Nueva funcion `obtenerUltimoRegistroPorThread(threadId)` en AdaptadorHojas.js
2. Backend GAS: Herencia de fase/estado en `processMessage()` (Main.js)
3. Extension: Nuevo tipo `HEREDAR_DEL_HILO` en TIPOS_ACCION_REGLA (action-rules.js)
4. Extension: Case `HEREDAR_DEL_HILO` en `ejecutarAccionRegla()` (panel.js)
5. Extension: UI para configurar nuevo tipo en modal reglas (config-rules-ui.js)
6. Regla default inactiva como ejemplo (action-rules.js)
7. Tests unitarios con cobertura >= 80%

### QUE NO
- No se modifica ThreadManager/DB_HILOS (funciona como esta)
- No se implementa herencia de campos custom mas alla de fase/estado/codCar
- No se modifica PWA movil (solo backend GAS + extension Chrome)
- No se heredan campos propios del mensaje: messageId, asunto, fechaCorreo, cuerpo, interlocutor

---

## Criterios de Exito

1. Correo nuevo de hilo con fase="19" y estado="GESTIONADO" aparece con esos mismos valores
2. En Kanban aparece en columna "En Ruta" (no "Sin Fase")
3. Si hay alerta (auditResult.alerta), estado="ALERTA" prevalece sobre herencia
4. Si no hay registro previo en el hilo, se usan defaults (comportamiento actual)
5. Regla de usuario configurable puede sobreescribir valores heredados
6. 882 tests existentes siguen pasando (0 regresiones)
7. Tests nuevos >= 80% cobertura del codigo nuevo

---

## Restricciones

- GAS no soporta ES6 modules (usar `var` y funciones globales)
- El patron dual-compat (`if (typeof module !== 'undefined')`) debe mantenerse para tests Jest
- `obtenerUltimoRegistroPorThread` debe ser funcion GAS global (no module export)
- Performance: no agregar llamadas extra a SpreadsheetApp (reutilizar datos existentes)

---

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| Scan completo SEGUIMIENTO por threadId lento | Baja | Bajo | La hoja ya se lee completa en `procesarCorreos`; reutilizar datos |
| Herencia de estado CERRADO no deseada | Media | Medio | Regla default inactiva para sobreescribir; configurable |
| Conflicto con ThreadManager | Baja | Alto | `obtenerUltimoRegistroPorThread` es nueva, no toca ThreadManager |
| Tests existentes rotos | Baja | Alto | Ejecutar suite completa antes/despues de cada cambio |

---

## Checklist

- [x] Objetivo documentado (que y por que)
- [x] Alcance definido (que SI y que NO)
- [x] Stakeholders identificados (operador logistico)
- [x] Restricciones tecnicas/negocio claras
- [x] Riesgos principales evaluados con mitigacion

---

**Estado:** COMPLETADO
