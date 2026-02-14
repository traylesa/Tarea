# INSTRUCCIONES PARA AGENTE (PLAYBOOK OPERACIONAL)

**Expediente:** boceto_proyecto_20260213_201758
**Creado:** 2026-02-13 20:17:58
**Archivo principal:** boceto_proyecto.md

---

## 🎯 CLASIFICACIÓN DEL EXPEDIENTE

- **Categoría:** BUG
- **Severidad:** CRITICA
- **Impacto:** BAJO
- **Urgencia:** NORMAL
- **Complejidad:** EPIC

---

## 🛤️ CAMINO ESTRATÉGICO ASIGNADO

**Camino:** PROYECTO_COMPLETO

**Justificación:** Proyecto complejo que requiere análisis profundo y todas las fases

**Fases a ejecutar:** 10

---

## 📋 LISTA DE FASES (ORDEN DE EJECUCIÓN)

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

## 📖 PLAYBOOK DETALLADO DE CADA FASE


### 00_ESTRATEGIA

**Estado:** APLICA

**Objetivo:** Definir objetivo, alcance y estrategia general

**Entradas:**
- Archivo principal del expediente
- Clasificación automática

**Salidas:**
- Objetivo claro
- Criterios de éxito
- Riesgos identificados

**Checklist:**
- [ ] Objetivo documentado
- [ ] Alcance definido
- [ ] Riesgos evaluados

**Archivo completo:** `00_ESTRATEGIA.md`

---


### 01_ANALISIS

**Estado:** APLICA

**Objetivo:** Analizar requisitos funcionales y no funcionales

**Entradas:**
- 00_ESTRATEGIA.md
- Archivo principal

**Salidas:**
- AS-IS documentado
- TO-BE documentado
- Requisitos completos

**Checklist:**
- [ ] AS-IS documentado
- [ ] TO-BE documentado
- [ ] Requisitos completos

**Archivo completo:** `01_ANALISIS.md`

---


### 02_INVESTIGACION

**Estado:** APLICA

**Objetivo:** Investigar opciones técnicas y decidir enfoque

**Entradas:**
- 01_ANALISIS.md (requisitos)

**Salidas:**
- Opciones evaluadas
- Decisión técnica
- ADR (si aplica)

**Checklist:**
- [ ] 3+ opciones investigadas
- [ ] Decisión justificada
- [ ] ADR creado

**Archivo completo:** `02_INVESTIGACION.md`

---


### 03_PLAN

**Estado:** APLICA

**Objetivo:** Crear plan detallado de implementación

**Entradas:**
- 00_ESTRATEGIA.md, 01_ANALISIS.md, 02_INVESTIGACION.md

**Salidas:**
- Tareas detalladas
- Estimaciones
- Orden de ejecución

**Checklist:**
- [ ] Todas las tareas listadas
- [ ] Estimaciones completas
- [ ] Plan de testing

**Archivo completo:** `03_PLAN.md`

---


### 04_DISENO

**Estado:** APLICA

**Objetivo:** Diseñar arquitectura y modelo de datos

**Entradas:**
- 03_PLAN.md
- Código existente

**Salidas:**
- Arquitectura
- Modelo de datos
- Interfaces definidas

**Checklist:**
- [ ] Arquitectura clara
- [ ] Nombres en diccionario ⚠️
- [ ] Interfaces definidas

**Archivo completo:** `04_DISENO.md`

---


### 05_RESULTADO

**Estado:** APLICA

**Objetivo:** Implementar código con tests

**Entradas:**
- 03_PLAN.md, 04_DISENO.md
- docs/DICCIONARIO_DOMINIO.md

**Salidas:**
- Código implementado
- Tests (>= 80% cobertura)
- Code review

**Checklist:**
- [ ] Código completo
- [ ] Tests >= 80%
- [ ] Diccionario actualizado

**Archivo completo:** `05_RESULTADO.md`

---


### 06_VALIDACION

**Estado:** APLICA

**Objetivo:** Validar requisitos y ejecutar QA

**Entradas:**
- 05_RESULTADO.md
- Requisitos originales

**Salidas:**
- Requisitos verificados
- Tests E2E
- QA aprobado

