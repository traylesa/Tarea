# 09 - EVOLUCIÓN

**Fase:** Mejora Continua
**Expediente:** boceto_proyecto_20260213_201758
**Camino:** PROYECTO_COMPLETO

---

## RETROSPECTIVA

### Qué funcionó bien
- **Arquitectura híbrida GAS+Extension:** Coste cero, sin servidor, separación clara de responsabilidades
- **Procesamiento incremental:** Evita reprocesar correos, maneja timeouts de GAS
- **Regex configurable:** Cambios en formato de adjuntos no requieren redeploy
- **Cache de hilos:** Resuelve el problema central de vincular conversaciones sin adjunto
- **Fases completas del expediente:** Documentación exhaustiva facilita onboarding y mantenimiento

### Qué mejorar
- **Tests en GAS:** Difícil hacer TDD estricto en Google Apps Script (sin framework de testing nativo). Considerar gas-testing-library o migrar tests a Jest con mocks
- **UI del popup:** Funcional pero básica. Podría beneficiarse de un framework ligero (Preact/Alpine.js)
- **Monitoreo pasivo:** Depende de que el usuario revise logs. Falta alerta automática si el sistema lleva > 30 min sin ejecutar
- **Dependencia de CSVs manuales:** Los datos ERP se desactualizan entre subidas

### Lecciones aprendidas
1. **GAS tiene limitaciones reales:** 6 min de timeout, sin módulos, scope global. El diseño modular con prefijos fue clave para mantener orden
2. **MV3 service workers son efímeros:** chrome.alarms es la forma correcta de programar tareas periódicas (no setInterval)
3. **La vinculación manual es esencial:** Por mucho que mejore la IA/regex, siempre habrá correos que no se pueden clasificar automáticamente
4. **BOM en CSVs:** Windows Excel exporta con BOM por defecto. Siempre hay que stripear BOM al parsear CSVs

---

## MEJORAS FUTURAS

### Técnicas (Prioridad ALTA)

#### MT-01: Automatizar subida de CSVs ERP
- **Descripción:** Script Python/PowerShell que exporta CSVs del ERP y los sube a Drive automáticamente (tarea programada Windows)
- **Impacto:** Elimina dependencia de subida manual, datos siempre frescos
- **Esfuerzo:** 8h

#### MT-02: Alerta de sistema inactivo
- **Descripción:** Si no hay Log_Proceso INFO en > 30 min, enviar email de alerta al administrador
- **Impacto:** Detección temprana de fallos silenciosos
- **Esfuerzo:** 2h

### Técnicas (Prioridad MEDIA)

#### MT-03: Dashboard en Google Sheets
- **Descripción:** Pestaña con gráficos: correos/día, tasa vinculación, alertas/semana
- **Impacto:** Visibilidad para dirección sin necesitar extensión
- **Esfuerzo:** 4h

#### MT-04: Tests automatizados con Jest
- **Descripción:** Migrar tests a Jest con mocks de GAS APIs. CI con GitHub Actions
- **Impacto:** TDD real, regresiones detectadas automáticamente
- **Esfuerzo:** 12h

### Funcionales (Prioridad ALTA)

#### MF-01: Notificación por email de resumen diario
- **Descripción:** Email automático a las 18:00 con resumen: cargas procesadas, pendientes, alertas del día
- **Impacto:** Visibilidad sin abrir extensión
- **Esfuerzo:** 4h

### Funcionales (Prioridad MEDIA)

#### MF-02: Histórico de cargas (búsqueda)
- **Descripción:** Buscador en popup por CODCAR o transportista, mostrando historial completo
- **Impacto:** Trazabilidad retrospectiva
- **Esfuerzo:** 6h

#### MF-03: Exportar a CSV
- **Descripción:** Botón en popup para exportar tabla visible a CSV (UTF-8, separador `;`)
- **Impacto:** Integración con hojas Excel del equipo
- **Esfuerzo:** 2h

### Funcionales (Prioridad BAJA)

#### MF-04: Integración con calendario
- **Descripción:** Crear eventos en Google Calendar para cargas con FECHOR próximo
- **Impacto:** Recordatorios nativos del SO
- **Esfuerzo:** 4h

---

## ROADMAP

### v1.1 (próximo sprint)
- MT-01: Automatizar subida CSVs
- MT-02: Alerta sistema inactivo
- MF-01: Resumen diario por email

### v1.2 (2 sprints)
- MF-02: Histórico con búsqueda
- MF-03: Exportar a CSV
- MT-03: Dashboard en Sheets

### v2.0 (futuro)
- MT-04: Tests con Jest + CI
- MF-04: Integración calendario
- Posible migración a servidor propio si el volumen crece > 2000 cargas/mes

---

## PRÓXIMOS PASOS INMEDIATOS

1. Desplegar v1.0 en producción (este expediente)
2. Período de estabilización: 2 semanas con monitoreo diario
3. Recoger feedback del equipo de tráfico
4. Priorizar mejoras v1.1 basándose en feedback real
5. Crear nuevo expediente para v1.1

---

## CHECKLIST

- [x] Retrospectiva realizada (qué bien, qué mejorar, lecciones)
- [x] Lecciones aprendidas documentadas (4 lecciones)
- [x] Mejoras técnicas identificadas (MT-01 a MT-04)
- [x] Mejoras funcionales identificadas (MF-01 a MF-04)
- [x] Roadmap definido (v1.1, v1.2, v2.0)
- [x] Próximos pasos claros

---

**Estado:** COMPLETADO
