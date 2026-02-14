let fasesEditando = [];
let faseEditandoIdx = null;

async function inicializarConfigUI() {
  const config = await cargar();

  const elGasUrl = document.getElementById('cfg-gas-url');
  if (elGasUrl) elGasUrl.value = config.gasUrl;
  document.getElementById('cfg-intervalo').value = config.intervaloMinutos;
  document.getElementById('cfg-ruta-csv').value = config.rutaCsvErp;
  document.getElementById('cfg-patron-codcar').value = config.patrones.codcarAdjunto;
  document.getElementById('cfg-patron-keywords').value = config.patrones.keywordsAdmin;

  fasesEditando = config.fases ? JSON.parse(JSON.stringify(config.fases)) : getDefaultFases();
  renderListaFasesConfig();
}

function leerFormulario() {
  const elGasUrl = document.getElementById('cfg-gas-url');
  return {
    gasUrl: elGasUrl ? elGasUrl.value.trim() : '',
    intervaloMinutos: parseInt(document.getElementById('cfg-intervalo').value, 10) || 0,
    rutaCsvErp: document.getElementById('cfg-ruta-csv').value.trim(),
    patrones: {
      codcarAdjunto: document.getElementById('cfg-patron-codcar').value.trim(),
      keywordsAdmin: document.getElementById('cfg-patron-keywords').value.trim()
    },
    fases: fasesEditando
  };
}

function mostrarErrores(errores) {
  const el = document.getElementById('config-errores');
  el.innerHTML = errores.map(e => `<p>${e}</p>`).join('');
  el.classList.remove('hidden');
  document.getElementById('config-exito').classList.add('hidden');
}

function mostrarExito() {
  document.getElementById('config-exito').classList.remove('hidden');
  document.getElementById('config-errores').classList.add('hidden');
  setTimeout(() => {
    document.getElementById('config-exito').classList.add('hidden');
  }, 3000);
}

async function guardarConfigDesdeUI(e) {
  e.preventDefault();

  const configAnterior = await cargar();
  const nuevaConfig = leerFormulario();
  nuevaConfig.ventana = configAnterior.ventana;

  const resultado = validar(nuevaConfig);
  if (!resultado.valido) {
    mostrarErrores(resultado.errores);
    return;
  }

  await guardar(nuevaConfig);
  mostrarExito();

  if (nuevaConfig.intervaloMinutos !== configAnterior.intervaloMinutos) {
    chrome.runtime.sendMessage({
      tipo: 'RECREAR_ALARMA',
      intervaloMinutos: nuevaConfig.intervaloMinutos
    });
  }

  if (typeof configActual !== 'undefined') {
    configActual = nuevaConfig;
  }

  if (typeof aplicarConfigFasesSesion === 'function') {
    await aplicarConfigFasesSesion();
  }
}

async function restaurarDefaults() {
  const config = getDefaults();
  await guardar(config);
  await inicializarConfigUI();
  mostrarExito();

  if (typeof configActual !== 'undefined') {
    configActual = config;
  }

  if (typeof aplicarConfigFasesSesion === 'function') {
    await aplicarConfigFasesSesion();
  }
}

// --- Fases Config UI ---

function renderListaFasesConfig() {
  const container = document.getElementById('lista-fases-config');
  if (!container) return;
  container.innerHTML = '';

  const ordenadas = obtenerFasesOrdenadas(fasesEditando);

  ordenadas.forEach((fase, idx) => {
    const item = document.createElement('div');
    item.className = 'fase-item';

    let badges = '';
    if (fase.es_critica) badges += '<span class="badge-critica">critica</span>';
    if (fase.clase_css) badges += `<span class="badge-clase">${fase.clase_css}</span>`;
    if (!fase.activa) badges += '<span class="badge-inactiva">inactiva</span>';

    const codigoDisplay = fase.codigo || '(vacia)';

    item.innerHTML = `
      <span class="fase-codigo">${codigoDisplay}</span>
      <span class="fase-nombre">${fase.nombre}</span>
      ${badges}
      <button class="btn-icon" data-action="subir" title="Subir">&#9650;</button>
      <button class="btn-icon" data-action="bajar" title="Bajar">&#9660;</button>
      <button class="btn-icon" data-action="editar" title="Editar">&#9998;</button>
      <button class="btn-icon btn-danger" data-action="eliminar" title="Eliminar">&#10005;</button>
    `;

    item.querySelectorAll('.btn-icon').forEach(btn => {
      btn.addEventListener('click', () => {
        const realIdx = fasesEditando.indexOf(fase);
        accionFase(btn.dataset.action, realIdx);
      });
    });

    container.appendChild(item);
  });
}

function accionFase(accion, idx) {
  if (accion === 'editar') {
    abrirModalFase(idx);
  } else if (accion === 'eliminar') {
    fasesEditando.splice(idx, 1);
    renderListaFasesConfig();
  } else if (accion === 'subir' || accion === 'bajar') {
    moverFase(idx, accion === 'subir' ? -1 : 1);
    renderListaFasesConfig();
  }
}

function moverFase(idx, direccion) {
  const ordenadas = obtenerFasesOrdenadas(fasesEditando);
  const fase = fasesEditando[idx];
  const posVisual = ordenadas.indexOf(fase);

  const posVecino = posVisual + direccion;
  if (posVecino < 0 || posVecino >= ordenadas.length) return;

  const vecino = ordenadas[posVecino];
  const tmpOrden = fase.orden;
  fase.orden = vecino.orden;
  vecino.orden = tmpOrden;
}

