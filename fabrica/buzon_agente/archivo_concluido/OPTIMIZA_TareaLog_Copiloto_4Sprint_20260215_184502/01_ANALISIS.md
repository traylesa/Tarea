# 01 - ANALISIS

**Fase:** Analisis Detallado
**Expediente:** OPTIMIZA_TareaLog_Copiloto_4Sprint_20260215_184502

---

## 1.1 Resumen Ejecutivo

Sprint 4 implementa 2 HUs del Bloque D (Micro-acciones): acciones contextuales por fase (HU-11) y notas rapidas por carga (HU-12). Ambos modulos son 100% cliente (sin cambios GAS), siguen el patron probado de logica pura + integracion panel.

## 1.2 Situacion Actual (AS-IS)

- El operador ve la tabla con todas las cargas y sus fases
- Para actuar sobre una carga debe: (1) identificar fase, (2) buscar plantilla correcta, (3) seleccionar, (4) enviar, (5) cambiar fase manualmente
- Para apuntar contexto de llamadas/WhatsApp no hay donde: usa papel, Excel o memoria
- No hay acciones rapidas asociadas a la fase de la carga
- No hay sistema de notas por carga

## 1.3 Situacion Deseada (TO-BE)

- Al seleccionar una fila, aparece barra con acciones relevantes segun la fase
- 1 click ejecuta accion (prepara plantilla + marca fase siguiente)
- Cada fila tiene icono de notas con badge si tiene contenido
- Click en icono abre modal con historial + input rapido
- Notas persisten en storage local asociadas a codCar

## 1.4 GAP Analysis

| Aspecto | AS-IS | TO-BE | GAP |
|---------|-------|-------|-----|
| Acciones por fase | Manuales (5+ pasos) | 1 click (accion contextual) | Modulo action-bar.js + UI |
| Contexto operativo | Papel/memoria | Notas digitales por carga | Modulo notes.js + UI |
| Tiempo por accion | ~30s (navegar menus) | ~3s (1 click) | Automatizacion accion |

---

## 1.5 Historias de Usuario

### HU-11: Acciones Contextuales por Fase

```
COMO operador que repite las mismas acciones segun la fase de la carga
QUIERO botones de accion rapida que cambien segun la fase actual
PARA eliminar navegacion repetitiva entre menus
```

**Criterios de Aceptacion:**

- CA-11.1 (caso feliz — barra visible):
  DADO que selecciono una fila con fase '29'
  CUANDO la tabla muestra la fila seleccionada
  ENTONCES veo barra con acciones ["Reclamar POD", "Marcar documentado"]

- CA-11.2 (caso feliz — acciones por fase):
  DADO que una carga esta en fase '12' (Cargando)
  CUANDO miro las acciones disponibles
  ENTONCES veo ["Solicitar posicion", "Avisar destino"]

- CA-11.3 (caso feliz — ejecucion):
  DADO que hago click en "Reclamar POD" para carga en fase '29'
  CUANDO se ejecuta la accion
  ENTONCES se prepara plantilla "Reclamar POD" con datos de la carga

- CA-11.4 (caso borde — fase sin acciones):
  DADO que selecciono una fila con fase '30' (Documentado)
  CUANDO busco acciones
  ENTONCES la barra muestra vacia o mensaje "Sin acciones pendientes"

- CA-11.5 (caso borde — sin fase):
  DADO que selecciono una fila sin fase asignada
  CUANDO busco acciones
  ENTONCES retorna array vacio

### HU-12: Notas Rapidas en Cargas

```
COMO operador que acaba de hablar por telefono/WhatsApp
QUIERO apuntar una nota rapida asociada a la carga
PARA no olvidar contexto y que otros operadores lo vean
```

**Criterios de Aceptacion:**

- CA-12.1 (caso feliz — crear nota):
  DADO que tengo la carga 168345 abierta
  CUANDO escribo "Conductor avisa 30min retraso" y presiono Enter
  ENTONCES la nota se guarda con timestamp asociada a codCar 168345

- CA-12.2 (caso feliz — listar notas):
  DADO que la carga 168345 tiene 3 notas
  CUANDO abro el modal de notas
  ENTONCES veo las 3 notas ordenadas cronologicamente (recientes arriba)

- CA-12.3 (caso feliz — eliminar nota):
  DADO que existe una nota con id especifico
  CUANDO la elimino
  ENTONCES desaparece de la lista

- CA-12.4 (caso error — texto vacio):
  DADO que intento crear nota sin texto
  CUANDO llamo a crearNota con texto vacio
  ENTONCES lanza error "El texto de la nota es obligatorio"

- CA-12.5 (caso borde — limite notas):
  DADO que una carga tiene 50 notas (maximo)
  CUANDO intento crear nota 51
  ENTONCES lanza error de limite alcanzado

- CA-12.6 (caso borde — carga sin notas):
  DADO que una carga no tiene notas
  CUANDO consulto notas
  ENTONCES retorna array vacio

---

## 1.6 Requisitos No Funcionales

- **Rendimiento:** obtenerAcciones() < 1ms (mapa estatico), listarNotas() < 5ms
- **Persistencia:** Notas en chrome.storage.local, sobreviven cierre navegador
- **Compatibilidad:** Chrome 120+ (MV3)
- **Limite:** Max 50 notas por carga

---

## 1.7 Analisis de Riesgos

| Riesgo | Prob | Impacto | Mitigacion |
|--------|------|---------|------------|
| Integracion panel.js compleja | MEDIA | MEDIO | Modulos puros, panel solo hookea |
| Storage local sin sincronizar entre dispositivos | BAJA | BAJO | Aceptable para v1, sync en futuro |
| Acciones no cubren todos los escenarios | MEDIA | BAJO | Mapa configurable |

---

## 1.8 Dependencias

- **Depende de:** Sprint 1-3 (alerts.js, reminders.js, config.js, panel.js)
- **No depende de:** Backend GAS (100% cliente)
- **Dependientes:** Sprint 5 podria reutilizar action-bar para secuencias

---

## 1.9 Preguntas Abiertas

- Ninguna. Los requisitos estan claros del documento fuente y los Sprints previos definen el patron.

---

## Checklist

- [x] AS-IS y TO-BE documentados
- [x] Todas las HU tienen formato COMO/QUIERO/PARA
- [x] Cada HU tiene minimo 3 criterios de aceptacion
- [x] Riesgos identificados con mitigacion
- [x] Sin preguntas abiertas

---

**Estado:** COMPLETADO
