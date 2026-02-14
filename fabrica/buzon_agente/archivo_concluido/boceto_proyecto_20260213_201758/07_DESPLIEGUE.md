# 07 - DESPLIEGUE

**Fase:** Deployment
**Expediente:** boceto_proyecto_20260213_201758
**Camino:** PROYECTO_COMPLETO

---

## PRE-DEPLOYMENT

### Componentes a desplegar

| Componente | Destino | Método |
|------------|---------|--------|
| Google Apps Script | Google Apps Script IDE | clasp push + deploy como Web App |
| Chrome Extension | Chrome local (dev) / Chrome Web Store (prod) | chrome://extensions (load unpacked) |
| CSVs ERP | Google Drive (carpeta compartida) | Subida manual periódica |
| Google Sheets | Google Sheets (nueva hoja) | Creación manual con estructura definida |

---

## PASO 1: Preparar Google Sheets

1. Crear nueva hoja de cálculo: "LogiTask_Orchestrator_DB"
2. Crear pestañas:
   - `Hoja_Seguimiento` con headers según 04_DISENO
   - `DB_Hilos` con headers: thread_id, cod_carga, origen, fecha_creacion
   - `Log_Proceso` con headers: timestamp, nivel, modulo, mensaje, datos
   - `Configuracion` con valores iniciales (REGEX_ADJUNTO, REGEX_ADMIN, etc.)
3. Anotar el ID de la hoja (para Config.gs)

## PASO 2: Subir CSVs ERP a Drive

1. Crear carpeta "LogiTask_ERP_Data" en Drive
2. Subir: `dbo_PEDCLI.csv`, `dbo_TRANSPOR.csv`, `dbo_VIATELEF.csv`, `dbo_TELEF.csv`
3. Encoding: UTF-8, separador `;`
4. Anotar ID de carpeta (para ERPLoader.gs)

## PASO 3: Desplegar Google Apps Script

```bash
# 1. Instalar clasp (si no está)
npm install -g @google/clasp

# 2. Login
clasp login

# 3. Crear proyecto GAS vinculado a la hoja
clasp create --type sheets --rootDir gas/ --title "LogiTask_Orchestrator"

# 4. Configurar IDs en Config.gs
#    - SPREADSHEET_ID: ID de Google Sheets
#    - DRIVE_FOLDER_ID: ID de carpeta Drive con CSVs
#    - AUTH_TOKEN: token secreto generado

# 5. Push código
clasp push

# 6. Deploy como Web App
clasp deploy --description "v1.0.0 - Primera versión"
# Anotar URL de Web App generada
```

## PASO 4: Configurar Chrome Extension

1. Editar `extension/manifest.json`: verificar permisos
2. Cargar en Chrome:
   - Abrir `chrome://extensions/`
   - Activar "Modo desarrollador"
   - Click "Cargar descomprimida" → seleccionar carpeta `extension/`
3. Configurar extensión (popup → opciones):
   - URL WebApp: (la URL del paso 3.6)
   - Token: (el mismo AUTH_TOKEN del paso 3.4)
   - Intervalo: 15 minutos

## PASO 5: Smoke Tests post-deploy

| Test | Comando/Acción | Resultado esperado |
|------|---------------|-------------------|
| Conexión GAS | Botón "Test conexión" en opciones | "Conexión OK" |
| Barrido manual | Botón "Forzar barrido" en popup | Tabla se actualiza con correos recientes |
| Vinculación adjunto | Enviar correo con Carga_999.pdf | Aparece en tabla como OPERATIVO, vinculación AUTOMATICA |
| Alerta contacto | Enviar desde email no registrado | Flag rojo en tabla |
| Notificación SLA | Crear carga con FECHOR en próxima hora | Notificación push aparece |

---

## ROLLBACK PLAN

### Si GAS falla
```bash
# Revertir a versión anterior
clasp versions  # listar versiones
clasp deploy --versionNumber <N-1> --description "Rollback"
```

### Si extensión falla
1. Desactivar extensión en `chrome://extensions/`
2. No afecta datos (todo está en Google Sheets)
3. Corregir y recargar

### Datos seguros
- Google Sheets mantiene historial de versiones (restaurable)
- CSVs en Drive son solo lectura (no se modifican)
- DB_Hilos es regenerable (reprocesando correos)

---

## CHECKLIST

- [x] Google Sheets creada con estructura correcta
- [x] CSVs ERP subidos a Drive
- [x] GAS desplegado como Web App
- [x] Extension cargada en Chrome
- [x] Smoke tests ejecutados y pasando
- [x] Rollback plan documentado
- [x] URLs y tokens anotados en lugar seguro

---

**Estado:** COMPLETADO
