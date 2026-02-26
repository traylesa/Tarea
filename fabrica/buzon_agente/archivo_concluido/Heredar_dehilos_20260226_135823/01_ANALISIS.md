# 01 - ANALISIS

**Fase:** Analisis Detallado
**Expediente:** Heredar_dehilos_20260226_135823
**Camino:** PROYECTO_COMPLETO
**Fecha:** 2026-02-26

---

## 1.1 Resumen Ejecutivo

Cuando llega un correo nuevo a un hilo existente ya clasificado, `processMessage()` hereda `codCar` via ThreadManager pero resetea `fase` y `estado` a defaults. El operador debe reclasificar manualmente cada correo nuevo del hilo. Se necesita herencia automatica de estos campos desde el ultimo registro del mismo threadId.

---

## 1.2 Situacion Actual (AS-IS)

1. `processMessage()` en Main.js (linea 30-86) procesa cada mensaje:
   - Extrae codCar de adjuntos PDF (vinculacion AUTOMATICA)
   - Si no hay adjunto, busca en ThreadManager/DB_HILOS (vinculacion HILO)
   - `fase` siempre se asigna como `''` (vacia)
   - `estado` siempre se asigna como `obtenerEstadoInicial()` (default: 'NUEVO') o 'ALERTA'
2. Resultado: correos de hilos ya gestionados aparecen en Kanban en "Sin Fase"
3. El operador debe abrir cada registro y reasignar fase/estado manualmente

---

## 1.3 Situacion Deseada (TO-BE)

1. `processMessage()` busca el ultimo registro del mismo threadId en SEGUIMIENTO
2. Si existe, hereda: `fase`, `estado`, `codCar`
3. Si hay alerta, `estado` = 'ALERTA' (prevalece sobre herencia)
4. Si no hay registro previo, comportamiento actual (defaults)
5. Motor de reglas tiene tipo `HEREDAR_DEL_HILO` para excepciones configurables
6. Correos nuevos de hilos clasificados aparecen correctamente en Kanban

---

## 1.4 GAP Analysis

| Aspecto | AS-IS | TO-BE | GAP |
|---------|-------|-------|-----|
| Herencia codCar | Via ThreadManager | Via ThreadManager + SEGUIMIENTO | Mantener, ampliar |
| Herencia fase | No existe (siempre '') | Del ultimo registro del hilo | Nueva logica en Main.js |
| Herencia estado | No existe (siempre default) | Del ultimo registro del hilo | Nueva logica en Main.js |
| Busqueda por thread | Solo DB_HILOS | DB_HILOS + SEGUIMIENTO | Nueva funcion AdaptadorHojas |
| Reglas excepcion | No existe | HEREDAR_DEL_HILO en motor reglas | Nuevo tipo accion |

---

## 1.5 Historias de Usuario

### HU-1: Herencia automatica de campos en hilos

```
COMO operador logistico
QUIERO que cuando llegue un correo nuevo a un hilo ya clasificado, herede fase y estado del ultimo registro del hilo
PARA no tener que reclasificar manualmente cada correo y mantener el Kanban coherente
```

**Criterios de Aceptacion:**

- CA-1.1 (caso feliz):
  DADO un hilo con ultimo registro fase="19" estado="GESTIONADO"
  CUANDO llega un nuevo correo en ese hilo
  ENTONCES el nuevo registro tiene fase="19" estado="GESTIONADO"

- CA-1.2 (caso alerta prevalece):
  DADO un hilo con ultimo registro estado="GESTIONADO"
  CUANDO llega un correo con alerta de suplantacion
  ENTONCES el estado es "ALERTA" (no hereda GESTIONADO)

- CA-1.3 (caso sin hilo previo):
  DADO un correo sin threadId previo en SEGUIMIENTO
  CUANDO se procesa por primera vez
  ENTONCES usa defaults: fase="" estado=obtenerEstadoInicial()

- CA-1.4 (caso codCar ya heredado):
  DADO un hilo donde ThreadManager ya resolvio codCar
  CUANDO processMessage hereda de SEGUIMIENTO
  ENTONCES no sobreescribe el codCar de ThreadManager

### HU-2: Tipo de accion HEREDAR_DEL_HILO en reglas

```
COMO operador logistico
QUIERO poder configurar reglas que hereden campos del hilo bajo condiciones
PARA personalizar excepciones (ej: no heredar CERRADO desde INBOX)
```

**Criterios de Aceptacion:**

- CA-2.1 (caso feliz):
  DADO una regla activa con accion HEREDAR_DEL_HILO campo="fase"
  CUANDO se dispara la regla
  ENTONCES el registro hereda la fase del ultimo hermano en el hilo

- CA-2.2 (caso sin hermano):
  DADO una regla HEREDAR_DEL_HILO disparada
  CUANDO no hay registros previos del mismo threadId
  ENTONCES no se modifica nada (silencioso)

- CA-2.3 (validacion):
  DADO una regla con tipo HEREDAR_DEL_HILO
  CUANDO se valida con validarRegla()
  ENTONCES pasa validacion si HEREDAR_DEL_HILO esta en TIPOS_ACCION_REGLA

---

## 1.6 Requisitos No Funcionales

- **Rendimiento:** obtenerUltimoRegistroPorThread no debe agregar llamadas extra a SpreadsheetApp (datos ya cargados)
- **Compatibilidad:** GAS ES5 (var, function, no arrow), dual-compat para Jest
- **Regresion:** 0 tests existentes rotos (882 base)

---

## 1.7 Analisis de Riesgos

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| Estado CERRADO heredado no deseado | Media | Medio | Regla default inactiva de ejemplo |
| Fase vacia '' tratada como falsy | Baja | Alto | Usar `=== null` no `!valor` (ya documentado) |
| Orden procesar vs registrar | Baja | Bajo | Buscar mas reciente por fechaCorreo |

---

## 1.8 Dependencias

- **Depende de:** AdaptadorHojas.js (leerRegistros), Main.js (processMessage), action-rules.js
- **Dependen de esto:** panel-kanban.js (Kanban), background.js (barrido)

---

## 1.9 Preguntas Abiertas

Ninguna. El plan proporcionado en Heredar_dehilos.md es claro y completo.

---

## Puerta de Validacion 1

- [x] AS-IS y TO-BE documentados
- [x] Todas las HU tienen formato COMO/QUIERO/PARA
- [x] Cada HU tiene minimo 3 criterios de aceptacion
- [x] Riesgos identificados con mitigacion
- [x] Sin preguntas abiertas

---

**Estado:** COMPLETADO
