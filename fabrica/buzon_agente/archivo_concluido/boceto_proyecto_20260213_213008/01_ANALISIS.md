# 01 - ANALISIS

**Fase:** Analisis de Requisitos
**Expediente:** boceto_proyecto_20260213_213008
**Camino:** PROYECTO_COMPLETO

---

## AS-IS (Estado Actual)

El equipo de trafico de TRAYLESA gestiona las ordenes de carga de forma manual:

1. **Proceso actual:**
   - Exportan CSVs del ERP con datos de cargas, transportistas y contactos
   - Envian correos con PDFs adjuntos (formato `Carga_XXXXX.pdf`) a transportistas
   - Revisan manualmente las respuestas en Gmail
   - No tienen forma automatica de vincular respuestas a la carga original
   - Las solicitudes administrativas (certificados, AEAT 347) se gestionan sin vinculacion

2. **Problemas:**
   - Perdida de contexto cuando un transportista responde sin adjuntar referencia
   - No se detecta si un correo se envio a un email no registrado en el ERP
   - No hay alertas cuando una carga esta proxima a vencer sin orden enviada
   - Documentacion administrativa desvinculada del transportista

---

## TO-BE (Estado Deseado)

Sistema automatizado que:
1. Vincula correos a cargas automaticamente (por adjunto, hilo o keywords)
2. Detecta emails no registrados en el ERP
3. Alerta sobre cargas proximas a vencer sin gestion
4. Proporciona panel visual de seguimiento en Chrome

---

## GAP Analysis

| Aspecto | AS-IS | TO-BE | GAP |
|---------|-------|-------|-----|
| Vinculacion correo-carga | Manual, por memoria del operador | Automatica por adjunto/hilo | EmailParser + ThreadManager |
| Deteccion email incorrecto | Inexistente | Alerta automatica | Auditor + cruce ERP |
| Alertas SLA | Inexistente | Notificacion push 2h antes | Regla SLA + Chrome notifications |
| Panel seguimiento | No existe | Extension Chrome con tabla | Popup + comunicacion GAS |
| Clasificacion administrativa | Manual | Automatica por keywords+NIF | EmailParser caso C |

---

## HISTORIAS DE USUARIO

### HU-01: Vinculacion automatica por adjunto (Caso A)

```
COMO operador de trafico
QUIERO que el sistema detecte automaticamente el codigo de carga de los PDFs adjuntos
PARA no tener que buscar manualmente la carga asociada a cada correo
```

**Criterios de Aceptacion:**

- CA-1.1 (caso feliz):
  DADO un correo con adjunto `Carga_0168345.pdf`
  CUANDO el sistema procesa el correo
  ENTONCES extrae CODCAR=168345 y lo vincula al hilo en la cache

- CA-1.2 (caso variante):
  DADO un correo con adjunto `Carga_168345.pdf` (sin ceros iniciales)
  CUANDO el sistema procesa el correo
  ENTONCES extrae CODCAR=168345 correctamente

- CA-1.3 (caso negativo):
  DADO un correo con adjunto `Factura_001.pdf` (no es carga)
  CUANDO el sistema procesa el correo
  ENTONCES no genera vinculacion de carga

- CA-1.4 (cruce ERP):
  DADO un CODCAR extraido del adjunto
  CUANDO se busca en dbo_PEDCLI
  ENTONCES se recuperan CODTRA, CODVIA, FECHOR y REFERENCIA

**Prioridad:** ALTA | **Complejidad:** M

---

### HU-02: Herencia de contexto por hilo (Caso B)

```
COMO operador de trafico
QUIERO que las respuestas en un hilo hereden automaticamente los datos de la carga original
PARA mantener trazabilidad sin depender de que el transportista adjunte referencias
```

**Criterios de Aceptacion:**

- CA-2.1 (caso feliz):
  DADO un correo con ThreadID=T001 vinculado a CODCAR=168345
  CUANDO llega una respuesta en el mismo hilo T001 sin adjuntos
  ENTONCES hereda automaticamente CODCAR=168345 y datos del ERP

- CA-2.2 (sin vinculacion):
  DADO un correo en un hilo sin vinculacion previa
  CUANDO el sistema lo procesa
  ENTONCES no asigna CODCAR y lo marca como "sin vincular"

- CA-2.3 (conflicto):
  DADO un hilo con vinculacion a dos cargas distintas
  CUANDO se detecta conflicto
  ENTONCES marca como "conflicto" y requiere intervencion manual

**Prioridad:** ALTA | **Complejidad:** M

---

### HU-03: Clasificacion administrativa (Caso C)

```
COMO operador de trafico
QUIERO que correos sobre certificados, AEAT 347 o facturas se clasifiquen automaticamente
PARA distinguir tareas administrativas de operativas sin revision manual
```

**Criterios de Aceptacion:**

- CA-3.1 (caso feliz):
  DADO un correo con asunto "Solicitud Certificado corriente de pago"
  CUANDO el sistema procesa el correo
  ENTONCES lo clasifica como tipo=ADMINISTRATIVA y busca NIF/CIF en el cuerpo

- CA-3.2 (con NIF):
  DADO un correo administrativo con NIF coincidente en dbo_TRANSPOR
  CUANDO se cruza con el maestro
  ENTONCES vincula al CODTRA correspondiente (sin CODCAR)

- CA-3.3 (sin NIF):
  DADO un correo con keyword "347" pero sin NIF reconocible
  CUANDO el sistema procesa
  ENTONCES clasifica como ADMINISTRATIVA con CODTRA=null y flag "revisar_manualmente"

**Prioridad:** MEDIA | **Complejidad:** M

---

### HU-04: Auditoria de emails (Auditor)

