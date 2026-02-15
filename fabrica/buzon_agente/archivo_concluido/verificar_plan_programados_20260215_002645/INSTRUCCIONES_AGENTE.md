# INSTRUCCIONES PARA AGENTE (PLAYBOOK OPERACIONAL)

**Expediente:** verificar_plan_programados_20260215_002645
**Creado:** 2026-02-15 00:26:46
**Archivo principal:** verificar_plan_programados.txt

---

## CLASIFICACION DEL EXPEDIENTE

- **Categoria:** BUG
- **Severidad:** MEDIA
- **Impacto:** BAJO
- **Urgencia:** INMEDIATA
- **Complejidad:** EPIC

---

## CAMINO ESTRATEGICO ASIGNADO

**Camino:** PROYECTO_COMPLETO
**Justificacion:** Proyecto complejo que requiere análisis profundo y todas las fases
**Fases a ejecutar:** 10

---

## LISTA DE FASES (ORDEN DE EJECUCION)

- ✅ **00_ESTRATEGIA.md** - APLICA (ejecutar en orden)
- ✅ **01_ANALISIS.md** - APLICA (ejecutar en orden)
- ✅ **02_INVESTIGACION.md** - APLICA (ejecutar en orden)
- ✅ **03_PLAN.md** - APLICA (ejecutar en orden)
- ✅ **04_DISENO.md** - APLICA (ejecutar en orden)
- ✅ **05_RESULTADO.md** - APLICA (ejecutar en orden)
- ✅ **06_VALIDACION.md** - APLICA (ejecutar en orden)
- ✅ **07_DESPLIEGUE.md** - APLICA (ejecutar en orden)
- ✅ **08_OPERACION.md** - APLICA (ejecutar en orden)
- ✅ **09_EVOLUCION.md** - APLICA (ejecutar en orden)

---

## PLAYBOOK DETALLADO (EJECUTAR SECUENCIALMENTE)

**REGLA CRITICA:** Las puertas de validacion son BLOQUEANTES.
NO avanzar a la siguiente fase sin cumplir TODOS los items del checklist.


## FASE 0: 00_ESTRATEGIA

**Acción:** Leer `verificar_plan_programados.txt` y generar `00_ESTRATEGIA.md` con: objetivo claro, alcance (que SI y que NO), criterios de exito medibles, riesgos con mitigacion

**Entradas:**
- Archivo principal del expediente
- Clasificación automática

**Salidas esperadas:**
- Objetivo claro
- Criterios de éxito
- Riesgos identificados

**Checklist (completar EN el archivo 00_ESTRATEGIA.md):**
- [ ] Objetivo documentado
- [ ] Alcance definido
- [ ] Riesgos evaluados

### >>> PUERTA DE VALIDACION 0 <<<
NO avanzar a Fase 1 hasta verificar:
- [ ] Objetivo documentado (que y por que)
- [ ] Alcance definido (que SI y que NO)
- [ ] Riesgos evaluados con mitigacion

---


## FASE 1: 01_ANALISIS

**Acción:** Analizar `verificar_plan_programados.txt` y generar `01_ANALISIS.md` con: Historias de Usuario (COMO/QUIERO/PARA), criterios de aceptacion (DADO/CUANDO/ENTONCES, minimo 3 por HU), requisitos no funcionales, dependencias

**Entradas:**
- 00_ESTRATEGIA.md
- Archivo principal

**Salidas esperadas:**
- AS-IS documentado
- TO-BE documentado
- Requisitos completos

**Checklist (completar EN el archivo 01_ANALISIS.md):**
- [ ] AS-IS documentado
- [ ] TO-BE documentado
- [ ] Requisitos completos

### >>> PUERTA DE VALIDACION 1 <<<
NO avanzar a Fase 2 hasta verificar:
- [ ] Todas las HU tienen formato COMO/QUIERO/PARA
- [ ] Cada HU tiene minimo 3 criterios de aceptacion
- [ ] Riesgos identificados con mitigacion
- [ ] Si hay preguntas abiertas: PARAR y consultar

---


## FASE 2: 02_INVESTIGACION

**Acción:** Investigar el codebase existente y generar `02_INVESTIGACION.md` con: mapa de impacto (archivos afectados con rutas exactas), patrones existentes a reutilizar, tests que podrian romperse, spike tecnico si hay incertidumbre

