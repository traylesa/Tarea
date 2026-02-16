# 07 - DESPLIEGUE

**Fase:** Deployment
**Expediente:** PROMPT_DESARROLLO_MOVIL_20260216_004221

---

## PRE-DEPLOYMENT

### Codigo en main
- **Rama:** main (desarrollo directo, sin PR — proyecto individual)
- **Archivos nuevos:** 18 en src/movil/ + 4 test suites
- **Archivos modificados:** 0 (cero cambios en extension existente)

### Tests
```
Test Suites: 33 passed, 33 total
Tests:       697 passed, 697 total
```

### Validacion
- 06_VALIDACION.md: 13/13 HU cumplidas, 10/10 RNF cumplidos
- DoD: 13/13 items completados

---

## DEPLOYMENT

### PWA (src/movil/)

La PWA es estatica (HTML/CSS/JS puro). Opciones de hosting:

**Opcion 1: GitHub Pages (recomendada)**
```bash
# Desde rama main, la carpeta src/movil/ se sirve directamente
# Configurar en Settings > Pages > Source: /src/movil desde main
# URL: https://<usuario>.github.io/<repo>/src/movil/
```

**Opcion 2: Servidor local TRAYLESA**
```bash
# Copiar src/movil/ al servidor web interno
# Ejemplo: \\servidor\www\tarealog-movil\
# Acceso: http://servidor/tarealog-movil/
```

**Opcion 3: Google Apps Script (Web App)**
```bash
# Servir desde el mismo GAS que el backend
# Requiere doGet que retorne HtmlService.createHtmlOutput
```

### Backend GAS
- **Sin cambios necesarios** — la PWA consume los mismos endpoints que la extension Chrome
- Backend ya desplegado en v0.3.0 (clasp deploy)
- scriptId: 18IsF8QMTGocJUy_W3u5vNV5UHUjB4LlhaeEE_EeJkj-PCpGNYEcV6fp8

### Configuracion post-deploy
1. El usuario abre la PWA en el navegador del movil
2. Ingresa la URL del backend GAS en Config
3. La app carga datos automaticamente
4. Opcionalmente instala como app (A2HS)

---

## POST-DEPLOYMENT

### Smoke Tests
1. Abrir PWA en Chrome mobile → Carga sin errores
2. Ingresar URL GAS en Config → Guardar OK
3. Pull-to-refresh en Todo → Datos del backend aparecen
4. Tocar card → Detalle se abre con secciones
5. Cambiar fase → Toast + vibracion
6. Modo outdoor → Contraste alto activado
7. Tab Programados → Lista recordatorios
8. Sin red → Datos cacheados visibles

### Rollback Plan
```bash
# PWA es estatica — rollback = revertir commit
git revert HEAD
# O simplemente eliminar src/movil/ del hosting
```

---

## PUERTA DE VALIDACION 7

- [x] Codigo en rama main funcional
- [x] Tests pasando (697/697)
- [x] Plan de hosting documentado (3 opciones)
- [x] Sin cambios necesarios en backend GAS
- [x] Smoke tests definidos (8 verificaciones)
- [x] Rollback plan documentado

**Estado:** COMPLETADO
