# 08 - OPERACION

**Fase:** Monitoreo y Soporte
**Expediente:** OPTIMIZA_TareaLog_Copiloto_2al5_20260215_171448

---

## Monitoreo

### Puntos de verificacion post-despliegue

| Que verificar | Como | Frecuencia |
|---------------|------|-----------|
| Service worker activo | chrome://extensions → TareaLog status | Al cargar |
| Alarma matutina creada | chrome://extensions → service worker → Alarms | Al instalar |
| Ventana resumen abre | Boton "Resumen" en panel | Diario |
| Flag matutino funciona | chrome.storage.local.get('tarealog_resumen_flag') | Tras primer uso |
| Config resumenMatutino guardada | Tab Config → Resumen matutino | Al configurar |
| Tests siguen pasando | `npx jest tests/TDD/unit/` | Antes de cada cambio |

### Metricas clave

| Metrica | Valor esperado |
|---------|---------------|
| Tests pasando | 70/70 |
| Errores service worker | 0 |
| Tiempo carga ventana resumen | < 3s |
| Alertas evaluadas por barrido | Variable (0-50) |

---

## Plan de Soporte

### Troubleshooting

| Problema | Causa probable | Solucion |
|----------|---------------|----------|
| Ventana resumen no abre | Service worker dormido | Recargar extension en chrome://extensions |
| Resumen matutino no aparece | Flag ya existe para hoy | Verificar `tarealog_resumen_flag` en storage |
| Config no se guarda | Error en leerFormulario() | Verificar consola de panel.html por errores |
| Click-through no funciona | Panel cerrado | abrirOEnfocarVentana() lo abre automaticamente |

---

## Puerta de Validacion 8

- [x] Monitoreo configurado (puntos de verificacion documentados)
- [x] Plan de soporte documentado (troubleshooting)

**Estado:** COMPLETADO
