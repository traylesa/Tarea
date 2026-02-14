# 00 - ESTRATEGIA

**Fase:** Definicion Estrategica
**Expediente:** VentayParametrizable_20260213_222619
**Camino:** PROYECTO_COMPLETO
**Estado:** COMPLETADO

---

## Objetivo

Transformar la extension Chrome "LogiTask Orchestrator" de un popup fijo a una **ventana independiente movible y redimensionable**, y convertir todos los valores hardcodeados en **configuracion parametrizable** editable desde la interfaz por el usuario.

**Por que:** El popup actual (700x400px) es limitado: no se puede mover, redimensionar ni mantener abierto mientras se navega. Los valores hardcodeados (GAS_URL, intervalos, patrones regex) obligan a modificar codigo fuente para cualquier cambio de configuracion, lo que no es viable para usuarios no tecnicos.

---

## Alcance

### Que SI incluye
- Reemplazar `default_popup` por apertura via `chrome.windows.create()` como ventana independiente
- Panel de configuracion en la UI con persistencia en `chrome.storage.local`
- Parametrizar: GAS_URL, intervalo de barrido, ruta CSVs del ERP, patrones regex de extraccion
- Mantener toda la funcionalidad existente (tabla Tabulator, filtros, vinculacion manual)

### Que NO incluye
- Cambios en el backend GAS (Google Apps Script)
- Nuevas funcionalidades de negocio (solo refactoring de UI y configuracion)
- Migracion a TypeScript o framework frontend
- Autenticacion o permisos adicionales

---

## Criterios de Exito

1. La ventana se abre como panel independiente, movible y redimensionable
2. El popup ya no existe (se abre ventana al hacer clic en icono de extension)
3. Existe un panel/seccion de configuracion accesible desde la interfaz
4. Todos los valores parametrizables se guardan en `chrome.storage.local` y persisten
5. La tabla Tabulator sigue funcionando identicamente (datos, filtros, columnas)
6. Tests unitarios cubren >= 80% del codigo nuevo

---

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| `chrome.windows.create` requiere permiso extra | BAJA | MEDIO | Solo necesita permiso `windows` que no existe en MV3; usar sin permiso adicional funciona con extension pages |
| Tabulator no se adapta a resize de ventana | MEDIA | ALTO | Usar `ResizeObserver` + `tabla.redraw(true)` al cambiar tamano |
| Perdida de datos de configuracion al actualizar extension | BAJA | MEDIO | `chrome.storage.local` persiste entre actualizaciones |
| Complejidad de la UI de configuracion | BAJA | BAJO | Tabs simples: Datos / Configuracion |

---

## Checklist

- [x] Objetivo documentado (que y por que)
- [x] Alcance definido (que SI y que NO)
- [x] Stakeholders identificados (usuario final de la extension)
- [x] Restricciones tecnicas/negocio claras
- [x] Riesgos principales evaluados

---

## PUERTA DE VALIDACION 0: SUPERADA

- [x] Objetivo documentado (que y por que)
- [x] Alcance definido (que SI y que NO)
- [x] Riesgos evaluados con mitigacion
