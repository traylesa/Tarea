# 📥 Buzón de Entrada

**¡Bienvenido al buzón de entrada del sistema de expedientes!**

---

## 🎯 ¿Qué hacer aquí?

**Deposita cualquier archivo** que quieras que el sistema procese automáticamente:

- ✅ Especificaciones de features (`.md`, `.txt`)
- ✅ Logs de errores (`.log`)
- ✅ Emails con feedback (`.email`)
- ✅ Cualquier otro documento relevante

---

## 🚀 Proceso Automático

1. **Depositas** archivo aquí → `entrada/mi_archivo.md`
2. **Ejecutas vigilante** → `just automatizar`
3. **El sistema crea expediente** → `taller_activo/EXP_xxx/`
4. **Tú trabajas** en el expediente siguiendo instrucciones
5. **Archivas** al terminar → `just concluir EXP_xxx`

---

## 📝 Ejemplo Rápido

```bash
# 1. Crear especificación
echo "Implementar sistema de notificaciones push" > entrada/feature_notificaciones.md

# 2. Procesar
just automatizar

# 3. El vigilante crea automáticamente:
#    taller_activo/EXP_20260213_feature_notificaciones/
#       ├── feature_notificaciones.md
#       └── INSTRUCCIONES_AGENTE.md
```

---

## ⚙️ Tipos de Archivos Soportados

| Extensión | Acción Automática |
|-----------|------------------|
| `.md` | `/implanta` (implementar) |
| `.txt` | `/implanta` (implementar) |
| `.log` | `/corrige` (corregir error) |
| `.email` | Transformar a especificación |

---

## 💡 Tips

- ✅ **Nombres descriptivos:** `feature_login.md` mejor que `spec1.md`
- ✅ **Un tema por archivo:** Facilita el procesamiento
- ✅ **Usa formato Markdown:** Para mejor legibilidad
- ❌ **No deposites archivos temporales:** `.tmp`, `.bak`, etc.

---

## 🔧 Comandos Útiles

```bash
# Ver qué hay en entrada
ls entrada/

# Procesar todos los archivos
just automatizar

# Ver estado de buzones
just estado-buzones

# Vigilancia continua (detecta archivos nuevos automáticamente)
just automatizar-vigilar
```

---

## 📚 Más Información

- **Guía completa:** `fabrica/buzon_agente/GUIA_INICIO_RAPIDO.md`
- **Comandos disponibles:** `just ayuda`
- **Ver logs:** `cat fabrica/buzon_agente/vigilante.log`

---

**Sistema:** Fábrica Agéntica v2.0
**Proyecto:** PruebaInicializa4
