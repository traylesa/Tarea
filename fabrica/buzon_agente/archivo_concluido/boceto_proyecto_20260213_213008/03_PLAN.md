# 03 - PLAN DE IMPLEMENTACION

**Fase:** Planificacion Detallada
**Expediente:** boceto_proyecto_20260213_213008
**Camino:** PROYECTO_COMPLETO

---

## 3.1 Desglose de Tareas (WBS)

| # | Tarea | Complejidad | Dependencia | Archivos | Entregable |
|---|-------|-------------|-------------|----------|------------|
| T1 | Setup proyecto (Jest, estructura) | S | - | `package.json`, `jest.config.js` | Proyecto con tests ejecutables |
| T2 | EmailParser: extraccion CODCAR de adjuntos | M | T1 | `src/gas/EmailParser.js`, `tests/TDD/unit/test_email_parser.js` | Regex + extraccion funcional |
| T3 | EmailParser: deteccion administrativa | S | T2 | `src/gas/EmailParser.js`, `tests/TDD/unit/test_email_parser.js` | Clasificacion keywords+NIF |
| T4 | ERPReader: parseo CSV | M | T1 | `src/gas/ERPReader.js`, `tests/TDD/unit/test_erp_reader.js` | Lectura dbo_PEDCLI, dbo_TRANSPOR |
| T5 | ThreadManager: cache hilos | M | T1 | `src/gas/ThreadManager.js`, `tests/TDD/unit/test_thread_manager.js` | CRUD cache hilo↔CODCAR |
| T6 | Auditor: validacion emails | S | T4 | `src/gas/Auditor.js`, `tests/TDD/unit/test_auditor.js` | Cruce email real vs ERP |
| T7 | SLAChecker: alertas vencimiento | M | T4 | `src/gas/SLAChecker.js`, `tests/TDD/unit/test_sla_checker.js` | Deteccion cargas por vencer |
| T8 | Main: orquestador GAS | M | T2-T7 | `src/gas/Main.js` | Flujo completo procesamiento |
| T9 | Extension: manifest + popup HTML | M | - | `src/extension/manifest.json`, `popup.html`, `popup.css` | Panel visual funcional |
| T10 | Extension: popup.js logica | M | T9 | `src/extension/popup.js` | Tabla, filtros, vinculacion manual |
| T11 | Extension: background.js | S | T9 | `src/extension/background.js` | Alarmas, comunicacion GAS |

Complejidad: S (< 30 min) / M (30 min - 2h) / L (> 2h)

---

## 3.2 Orden de Ejecucion

```
Incremento 1 (Core - T1..T7):
  T1 → [T2, T4, T5 en paralelo] → [T3, T6, T7] → T8

Incremento 2 (Extension - T9..T11):
  T9 → [T10, T11 en paralelo]
```

---

## 3.3 Estrategia TDD

**Tests a escribir PRIMERO (Red):**

1. `test_extraer_codcar_de_adjunto`: Valida regex con nombres reales de PDF
2. `test_extraer_codcar_sin_ceros`: Patron sin ceros iniciales
3. `test_adjunto_no_carga`: Archivos que no son ordenes de carga
4. `test_clasificar_administrativo`: Keywords certificado/347/AEAT
5. `test_buscar_nif_en_texto`: Extraccion NIF/CIF de cuerpo email
6. `test_parsear_pedcli`: Lectura CSV con campos CODCAR,CODTRA,CODVIA,FECHOR
7. `test_parsear_transpor`: Lectura CSV con CODIGO,NOMBRE,NIF
8. `test_guardar_vinculacion_hilo`: Persistencia threadId→CODCAR
9. `test_recuperar_codcar_por_hilo`: Lectura desde cache
10. `test_auditar_email_correcto`: Email coincide con ERP
11. `test_auditar_email_incorrecto`: Email no coincide
12. `test_detectar_carga_por_vencer`: FECHOR - 2h sin correo

**Orden de Green (implementacion minima):**
1. EmailParser (regex + clasificacion)
2. ERPReader (parseo CSV)
3. ThreadManager (cache CRUD)
4. Auditor (cruce emails)
5. SLAChecker (deteccion vencimiento)

---

## 3.4 Plan de Testing

- **Unit tests** (`tests/TDD/unit/`):
  - `test_email_parser.js` - Regex, extraccion, clasificacion
  - `test_erp_reader.js` - Parseo CSV, busqueda por CODCAR/CODTRA
  - `test_thread_manager.js` - CRUD cache hilos
  - `test_auditor.js` - Comparacion emails
  - `test_sla_checker.js` - Deteccion vencimientos

- **Integration tests** (futuro, post-MVP):
  - Flujo completo: correo → extraccion → cache → registro

- **E2E** (manual):
  - Extension cargada en Chrome, panel funcional, vinculacion manual

---

## 3.5 Definition of Done (DoD)

### Criterios de aceptacion verificables:

- [ ] CA-1.1: EmailParser extrae CODCAR=168345 de `Carga_0168345.pdf`
- [ ] CA-1.2: EmailParser extrae CODCAR=168345 de `Carga_168345.pdf`
- [ ] CA-1.3: EmailParser retorna null para `Factura_001.pdf`
- [ ] CA-1.4: ERPReader encuentra CODTRA/CODVIA/FECHOR por CODCAR
- [ ] CA-2.1: ThreadManager recupera CODCAR por threadId existente
- [ ] CA-2.2: ThreadManager retorna null para threadId sin vincular
- [ ] CA-3.1: EmailParser clasifica "Certificado" como ADMINISTRATIVA
- [ ] CA-3.2: EmailParser vincula NIF encontrado a CODTRA
- [ ] CA-4.1: Auditor genera alerta para email no registrado
- [ ] CA-4.2: Auditor no genera alerta para email correcto
- [ ] CA-5.1: SLAChecker detecta carga a 2h de vencer sin correo
- [ ] CA-5.2: SLAChecker ignora carga con correo enviado

### Criterios tecnicos:

- [ ] Tests TDD escritos y pasando (green)
- [ ] Cobertura >= 80% del codigo nuevo
- [ ] Sin regresiones en tests existentes
- [ ] Nombres verificados en docs/DICCIONARIO_DOMINIO.md
- [ ] Extension Chrome carga sin errores en Manifest V3
- [ ] Funciones < 20 lineas

---

## PUERTA DE VALIDACION 3

- [x] Todas las tareas tienen complejidad, dependencia y archivos
- [x] Estrategia TDD definida (que tests primero)
- [x] Plan de testing completo
- [x] DoD completo y verificable (cada item medible)

---

**Estado:** COMPLETADO
**Puerta de validacion 3:** SUPERADA