**Checklist:**
- [ ] Requisitos 100%
- [ ] Tests pasando
- [ ] Performance OK

**Archivo completo:** `06_VALIDACION.md`

---


### 07_DESPLIEGUE

**Estado:** APLICA

**Objetivo:** Desplegar a producción

**Entradas:**
- 06_VALIDACION.md
- Código en rama

**Salidas:**
- Código en producción
- Smoke tests OK
- Rollback plan

**Checklist:**
- [ ] PR aprobado
- [ ] Deploy exitoso
- [ ] Smoke tests OK

**Archivo completo:** `07_DESPLIEGUE.md`

---


### 08_OPERACION

**Estado:** APLICA

**Objetivo:** Monitorear y dar soporte

**Entradas:**
- 07_DESPLIEGUE.md
- Monitoreo configurado

**Salidas:**
- Sistema estable
- Métricas en verde
- 0 incidentes críticos

**Checklist:**
- [ ] Monitoreo activo
- [ ] Métricas OK
- [ ] 0 incidentes

**Archivo completo:** `08_OPERACION.md`

---


### 09_EVOLUCION

**Estado:** APLICA

**Objetivo:** Retrospectiva y mejora continua

**Entradas:**
- 08_OPERACION.md
- Feedback usuarios

**Salidas:**
- Retrospectiva
- Lecciones aprendidas
- Roadmap actualizado

**Checklist:**
- [ ] Retrospectiva
- [ ] Lecciones aprendidas
- [ ] Mejoras priorizadas

**Archivo completo:** `09_EVOLUCION.md`

---


---

## 📚 DICCIONARIO DE DOMINIO (⚠️ OBLIGATORIO)

**Ubicación:** `docs/DICCIONARIO_DOMINIO.md` (raíz del proyecto, ÚNICO)

**REGLA FUNDAMENTAL:**
Ningún nombre nuevo de tabla/campo/variable/estado puede aparecer en el código sin estar registrado en el diccionario central primero.

**PROCESO OBLIGATORIO:**

1. **Abrir:** `docs/DICCIONARIO_DOMINIO.md` (diccionario central del proyecto)
2. **Verificar** si el nombre ya existe
3. **Si NO existe:**
   a. Abrir `PROPUESTA_DICCIONARIO.md` en este expediente
   b. Documentar propuesta de cambio completa
   c. (Opcional) Actualizar `docs/DICCIONARIO_DOMINIO.md` si tienes permiso
   d. Registrar en historial de cambios del diccionario
4. **Solo entonces implementar en código**

**Checklist mínimo:**
- [ ] Consultado `docs/DICCIONARIO_DOMINIO.md` antes de crear nombres
- [ ] Propuesta documentada en `PROPUESTA_DICCIONARIO.md` (si hay nombres nuevos)
- [ ] Diccionario central actualizado (si aprobado)
- [ ] Historial de cambios actualizado

---

## 🎯 PRÓXIMOS PASOS

1. **Revisar clasificación** y validar que el camino asignado es correcto
2. **Ejecutar fases en orden numérico** (empezando por 00_ESTRATEGIA)
3. **Consultar diccionario** antes de crear cualquier nombre nuevo
4. **Documentar propuestas** en PROPUESTA_DICCIONARIO.md
5. **Al completar todas las fases:** Ejecutar `just concluir boceto_proyecto_20260213_201758`

---

## 📝 REGLAS IMPORTANTES

1. **SOLO ejecutar fases marcadas como "APLICA"** (las listadas arriba)
2. **Respetar orden numérico** de fases (no saltarse ninguna)
3. **Consultar docs/DICCIONARIO_DOMINIO.md** ANTES de crear nombres nuevos
4. **Documentar decisiones** en cada archivo de fase
5. **Al terminar una fase:** Marcar checklist completo antes de pasar a la siguiente

---

## 🔄 TRACKING DE ESTADO

**Archivo:** `ESTADO.json`

Este archivo contiene el estado actualizado del expediente (clasificación, camino, fases, timestamps). Consultar/actualizar según progreso.

---

**Sistema:** Fábrica Agéntica v2.3.1
**Generado automáticamente por:** vigilante_v2.3.1.py
**Documentación Hub:** CLAUDE.md (raíz del proyecto)
