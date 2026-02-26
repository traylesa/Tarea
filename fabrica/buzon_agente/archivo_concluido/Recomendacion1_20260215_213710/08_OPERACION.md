# 08 - OPERACION

**Fase:** Monitoreo y Soporte
**Expediente:** Recomendacion1_20260215_213710
**Camino:** MINI_PROYECTO

---

## Monitoreo

### Metricas Clave

| Metrica | Donde verificar | Valor esperado |
|---------|-----------------|----------------|
| Barridos con timeout | Console background.js | 0 (si servidor responde en <5min) |
| Barridos superpuestos evitados | Console "barrido ignorado" | Deberia ser raro |
| Mensajes por lote | Logger GAS | Max 50, luego hayMas |
| Errores de guardado | Toast en panel | 0 en uso normal |
| Tandas de envio | Progreso "tanda X/Y" | Solo visible con >15 destinatarios |

### Puntos de Observacion

1. **Console del service worker** (`chrome://extensions` → Inspeccionar vistas de servicio):
   - `"Barrido cancelado por timeout"` → indica servidor lento, considerar aumentar `timeoutBarridoMs`
   - `"Error en barrido periodico"` → error de red o servidor

2. **Logger GAS** (Google Apps Script → Ejecuciones):
   - `"procesarCorreos (limite: 50)"` → lote limitado correctamente
   - `"hayMas: true"` → hay correos pendientes, siguiente barrido los procesara

3. **Panel TareaLog**:
   - Toast rojo → error de guardado, verificar conexion
   - Celda con borde rojo → guardado fallido, dato local != servidor

### Alertas Configuradas

| Alerta | Condicion | Accion |
|--------|-----------|--------|
| Timeout frecuente | >3 timeouts/dia | Aumentar `timeoutBarridoMs` a 600000 |
| Lotes frecuentes | hayMas=true >5 veces seguidas | Considerar aumentar `limiteLoteProcesamiento` a 100 |
| Errores guardado | Toast rojo frecuente | Verificar estado servidor GAS |

---

## Plan de Soporte

### Ajuste de Parametros

Los 3 parametros son configurables via `config.robustez` en storage:

```javascript
// Desde consola del panel:
chrome.storage.local.get('tarealog_config', (r) => {
  var c = r.tarealog_config;
  c.robustez.timeoutBarridoMs = 600000;   // 10 min si servidor lento
  c.robustez.limiteLoteProcesamiento = 100; // Mas mensajes por lote
  c.robustez.tamanoTandaEnvio = 20;        // Tandas mas grandes
  chrome.storage.local.set({ tarealog_config: c });
});
```

### Troubleshooting

| Problema | Causa probable | Solucion |
|----------|---------------|----------|
| "Barrido cancelado por timeout" frecuente | Servidor GAS lento, muchos correos | Aumentar timeoutBarridoMs |
| Toast "Error al guardar" constante | Servidor caido o URL incorrecta | Verificar gasUrl en config |
| "Enviando tanda X/Y" se queda colgado | Timeout GAS en envio | Reducir tamanoTandaEnvio a 10 |
| No procesa correos nuevos | hayMas=true pero alarma no funciona | Verificar chrome.alarms en service worker |

---

## Incidentes

Ninguno registrado (implementacion reciente).

---

## CHECKLIST

- [x] Monitoreo documentado (3 puntos de observacion)
- [x] Metricas clave definidas (5 metricas)
- [x] Plan de soporte con troubleshooting
- [x] Parametros ajustables documentados
- [x] 0 incidentes criticos

---

## >>> PUERTA DE VALIDACION 8 <<<

- [x] Monitoreo configurado (console + logger + panel)
- [x] Plan de soporte documentado

---

**Estado:** COMPLETADO
