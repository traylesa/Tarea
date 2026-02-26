# 08 - OPERACION

**Fase:** Monitoreo y Soporte
**Expediente:** Recomendaciones2y3_20260215_214727
**Camino:** MINI_PROYECTO
**Estado:** COMPLETADO

---

## OBJETIVO

Documentar monitoreo y soporte post-implementacion de cambios R2/R3.

---

## Monitoreo

### Que vigilar

1. **Consola del panel**: Errores JS por funciones no encontradas indicarian problema en carga de modulos
2. **Edicion de campos**: Si un campo valido no se puede editar, revisar CAMPOS_EDITABLES en Codigo.js
3. **Sanitizacion HTML**: Si plantillas pierden formato, revisar TAGS_SEGUROS en templates.js
4. **Spreadsheet**: Si el backend falla con "SPREADSHEET_ID no configurado", ir a Config > Hoja de Calculo Destino

### Metricas clave
- Extension carga sin errores en consola
- Edicion inline de campos funciona (fase, estado, codCar, etc.)
- Plantillas se renderizan correctamente (HTML sanitizado)
- Backend responde a todas las acciones

---

## Posibles Incidentes

### 1. Campo no editable que deberia serlo
**Causa:** Campo no esta en CAMPOS_EDITABLES
**Solucion:** Agregar campo a CAMPOS_EDITABLES en src/gas/Codigo.js, hacer clasp push + deploy

### 2. HTML de plantilla se pierde o muestra mal
**Causa:** Tag o atributo no esta en whitelist
**Solucion:** Agregar tag a TAGS_SEGUROS o atributo a ATRIBUTOS_SEGUROS en src/extension/templates.js

### 3. Error "SPREADSHEET_ID no configurado"
**Causa:** PropertiesService no tiene SPREADSHEET_ID
**Solucion:** Desde la extension, ir a tab Config > Hoja de Calculo Destino y configurar

### 4. Funcion no definida al interactuar con panel
**Causa:** Script module no cargado o error de sintaxis
**Solucion:** Verificar panel.html tiene los 5 nuevos script tags y recargar extension

---

## Documentacion Actualizada

- **05_RESULTADO.md**: Implementacion completa con resultados de tests
- **06_VALIDACION.md**: Validacion de todos los requisitos
- **07_DESPLIEGUE.md**: Pasos de deploy y rollback

---

## Conclusion

Expediente completado exitosamente:
- **R2 (Seguridad):** sanitizarHtml con whitelist, CAMPOS_EDITABLES, sin ID hardcodeado
- **R3 (Modularizacion):** panel.js de 2772 a 1714 lineas, 5 modulos extraidos
- **Tests:** 419 pasando, 0 regresiones
- **Bug bonus:** Corregido abrirModalNotas(codCar -> clave)

---

**Estado final:** EXPEDIENTE COMPLETADO
