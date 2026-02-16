# 01 - ANALISIS

**Fase:** Analisis de Requisitos
**Expediente:** PROMPT_DESARROLLO_MOVIL_20260216_004221

---

## AS-IS (Situacion Actual)

- Los operadores de trafico gestionan cargas SOLO desde PC (extension Chrome TareaLog v0.3.0)
- Fuera de oficina (almacen, muelle, en movimiento) no tienen acceso a la herramienta
- Dependen de llamadas/WhatsApp para informacion que ya esta en el sistema
- No reciben alertas proactivas en movil
- El backend GAS ya expone todos los endpoints necesarios (GET/POST)
- Existen 12 modulos de logica pura testeados (alerts, templates, filters, reminders, etc.)

## TO-BE (Situacion Deseada)

- PWA mobile-first accesible desde cualquier dispositivo con navegador
- Triaje en 3 segundos: abrir app, ver urgencias, actuar en 2 taps
- Alertas proactivas inline en lista de cargas (cards coloreadas)
- Gestion completa: cambiar fase, responder email, notas, recordatorios
- Funciona offline con cache de datos
- Modo outdoor para condiciones de campo dificiles
- Misma fuente de datos que la extension Chrome (backend GAS compartido)

## GAP Analysis

| Aspecto | AS-IS | TO-BE | GAP |
|---------|-------|-------|-----|
| Acceso movil | Ninguno | PWA completa | Crear app desde cero |
| Alertas movil | Solo en extension | Inline en cards + badge | Adaptar motor alertas a PWA |
| Offline | N/A | Cache IndexedDB | Implementar SW + IndexedDB |
| UI campo | Solo desktop | Modo outdoor + haptico | Diseno mobile-first |
| Notificaciones | chrome.notifications | Notification API + vibra | Adaptar a Web API |

---

## HISTORIAS DE USUARIO

### HU-01: Ver lista de cargas
**COMO** operador de trafico
**QUIERO** ver todas mis cargas en una lista con cards agrupadas por codCar
**PARA** tener una vision rapida del estado de todas mis cargas

**Criterios de aceptacion:**
1. DADO que abro la app, CUANDO se cargan los registros, ENTONCES veo cards agrupadas por codCar ordenadas por fecha descendente
2. DADO que hay cargas con alertas CRITICAS, CUANDO veo la lista, ENTONCES esas cards aparecen PRIMERO con banner rojo
3. DADO que quiero actualizar datos, CUANDO hago pull-to-refresh, ENTONCES se ejecuta procesarCorreos + getRegistros y la lista se actualiza
4. DADO que busco una carga especifica, CUANDO escribo en el campo busqueda, ENTONCES la lista se filtra por codCar en tiempo real

### HU-02: Ver detalle de carga
**COMO** operador de trafico
**QUIERO** tocar una card y ver toda la informacion de la carga
**PARA** entender el contexto completo antes de actuar

**Criterios de aceptacion:**
1. DADO que toco una card, CUANDO se abre el detalle, ENTONCES veo header sticky con codCar + transportista + chip fase
2. DADO que estoy en detalle, CUANDO miro la pantalla, ENTONCES veo secciones colapsables: Emails (abierta), Notas, Historial
3. DADO que estoy en detalle, CUANDO miro abajo, ENTONCES veo bottom bar sticky con [Responder] [Cambiar fase] [+ Nota]
4. DADO que toco el menu [mas], CUANDO se abre, ENTONCES veo opciones: vincular, recordatorio, historial, secuencias

### HU-03: Cambiar fase de carga
**COMO** operador de trafico
**QUIERO** cambiar la fase de una carga con un tap
**PARA** actualizar el estado del transporte rapidamente

**Criterios de aceptacion:**
1. DADO que toco [Cambiar fase], CUANDO se abre el bottom sheet, ENTONCES veo opciones coloreadas (incidencia=rojo, ok=verde)
2. DADO que selecciono una fase, CUANDO confirmo, ENTONCES recibo vibracion corta + toast "Fase actualizada a XX"
3. DADO que la fase tiene acciones contextuales, CUANDO cambio fase, ENTONCES veo sugerencias relevantes (ej: fase 19 → "Verificar descarga")
4. DADO un error de red, CUANDO falla el cambio, ENTONCES veo toast rojo "Error al actualizar" + borde rojo

