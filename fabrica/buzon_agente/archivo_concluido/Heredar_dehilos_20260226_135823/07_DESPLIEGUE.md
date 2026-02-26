# 07 - DESPLIEGUE

**Fase:** Deployment
**Expediente:** Heredar_dehilos_20260226_135823
**Fecha:** 2026-02-26

---

## Pre-Deployment

### Tests
```
Test Suites: 39 passed, 39 total
Tests:       895 passed, 895 total
```

### Archivos Modificados
- `src/gas/AdaptadorHojas.js` — +obtenerUltimoRegistroPorThread
- `src/gas/Main.js` — +herencia fase/estado en processMessage
- `src/extension/action-rules.js` — +HEREDAR_DEL_HILO tipo + regla default
- `src/extension/panel.js` — +case HEREDAR_DEL_HILO
- `src/extension/config-rules-ui.js` — +UI params HEREDAR_DEL_HILO
- `tests/TDD/unit/test_herencia_hilos.js` — nuevo (8 tests)
- `tests/TDD/unit/test_action_rules.js` — +5 tests
- `tests/TDD/unit/test_export_import.js` — ajuste conteos

---

## Deployment

### Paso 1: GAS (clasp)
```bash
# Subir codigo al proyecto GAS
clasp push

# Desplegar a web app existente
clasp deploy -i <DEPLOYMENT_ID>
```

### Paso 2: Extension Chrome
La extension se carga localmente (`chrome://extensions` → Load unpacked).
No requiere publicacion en Chrome Web Store.

### Paso 3: Verificacion post-deploy
1. Abrir extension en Chrome
2. Ejecutar barrido manual
3. Verificar que correos de hilos clasificados heredan fase/estado
4. Verificar en Kanban que no aparecen en "Sin Fase"

---

## Smoke Tests

| Test | Resultado |
|------|-----------|
| Extension carga sin errores | Pendiente ejecucion manual |
| Barrido procesa correos | Pendiente ejecucion manual |
| Herencia funciona en hilo clasificado | Pendiente ejecucion manual |
| Kanban muestra columna correcta | Pendiente ejecucion manual |
| Reglas config muestra HEREDAR_DEL_HILO | Pendiente ejecucion manual |

---

## Rollback Plan

```bash
# Si algo falla, revertir los cambios:
git revert HEAD

# Para GAS:
clasp push  # despues de revert
clasp deploy -i <DEPLOYMENT_ID>
```

---

## Checklist

- [ ] clasp push ejecutado
- [ ] clasp deploy ejecutado
- [ ] Extension recargada en Chrome
- [ ] Smoke tests ejecutados
- [x] Rollback plan documentado

---

**Estado:** PENDIENTE (requiere ejecucion manual por usuario)
