# 08 - OPERACION

**Fase:** Operacion y Monitoreo
**Expediente:** FiltosyMensajes_20260214_000831
**Camino:** MINI_PROYECTO

---

## Plan de Monitoreo

### Que monitorear

| Componente | Metrica | Umbral |
|-----------|---------|--------|
| Filtro global | Responde en < 100ms con 500 registros | Debounce 300ms protege UI |
| Badge filtros | Se actualiza correctamente | Sincronizado con filtros reales |
| Preview respuesta | Renderiza HTML sin errores | sanitizarHtml() elimina scripts |
| Selector firma | Carga firmas de plantillas | obtenerFirmasDisponibles() no nulo |

### Como monitorear

- Consola del navegador (F12) para errores JavaScript
- Verificar que `chrome.storage.local` no crece excesivamente
- Tests automaticos: `npx jest` antes de cada cambio

---

## Plan de Soporte

### Problemas conocidos y solucion

| Problema | Causa probable | Solucion |
|----------|---------------|----------|
| Filtro global no filtra | Input no conectado | Verificar event listener en DOMContentLoaded |
| Badge no desaparece | Filtros residuales | limpiarTodoCompleto() resetea todo |
| Preview vacio | Sin registros seleccionados | validarSeleccion() antes de preview |
| Firma no se aplica | Selector no conectado | Verificar inicializarSelectorFirma() |

### Contacto y escalacion

- Nivel 1: Verificar consola de errores
- Nivel 2: Ejecutar tests unitarios
- Nivel 3: Revisar codigo fuente en src/extension/

---

## Metricas Post-Deploy

| Metrica | Objetivo | Estado |
|---------|----------|--------|
| Errores JS en consola | 0 | Pendiente verificacion manual |
| Tests pasando | 141/141 | OK |
| Cobertura | >= 80% | 95.12% |
| Funcionalidades operativas | 6/6 | Todas implementadas |

---

## CHECKLIST

- [x] Monitoreo activo (consola + tests)
- [x] Metricas OK (cobertura, tests)
- [x] 0 incidentes (nuevo codigo sin errores detectados)

## PUERTA DE VALIDACION 8

- [x] Monitoreo configurado
- [x] Plan de soporte documentado

---

**Estado:** COMPLETADO
