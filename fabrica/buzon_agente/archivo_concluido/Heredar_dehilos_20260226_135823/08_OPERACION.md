# 08 - OPERACION

**Fase:** Monitoreo y Soporte
**Expediente:** Heredar_dehilos_20260226_135823
**Fecha:** 2026-02-26

---

## Monitoreo

### Metricas Clave
- **Registros con fase heredada:** Verificar en SEGUIMIENTO que correos de hilos clasificados tienen fase no vacia
- **Kanban "Sin Fase":** Reduccion de tarjetas en columna "Sin Fase" para hilos existentes
- **Reglas activas:** Verificar en Config > Reglas que HEREDAR_DEL_HILO aparece como tipo disponible

### Verificacion Manual
1. Abrir Sheets SEGUIMIENTO
2. Filtrar por threadId con multiples registros
3. Verificar que registros nuevos tienen fase/estado coherente con el hilo
4. Abrir Kanban y confirmar que no hay tarjetas "huerfanas" en Sin Fase

---

## Plan de Soporte

### Escenario: Herencia no deseada
**Sintoma:** Correo nuevo hereda estado CERRADO cuando deberia ser PENDIENTE
**Solucion:** Activar regla `default_heredar_cerrado` en Config > Reglas (viene inactiva por defecto)

### Escenario: Herencia no funciona
**Sintoma:** Correos de hilos clasificados siguen apareciendo en "Sin Fase"
**Verificar:**
1. Que `obtenerUltimoRegistroPorThread` esta desplegado (clasp push + deploy)
2. Que el threadId del correo coincide con registros existentes en SEGUIMIENTO
3. Que la columna `threadId` existe en headers de SEGUIMIENTO

---

## Checklist

- [x] Monitoreo definido
- [x] Plan de soporte documentado
- [x] Escenarios comunes con solucion

---

**Estado:** COMPLETADO (monitoreo a ejecutar post-deploy)
