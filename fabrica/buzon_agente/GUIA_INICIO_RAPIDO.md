# Guía de Inicio Rápido - Sistema de Buzones

**Versión:** 2.0
**Proyecto:** PruebaInicializa4
**Última actualización:** 2026-02-13

---

## 🎯 ¿Qué es el Sistema de Buzones?

Sistema automatizado para gestionar especificaciones, errores y tareas mediante **expedientes**. Funciona como un "buzón postal inteligente":

1. **Depositas** un archivo en `entrada/`
2. **El vigilante** lo detecta y crea un expediente en `taller_activo/`
3. **Tú procesas** el expediente siguiendo las instrucciones generadas
4. **Al terminar**, lo archivas en `archivo_concluido/`

---

## 📁 Estructura de Carpetas

```
fabrica/buzon_agente/
├── entrada/              ← 📥 DEPOSITA aquí tus archivos
├── taller_activo/        ← 🔧 Expedientes en proceso
├── archivo_concluido/    ← ✅ Expedientes finalizados
├── vigilante.py          ← 👁️  Monitor automático
├── buzones.json          ← ⚙️  Configuración
└── vigilante.log         ← 📝 Logs del sistema
```

---

## 🚀 Inicio Rápido (3 Pasos)

### Paso 1: Depositar Archivo

Coloca tu archivo en `entrada/`:

```bash
# Ejemplo: Especificación de una nueva feature
echo "Implementar login con Google OAuth" > entrada/feature_login.md

# Ejemplo: Log de error para corregir
cp logs/error_critical.log entrada/
```

### Paso 2: Procesar con Vigilante

**Opción A: Modo Batch** (procesar una vez)

```bash
just automatizar
# O directamente:
python fabrica/buzon_agente/vigilante.py --modo batch
```

**Opción B: Modo Watch** (monitoreo continuo)

```bash
just automatizar-vigilar
# O directamente:
python fabrica/buzon_agente/vigilante.py --modo watch
```

### Paso 3: Trabajar en el Expediente

El vigilante habrá creado un expediente en `taller_activo/`:

```bash
# Ver expedientes activos
just estado-buzones

# Abrir expediente específico
just ejecutar-buzon EXP_20260213_120000_feature_login

# Dentro del expediente encontrarás:
taller_activo/EXP_20260213_120000_feature_login/
├── feature_login.md                # Archivo original
└── INSTRUCCIONES_AGENTE.md         # Instrucciones generadas
```

### Paso 4: Concluir Expediente

Cuando termines el trabajo:

```bash
just concluir EXP_20260213_120000_feature_login
```

Esto moverá el expediente a `archivo_concluido/` con timestamp.

---

## 📋 Tipos de Archivos Soportados

| Extensión | Tipo | Acción Recomendada |
|-----------|------|-------------------|
| `.md` | Especificación | `/implanta` |
| `.txt` | Especificación | `/implanta` |
| `.log` | Error | `/corrige` |
| `.email` | Feedback | Transformar a especificación |

Configurable en `buzones.json`.

---

## 🎓 Ejemplos de Uso

### Ejemplo 1: Nueva Feature

```bash
# 1. Crear especificación
cat > entrada/hu_login_social.md << EOF
# HU: Login con Redes Sociales

Como usuario, quiero poder iniciar sesión con Google o Facebook
para no tener que crear una cuenta nueva.

Criterios de aceptación:
- Botones "Continuar con Google" y "Continuar con Facebook"
- Redirección a OAuth
- Guardar token en localStorage
EOF

# 2. Procesar
just automatizar

# 3. El vigilante crea: taller_activo/EXP_20260213_feature_login/
# 4. Ejecutar comando recomendado:
#    /implanta --expediente EXP_20260213_feature_login

# 5. Al terminar:
just concluir EXP_20260213_feature_login
```

### Ejemplo 2: Corregir Error

```bash
# 1. Copiar log de error
cp logs/error_500_api.log entrada/

# 2. Procesar
just automatizar

# 3. El vigilante crea: taller_activo/EXP_20260213_error_500_api/
# 4. Ejecutar comando recomendado:
#    /corrige --log taller_activo/EXP_20260213_error_500_api/error_500_api.log

# 5. Al terminar:
just concluir EXP_20260213_error_500_api
```

