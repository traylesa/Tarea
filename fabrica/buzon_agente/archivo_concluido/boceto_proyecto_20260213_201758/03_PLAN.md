# 03 - PLAN DE IMPLEMENTACIÓN

**Fase:** Planificación
**Expediente:** boceto_proyecto_20260213_201758
**Camino:** PROYECTO_COMPLETO

---

## RESUMEN

10 tareas organizadas en 4 sprints. Orden de ejecución basado en dependencias: primero el backend GAS (datos + lógica), después la extensión Chrome (UI + orquestación).

---

## TAREAS

### Sprint 1: Fundamentos Backend (GAS)

#### T-01: ERPLoader - Carga de CSVs desde Drive
- **Descripción:** Módulo GAS que lee los 4 CSVs (dbo_PEDCLI, dbo_TRANSPOR, dbo_VIATELEF, dbo_TELEF) desde Google Drive, parseando con separador `;` y encoding UTF-8
- **Estimación:** 4h
- **Depende de:** Nada (primera tarea)
- **Archivos:** `gas/ERPLoader.gs`
- **Tests:** Parseo correcto de CSVs con `;`, campos con acentos, campos vacíos

#### T-02: ThreadManager - Cache de hilos
- **Descripción:** Módulo GAS que gestiona la hoja DB_Hilos (ThreadID → CODCAR). Funciones: `mapThreadToLoad()`, `getLoadFromThread()`, `cleanOldThreads()`
- **Estimación:** 3h
- **Depende de:** Nada
- **Archivos:** `gas/ThreadManager.gs`, hoja `DB_Hilos`
- **Tests:** Escritura/lectura de mapeos, limpieza de hilos > 30 días

#### T-03: EmailParser - Extracción de metadatos
- **Descripción:** Módulo GAS que analiza un mensaje Gmail y extrae: CODCAR (de adjuntos via regex), NIF/Nombre (del cuerpo), keywords administrativas. Implementa los 3 casos (A: Orden, B: Conversación, C: Administrativa)
- **Estimación:** 6h
- **Depende de:** T-01 (necesita datos ERP para cruce NIF/Nombre), T-02 (consulta cache hilos)
- **Archivos:** `gas/EmailParser.gs`
- **Tests:** Caso A con adjunto PDF, Caso B con hilo conocido, Caso C con keywords, caso sin match

---

### Sprint 2: Lógica de Negocio (GAS)

#### T-04: Auditor - Validación de contactos
- **Descripción:** Módulo GAS que compara email real (remitente/destinatario) contra email esperado del ERP (cadena CODCAR → CODVIA → VIATELEF → TELEF). Genera flag ALERTA_CONTACTO_NO_REGISTRADO
- **Estimación:** 4h
- **Depende de:** T-01, T-03
- **Archivos:** `gas/Auditor.gs`
- **Tests:** Email correcto (sin alerta), email incorrecto (alerta), transportista sin email en ERP

#### T-05: Procesador principal - Barrido de Gmail
- **Descripción:** Función principal que ejecuta un barrido incremental: obtiene correos nuevos desde último timestamp, procesa cada uno con EmailParser, registra en Hoja_Seguimiento, ejecuta Auditor
- **Estimación:** 5h
- **Depende de:** T-01, T-02, T-03, T-04
- **Archivos:** `gas/Procesador.gs`, hoja `Hoja_Seguimiento`
- **Tests:** Barrido con correos mixtos, procesamiento incremental (no reprocesar), timeout handling

#### T-06: WebApp - API para extensión
- **Descripción:** Endpoints doGet/doPost que exponen: obtener cargas del día, forzar barrido, vinculación manual, obtener alertas. Protegido con token en headers
- **Estimación:** 4h
- **Depende de:** T-05
- **Archivos:** `gas/WebApp.gs`
- **Tests:** Cada endpoint con request válido e inválido, token incorrecto rechazado

---

### Sprint 3: Extensión Chrome

#### T-07: Estructura base de extensión (MV3)
- **Descripción:** manifest.json con permisos necesarios, service-worker.js con alarms cada 15min, popup.html/css/js base, chrome.storage para configuración (URL webapp, token, intervalo)
- **Estimación:** 4h
- **Depende de:** T-06 (necesita URL de webapp para configurar)
- **Archivos:** `extension/manifest.json`, `extension/service-worker.js`, `extension/popup.html`, `extension/popup.js`, `extension/popup.css`
- **Tests:** Extensión carga sin errores, alarm se registra, popup renderiza

#### T-08: Panel de control (popup)
- **Descripción:** Tabla HTML con cargas del día. Columnas: CODCAR, Transportista, Estado (semáforo), Alertas. Filtros por estado. Botón "Forzar barrido". Sección de vinculación manual
- **Estimación:** 6h
- **Depende de:** T-07
- **Archivos:** `extension/popup.js`, `extension/popup.css`, `extension/api.js`
- **Tests:** Renderizado de tabla con datos mock, estados semáforo correctos, botón forzar barrido llama API

---

### Sprint 4: Alertas e Integración

#### T-09: Sistema de alertas
- **Descripción:** Alertas Chrome push para: SLA (carga a < 2h sin envío), contacto no registrado. Badge en icono extensión con número de alertas activas
- **Estimación:** 3h
- **Depende de:** T-07, T-08
- **Archivos:** `extension/service-worker.js`, `extension/notifications.js`
- **Tests:** Notificación aparece con datos correctos, badge se actualiza, click en notificación abre popup

#### T-10: Integración E2E y configuración
- **Descripción:** Pantalla de configuración en popup (URL webapp, token, intervalo). Test E2E del flujo completo: CSV → GAS procesa → extensión muestra. Documentación de usuario
- **Estimación:** 4h
- **Depende de:** T-01 a T-09
- **Archivos:** `extension/options.html`, `extension/options.js`, `README.md`
- **Tests:** Flujo completo con datos reales de prueba

---

## ORDEN DE EJECUCIÓN

```
Sprint 1 (13h):  T-01 ─┬─ T-03 ──┐
                 T-02 ─┘          │
                                  ▼
Sprint 2 (13h):           T-04 ─┬─ T-05 → T-06
                                │
                                ▼
Sprint 3 (10h):               T-07 → T-08
                                      │
Sprint 4 (7h):                T-09 ──┘→ T-10
```

**Esfuerzo total estimado:** ~43h

---

## PLAN DE TESTING

### Unit tests (por módulo GAS)
- ERPLoader: parseo CSV, encoding, campos vacíos
- ThreadManager: CRUD de mapeos, limpieza
- EmailParser: 3 casos de vinculación + edge cases
- Auditor: match/mismatch de emails

### Integration tests
- Procesador: barrido completo con datos de prueba
- WebApp: endpoints con extensión simulada

### E2E tests
- Flujo completo: CSV en Drive → correo de prueba → extensión muestra resultado
- Vinculación manual: correo no identificado → usuario asigna CODCAR → hilo vinculado

### Datos de prueba
- 3 CSVs de prueba con ~10 registros cada uno
- 5 correos de prueba: 2 con adjunto PDF, 1 respuesta en hilo, 1 administrativo, 1 sin match

---

## CHECKLIST

- [x] Todas las tareas listadas (T-01 a T-10)
- [x] Estimaciones por tarea y totales
- [x] Orden de ejecución con dependencias
- [x] Plan de testing (unit, integration, E2E)
- [x] Sprints definidos

---

**Estado:** COMPLETADO
