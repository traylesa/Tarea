# 02 - INVESTIGACIÓN

**Fase:** Investigación Técnica
**Expediente:** boceto_proyecto_20260213_201758
**Camino:** PROYECTO_COMPLETO

---

## OPCIONES EVALUADAS

### Opción 1: Google Apps Script puro (sin extensión)

**Descripción:** Todo el procesamiento y UI en Google Apps Script con sidebar HTML en Gmail

**Pros:**
- Sin necesidad de instalar extensión
- Acceso nativo a Gmail API desde GAS
- Despliegue simplificado (solo script)

**Contras:**
- UI limitada (sidebar pequeño, sin notificaciones push)
- Sin control de ejecución desde el navegador
- Sin modo offline parcial
- Dependencia total de triggers GAS (poco fiables para intervalos < 1h)

**Veredicto:** DESCARTADA - UI insuficiente para panel de control y sin notificaciones push

---

### Opción 2: Extensión Chrome + Google Apps Script (híbrido)

**Descripción:** GAS como backend de procesamiento Gmail, extensión Chrome como orquestador y UI

**Pros:**
- GAS accede nativamente a Gmail, Sheets, Drive (sin cuotas de API externa)
- Extensión proporciona UI rica (popup, notificaciones push, badges)
- La extensión programa/dispara ejecuciones del script via HTTP
- Separación clara: backend (GAS) / frontend (Chrome Extension)
- Sin servidor propio, coste cero

**Contras:**
- Dos codebases separadas (GAS + extensión)
- Comunicación via Apps Script Web App (requiere deploy como webapp)
- Manifest V3 limita service workers (no persistentes)

**Veredicto:** SELECCIONADA

---

### Opción 3: Servidor Node.js + Gmail API + Extensión Chrome

**Descripción:** Servidor propio que procesa Gmail API, extensión como frontend

**Pros:**
- Control total sobre procesamiento
- Sin límites de tiempo de GAS (6 min)
- Base de datos real (SQLite/PostgreSQL)

**Contras:**
- Requiere servidor (coste, mantenimiento, hosting)
- Configuración OAuth más compleja
- Over-engineering para el volumen actual (~500 cargas/mes)
- Necesita infraestructura que TRAYLESA no tiene preparada

**Veredicto:** DESCARTADA - Over-engineering, coste innecesario

---

### Opción 4: Google Workspace Add-on

**Descripción:** Add-on oficial de Google Workspace que aparece como panel en Gmail

**Pros:**
- Integración nativa en Gmail (panel lateral)
- Acceso a Gmail API sin OAuth externo
- Marketplace de Google para distribución

**Contras:**
- UI aún más limitada que extensión Chrome (Card-based)
- Sin notificaciones push nativas
- Proceso de publicación en Marketplace complejo
- Menos control sobre UX

**Veredicto:** DESCARTADA - UI demasiado restrictiva para el panel de control requerido

---

## DECISIÓN TÉCNICA

### Arquitectura seleccionada: Opción 2 (Híbrido GAS + Chrome Extension)

**Justificación:**
1. **Coste cero** de infraestructura (solo Google Workspace + Chrome)
2. **Acceso nativo a Gmail** desde GAS sin configurar OAuth externo
3. **UI rica** via extensión Chrome con popup, notificaciones y badges
4. **Separación de responsabilidades** clara entre backend y frontend
5. **Complejidad adecuada** para el volumen de datos (~500 cargas/mes)

### Stack técnico definitivo

| Componente | Tecnología | Responsabilidad |
|------------|-----------|----------------|
| Backend | Google Apps Script | Procesamiento Gmail, cruce ERP, cache hilos |
| Frontend | Chrome Extension (MV3) | UI, orquestación, notificaciones, vinculación manual |
| Almacenamiento | Google Sheets | Hoja_Seguimiento, DB_Hilos, Log_Proceso |
| Datos ERP | CSVs en Google Drive | dbo_PEDCLI, dbo_TRANSPOR, dbo_VIATELEF, dbo_TELEF |
| Comunicación | GAS Web App (doGet/doPost) | API REST entre extensión y backend |

### Comunicación Extension ↔ GAS

```
Chrome Extension → fetch(GAS_WEB_APP_URL, {method: 'POST', body: JSON})
                 ← JSON response con datos procesados
```

El GAS se despliega como Web App con acceso "Anyone" (protegido por token secreto en headers).

---

## TECNOLOGÍAS ESPECÍFICAS

### Chrome Extension (Manifest V3)

| Componente | Uso |
|------------|-----|
| `manifest.json` | Permisos: storage, notifications, alarms |
| `service-worker.js` | Alarms para barridos periódicos, listeners |
| `popup.html/js` | Panel de control con tabla de cargas |
| `chrome.storage.local` | Cache local de última consulta |
| `chrome.notifications` | Alertas SLA y contacto no registrado |

### Google Apps Script

| Módulo | Responsabilidad |
|--------|----------------|
| `ThreadManager.gs` | Cache DB_Hilos: mapear ThreadID → CODCAR |
| `EmailParser.gs` | Extraer CODCAR de adjuntos, NIF de cuerpo, keywords |
| `Auditor.gs` | Comparar email real vs email ERP, generar alertas |
| `ERPLoader.gs` | Leer CSVs desde Drive, parsear con separador `;` |
| `WebApp.gs` | Endpoints doGet/doPost para extensión |

---

## ADR-001: Arquitectura Híbrida GAS + Chrome Extension

**Estado:** ACEPTADA

**Contexto:** Se necesita un sistema de seguimiento de cargas logísticas que cruce datos ERP con comunicaciones Gmail, con panel visual y alertas.

**Decisión:** Usar Google Apps Script como backend y Chrome Extension (MV3) como frontend/orquestador.

**Consecuencias:**
- (+) Coste cero de infraestructura
- (+) Acceso nativo a Gmail desde GAS
- (+) UI rica vía extensión Chrome
- (-) Dos codebases que mantener
- (-) Límite de 6 min por ejecución en GAS (mitigado con procesamiento incremental)
- (-) Service worker no persistente en MV3 (mitigado con chrome.alarms)

---

## CHECKLIST

- [x] 3+ opciones investigadas (4 evaluadas)
- [x] Decisión justificada con pros/contras
- [x] ADR creado (ADR-001)
- [x] Stack técnico definido
- [x] Comunicación entre componentes diseñada

---

**Estado:** COMPLETADO
