# 05 - RESULTADO (IMPLEMENTACIÓN TDD)

**Fase:** Implementación con TDD
**Expediente:** OPTIMIZA_TareaLog_Copiloto_4Sprint_20260215_190710
**Camino:** PROYECTO_COMPLETO

---

## OBJETIVO

Ejecutar el plan de 03_PLAN.md siguiendo TDD estricto.
ESCRIBIR CODIGO REAL en src/ (NO solo documentar).

---

## ENTRADAS

- 03_PLAN.md (tareas, estrategia TDD y DoD)
- 04_DISENO.md (diseño técnico, modelos, interfaces)
- docs/DICCIONARIO_DOMINIO.md (nombres canónicos)

---

## PASO 1: TESTS (Red)

Escribir tests que FALLEN (aún no hay implementación):

| # | Test | Archivo | Estado |
|---|------|---------|--------|
| 1 | [Descripción test] | tests/test_xxx.py | RED |
| 2 | [Descripción test] | tests/test_xxx.py | RED |

```bash
# Ejecutar tests (deben fallar)
pytest tests/ -v --tb=short
# Resultado esperado: X failed
```

---

## PASO 2: CÓDIGO (Green)

Escribir código MÍNIMO para que los tests pasen:

| # | Archivo | Acción | Líneas | Descripción |
|---|---------|--------|--------|-------------|
| 1 | src/xxx.py | creado | [N] | [Qué hace] |
| 2 | src/xxx.py | modificado | [N] | [Qué cambió] |

```bash
# Ejecutar tests (deben pasar)
pytest tests/ -v --tb=short
# Resultado esperado: X passed, 0 failed
```

---

## PASO 3: REFACTOR

Mejoras aplicadas post-green (manteniendo tests en verde):
- [Mejora 1: qué se mejoró y por qué]
- [Mejora 2: qué se mejoró y por qué]

```bash
# Verificar que siguen pasando después de refactor
pytest tests/ -v --tb=short
# Resultado: X passed, 0 failed
```

---

## RESULTADO FINAL

### Archivos Creados/Modificados
| Archivo | Acción | Líneas | Descripción |
|---------|--------|--------|-------------|
| src/xxx.py | creado | [N] | [Qué hace] |
| tests/test_xxx.py | creado | [N] | [Qué testea] |

### Resultados de Tests
- **Unitarios:** [X] passed, [Y] failed
- **Integración:** [X] passed, [Y] failed
- **Cobertura:** [%]

### Ejecución Real
```
[PEGAR SALIDA REAL DE PYTEST AQUÍ - NO INVENTAR]
```

### Notas de Implementación
[Decisiones tomadas durante implementación, desviaciones del plan, problemas encontrados y cómo se resolvieron]

---

## >>> PUERTA DE VALIDACION 5 <<<

NO avanzar a Fase 6 hasta verificar:
- [ ] TODOS los tests nuevos pasan (salida real pegada arriba)
- [ ] CERO tests existentes rotos
- [ ] Código escrito en src/ (NO solo documentación)
- [ ] Cobertura >= 80% del código nuevo
- [ ] Nombres verificados en docs/DICCIONARIO_DOMINIO.md
- [ ] PROPUESTA_DICCIONARIO.md actualizada (si hay nombres nuevos)
- [ ] Si hay fallos: corregir ANTES de avanzar

---

**Estado:** NO INICIADO