**Entradas:**
- 01_ANALISIS.md (requisitos)

**Salidas esperadas:**
- Opciones evaluadas
- Decisión técnica
- ADR (si aplica)

**Checklist (completar EN el archivo 02_INVESTIGACION.md):**
- [ ] 3+ opciones investigadas
- [ ] Decisión justificada
- [ ] ADR creado

### >>> PUERTA DE VALIDACION 2 <<<
NO avanzar a Fase 3 hasta verificar:
- [ ] Mapa de impacto completo (archivos + rutas exactas)
- [ ] Precauciones criticas identificadas
- [ ] Spike resuelto (si aplico)

---


## FASE 3: 03_PLAN

**Acción:** Generar `03_PLAN.md` con: desglose de tareas (WBS con complejidad S/M/L), estrategia TDD (que tests escribir primero), Definition of Done especifica para este expediente

**Entradas:**
- 00_ESTRATEGIA.md, 01_ANALISIS.md, 02_INVESTIGACION.md

**Salidas esperadas:**
- Tareas detalladas
- Estimaciones
- Orden de ejecución

**Checklist (completar EN el archivo 03_PLAN.md):**
- [ ] Todas las tareas listadas
- [ ] Estimaciones completas
- [ ] Plan de testing

### >>> PUERTA DE VALIDACION 3 <<<
NO avanzar a Fase 4/5 hasta verificar:
- [ ] Todas las tareas tienen complejidad y dependencia
- [ ] Estrategia TDD definida (que tests primero)
- [ ] DoD completo y verificable

---


## FASE 4: 04_DISENO

**Acción:** Generar `04_DISENO.md` con: modelos/entidades (campos, tipos, relaciones), API/endpoints (si aplica), migraciones de BD, diagramas de flujo (si complejidad >= L)

**Entradas:**
- 03_PLAN.md
- Código existente

**Salidas esperadas:**
- Arquitectura
- Modelo de datos
- Interfaces definidas

**Checklist (completar EN el archivo 04_DISENO.md):**
- [ ] Arquitectura clara
- [ ] Nombres en diccionario ⚠️
- [ ] Interfaces definidas

### >>> PUERTA DE VALIDACION 4 <<<
NO avanzar a Fase 5 hasta verificar:
- [ ] Nombres en docs/DICCIONARIO_DOMINIO.md
- [ ] Modelos coherentes con arquitectura existente
- [ ] Interfaces definidas

---


## FASE 5: 05_RESULTADO

**Acción:** ESCRIBIR CODIGO REAL en src/ siguiendo TDD estricto: (1) Escribir tests que fallen (Red), (2) Escribir codigo minimo para que pasen (Green), (3) Refactorizar (Refactor). Documentar en `05_RESULTADO.md` los archivos creados/modificados y resultados de tests

**Entradas:**
- 03_PLAN.md, 04_DISENO.md
- docs/DICCIONARIO_DOMINIO.md

**Salidas esperadas:**
- Código implementado
- Tests (>= 80% cobertura)
- Code review

**Checklist (completar EN el archivo 05_RESULTADO.md):**
- [ ] Código completo
- [ ] Tests >= 80%
- [ ] Diccionario actualizado

### >>> PUERTA DE VALIDACION 5 <<<
NO avanzar a Fase 6 hasta verificar:
- [ ] TODOS los tests nuevos pasan
- [ ] CERO tests existentes rotos
- [ ] Codigo escrito en src/ (NO solo documentacion)
- [ ] Cobertura >= 80% del codigo nuevo

---


## FASE 6: 06_VALIDACION

**Acción:** Ejecutar TODOS los tests, verificar criterios de aceptacion de Fase 01, completar checklist DoD de Fase 03. Generar `06_VALIDACION.md` con resultados

**Entradas:**
- 05_RESULTADO.md
- Requisitos originales

**Salidas esperadas:**
- Requisitos verificados
- Tests E2E
- QA aprobado

**Checklist (completar EN el archivo 06_VALIDACION.md):**
- [ ] Requisitos 100%
- [ ] Tests pasando
- [ ] Performance OK

### >>> PUERTA DE VALIDACION 6 <<<
NO avanzar a Fase 7 hasta verificar:
- [ ] TODOS los criterios de aceptacion verificados
- [ ] DoD 100% completado
- [ ] Suite completa de tests ejecutada

