# 00 - ESTRATEGIA

**Fase:** Definicion Estrategica
**Expediente:** boceto_proyecto_20260213_213008
**Camino:** PROYECTO_COMPLETO

---

## OBJETIVO

**Que:** Construir **LogiTask Orchestrator**, un sistema hibrido (Extension de Chrome + Google Apps Script) que reconcilia datos del ERP (CSVs exportados) con correos de Gmail para automatizar el seguimiento de Ordenes de Carga en el equipo de trafico de TRAYLESA.

**Por que:** Actualmente el equipo de trafico realiza manualmente el cruce entre ordenes de carga del ERP y los correos enviados/recibidos a transportistas. Esto genera:
- Perdida de trazabilidad cuando un transportista responde sin adjuntar referencia
- Desviaciones no detectadas (emails enviados a destinatarios incorrectos)
- Documentacion administrativa (certificados, AEAT 347) sin vinculacion al transportista
- Alertas de SLA inexistentes (cargas a punto de vencer sin orden enviada)
- Alertas configurables para recordatorios referidos a cargas o email marcados

---

## ALCANCE

### QUE SI (In Scope)

1. **Extension de Chrome:**
   - Panel de control con tabla de seguimiento de cargas
   - Boton "Forzar Vinculacion" para asociacion manual correo-carga
   - Programacion de barridos periodicos (cada 15 min configurable)
   - Notificaciones push para alertas SLA

2. **Google Apps Script (Backend):**
   - `ThreadManager`: Cache de hilos Gmail ↔ CODCAR (persistencia en hoja oculta)
   - `EmailParser`: Extraccion de metadatos (CODCAR de adjuntos, NIF/CIF, keywords admin)
   - `Auditor`: Validacion email real vs email ERP registrado
   - Lectura de CSVs del ERP (`dbo_PEDCLI`, `dbo_TRANSPOR`, `dbo_VIATELEF`, `dbo_TELEF`)

3. **Logica de vinculacion (3 casos):**
   - Caso A: Orden de Carga (adjunto PDF con patron `Carga_0*(\d+)\.pdf`)
   - Caso B: Conversacion (heredar CODCAR por ThreadID)
   - Caso C: Documentacion administrativa (keywords + NIF/CIF)

4. **Reglas de negocio:**
   - Alerta SLA: FECHOR - 2 horas sin correo enviado
   - Exportacion CSV UTF-8 con separador `;`

### QUE NO (Out of Scope)

- Modificacion directa del ERP
- Envio automatico de correos (solo lectura/seguimiento)
- Integracion con otros proveedores de email (solo Gmail)
- App movil
- Gestion de facturacion completa
- Machine Learning / IA para clasificacion

---

## CRITERIOS DE EXITO

| # | Criterio | Metrica | Umbral |
|---|----------|---------|--------|
| 1 | Vinculacion automatica de correos | % correos con CODCAR auto-asignado | >= 85% |
| 2 | Deteccion de emails incorrectos | % alertas correctas de email no registrado | >= 95% |
| 3 | Herencia de contexto por hilo | % respuestas vinculadas correctamente | >= 90% |
| 4 | Alertas SLA | Tiempo entre deteccion y notificacion | < 5 min |
| 5 | Rendimiento Extension | Tiempo carga panel de control | < 2 seg |
| 6 | Cobertura tests | Tests unitarios del core | >= 80% |

---

## STAKEHOLDERS

| Rol | Responsabilidad |
|-----|----------------|
| Equipo de Trafico | Usuarios principales, validan funcionalidad |
| Administracion | Usuarios documentacion administrativa |
| Desarrollo | Implementacion y mantenimiento |
| IT/Infra | Acceso Gmail API, Google Workspace |

---

## RESTRICCIONES

1. **Tecnologicas:**
   - Google Apps Script como backend (limites de ejecucion: 6 min/ejecucion, 90 min/dia en cuentas gratuitas)
   - Chrome Extension API Manifest V3 (obligatorio desde 2024)
   - CSVs del ERP como fuente de datos (no hay API directa)

2. **Negocio:**
   - Debe funcionar con la estructura actual de datos del ERP (campos CODCAR, CODTRA, CODVIA, etc.)
   - Encoding UTF-8 con separador `;` para compatibilidad Windows/Espana
   - Formato fecha DD/MM/YYYY (locale es-ES)

3. **Seguridad:**
   - OAuth2 para Gmail API (no credenciales en texto plano)
   - Extension solo accede a dominios autorizados
   - CSVs no contienen datos personales sensibles (solo datos empresariales)

---

## RIESGOS

| # | Riesgo | Probabilidad | Impacto | Mitigacion |
|---|--------|-------------|---------|------------|
| R1 | Limites de ejecucion GAS (6 min) insuficientes para volumenes altos | Media | Alto | Procesamiento incremental por lotes, cache agresiva |
| R2 | Cambio estructura CSV del ERP sin aviso | Baja | Alto | Validacion de headers al importar, alertas de schema |
| R3 | Regex de adjuntos no cubre todos los patrones de nombre | Media | Medio | Tests extensivos con nombres reales, fallback manual |
| R4 | Manifest V3 depreca APIs usadas | Baja | Medio | Usar solo APIs estables, seguir docs oficiales |
| R5 | Volumen de correos supera capacidad de Script Properties | Media | Medio | Usar hoja oculta como DB en vez de Script Properties |
| R6 | Falsos positivos en deteccion administrativa (keywords) | Media | Bajo | Doble verificacion: keyword + NIF/CIF coincidente |

---

## ESTRATEGIA DE IMPLEMENTACION

**Enfoque:** Desarrollo iterativo en 3 incrementos:

1. **Incremento 1 (Core):** ThreadManager + EmailParser + tests unitarios
2. **Incremento 2 (Extension):** Panel Chrome + comunicacion con GAS
3. **Incremento 3 (Alertas):** Auditor + SLA + notificaciones push

---

## CHECKLIST

- [x] Objetivo documentado (que y por que)
- [x] Alcance definido (que SI y que NO)
- [x] Stakeholders identificados
- [x] Restricciones tecnicas/negocio claras
- [x] Riesgos principales evaluados

---

## SALIDAS

- [x] Objetivo claro del expediente
- [x] Criterios de exito definidos
- [x] Restricciones identificadas
- [x] Riesgos principales listados

---

**Estado:** COMPLETADO
**Puerta de validacion 0:** SUPERADA