```
COMO responsable de trafico
QUIERO recibir alertas cuando un correo se envia a un email no registrado en el ERP
PARA detectar desviaciones y mantener la integridad de contactos
```

**Criterios de Aceptacion:**

- CA-4.1 (email incorrecto):
  DADO un correo enviado a `juan@transportes.com` para CODCAR=168345
  CUANDO el email ERP para ese CODTRA es `info@transportes.com`
  ENTONCES se genera alerta ALERTA_CONTACTO_NO_REGISTRADO

- CA-4.2 (email correcto):
  DADO un correo enviado al email correcto segun ERP
  CUANDO el Auditor lo verifica
  ENTONCES marca como verificado sin alerta

- CA-4.3 (sin contacto):
  DADO un CODTRA sin email registrado en dbo_TELEF
  CUANDO el Auditor intenta verificar
  ENTONCES genera alerta ALERTA_SIN_CONTACTO_ERP

**Prioridad:** ALTA | **Complejidad:** S

---

### HU-05: Alertas SLA

```
COMO jefe de trafico
QUIERO recibir notificaciones push cuando una carga esta a 2 horas de vencer sin correo enviado
PARA actuar a tiempo y evitar incumplimientos
```

**Criterios de Aceptacion:**

- CA-5.1 (alerta activada):
  DADO una carga con FECHOR="13/02/2026 18:00" sin correo enviado
  CUANDO el reloj marca las 16:00 (FECHOR - 2h)
  ENTONCES se genera notificacion push "URGENTE: Carga 168345 a punto de vencer"

- CA-5.2 (sin alerta):
  DADO una carga con correo ya enviado y confirmado
  CUANDO se acerca FECHOR - 2h
  ENTONCES no se genera alerta

- CA-5.3 (multiples):
  DADO multiples cargas por vencer simultaneamente
  CUANDO se genera el barrido
  ENTONCES se envian notificaciones individuales por cada carga

**Prioridad:** ALTA | **Complejidad:** M

---

### HU-06: Panel de control (Extension Chrome)

```
COMO operador de trafico
QUIERO ver un panel en Chrome con el estado de todas las cargas
PARA tener vision global del seguimiento sin abrir multiples pestanas
```

**Criterios de Aceptacion:**

- CA-6.1 (carga panel):
  DADO que el usuario abre la extension
  CUANDO se carga el panel
  ENTONCES muestra tabla con: Estado, CODCAR, Transportista, Email, Tipo, Timestamp

- CA-6.2 (alerta visual):
  DADO una carga con alerta de email
  CUANDO se renderiza la tabla
  ENTONCES aparece con indicador rojo y texto "Email Desconocido"

- CA-6.3 (vinculacion manual):
  DADO que el usuario quiere vincular manualmente
  CUANDO pulsa "Forzar Vinculacion" e introduce CODCAR
  ENTONCES actualiza la cache de hilos y refresca la tabla

**Prioridad:** MEDIA | **Complejidad:** L

---

### HU-07: Programacion de barridos

```
COMO operador de trafico
QUIERO programar ejecuciones periodicas del procesamiento
PARA mantener los datos actualizados sin intervencion manual
```

**Criterios de Aceptacion:**

- CA-7.1 (barrido programado):
  DADO que el usuario configura barrido cada 15 minutos
  CUANDO pasan 15 minutos desde el ultimo barrido
  ENTONCES el sistema ejecuta procesamiento automatico

- CA-7.2 (barrido manual):
  DADO que el usuario pulsa "Ejecutar Ahora"
  CUANDO se lanza el barrido manual
  ENTONCES procesa todos los correos nuevos desde el ultimo barrido

- CA-7.3 (error en barrido):
  DADO un error en el barrido automatico
  CUANDO falla la ejecucion
  ENTONCES registra el error en log y reintenta en el siguiente ciclo

**Prioridad:** MEDIA | **Complejidad:** S

---

## REQUISITOS NO FUNCIONALES

| ID | Requisito | Criterio |
|----|-----------|----------|
| RNF-01 | Rendimiento panel | Carga en < 2 segundos |
| RNF-02 | Rendimiento GAS | Procesamiento lote < 6 min (limite GAS) |
| RNF-03 | Compatibilidad | Chrome 120+ con Manifest V3 |
| RNF-04 | Encoding | UTF-8 con separador `;` en exportaciones |
| RNF-05 | Locale | Fechas DD/MM/YYYY, numeros con `,` decimal |
| RNF-06 | Seguridad | OAuth2 para Gmail, sin credenciales hardcoded |
| RNF-07 | Escalabilidad | Soportar hasta 1000 correos/dia sin degradacion |
| RNF-08 | Disponibilidad | Extension funcional offline (muestra ultimo estado cacheado) |

---

## DEPENDENCIAS

| Dependencia | Tipo | Estado |
|-------------|------|--------|
| Gmail API / Google Workspace | Externa | Disponible |
| CSVs del ERP actualizados | Externa | Manual (exportacion periodica) |
| Google Sheets (hoja de seguimiento) | Externa | Disponible |

---

## PREGUNTAS ABIERTAS

Ninguna bloqueante. El boceto es suficientemente detallado para proceder.

---

## PUERTA DE VALIDACION 1

- [x] AS-IS y TO-BE documentados
- [x] Todas las HU tienen formato COMO/QUIERO/PARA
- [x] Cada HU tiene minimo 3 criterios de aceptacion (caso feliz + error + borde)
- [x] Riesgos identificados con mitigacion (ver 00_ESTRATEGIA)
- [x] Sin preguntas abiertas bloqueantes

---

**Estado:** COMPLETADO
**Puerta de validacion 1:** SUPERADA
