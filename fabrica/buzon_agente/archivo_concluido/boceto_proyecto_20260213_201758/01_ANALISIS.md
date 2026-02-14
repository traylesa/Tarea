# 01 - ANÁLISIS

**Fase:** Análisis de Requisitos
**Expediente:** boceto_proyecto_20260213_201758
**Camino:** PROYECTO_COMPLETO

---

## AS-IS (Estado Actual)

### Proceso actual del equipo de tráfico

1. **Envío de Órdenes:** El operador genera un PDF con nombre `Carga_XXXXXX.pdf` desde el ERP y lo envía manualmente por email al transportista
2. **Seguimiento manual:** El operador revisa su bandeja buscando respuestas, cruzando mentalmente correos con números de carga
3. **Detección de errores:** Si un correo se envió al transportista equivocado, se detecta tardíamente (o nunca)
4. **Documentación administrativa:** Certificados y AEAT 347 llegan por email y se gestionan ad-hoc, sin trazabilidad
5. **Alertas de SLA:** Inexistentes. El operador debe recordar qué cargas están próximas a vencer

### Problemas identificados

- **Sin trazabilidad:** No hay registro centralizado de qué correos pertenecen a qué carga
- **Errores silenciosos:** Emails a contactos no registrados en ERP pasan desapercibidos
- **Carga mental alta:** El operador mantiene el contexto "en la cabeza"
- **SLA reactivo:** Se detectan retrasos cuando ya es tarde
- **Datos dispersos:** ERP, Gmail y hojas Excel sin conexión

---

## TO-BE (Estado Objetivo)

### Proceso automatizado

1. **Procesamiento automático:** El sistema escanea Gmail cada 15 min (o bajo demanda) y vincula correos a cargas
2. **Panel centralizado:** El operador ve en la extensión Chrome el estado de cada carga con semáforos
3. **Alertas proactivas:** Notificaciones push cuando una carga está a < 2h de vencer sin confirmación
4. **Auditoría de contactos:** Flag automático cuando el email real no coincide con el registrado en ERP
5. **Documentación trazada:** Correos administrativos vinculados al transportista correspondiente

---

## REQUISITOS FUNCIONALES

### RF-01: Vinculación automática de correos a cargas
- **Descripción:** Analizar adjuntos de correos buscando patrón `Carga_0*(\d+)\.pdf` para extraer CODCAR
- **Prioridad:** CRÍTICA
- **Criterio aceptación:** >= 85% de correos con adjunto de carga vinculados automáticamente

### RF-02: Persistencia de hilos
- **Descripción:** Cuando un correo se vincula a un CODCAR, todos los mensajes del mismo ThreadID heredan esa vinculación
- **Prioridad:** CRÍTICA
- **Criterio aceptación:** Respuestas sin adjunto en hilos conocidos se vinculan al CODCAR original

### RF-03: Identificación de documentación administrativa
- **Descripción:** Detectar correos con keywords (Certificado, AEAT, 347, Factura) y vincular al transportista via NIF/Nombre
- **Prioridad:** ALTA
- **Criterio aceptación:** Correos administrativos clasificados como tipo ADMINISTRATIVA con CODTRA asociado

### RF-04: Auditoría de contactos
- **Descripción:** Comparar email real del correo vs email esperado según cadena CODCAR → CODTRA → CODVIA → TELEF
- **Prioridad:** ALTA
- **Criterio aceptación:** Flag ALERTA_CONTACTO_NO_REGISTRADO visible en panel cuando hay discrepancia

### RF-05: Panel de control en extensión Chrome
- **Descripción:** Vista tabular con cargas activas, estado semáforo, transportista y alertas
- **Prioridad:** ALTA
- **Criterio aceptación:** Panel muestra cargas del día con estados verde/rojo/gris

### RF-06: Alertas de SLA
- **Descripción:** Notificación push cuando FECHOR - 2h se alcanza sin correo "Enviado" para ese CODCAR
- **Prioridad:** MEDIA
- **Criterio aceptación:** Notificación Chrome visible con datos de la carga urgente

### RF-07: Vinculación manual
- **Descripción:** El usuario puede seleccionar un correo no vinculado y asignarle un CODCAR manualmente
- **Prioridad:** MEDIA
- **Criterio aceptación:** El CODCAR manual se propaga al hilo completo via Cache_Hilos

### RF-08: Ejecución programada y bajo demanda
- **Descripción:** Barrido automático cada 15 min + botón "Forzar vinculación" en extensión
- **Prioridad:** MEDIA
- **Criterio aceptación:** Timer configurable + botón funcional

---

## REQUISITOS NO FUNCIONALES

### RNF-01: Rendimiento
- Procesamiento de barrido < 60 segundos para 100 correos
- Extensión Chrome con tiempo de carga < 2 segundos

### RNF-02: Compatibilidad
- Chrome >= 120 (Manifest V3)
- Google Workspace (Gmail + Sheets + Drive)
- CSVs con encoding UTF-8, separador `;`

### RNF-03: Fiabilidad
- Procesamiento incremental (no reprocesar correos ya vinculados)
- Checkpoint en caso de timeout de GAS (6 min límite)

### RNF-04: Seguridad
- OAuth 2.0 para acceso Gmail (scopes mínimos: readonly)
- Sin almacenamiento de credenciales en extensión
- CSVs de ERP en Drive con acceso restringido

### RNF-05: Mantenibilidad
- Patrones regex configurables (no hardcoded en código)
- Logs de procesamiento en hoja dedicada
- Código modular (ThreadManager, EmailParser, Auditor)

---

## MODELO DE DATOS (Fuentes)

### Fuentes ERP (CSVs de entrada)

| CSV | Clave | Campos relevantes | Relación |
|-----|-------|-------------------|----------|
| dbo_PEDCLI | CODCAR | CODTRA, CODVIA, FECHOR, REFERENCIA | Maestro de cargas |
| dbo_TRANSPOR | CODIGO | NOMBRE, NIF, DIRECCION | CODIGO = PEDCLI.CODTRA |
| dbo_VIATELEF | CODIGO | NUMERO (ref a TELEF) | CODIGO = PEDCLI.CODVIA |
| dbo_TELEF | NUMERO | Email, Teléfono | Contactos finales |

### Cadena de vinculación ERP
```
CODCAR → dbo_PEDCLI.CODTRA → dbo_TRANSPOR (datos empresa)
CODCAR → dbo_PEDCLI.CODVIA → dbo_VIATELEF → dbo_TELEF (email esperado)
```

### Datos generados (Hojas Google)

| Hoja | Propósito |
|------|-----------|
| Hoja_Seguimiento | Registro principal: correos vinculados con datos ERP |
| DB_Hilos | Cache ThreadID → CODCAR |
| Log_Proceso | Registro de ejecuciones y errores |

---

## CHECKLIST

- [x] AS-IS documentado
- [x] TO-BE documentado
- [x] Requisitos funcionales completos (RF-01 a RF-08)
- [x] Requisitos no funcionales (RNF-01 a RNF-05)
- [x] Modelo de datos mapeado

---

**Estado:** COMPLETADO