### Ejemplo 3: Feedback de Usuario

```bash
# 1. Guardar email como .email
cat > entrada/feedback_usuario_123.email << EOF
From: usuario@example.com
Subject: Mejora sugerida

Me gustaría que el dashboard tuviera modo oscuro.
Sería genial para trabajar de noche.
EOF

# 2. Procesar
just automatizar

# 3. El vigilante detecta tipo "feedback"
# 4. Transformar a especificación formal
# 5. Crear nueva especificación en entrada/hu_modo_oscuro.md
# 6. Concluir expediente original
```

---

## 🔧 Comandos Útiles

```bash
# Ver estado de buzones
just estado-buzones

# Iniciar vigilante en modo watch
just automatizar-vigilar

# Procesar todos los archivos en entrada/
just automatizar

# Ejecutar expediente específico
just ejecutar-buzon [ID_EXPEDIENTE]

# Concluir expediente
just concluir [ID_EXPEDIENTE]

# Ver logs
cat fabrica/buzon_agente/vigilante.log
tail -f fabrica/buzon_agente/vigilante.log  # Seguir en tiempo real
```

---

## ⚙️ Configuración Avanzada

### Personalizar Tipos de Archivos

Edita `buzones.json`:

```json
{
  "deteccion_tipo": {
    ".pdf": {
      "tipo": "documento",
      "accion": "Extraer texto y analizar"
    },
    ".json": {
      "tipo": "datos",
      "accion": "Importar a base de datos"
    }
  }
}
```

### Ignorar Archivos Específicos

```json
{
  "vigilante": {
    "patrones_ignorar": [
      "*.tmp",
      "*.bak",
      "notas_personales.txt"
    ]
  }
}
```

### Deshabilitar Vigilante

```json
{
  "vigilante": {
    "habilitado": false
  }
}
```

---

## 🐛 Troubleshooting

### El vigilante no detecta archivos

**Síntoma:** Archivos permanecen en `entrada/` sin procesarse.

**Solución:**
1. Verificar que no estén en la lista de ignorados (`buzones.json`)
2. Ejecutar manualmente: `python fabrica/buzon_agente/vigilante.py --modo batch`
3. Revisar logs: `cat fabrica/buzon_agente/vigilante.log`

### Error "watchdog not found" en modo watch

**Síntoma:** `ModuleNotFoundError: No module named 'watchdog'`

**Solución:**
```bash
pip install watchdog
```

### Expediente no se mueve a archivo_concluido

**Síntoma:** `just concluir` falla.

**Solución:**
```bash
# Mover manualmente
mv fabrica/buzon_agente/taller_activo/EXP_xxx fabrica/buzon_agente/archivo_concluido/
```

---

## 📊 Flujo Completo Recomendado

```
1. Depositar
   │
   └─→ entrada/mi_spec.md
        │
2. Procesar (vigilante)
   │
   └─→ taller_activo/EXP_20260213_mi_spec/
        ├── mi_spec.md
        └── INSTRUCCIONES_AGENTE.md
        │
3. Trabajar en expediente
   │   (seguir instrucciones)
   │   (ejecutar comandos recomendados)
   │   (documentar decisiones)
   │
4. Concluir
   │
   └─→ archivo_concluido/EXP_20260213_mi_spec/
        └── (todo el contenido preservado)
```

---

## 💡 Tips y Mejores Prácticas

1. **Nombres descriptivos:** `feature_login_oauth.md` mejor que `spec1.md`
2. **Un tema por archivo:** No mezclar múltiples features
3. **Usa modo watch para flujos continuos:** Ideal si recibes archivos constantemente
4. **Revisa INSTRUCCIONES_AGENTE.md:** Contiene análisis automático útil
5. **Documenta en el expediente:** Añade notas, decisiones, cambios
6. **Archiva regularmente:** No dejes expedientes terminados en `taller_activo/`

---

## 🔗 Referencias

- **Guía completa:** `fabrica/GUIA_COMPLETA.md`
- **Protocolo agentes:** `docs/AGENT_GUIDE.md`
- **Código vigilante:** `fabrica/buzon_agente/vigilante.py`
- **Configuración:** `fabrica/buzon_agente/buzones.json`

---

**¿Dudas?** Revisa los logs en `vigilante.log` o ejecuta `just diagnostico`
