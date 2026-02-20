# US-001: Redisenar sistema de estados de registro para escaneo rapido

**Epica**: Visualizacion operativa
**Prioridad**: Must
**Estimacion**: M (5 puntos)
**Sprint**: Actual

---

## Historia de Usuario

**COMO** operador logistico de TRAYLESA que gestiona 300+ cargas activas
**QUIERO** distinguir de un vistazo el estado de cada registro con iconos y colores unicos por estado
**PARA** identificar en 2 segundos que cargas necesitan mi atencion inmediata sin leer texto

---

## Contexto y Motivacion

El operador monitoriza correos entre la empresa y transportistas. Con 300 cards en pantalla movil,
necesita escanear rapidamente para responder: "Que necesita mi atencion AHORA?"

**Problema actual:** 3 de 4 estados (ENVIADO, RECIBIDO, GESTIONADO) usan el mismo icono verde 🟢.
Solo ALERTA (🔴) se diferencia. Resultado: el operador no puede distinguir estados visualmente
y pierde tiempo revisando cards que ya estan gestionadas.

**Impacto:** Con 300 cargas, un escaneo visual que deberia tomar 3 segundos toma 30+ segundos
porque cada card requiere lectura de texto.

---

## Persona Asociada

| Atributo | Valor |
|----------|-------|
| **Nombre** | Pablo (operador TRAYLESA) |
| **Rol** | Operador logistico de trafico |
| **Objetivo** | Gestionar 300 cargas por turno sin perder incidencias |
| **Frustracion** | "Todas las cards se ven iguales, no se cuales he gestionado ya" |

---

## Diseno: 7 Estados del Registro

### Analisis del ciclo de vida email-carga

```
Email llega ──> [NUEVO] ──> Operador revisa
                              |
              ┌───────────────┼───────────────┐
              v               v               v
         [ENVIADO]      [RECIBIDO]       [ALERTA]
         Nosotros       Transportista    Problema
         enviamos       respondio        detectado
              |               |               |
              v               v               v
         [PENDIENTE]    [GESTIONADO]    [ESCALADO]
         Esperando      Accion          A supervision
         respuesta      completada      (futuro)
              |               |
              └───────┬───────┘
                      v
                 [CERRADO]
                 Documentado
                 y archivado
```

### Tabla de estados

| # | Codigo | Nombre | Significado operativo | Icono | Color fondo | Color texto | Clase CSS |
|---|--------|--------|----------------------|-------|-------------|-------------|-----------|
| 1 | NUEVO | Nuevo | Email procesado, sin revisar por operador | ● | #BBDEFB | #0D47A1 | estado-nuevo |
| 2 | ENVIADO | Enviado | Email enviado por nosotros al transportista | ↗ | #E3F2FD | #1565C0 | estado-enviado |
| 3 | RECIBIDO | Recibido | Respuesta del transportista, pendiente revision | ↙ | #FFF3E0 | #E65100 | estado-recibido |
| 4 | PENDIENTE | Pendiente | Esperando respuesta del transportista | ◔ | #FFF8E1 | #F57F17 | estado-pendiente |
| 5 | GESTIONADO | Gestionado | Procesado, accion completada | ✓ | #E8F5E9 | #2E7D32 | estado-gestionado |
| 6 | ALERTA | Alerta | Requiere atencion urgente | ▲ | #FFEBEE | #C62828 | estado-alerta |
| 7 | CERRADO | Cerrado | Documentado y archivado, sin mas acciones | ✔ | #F5F5F5 | #757575 | estado-cerrado |

### Jerarquia visual (300 cards)

```
URGENTE   ▲ ALERTA    → Fondo ROJO      → "Hay problema, actua YA"
ATENCION  ↙ RECIBIDO  → Fondo NARANJA   → "Me respondieron, debo revisar"
NUEVO     ● NUEVO     → Fondo AZUL      → "Sin revisar, es nuevo"
TRACKING  ↗ ENVIADO   → Fondo AZUL CLRO → "Enviado, tracking"
ESPERA    ◔ PENDIENTE → Fondo AMARILLO  → "Esperando su respuesta"
OK        ✓ GESTIONADO→ Fondo VERDE     → "Hecho, no requiere nada"
ARCHIVO   ✔ CERRADO   → Fondo GRIS      → "Cerrado, archivo"
```

