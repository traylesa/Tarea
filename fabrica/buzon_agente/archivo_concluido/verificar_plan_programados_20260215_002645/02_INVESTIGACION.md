# 02 - INVESTIGACION

**Fase:** Investigacion del Codebase + Verificacion Tecnica
**Expediente:** verificar_plan_programados_20260215_002645

---

## 2.1 Mapa de Impacto (Verificacion plan vs realidad)

| Archivo | Plan decia | Estado real | Conformidad |
|---------|-----------|-------------|-------------|
| `src/gas/Configuracion.js` (L31-93) | +HOJA_PROGRAMADOS, +HEADERS_PROGRAMADOS | Implementado + horario laboral extra (no en plan original) | CONFORME + AMPLIADO |
| `src/gas/AdaptadorHojas.js` (L117-166) | +4 funciones CRUD | 4 funciones implementadas exactas | CONFORME |
| `src/gas/Codigo.js` (L212-381) | +3 endpoints, extender trigger, +LockService | 5 endpoints (3 plan + 2 extras horario) + trigger + LockService | CONFORME + AMPLIADO |
| `src/extension/panel.html` (L165-193, L422-431, L289-322) | +date/time picker, +panel programados | Modal con checkbox, panel colapsable, config horario | CONFORME + AMPLIADO |
| `src/extension/panel.js` (L1763-1965) | +programarEnvioMasivo(), +vista, +handlers | Todas las funciones implementadas | CONFORME |
| `src/extension/panel.css` (L1095-1141) | +estilos programados | Estilos completos | CONFORME |
| `src/extension/scheduled.js` (completo) | Nuevo: logica pura | 6 funciones con dual-compat | CONFORME |
| `src/extension/popup.html` (L15-53) | +seccion programados | Panel con filtro y tabla | CONFORME |
| `src/extension/popup.js` (L405-527) | +cargarProgramados, fix luxon | Funciones completas, sorter custom (L167-170) | CONFORME |

**Conformidad general: 100%** — Todos los archivos del plan estan implementados.
**Extras no previstos:** Horario laboral configurable (mejora no prevista en plan original pero coherente).

---

## 2.2 Patrones Existentes Reutilizados

### Patron dual-compat (reutilizado correctamente en scheduled.js)
```javascript
// scheduled.js linea 43-51
if (typeof module !== 'undefined') {
  module.exports = {
    ESTADOS_PROGRAMADO: ESTADOS_PROGRAMADO,
    formatearEstadoProgramado: formatearEstadoProgramado,
    // ...
  };
}
```

### Patron CRUD Sheets (reutilizado en AdaptadorHojas.js)
```javascript
// Mismo patron que guardarRegistro/leerRegistros
function guardarProgramado(registro) {
  var hoja = obtenerHoja(HOJA_PROGRAMADOS);
  var fila = HEADERS_PROGRAMADOS.map(function(h) {
    return registro[h] !== undefined ? registro[h] : '';
  });
  hoja.appendRow(fila);
}
```

### Patron endpoint GAS (reutilizado en Codigo.js)
```javascript
// Mismo patron que accionGetRegistros/accionActualizarCampo
if (action === 'programarEnvio') return accionProgramarEnvio(body);
```

---

## 2.3 Analisis de Tests Existentes

- **Tests relacionados:** `test_bulk_reply.js` (construirPayload reutilizado por programados)
- **Cobertura zona afectada:** scheduled.js tiene 0% cobertura (sin test)
- **Tests que podrian romperse:** Ninguno — las funciones nuevas no modifican APIs existentes
- **Estado tests:** 84 tests pasando en test_bulk_reply + test_templates + test_filters

---

## 2.4 Spike Tecnico

No aplica. La arquitectura elegida (cola en Sheets + trigger unico) esta probada y es la mas adecuada dadas las restricciones de GAS.

---

## 2.5 Opciones Evaluadas (Verificacion decision del plan)

### Opcion 1: Cola en Sheets + trigger periodico unico (ELEGIDA)
- **Pros:** Visual, auditable, ilimitada, un solo trigger
- **Cons:** Precision +-15 min, lento con muchas filas
- **Complejidad:** M
- **Veredicto:** CORRECTA para el caso de uso

### Opcion 2: Cola en PropertiesService + triggers individuales
- **Pros:** Mas rapido acceso, precision por trigger individual
- **Cons:** Limite 500KB, limite 20 triggers, no visual/auditable
- **Complejidad:** L
- **Veredicto:** DESCARTADA correctamente

### Opcion 3: Cola en PropertiesService + trigger unico
- **Pros:** Acceso rapido, un solo trigger
- **Cons:** Limite 500KB, no visual, dificil depurar
- **Complejidad:** S
- **Veredicto:** DESCARTADA correctamente (500KB insuficiente para historico)

---

## 2.6 Verificacion de Decisiones

| Criterio | Op.1 (Sheets) | Op.2 (Props+multi) | Op.3 (Props+unico) |
|----------|--------------|-------------------|-------------------|
| Auditabilidad | Alta | Baja | Baja |
| Escalabilidad | Alta | Baja (500KB) | Baja (500KB) |
| Simplicidad | Media | Baja (multi-trigger) | Alta |
| Precision | Media (+-15min) | Alta | Media |
| **Total** | **MEJOR** | Peor | Aceptable |

---

## 2.7 Decision (ADR)

**Opcion seleccionada:** Cola en Sheets + trigger periodico unico
**Justificacion:** Es la unica opcion que ofrece auditabilidad visual (operadores pueden ver/editar la hoja directamente), escalabilidad ilimitada, y usa un solo trigger (evita limite 20). La precision +-15 min es aceptable para logistica.
**Conclusion verificacion:** La decision del plan es CORRECTA y OPTIMA para el caso de uso.

---

## 2.8 Hallazgos y Optimizaciones Detectadas

### Optimizaciones prioritarias
1. **[P1] Falta test_scheduled.js** — El unico modulo de logica pura sin tests
2. **[P2] Falta entidad PROGRAMADOS en diccionario** — Viola la regla fundamental del proyecto
3. **[P3] popup.js duplica logica de obtencion URL** — cargarProgramadosPopup y cancelarProgramadoPopup repiten bloque de fallback al storage (L421-431 y L490-499)

### Observaciones menores
4. La funcion `obtenerUrlPopup()` en popup.js retorna GAS_URL que esta hardcodeada a '' (L1) — siempre cae en el fallback storage
5. El plan mencionaba "Paso 10: Manual — crear trigger cada 5 min en editor GAS" — esto es externo y no verificable desde codigo

---

## PUERTA DE VALIDACION 2

- [x] Mapa de impacto completo (archivos + rutas exactas)
- [x] Patrones existentes identificados con codigo real
- [x] Tests existentes analizados
- [x] Spike resuelto (no aplico)
- [x] 3 opciones evaluadas con pros/cons
- [x] Decision justificada y verificada como correcta

---

**Estado:** COMPLETADO
