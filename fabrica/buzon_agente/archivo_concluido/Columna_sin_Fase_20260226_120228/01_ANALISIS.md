# 01 - ANÁLISIS

**Fase:** Análisis Detallado
**Expediente:** Columna_sin_Fase_20260226_120228
**Camino:** PROYECTO_COMPLETO

---

## 1.1 Resumen Ejecutivo

Los registros con fase vacía (correos nuevos sin clasificar) se procesan correctamente pero no aparecen en el tablero Kanban, ya que van a `grupos.sin_columna` que nunca se renderiza. Se necesita una columna visual "Sin Fase" como punto de entrada para clasificar registros nuevos.

## 1.2 Situación Actual (AS-IS)

- `agruparPorColumna()` crea `grupos.sin_columna = []` para registros sin fase reconocida
- `renderKanban()` solo itera `COLUMNAS_KANBAN` (7 columnas) → `sin_columna` nunca se renderiza
- Registros con `fase = ''` o `fase = null` desaparecen del tablero
- El operador debe ir a la tabla (tab Datos) para verlos y asignarles fase

## 1.3 Situación Deseada (TO-BE)

- `COLUMNAS_KANBAN` incluye `sin_fase` como primera columna (orden 0, fases: [])
- Registros sin fase aparecen visibles en columna "Sin Fase"
- Drag & drop permite clasificar registros arrastrándolos a columnas con fase
- Drag hacia "Sin Fase" limpia la fase (vuelve a vacía)
- Toggle para ocultar/mostrar la columna

## 1.4 GAP Analysis

| Aspecto | AS-IS | TO-BE | GAP |
|---------|-------|-------|-----|
| Visibilidad sin fase | No visible en Kanban | Columna dedicada | Añadir columna a COLUMNAS_KANBAN |
| Clasificación | Solo desde tabla | Drag & drop en Kanban | resolverFaseAlMover maneja sin_fase |
| Nombre grupo | sin_columna | sin_fase | Renombrar en agruparPorColumna |

## 1.5 Historias de Usuario

### HU-1: Ver registros sin fase en Kanban
```
COMO operador logístico
QUIERO ver los correos sin fase asignada en el tablero Kanban
PARA no perder visibilidad de registros nuevos pendientes de clasificar
```

**Criterios de Aceptación:**
- CA-1.1 (caso feliz): DADO un registro con fase vacía CUANDO abro el tablero ENTONCES aparece en columna "Sin Fase"
- CA-1.2 (caso null): DADO un registro con fase null CUANDO abro el tablero ENTONCES aparece en columna "Sin Fase"
- CA-1.3 (caso borde): DADO un registro con fase desconocida ('99') CUANDO abro el tablero ENTONCES aparece en columna "Sin Fase"

### HU-2: Clasificar arrastrando desde "Sin Fase"
```
COMO operador logístico
QUIERO arrastrar un registro de "Sin Fase" a otra columna
PARA asignarle fase sin abrir la tabla
```

**Criterios de Aceptación:**
- CA-2.1 (caso feliz): DADO un registro en "Sin Fase" CUANDO lo arrastro a "Espera" ENTONCES su fase cambia a '00'
- CA-2.2 (otro grupo): DADO un registro en "Sin Fase" CUANDO lo arrastro a "Carga" ENTONCES su fase cambia a '11'
- CA-2.3 (persistencia): DADO el cambio de fase CUANDO se persiste ENTONCES se sincroniza con GAS

### HU-3: Devolver registro a "Sin Fase"
```
COMO operador logístico
QUIERO arrastrar un registro a "Sin Fase" para desclasificarlo
PARA corregir una clasificación errónea
```

**Criterios de Aceptación:**
- CA-3.1 (desde en_ruta): DADO un registro en "En Ruta" (fase '19') CUANDO lo arrastro a "Sin Fase" ENTONCES su fase se limpia a ''
- CA-3.2 (desde incidencia): DADO un registro en "Incidencia" (fase '05') CUANDO lo arrastro a "Sin Fase" ENTONCES su fase se limpia a ''
- CA-3.3 (valor almacenado): DADO la fase limpiada CUANDO se persiste ENTONCES el valor guardado es '' (string vacío)

### HU-4: Toggle visibilidad columna "Sin Fase"
```
COMO operador logístico
QUIERO ocultar/mostrar la columna "Sin Fase"
PARA ver solo las columnas relevantes cuando no hay registros nuevos
```

**Criterios de Aceptación:**
- CA-4.1 (ocultar): DADO el checkbox "Sin Fase" desmarcado CUANDO renderiza Kanban ENTONCES la columna no aparece
- CA-4.2 (vacía visible): DADO el checkbox marcado CUANDO hay 0 registros sin fase ENTONCES la columna muestra "Arrastra aquí"
- CA-4.3 (móvil): DADO el chip "Sin Fase" en móvil CUANDO lo toco ENTONCES toggle la columna

## 1.6 Requisitos No Funcionales

- **Rendimiento:** Sin impacto medible (añadir 1 columna a iteración existente)
- **Compatibilidad:** Mismo patrón que columnas existentes, Chrome MV3
- **Tests:** Cobertura >= 80% del código nuevo

## 1.7 Análisis de Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Tests existentes referenciando sin_columna | ALTA | BAJO | Actualizar a sin_fase |
| resolverFaseAlMover con array fases vacío | MEDIA | MEDIO | Guard clause para sin_fase |
| Regresión en conteos | BAJA | BAJO | calcularConteos usa Object.keys, funciona automáticamente |

## 1.8 Dependencias

- **Depende de:** kanban.js (lógica pura existente)
- **Dependen de esto:** panel-kanban.js, movil/views/kanban.js

## 1.9 Preguntas Abiertas

- Ninguna. El archivo Columna_sin_Fase.md es suficientemente detallado.

---

## Puerta de Validación 1

- [x] AS-IS y TO-BE documentados
- [x] Todas las HU tienen formato COMO/QUIERO/PARA
- [x] Cada HU tiene mínimo 3 criterios de aceptación
- [x] Riesgos identificados con mitigación
- [x] Sin preguntas abiertas

---

**Estado:** COMPLETADO
