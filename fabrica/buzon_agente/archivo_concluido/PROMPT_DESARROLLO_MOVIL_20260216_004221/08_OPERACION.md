# 08 - OPERACION

**Fase:** Monitoreo y Soporte
**Expediente:** PROMPT_DESARROLLO_MOVIL_20260216_004221

---

## MONITOREO

### Metricas Clave

| Metrica | Herramienta | Umbral | Accion |
|---------|-------------|--------|--------|
| Disponibilidad PWA | Navegador / uptime check | > 99% | Verificar hosting |
| Errores fetch API | Console.log + toast | 0 en condiciones normales | Verificar GAS URL |
| Cache hit rate | SW console | > 80% offline | Verificar sw.js |
| Tiempo carga inicial | DevTools Performance | < 2s | Revisar assets |

### Alertas Automaticas

La PWA maneja errores de forma autonoma:
- **Sin red:** Muestra datos cacheados + toast "Sin conexion"
- **Error API:** Toast rojo con mensaje de error
- **Cache expirado:** Auto-refresh al recuperar conexion

### Dependencias Externas

| Dependencia | SLA | Impacto si falla | Mitigacion |
|-------------|-----|-------------------|------------|
| GAS Backend | 99.9% (Google) | Sin datos frescos | Cache offline |
| Gmail API | 99.9% (Google) | Sin nuevos correos | Cola de reintentos |
| Hosting PWA | Variable | App inaccesible | Cache SW (funciona offline) |

---

## SOPORTE

### Problemas Comunes

| Problema | Causa | Solucion |
|----------|-------|----------|
| "Sin conexion y sin cache" | Primera carga sin red | Conectar a red, cargar datos, luego funciona offline |
| Datos no actualizan | URL GAS incorrecta | Config > verificar URL backend |
| No vibra | Dispositivo sin haptics | Normal en algunos dispositivos |
| No se puede instalar | HTTP (no HTTPS) | Requiere HTTPS para PWA completa |
| Cards vacias | Sin registros en Sheets | Verificar hoja SEGUIMIENTO en Google Sheets |

### Flujo de Soporte
1. Usuario reporta incidencia
2. Verificar: tiene red? URL GAS correcta? Datos en Sheets?
3. Limpiar cache si necesario: Config > borrar localStorage
4. Si persiste: revisar Console del navegador

---

## DOCUMENTACION USUARIO

### Guia Rapida

1. **Abrir** la URL de la PWA en Chrome del movil
2. **Configurar** la URL del backend GAS en el tab Config
3. **Actualizar** tirando hacia abajo en la lista (pull-to-refresh)
4. **Gestionar** cargas: tocar card → detalle → acciones
5. **Instalar** como app: Chrome menu > "Agregar a pantalla inicio"

### Funciones Principales
- **Todo:** Lista de cargas con alertas, busqueda, filtros rapidos
- **Detalle:** Emails, notas, historial, cambio fase, responder
- **Programados:** Envios futuros y recordatorios activos
- **Config:** URL backend, modo outdoor, firma

---

## PUERTA DE VALIDACION 8

- [x] Metricas clave definidas con umbrales
- [x] Alertas automaticas documentadas
- [x] Problemas comunes con soluciones
- [x] Flujo de soporte definido
- [x] Documentacion usuario creada

**Estado:** COMPLETADO
