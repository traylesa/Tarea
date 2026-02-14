# 09 - EVOLUCION

**Fase:** Mejora Continua
**Expediente:** VentayParametrizable_20260213_222619
**Estado:** COMPLETADO

---

## Retrospectiva

### Que funciono bien

- **TDD para config.js**: Escribir tests primero forzo un diseno limpio con funciones puras separadas de DOM
- **Modulo config.js dual**: Patron `module.exports` para tests + globales para extension funciono perfectamente
- **Separacion tabs**: Datos y Configuracion en tabs mantiene UI limpia sin sobrecargar
- **Merge con defaults**: Cargar config parcial y mergear con defaults evita problemas de migracion

### Que mejorar

- **Tests de UI**: Solo se testeo config.js (logica pura). Los archivos de UI (panel.js, config-ui.js) no tienen tests automatizados. Considerar Puppeteer para tests E2E en futuras iteraciones
- **Duplicacion de getDefaults()**: La funcion existe en config.js Y en background.js (el service worker no puede importar modulos con module.exports). Considerar ES modules nativos

### Lecciones Aprendidas

1. **chrome.windows.create con type:'popup'** es la forma mas simple de crear ventana independiente en MV3. No requiere permisos extra.
2. **chrome.windows.onBoundsChanged** es el evento correcto para guardar posicion/tamano de ventana. No necesita debounce porque Chrome ya lo throttlea.
3. **Service workers en MV3** no pueden usar `require()` ni `module.exports`. La comunicacion entre panel y background se hace via `chrome.runtime.sendMessage`.
4. **Tabulator se adapta a resize** si se llama `tabla.setHeight(nuevaAltura)` desde un listener de window.resize.

## Mejoras Futuras

### Tecnicas (prioridad)

- **MEDIA**: Migrar a ES modules nativos (import/export) cuando MV3 lo soporte mejor en service workers
- **BAJA**: Anadir Puppeteer para tests E2E de la extension
- **BAJA**: Implementar sync con chrome.storage.sync para compartir config entre dispositivos

### Funcionales (prioridad)

- **ALTA**: Anadir mas campos configurables segun feedback de usuarios (ej: columnas visibles por defecto, colores de estados)
- **MEDIA**: Export/import de configuracion como JSON (backup/restore)
- **BAJA**: Notificacion visual cuando config no tiene GAS_URL configurada

## Proximos Pasos

1. Desplegar extension y recoger feedback de usuarios
2. Eliminar archivos popup.* originales una vez confirmada la migracion
3. Evaluar migracion a ES modules segun soporte de Chrome

---

## PUERTA FINAL: SUPERADA

- [x] Retrospectiva completada
- [x] Documentacion proyecto actualizada
- [x] Listo para: `just concluir VentayParametrizable_20260213_222619`
