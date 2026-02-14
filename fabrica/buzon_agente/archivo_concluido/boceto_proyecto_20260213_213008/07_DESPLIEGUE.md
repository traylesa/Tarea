# 07 - DESPLIEGUE

**Fase:** Deployment
**Expediente:** boceto_proyecto_20260213_213008
**Camino:** PROYECTO_COMPLETO

---

## PRE-DEPLOYMENT

### Verificacion Tests
```
Test Suites: 5 passed, 5 total
Tests:       67 passed, 67 total
Cobertura:   100% statements, 98.48% branches
```

### Artefactos a desplegar

| Componente | Destino | Metodo |
|-----------|---------|--------|
| src/gas/*.js | Google Apps Script | clasp push |
| src/extension/* | Chrome (local) | chrome://extensions → Cargar descomprimida |

---

## PLAN DE DESPLIEGUE

### Paso 1: Google Apps Script

```bash
# 1. Instalar clasp (si no existe)
npm install -g @google/clasp

# 2. Login en Google
clasp login

# 3. Crear proyecto GAS vinculado a la hoja de calculo
clasp create --type sheets --title "LogiTask Orchestrator"

# 4. Copiar archivos GAS
# (Adaptar modulos JS puros a GAS: quitar require/module.exports)
clasp push

# 5. Desplegar como Web App
clasp deploy --description "v0.1.0 - MVP"
```

### Paso 2: Extension Chrome (carga local)

```bash
# 1. Abrir chrome://extensions
# 2. Activar "Modo desarrollador"
# 3. Click "Cargar extension descomprimida"
# 4. Seleccionar carpeta src/extension/
# 5. Configurar GAS_URL en popup.js y background.js
```

### Paso 3: Configuracion post-deploy

1. Crear hoja "DB_HILOS" (oculta) en el spreadsheet
2. Crear hoja "SEGUIMIENTO" con headers segun modelo de datos
3. Importar CSVs del ERP a hojas correspondientes
4. Configurar trigger de tiempo en GAS (cada 15 min)

---

## SMOKE TESTS

| # | Test | Accion | Resultado esperado |
|---|------|--------|-------------------|
| 1 | Extension carga | Abrir popup en Chrome | Panel visible sin errores |
| 2 | Conexion GAS | Click "Ejecutar Ahora" | No errores en consola |
| 3 | Procesamiento | Enviar correo con Carga_001.pdf | Registro en SEGUIMIENTO |
| 4 | Cache hilos | Responder al correo anterior | Hereda CODCAR |
| 5 | Alerta email | Enviar desde email no registrado | Alerta roja en panel |

---

## ROLLBACK PLAN

```bash
# Si GAS falla:
clasp deploy --description "rollback" --versionNumber [anterior]

# Si Extension falla:
# 1. Desactivar extension en chrome://extensions
# 2. Volver a cargar version anterior del codigo

# Si datos corruptos:
# 1. Restaurar hoja DB_HILOS desde backup
# 2. Restaurar hoja SEGUIMIENTO desde backup
```

**Backup obligatorio antes de deploy:**
- Exportar hoja DB_HILOS como CSV
- Exportar hoja SEGUIMIENTO como CSV

---

## CHECKLIST

- [x] Tests pasando (67/67)
- [x] Artefactos identificados
- [x] Plan de deployment documentado
- [x] Smoke tests definidos
- [x] Rollback plan documentado

---

## PUERTA DE VALIDACION 7

- [x] Plan de deploy documentado
- [x] Smoke tests definidos
- [x] Rollback plan documentado

**Nota:** Deploy real requiere acceso a Google Workspace de TRAYLESA y autorizacion del equipo IT.

---

**Estado:** COMPLETADO
**Puerta de validacion 7:** SUPERADA (plan documentado, ejecucion pendiente de autorizacion)
