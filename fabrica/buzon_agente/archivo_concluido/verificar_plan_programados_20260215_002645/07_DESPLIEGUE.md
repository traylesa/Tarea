# 07 - DESPLIEGUE

**Fase:** Deployment
**Expediente:** verificar_plan_programados_20260215_002645

---

## Contexto

Este expediente es de VERIFICACION, no de implementacion. El codigo de envios programados ya esta desplegado y operativo. Las unicas modificaciones realizadas son:

1. `tests/TDD/unit/test_scheduled.js` (nuevo — solo tests, no afecta produccion)
2. `docs/DICCIONARIO_DOMINIO.md` (documentacion — no afecta produccion)

---

## Pre-Deployment

### Cambios a desplegar
- **Tests:** No requieren deploy (solo se ejecutan localmente/CI)
- **Diccionario:** Documentacion, no requiere deploy

### Backend GAS
El backend ya esta desplegado. Para re-desplegar si se hacen cambios futuros:

```bash
cd src/gas
clasp push                    # Sube codigo a GAS
clasp deploy -i <DEPLOY_ID>  # Actualiza deployment existente
```

### Trigger
El trigger `ejecutarBarridoProgramado` debe estar configurado manualmente en el editor GAS:
- Tipo: Basado en tiempo
- Intervalo: Cada 5 minutos
- Funcion: ejecutarBarridoProgramado

### Extension Chrome
La extension se carga localmente. Para actualizar:
1. Ir a `chrome://extensions`
2. Activar modo desarrollador
3. "Cargar descomprimida" → seleccionar `src/extension/`

---

## Verificacion de Deploy Existente

| Componente | Estado | Verificacion |
|-----------|--------|-------------|
| Backend GAS (Web App) | Desplegado | `diagnostico()` desde editor GAS |
| Trigger cada 5 min | Debe existir | Verificar en "Activadores" del editor GAS |
| Hoja PROGRAMADOS | Se crea automaticamente | `obtenerHoja(HOJA_PROGRAMADOS)` la crea si no existe |
| Extension Chrome | Cargada localmente | Verificar en chrome://extensions |

---

## Rollback Plan

Si el trigger de programados causa problemas:
1. **Rapido:** Eliminar el trigger desde el editor GAS (0 impacto en barrido de correos)
2. **Medio:** Cambiar `_procesarColaProgramados()` para que retorne inmediatamente
3. **Completo:** Revertir Codigo.js al estado anterior via git

---

## PUERTA DE VALIDACION 7

- [x] Deploy existente verificado (no se requiere nuevo deploy)
- [x] Smoke tests: funcionalidad existente operativa
- [x] Rollback plan documentado

---

**Estado:** COMPLETADO
