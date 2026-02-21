# Skill: Motor de Reglas de Acciones

**Proposito**: Guia completa para el sistema de reglas parametrizables que dispara acciones automaticas al cambiar campos de registros (fase, estado, codCar, bandeja, etc.)

**Version**: 1.1.0 | **Ultima actualizacion**: 2026-02-21

---

## Contexto del Proyecto

TareaLog permite al usuario definir reglas tipo "cuando el campo X cambie a valor Y, ejecutar accion Z". Esto automatiza flujos de trabajo logisticos (propagar cambios al hilo, sugerir recordatorios, preseleccionar plantillas, cambiar fase/estado).

### Archivos Relevantes

| Archivo | Rol |
|---------|-----|
| `src/extension/action-rules.js` | Logica pura: CRUD reglas, evaluacion, validacion (sin DOM) |
| `src/extension/config-rules-ui.js` | UI: modal edicion, lista renderizada, select dinamicos |
| `src/extension/config.js` | Almacena reglas en `reglasAcciones` del config |
| `src/extension/config-ui.js` | Integra reglas en tab Config (init, leerFormulario) |
| `src/extension/panel.html` | Select `regla-campo` con 9 opciones, modal regla |
| `tests/TDD/unit/test_action_rules.js` | Tests unitarios (validacion, evaluacion, CRUD) |

### Referencia: `docs/DICCIONARIO_DOMINIO.md`

Consultar seccion **ESTADO_REGISTRO**, **TIPO_VINCULACION**, **FASES_TRANSPORTE** para valores validos de cada campo.

---

## Implementacion Principal

### Estructura de una Regla

```javascript
{
  id: 'regla_1708000000_a1b2',      // ID unico auto-generado
  nombre: 'Propagar fase al hilo',   // Descripcion legible
  activa: true,                      // Toggle on/off
  condicion: {
    campo: 'fase',                   // Campo que dispara la regla
    valor: '*',                      // Valor especifico o '*' (cualquiera)
    faseOrigen: null                 // Opcional: solo si viene de esta fase
  },
  acciones: [
    { tipo: 'PROPAGAR_HILO', params: {} }
  ],
  orden: 1,                          // Prioridad (menor = primero)
  origen: 'sistema'                  // 'sistema' o 'usuario'
}
```

### Campos Validos para Condiciones (9)

```javascript
var camposValidos = [
  'fase',          // Fases de transporte (00-30)
  'estado',        // Estados del registro (NUEVO, EN_PROCESO, etc.)
  'codCar',        // Codigo de carga
  'tipoTarea',     // CARGA, ADMIN, GENERAL
  'vinculacion',   // AUTOMATICA, HILO, MANUAL, SIN_VINCULAR
  'alerta',        // null, ALERTA_SUPLANTACION
  'bandeja',       // Etiqueta Gmail de origen (INBOX, OTRO, custom)
  'interlocutor',  // Email del interlocutor (texto libre)
  'zona'           // Zona geografica (texto libre)
];
```

### Tipos de Accion (8)

| Tipo | Descripcion | Params |
|------|-------------|--------|
| `PROPAGAR_HILO` | Aplica cambio a todos los msgs del hilo | `{}` |
| `SUGERIR_RECORDATORIO` | Muestra sugerencia al usuario | `{texto, horas}` |
| `CREAR_RECORDATORIO` | Crea recordatorio automaticamente | `{texto, horas}` |
| `INICIAR_SECUENCIA` | Inicia secuencia de follow-up | `{nombreSecuencia}` |
| `PRESELECCIONAR_PLANTILLA` | Abre plantilla para envio | `{nombrePlantilla}` |
| `CAMBIAR_FASE` | Cambia fase del registro | `{fase}` |
| `CAMBIAR_ESTADO` | Cambia estado del registro | `{estado}` |
| `MOSTRAR_AVISO` | Muestra mensaje al usuario | `{mensaje}` |

---

## Patrones Recomendados

### Patron 1: Evaluacion con Early Return

```javascript
// action-rules.js:95 — evaluarReglas filtra y ordena
function evaluarReglas(reglas, campo, valorNuevo, valorAnterior) {
  if (!reglas || !Array.isArray(reglas)) return [];

  var coincidentes = reglas.filter(function(r) {
    if (!r.activa) return false;
    if (r.condicion.campo !== campo) return false;
    if (r.condicion.valor !== '*' && r.condicion.valor !== valorNuevo) return false;
    if (r.condicion.faseOrigen && r.condicion.faseOrigen !== valorAnterior) return false;
    return true;
  });

  coincidentes.sort(function(a, b) { return a.orden - b.orden; });
  return coincidentes.map(function(r) {
    return { reglaId: r.id, nombre: r.nombre, acciones: r.acciones };
  });
}
```

### Patron 2: Select Dinamico por Campo

En `config-rules-ui.js`, `_poblarSelectValores()` cambia las opciones del select "valor" segun el campo seleccionado:
- **fase/estado**: opciones desde `fasesEditando`/`estadosEditando` (configuracion activa)
- **tipoTarea/vinculacion/alerta**: opciones fijas predefinidas
- **bandeja/interlocutor/zona**: solo `*` (texto libre, no hay catalogo)

### Patron 3: Reglas Default de Sistema

Las reglas con `origen: 'sistema'` no se pueden eliminar (solo desactivar). El boton "Restaurar reglas" regenera las de sistema conservando las de usuario.

---

## Errores Comunes a Evitar

### Error 1: Validar con campos antiguos

```javascript
// ANTES (solo 3 campos):
var camposValidos = ['fase', 'estado', 'codCar'];

// DESPUES (9 campos):
var camposValidos = ['fase', 'estado', 'codCar', 'tipoTarea',
  'vinculacion', 'alerta', 'bandeja', 'interlocutor', 'zona'];
```

Siempre verificar `validarRegla()` cuando se agreguen campos nuevos.

### Error 2: Olvidar actualizar panel.html

Al agregar un campo nuevo a `camposValidos`, tambien hay que agregar la `<option>` en el `<select id="regla-campo">` de `panel.html`.

---

## Consideraciones para Agentes

1. **Antes de modificar**: Leer `action-rules.js` completo + `config-rules-ui.js` para entender el flujo
2. **Durante implementacion**: Mantener dual-compat (`module.exports`), no usar DOM en action-rules.js
3. **Despues de cambios**: Ejecutar `npx jest tests/TDD/unit/test_action_rules.js`
4. **Precauciones**: No modificar reglas con `origen: 'sistema'` sin actualizar `generarReglasDefault()`

---

## Tests

```bash
npx jest tests/TDD/unit/test_action_rules.js --no-coverage
```

Tests cubren: CRUD, evaluacion con wildcards, validacion de campos, reglas default, duplicar, acciones desde reglas.

---

## Referencias

- **Diccionario dominio**: `docs/DICCIONARIO_DOMINIO.md` (campos, estados, fases)
- **Config general**: `.claude/skills/productividad-avanzada.md` (recordatorios, secuencias)
- **Sistema configuracion**: `.claude/skills/sistema-configuracion.md` (almacenamiento reglas en config)
- **Patron dual-compat**: `.claude/skills/dual-compat-modules.md`

---

**Generada automaticamente por /genera-skills**