function abrirModalFase(idx) {
  faseEditandoIdx = idx;
  const modal = document.getElementById('modal-fase');
  const titulo = document.getElementById('modal-fase-titulo');
  const errorEl = document.getElementById('modal-fase-error');
  errorEl.classList.add('hidden');

  if (idx !== null && idx >= 0) {
    titulo.textContent = 'Editar Fase';
    const fase = fasesEditando[idx];
    document.getElementById('fase-codigo').value = fase.codigo;
    document.getElementById('fase-nombre').value = fase.nombre;
    document.getElementById('fase-orden').value = fase.orden;
    document.getElementById('fase-critica').checked = fase.es_critica;
    document.getElementById('fase-clase-css').value = fase.clase_css;
    document.getElementById('fase-activa').checked = fase.activa;
  } else {
    titulo.textContent = 'Nueva Fase';
    const maxOrden = fasesEditando.reduce((max, f) => Math.max(max, f.orden), 0);
    document.getElementById('fase-codigo').value = '';
    document.getElementById('fase-nombre').value = '';
    document.getElementById('fase-orden').value = maxOrden + 1;
    document.getElementById('fase-critica').checked = false;
    document.getElementById('fase-clase-css').value = '';
    document.getElementById('fase-activa').checked = true;
  }

  modal.classList.remove('hidden');
}

function cerrarModalFase() {
  document.getElementById('modal-fase').classList.add('hidden');
  faseEditandoIdx = null;
}

function guardarFaseDesdeModal() {
  const codigo = document.getElementById('fase-codigo').value.trim();
  const nombre = document.getElementById('fase-nombre').value.trim();
  const orden = parseInt(document.getElementById('fase-orden').value, 10);
  const es_critica = document.getElementById('fase-critica').checked;
  const clase_css = document.getElementById('fase-clase-css').value;
  const activa = document.getElementById('fase-activa').checked;

  if (!nombre) {
    const errorEl = document.getElementById('modal-fase-error');
    errorEl.textContent = 'El nombre es obligatorio';
    errorEl.classList.remove('hidden');
    return;
  }

  // Verificar codigo duplicado (excepto si editamos la misma fase)
  const duplicado = fasesEditando.findIndex(f => f.codigo === codigo);
  if (duplicado >= 0 && duplicado !== faseEditandoIdx) {
    const errorEl = document.getElementById('modal-fase-error');
    errorEl.textContent = `Ya existe una fase con codigo "${codigo}"`;
    errorEl.classList.remove('hidden');
    return;
  }

  const fase = { codigo, nombre, orden, es_critica, clase_css, activa };

  if (faseEditandoIdx !== null && faseEditandoIdx >= 0) {
    fasesEditando[faseEditandoIdx] = fase;
  } else {
    fasesEditando.push(fase);
  }

  cerrarModalFase();
  renderListaFasesConfig();
}

// --- Export/Import UI ---

function exportarConfig() {
  const config = leerFormulario();
  const configAnterior = configActual || config;
  const merged = { ...configAnterior, ...config };
  merged.ventana = configAnterior.ventana || { width: 800, height: 600, left: null, top: null };

  const exportado = exportarConfigCompleta(merged);
  const json = JSON.stringify(exportado, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const fecha = new Date().toISOString().split('T')[0];
  const a = document.createElement('a');
  a.href = url;
  a.download = `logitask_config_${fecha}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function clickImportarConfig() {
  document.getElementById('input-importar-config').click();
}

function procesarImportacion(e) {
  const file = e.target.files[0];
  if (!file) return;

  const resultadoEl = document.getElementById('import-resultado');

  const reader = new FileReader();
  reader.onload = async (evt) => {
    try {
      const data = JSON.parse(evt.target.result);
      const resultado = validarImportacion(data);

      if (!resultado.valido) {
        resultadoEl.className = 'error';
        resultadoEl.textContent = 'Error: ' + resultado.errores.join(', ');
        resultadoEl.classList.remove('hidden');
        return;
      }

      await guardar(data.config);
      await inicializarConfigUI();

      if (typeof configActual !== 'undefined') {
        configActual = data.config;
      }

      if (typeof aplicarConfigFasesSesion === 'function') {
        await aplicarConfigFasesSesion();
      }

      resultadoEl.className = 'exito';
      resultadoEl.textContent = 'Configuracion importada correctamente';
      resultadoEl.classList.remove('hidden');
      setTimeout(() => resultadoEl.classList.add('hidden'), 3000);
    } catch (err) {
      resultadoEl.className = 'error';
      resultadoEl.textContent = 'Error al leer archivo: ' + err.message;
      resultadoEl.classList.remove('hidden');
    }
  };
  reader.readAsText(file);

  // Reset para permitir reimportar mismo archivo
  e.target.value = '';
}

// --- Init ---

document.addEventListener('DOMContentLoaded', () => {
  inicializarConfigUI();

  document.getElementById('form-config').addEventListener('submit', guardarConfigDesdeUI);
  document.getElementById('btn-restaurar-defaults').addEventListener('click', restaurarDefaults);

  // Fases
  document.getElementById('btn-nueva-fase').addEventListener('click', () => abrirModalFase(null));
  document.getElementById('btn-guardar-fase').addEventListener('click', guardarFaseDesdeModal);
  document.getElementById('btn-cancelar-fase').addEventListener('click', cerrarModalFase);

  // Export/Import
  document.getElementById('btn-exportar-config').addEventListener('click', exportarConfig);
  document.getElementById('btn-importar-config').addEventListener('click', clickImportarConfig);
  document.getElementById('input-importar-config').addEventListener('change', procesarImportacion);
});