### Renderizado en chip movil

El chip de estado en cards muestra icono + abreviatura 3 letras sobre fondo coloreado:

```html
<span class="chip-estado chip-estado-nuevo">● NUE</span>
<span class="chip-estado chip-estado-enviado">↗ ENV</span>
<span class="chip-estado chip-estado-recibido">↙ REC</span>
<span class="chip-estado chip-estado-pendiente">◔ PEN</span>
<span class="chip-estado chip-estado-gestionado">✓ GES</span>
<span class="chip-estado chip-estado-alerta">▲ ALE</span>
<span class="chip-estado chip-estado-cerrado">✔ CER</span>
```

Cada chip tiene:
- Fondo coloreado (pill redondeada)
- Icono unico por forma (no solo color)
- Abreviatura 3 letras para refuerzo textual
- Tamano compacto: `font-size: 9px; padding: 1px 4px;`

### Accesibilidad campo (outdoor)

- Contraste minimo WCAG AA en cada combinacion fondo/texto
- Iconos con FORMAS distintas (no solo color) para daltonismo
- En modo outdoor: font-size escala a 11px, padding a 2px 6px

---

## Criterios de Aceptacion (DoD)

| # | Criterio | Tipo | Prioridad |
|---|----------|------|-----------|
| AC-1 | `getDefaultEstados()` retorna 7 estados con iconos, colores y clases CSS unicos | Funcional | Must |
| AC-2 | Cada estado tiene clase CSS propia con fondo y texto coloreado distinto | Visual | Must |
| AC-3 | El chip de estado en cards muestra icono + abreviatura 3 letras | UX | Must |
| AC-4 | Con 300 cards, el operador distingue cada estado sin leer texto en <3 seg | UX | Must |
| AC-5 | Los 7 estados son distinguibles por FORMA de icono (no solo color) | Accesibilidad | Must |
| AC-6 | Tests actualizados: validan 7 estados, clases CSS nuevas, chips | Testing | Must |
| AC-7 | DICCIONARIO_DOMINIO.md actualizado con nuevos estados | Doc | Must |
| AC-8 | Funciona identico en extension Chrome y PWA movil | Cross-platform | Must |
| AC-9 | Modo outdoor: chips legibles con luz directa (contraste WCAG AA) | Accesibilidad | Should |

---

## Dependencias

**Bloqueantes**: Ninguna
**Habilitadas por esta historia**: Filtros por estado mejorados, dashboard por estado

---

## Notas Tecnicas

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/extension/estados-config.js` | 7 estados, nuevas clases CSS, campo `abreviatura` |
| `src/extension/panel.css` | Clases `.tabulator-cell.estado-*` para 7 estados |
| `src/movil/css/cards.css` | Clases `.chip-estado-*` y `.ficha-estado-*` para 7 estados |
| `src/movil/js/components/card.js` | `_chipEstadoHTML` renderiza pill coloreada con abreviatura |
| `tests/TDD/unit/test_estados_config.js` | Tests para 7 estados |
| `docs/DICCIONARIO_DOMINIO.md` | Enum ESTADO_REGISTRO actualizado |

### Retrocompatibilidad

- Los 4 estados originales (ENVIADO, RECIBIDO, GESTIONADO, ALERTA) se mantienen con mismos codigos
- Se agregan 3 nuevos: NUEVO, PENDIENTE, CERRADO
- Registros existentes sin estado → se muestran como NUEVO
- `obtenerEstadoPorCodigo()` retorna null para codigo desconocido → chip vacio (fallback seguro)

---

## Validacion INVEST

| Criterio | Estado | Notas |
|----------|--------|-------|
| **I**ndependiente | OK | No depende de otras historias |
| **N**egociable | OK | Iconos y colores ajustables sin cambiar logica |
| **V**aliosa | OK | Resuelve problema real de escaneo con 300 cargas |
| **E**stimable | OK | Alcance claro: 6 archivos, ~100 lineas cambio |
| **S**mall | OK | Completable en 1 sesion |
| **T**estable | OK | Criterios verificables: 7 estados, chips distintos, tests |
