**Objetivo:** Desde el punto de vista del usuario de tráfico ayudémole a minimizar su carga y estresante trabajo. Optimizar la visualización y la carga operativa del gestor de tráfico mediante una interfaz dinámica, edición masiva y filtros inteligentes.

---

## 1. Modelo de Datos y Registro Principal
Se requiere la integración de nuevos campos en la base de datos principal, permitiendo la importación directa, (junto con el resto de campos definidos anteriormente) desde la tabla `PEDCLI`.

| Campo Destino | Origen (`PEDCLI`) | Lógica / Valor por Defecto |
| :--- | :--- | :--- |
| **Fase** | - | Inicializar como **"00 Esperando"** (Parametrizable) |
| **FCarga** | `FECSAL` | Fecha de salida |
| **HCarga** | `FECHORSAL` | Hora de salida |
| **FEntrega** | `FECLLE` | Fecha de llegada |
| **HEntrega** | `FECHORLLE` | Hora de llegada |
| **Zona** | `ZONA` | Zona de origen |
| **ZDest** | `ZONADES` | Zona de destino |

> **Configuración:** Las **Fases** deben ser totalmente editables y creables desde una interfaz de mantenimiento específica.

---

## 2. Sistema de Filtrado y Búsqueda
Diseñado para minimizar clics y evitar errores de rango:

### A. Filtros Temporales (Habilitables por Checkbox)
*   **Rango de Carga:** Desde `[Fecha Actual]` hasta `[Día Siguiente]`.
*   **Rango de Descarga:** Desde `[Día Anterior]` hasta `[Fecha Actual]`.

### B. Filtros Geográficos y Generales
*   **Zona / ZDest:** Uso del método "Contiene". Poblados por defecto con `*` (Comodín total).
*   **Búsqueda Global:** El campo de búsqueda de texto debe realizar un barrido en **todas las columnas** de la rejilla.
*   **Opción "Todo":** Los campos *Referencia, FCarga, FEntrega, Zona y ZDest* incluirán un estado "Todo" que deshabilite el filtro para evitar exclusiones accidentales.

### C. Selectores de Fase
*   Visualización mediante **Tarjetas (Cards)** interactivas.
*   Opciones rápidas de **"Marcar Todas"** y **"Desmarcar Todas"**.

---

## 3. Funcionalidades de la Rejilla (Grid)

### Edición Dinámica
*   **Individual:** Los campos **Estado** y **Fase** en la rejilla serán `ComboBox` para cambios rápidos sin salir de la línea.
*   **Masiva:** 
    1.  Check de selección múltiple por línea.
    2.  Panel superior con Checkbox + ComboBox para **Fase** y **Estado**.
    3.  Botón de aplicado eficaz al registro de base de datos.

### Visualización Personalizada
*   **Gestor de Columnas:** Opción para **Mostrar/Ocultar** campos según la necesidad del usuario.
*   **Operadores Lógicos:** Incorporación obligatoria de: `contiene`, `no contiene`, `igual`, `<`, `<=`, `>`, `>=`.

---

## 4. Usabilidad y Reglas de Negocio
*   **Case Insensitivity:** El sistema debe ignorar mayúsculas y minúsculas en cualquier entrada de búsqueda o filtrado.
*   **Reactividad:** Los filtros temporales deben actualizarse automáticamente al abrir la interfaz basándose en la fecha del sistema.