### HU-04: Responder email
**COMO** operador de trafico
**QUIERO** responder a un hilo de correo con plantilla
**PARA** comunicarme rapidamente con transportistas

**Criterios de aceptacion:**
1. DADO que toco [Responder], CUANDO se abre el modal, ENTONCES veo editor full-screen con toolbar [X] [Plantilla]
2. DADO que selecciono una plantilla, CUANDO se aplica, ENTONCES las variables (codCar, transportista, etc.) se interpolan automaticamente
3. DADO que toco [Enviar ahora], CUANDO se envia, ENTONCES el boton cambia a spinner + vibracion doble al completar + toast "Email enviado"
4. DADO que quiero programar, CUANDO toco [Programar], ENTONCES puedo seleccionar fecha/hora futura

### HU-05: Ver alertas proactivas
**COMO** operador de trafico
**QUIERO** ver alertas de atencion requerida directamente en las cards
**PARA** saber inmediatamente que necesita mi atencion

**Criterios de aceptacion:**
1. DADO que hay alertas evaluadas (R2-R6), CUANDO veo la lista, ENTONCES las cards con alerta muestran banner coloreado "ACCION REQUERIDA: [texto]"
2. DADO alertas CRITICAS, CUANDO veo la lista, ENTONCES esas cards aparecen primero (antes de ordenacion por fecha)
3. DADO alertas activas, CUANDO miro el tab "Todo", ENTONCES veo badge numerico con total alertas
4. DADO alertas CRITICAS, CUANDO aparecen, ENTONCES el dispositivo vibra doble (100ms+100ms)

### HU-06: Gestionar notas
**COMO** operador de trafico
**QUIERO** agregar y ver notas rapidas por carga
**PARA** registrar contexto de llamadas u observaciones

**Criterios de aceptacion:**
1. DADO que toco [+ Nota], CUANDO escribo texto, ENTONCES la nota se guarda y aparece en lista por fecha descendente
2. DADO que una carga tiene notas, CUANDO veo la card, ENTONCES aparece icono con badge
3. DADO que quiero eliminar nota, CUANDO confirmo eliminacion, ENTONCES se borra con toast + [Deshacer 5s]

### HU-07: Filtrar cargas
**COMO** operador de trafico
**QUIERO** filtrar cargas por criterios rapidos y avanzados
**PARA** encontrar cargas especificas rapidamente

**Criterios de aceptacion:**
1. DADO que veo la lista, CUANDO miro bajo la busqueda, ENTONCES veo chips: [Urgentes] [Hoy] [Sin leer] [+]
2. DADO que toco [Urgentes], CUANDO se filtra, ENTONCES solo veo cards con alertas CRITICO + ALTO
3. DADO que toco [+], CUANDO se abre bottom sheet, ENTONCES veo filtros: transportista, fase, periodo, estado, vinculacion
4. DADO filtros activos, CUANDO veo la pantalla, ENTONCES hay resumen de filtros activos + boton [Resetear]

### HU-08: Seleccion multiple y acciones masivas
**COMO** operador de trafico
**QUIERO** seleccionar varias cargas y aplicar acciones masivas
**PARA** gestionar multiples cargas de una vez

**Criterios de aceptacion:**
1. DADO que toco checkbox de una card, CUANDO activo modo seleccion, ENTONCES aparece bottom bar "N seleccionadas [Cambiar fase] [Responder] [X]"
2. DADO seleccion activa, CUANDO toco [Cambiar fase], ENTONCES se aplica a todas las seleccionadas con confirmacion
3. DADO seleccion activa, CUANDO toco [Responder], ENTONCES puedo elegir plantilla + preview + confirmar envio masivo

### HU-09: Resumen matutino
**COMO** operador de trafico
**QUIERO** ver un resumen de alertas al inicio del turno
**PARA** planificar mi dia de trabajo

**Criterios de aceptacion:**
1. DADO que es la hora configurada (default 08:00), CUANDO abro la app, ENTONCES veo modal con 4 categorias: Urgente, Sin respuesta, Docs pendientes, Fases estancadas
2. DADO el resumen abierto, CUANDO toco "Ver" en una categoria, ENTONCES se cierra resumen y filtra lista principal
3. DADO que ya vi el resumen hoy, CUANDO abro la app de nuevo, ENTONCES NO se vuelve a mostrar

