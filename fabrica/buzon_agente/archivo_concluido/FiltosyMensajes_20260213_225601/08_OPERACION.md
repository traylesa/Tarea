# 08 - OPERACION

**Fase:** Monitoreo y Soporte
**Expediente:** FiltosyMensajes_20260213_225601
**Camino:** MINI_PROYECTO

---

## Monitoreo

### Metricas Clave

| Metrica | Forma de verificar | Umbral |
|---------|-------------------|--------|
| Extension carga sin errores | chrome://extensions, consola sin errores rojos | 0 errores |
| Filtros responden < 100ms | Performance tab en DevTools al filtrar | < 100ms |
| Storage < 5MB | chrome.storage.local.getBytesInUse() en consola | < 5MB |
| Fetch GAS responde | Network tab, respuesta 200 | < 5s |

### Como verificar

```javascript
// En consola de la extension (DevTools > Console):

// 1. Verificar storage usado
chrome.storage.local.getBytesInUse(null, (bytes) => {
  console.log('Storage usado:', (bytes / 1024).toFixed(1), 'KB');
});

// 2. Verificar plantillas guardadas
chrome.storage.local.get('logitask_plantillas', (r) => {
  console.log('Plantillas:', (r.logitask_plantillas || {}).plantillas?.length || 0);
});

// 3. Verificar servicios GAS
chrome.storage.local.get('logitask_gas_services', (r) => {
  console.log('Servicios:', r.logitask_gas_services?.services?.length || 0);
});
```

---

## Plan de Soporte

### Problemas frecuentes

| Problema | Causa probable | Solucion |
|----------|---------------|----------|
| Filtros no funcionan | Tabulator no inicializado | Recargar extension |
| Plantillas no se guardan | Storage lleno | Eliminar plantillas antiguas |
| "Sin servicio" en selector | Ningun servicio GAS configurado | Tab Config > Agregar servicio |
| Agrupacion vacia | Registros sin threadId | Normal si correos no tienen hilo |
| Respuesta masiva falla | Endpoint GAS no implementado | Implementar `enviarRespuesta` en GAS |

### Endpoint GAS pendiente

El endpoint `?action=enviarRespuesta` debe implementarse en el script GAS con este contrato:

```javascript
// Request POST body:
{
  "destinatarios": [
    {
      "email": "garcia@email.com",
      "threadId": "thread_123",
      "asunto": "Re: Carga 168345",
      "cuerpo": "<p>HTML del mensaje</p>"
    }
  ]
}

// Response OK:
{ "ok": true, "enviados": 2 }

// Response Error:
{ "error": "Descripcion del error" }
```

---

## Documentacion Usuario

La ayuda integrada (tab "?") cubre:
- Filtros Avanzados (uso, operadores, baterias)
- Agrupacion por Hilo (activar, colapsar)
- Respuesta Masiva (seleccion, plantillas, envio)
- Plantillas de Respuesta (crear, variables, previsualizacion)
- Configuracion (servicios GAS, intervalos, patrones)

---

## Incidentes

Sin incidentes registrados (primera implementacion).

---

## CHECKLIST

- [x] Monitoreo: verificacion via consola DevTools documentada
- [x] Metricas: storage, performance, errores
- [x] Soporte: problemas frecuentes documentados
- [x] Documentacion: ayuda integrada en la extension
- [x] Pendientes: endpoint GAS enviarRespuesta documentado

## PUERTA DE VALIDACION 8

- [x] Monitoreo configurado (via DevTools)
- [x] Plan de soporte documentado

---

**Estado:** COMPLETADO