---


## FASE 7: 07_DESPLIEGUE

**Acción:** Preparar deployment: PR, merge, deploy commands, smoke tests. Documentar en `07_DESPLIEGUE.md`

**Entradas:**
- 06_VALIDACION.md
- Código en rama

**Salidas esperadas:**
- Código en producción
- Smoke tests OK
- Rollback plan

**Checklist (completar EN el archivo 07_DESPLIEGUE.md):**
- [ ] PR aprobado
- [ ] Deploy exitoso
- [ ] Smoke tests OK

### >>> PUERTA DE VALIDACION 7 <<<
- [ ] Deploy exitoso
- [ ] Smoke tests OK
- [ ] Rollback plan documentado

---


## FASE 8: 08_OPERACION

**Acción:** Documentar plan de monitoreo y soporte en `08_OPERACION.md`

**Entradas:**
- 07_DESPLIEGUE.md
- Monitoreo configurado

**Salidas esperadas:**
- Sistema estable
- Métricas en verde
- 0 incidentes críticos

**Checklist (completar EN el archivo 08_OPERACION.md):**
- [ ] Monitoreo activo
- [ ] Métricas OK
- [ ] 0 incidentes

### >>> PUERTA DE VALIDACION 8 <<<
- [ ] Monitoreo configurado
- [ ] Plan de soporte documentado

---


## FASE 9: 09_EVOLUCION

**Acción:** Retrospectiva y lecciones aprendidas en `09_EVOLUCION.md`. Actualizar CLAUDE.md y docs si hubo cambios arquitectonicos

**Entradas:**
- 08_OPERACION.md
- Feedback usuarios

**Salidas esperadas:**
- Retrospectiva
- Lecciones aprendidas
- Roadmap actualizado

**Checklist (completar EN el archivo 09_EVOLUCION.md):**
- [ ] Retrospectiva
- [ ] Lecciones aprendidas
- [ ] Mejoras priorizadas

### >>> PUERTA FINAL <<<
- [ ] Retrospectiva completada
- [ ] Documentacion proyecto actualizada
- [ ] Listo para: `just concluir [expediente]`

---


---

## DICCIONARIO DE DOMINIO (OBLIGATORIO)

**Ubicacion:** `docs/DICCIONARIO_DOMINIO.md` (raiz del proyecto, UNICO)

**REGLA FUNDAMENTAL:**
Ningun nombre nuevo de tabla/campo/variable/estado puede aparecer en el codigo
sin estar registrado en el diccionario central primero.

**PROCESO:**
1. Consultar `docs/DICCIONARIO_DOMINIO.md`
2. Si NO existe el nombre: documentar en `PROPUESTA_DICCIONARIO.md` de este expediente
3. Actualizar diccionario central
4. Solo entonces implementar en codigo

---

## REGLAS IMPORTANTES

1. Ejecutar fases en ORDEN NUMERICO (no saltarse ninguna)
2. Las puertas de validacion son BLOQUEANTES (no avanzar sin cumplir)
3. Consultar docs/DICCIONARIO_DOMINIO.md ANTES de crear nombres nuevos
4. Fase 05_RESULTADO = ESCRIBIR CODIGO REAL en src/ (no solo documentar)
5. Seguir TDD: test primero (Red), codigo minimo (Green), refactorizar (Refactor)
6. Al terminar TODAS las fases: `just concluir verificar_plan_programados_20260215_002645`

---

## ESTADO DEL EXPEDIENTE

- [ ] Archivo recibido
- [ ] 00_ESTRATEGIA
- [ ] 01_ANALISIS
- [ ] 02_INVESTIGACION
- [ ] 03_PLAN
- [ ] 04_DISENO
- [ ] 05_RESULTADO
- [ ] 06_VALIDACION
- [ ] 07_DESPLIEGUE
- [ ] 08_OPERACION
- [ ] 09_EVOLUCION
- [ ] Expediente concluido

---

## TRACKING

**Archivo:** `ESTADO.json` - Actualizar segun progreso.
**Hub:** `CLAUDE.md` (raiz del proyecto)

---

**Sistema:** Fabrica Agentica v2.3.1
**Generado automaticamente por:** vigilante_v2.3.1.py