### HU-10: Recordatorios con snooze
**COMO** operador de trafico
**QUIERO** crear recordatorios con presets de tiempo
**PARA** no olvidar acciones pendientes sobre cargas

**Criterios de aceptacion:**
1. DADO que creo recordatorio, CUANDO selecciono preset (15min, 1h, manana), ENTONCES se programa con fechaDisparo calculada
2. DADO que el recordatorio vence, CUANDO se dispara, ENTONCES recibo notificacion con [Snooze 15min] [Hecho]
3. DADO sugerencia automatica (fase 19), CUANDO cambio fase, ENTONCES se pre-rellena "Verificar descarga" 8h

### HU-11: Envios programados
**COMO** operador de trafico
**QUIERO** ver y gestionar envios programados
**PARA** controlar emails que se enviaran en el futuro

**Criterios de aceptacion:**
1. DADO que voy al tab Programados, CUANDO miro, ENTONCES veo lista con estado (PENDIENTE, ENVIADO, CANCELADO, ERROR)
2. DADO un envio PENDIENTE, CUANDO toco cancelar, ENTONCES se cancela con confirmacion
3. DADO envios pasados, CUANDO miro, ENTONCES veo fecha real de envio o error

### HU-12: Dashboard operativo
**COMO** operador de trafico
**QUIERO** ver KPIs de mi turno
**PARA** conocer mi rendimiento y cargas pendientes

**Criterios de aceptacion:**
1. DADO que accedo al dashboard, CUANDO miro, ENTONCES veo: cargas activas, distribucion por grupo, alertas criticas
2. DADO datos de la semana, CUANDO miro grafico, ENTONCES veo barras de cargas cerradas por dia (7 dias)
3. DADO recordatorios hoy, CUANDO miro, ENTONCES veo conteo de pendientes

### HU-13: Modo outdoor
**COMO** operador de trafico en campo
**QUIERO** activar modo outdoor
**PARA** ver la app con contraste extra bajo sol directo

**Criterios de aceptacion:**
1. DADO que activo modo outdoor en Config, CUANDO la app cambia, ENTONCES fuentes +25%, bordes gruesos, contraste maximo
2. DADO modo outdoor activo, CUANDO navego, ENTONCES no hay animaciones complejas
3. DADO modo outdoor activo, CUANDO toco botones, ENTONCES el padding es mayor (+8dp)

---

## REQUISITOS NO FUNCIONALES

| # | Requisito | Metrica | Umbral |
|---|-----------|---------|--------|
| RNF-01 | Carga inicial | Tiempo | < 2s en 4G |
| RNF-02 | Pull-to-refresh | Tiempo | < 5s |
| RNF-03 | Offline | Disponibilidad | Datos cacheados visibles sin red |
| RNF-04 | Instalable | PWA | manifest + SW + A2HS |
| RNF-05 | Contraste | WCAG | AAA (7:1) |
| RNF-06 | Tap targets | Tamano | >= 48x48dp |
| RNF-07 | Responsive | Breakpoints | movil < 640, tablet 640-1024 |
| RNF-08 | Sin dependencias | Bundle | 0 deps externas |
| RNF-09 | Funciones | Tamano | < 20 lineas |
| RNF-10 | Cobertura tests | Porcentaje | >= 80% logica pura |

---

## DEPENDENCIAS

- Backend GAS desplegado y funcional (v0.3.0)
- Logica pura reutilizable de extension Chrome (12 modulos)
- Diccionario de dominio actualizado (docs/DICCIONARIO_DOMINIO.md)
- Hosting estatico para servir PWA (GitHub Pages o similar)

---

## PUERTA DE VALIDACION 1

- [x] AS-IS y TO-BE documentados
- [x] Todas las HU tienen formato COMO/QUIERO/PARA
- [x] Cada HU tiene minimo 3 criterios de aceptacion
- [x] Riesgos identificados con mitigacion (ver Fase 00)
- [x] No hay preguntas abiertas bloqueantes

**Estado:** COMPLETADO
