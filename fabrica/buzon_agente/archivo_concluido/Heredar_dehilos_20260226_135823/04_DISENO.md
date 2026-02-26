# 04 - DISENO TECNICO

**Fase:** Diseno Detallado
**Expediente:** Heredar_dehilos_20260226_135823
**Camino:** PROYECTO_COMPLETO
**Fecha:** 2026-02-26

---

## Arquitectura

### Flujo de herencia en processMessage

```
Correo nuevo → processMessage()
  ├─ extractMetadata → codCar de adjunto?
  │   ├─ SI → vinculacion=AUTOMATICA, mapThread
  │   └─ NO → ThreadManager.getLoadFromThread?
  │       ├─ SI → codCar heredado, vinculacion=HILO
  │       └─ NO → SIN_VINCULAR
  │
  ├─ [NUEVO] obtenerUltimoRegistroPorThread(threadId)
  │   ├─ Encontrado → heredar fase, estado, codCar (si no hay)
  │   └─ No encontrado → defaults (fase='', estado=obtenerEstadoInicial())
  │
  ├─ auditEmail → alerta?
  │   ├─ SI → estado='ALERTA' (prevalece sobre herencia)
  │   └─ NO → estado heredado o default
  │
  └─ return registro completo
```

---

## Modelo de Datos

### Campos heredados (ya en DICCIONARIO_DOMINIO.md)

| Campo | Tipo | Fuente herencia | Notas |
|-------|------|----------------|-------|
| `fase` | enum(FASE_TRANSPORTE) | ultimo registro SEGUIMIENTO por threadId | '' si no hay previo |
| `estado` | enum(ESTADO_REGISTRO) | ultimo registro SEGUIMIENTO por threadId | ALERTA prevalece |
| `codCar` | number | ThreadManager (prioridad) o SEGUIMIENTO | Solo si ThreadManager no tiene |

### Nuevo tipo accion (ya en DICCIONARIO_DOMINIO.md via TIPOS_ACCION_REGLA)

| Tipo | Nombre UI | Params |
|------|-----------|--------|
| `HEREDAR_DEL_HILO` | Heredar campo del hilo | `{campo: string}` |

**Verificacion diccionario:** Todos los nombres usados (`fase`, `estado`, `codCar`, `threadId`, `HEREDAR_DEL_HILO`, `vinculacion`, `HILO`) ya existen en `docs/DICCIONARIO_DOMINIO.md`.

---

## Interfaces

### AdaptadorHojas.js — Nueva funcion

```javascript
/**
 * Busca en SEGUIMIENTO el registro mas reciente del mismo threadId.
 * @param {string} threadId - ID del hilo Gmail
 * @returns {Object|null} - Registro como objeto {header: valor} o null
 */
function obtenerUltimoRegistroPorThread(threadId)
```

### Main.js — processMessage modificado

```javascript
// Despues de resolver codCar via threadManager (linea ~43):
// 1. Buscar ultimo registro del hilo en SEGUIMIENTO
// 2. Si existe: heredar fase y estado
// 3. Si codCar aun no resuelto: heredar codCar
// 4. Alerta prevalece sobre estado heredado
```

### action-rules.js — Nuevo tipo

```javascript
TIPOS_ACCION_REGLA.HEREDAR_DEL_HILO = 'HEREDAR_DEL_HILO';
NOMBRES_ACCION_REGLA.HEREDAR_DEL_HILO = 'Heredar campo del hilo';
```

### panel.js — Nuevo case

```javascript
case 'HEREDAR_DEL_HILO':
  // Buscar hermano con mismo threadId que tenga el campo
  // Si encontrado: actualizar registro + sync backend
  break;
```

---

## Flujos de Ejecucion

### Flujo 1: Herencia automatica (backend)
1. Llega correo nuevo de hilo existente
2. processMessage extrae metadata
3. ThreadManager resuelve codCar (o no)
4. **NUEVO:** obtenerUltimoRegistroPorThread busca en SEGUIMIENTO
5. Si hay registro previo: hereda fase, estado, codCar (si falta)
6. auditEmail evalua alertas
7. Si alerta: estado='ALERTA' (sobreescribe herencia)
8. Retorna registro con campos heredados

### Flujo 2: Accion HEREDAR_DEL_HILO (extension)
1. Usuario configura regla con accion HEREDAR_DEL_HILO
2. Al dispararse la regla: busca en registros locales por threadId
3. Encuentra hermano con campo no vacio
4. Actualiza registro local + sync a backend
5. Muestra toast confirmacion

---

## Checklist

- [x] Arquitectura clara y documentada
- [x] Todos los nombres en DICCIONARIO_DOMINIO.md
- [x] Interfaces publicas definidas
- [x] Flujos criticos diagramados
- [x] Validaciones especificadas

---

**Estado:** COMPLETADO
