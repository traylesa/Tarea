// panel-plantillas.js — UI plantillas de respuesta + respuesta masiva
// Depende de globals: plantillasGuardadas, plantillaEditandoId, pieComun,
//   tabla, configActual, STORAGE_KEY_PLANTILLAS, STORAGE_KEY_PIE
// Depende de: templates.js (crearPlantilla, editarPlantilla, eliminarPlantilla,
//   interpolar, obtenerVariablesDisponibles, sanitizarHtml)
// Depende de: bulk-reply.js (construirPayload, validarSeleccion, generarPrevisualizacion)
// Depende de: resilience.js (dividirEnTandas)

var _kanbanSeleccionadosRespuesta = null;

async function cargarPlantillasGuardadas() {
  const result = await chrome.storage.local.get([STORAGE_KEY_PLANTILLAS, STORAGE_KEY_PIE]);
  plantillasGuardadas = (result[STORAGE_KEY_PLANTILLAS] || {}).plantillas || [];
  pieComun = result[STORAGE_KEY_PIE] || '';

  if (plantillasGuardadas.length === 0) {
    plantillasGuardadas = crearPlantillasPredefinidas();
    await chrome.storage.local.set({ [STORAGE_KEY_PLANTILLAS]: { plantillas: plantillasGuardadas } });
  }
}

async function guardarPieComun() {
  pieComun = document.getElementById('pie-comun').value;
  await chrome.storage.local.set({ [STORAGE_KEY_PIE]: pieComun });
}

function obtenerPieComun() {
  return pieComun || '';
}

function crearPlantillasPredefinidas() {
  return [
    crearPlantilla(
      'Consulta hora carga',
      'Re: {{asunto}}',
      '<div style="font-family: Arial, sans-serif; line-height: 1.8; color: #333;">' +
        '<p style="margin-bottom: 20px;">Estimad@ companer@,</p>' +
        '<p style="margin-bottom: 20px;">Respecto a la <b>carga del asunto</b>: ¿Cual es su <b>hora prevista de llegada</b> al punto de carga?</p>' +
        '<p style="margin-bottom: 20px;">Su reporte nos ayuda a mejorar la <b>planificacion operativa</b>. Gracias por su <b>pronta respuesta</b>.</p>' +
      '</div>',
      ''
    ),
    crearPlantilla(
      'Solicitud docs descarga',
      'Re: {{asunto}}',
      '<div style="font-family: Arial, sans-serif; line-height: 2.0; color: #333;">' +
        '<p style="margin-bottom: 25px;">Estimad@ companer@:</p>' +
        '<p style="margin-bottom: 25px;">Esperamos que la entrega de la carga <b>referida al asunto</b> se haya realizado con exito. ¿Podria confirmarnos si la descarga finalizo <b>sin incidencias ni diferencias</b>? En caso de cualquier novedad, le agradecemos que nos lo comunique.</p>' +
        '<p style="margin-bottom: 25px;">Por ello, le solicitamos nos adelante por este medio los <b>documentos justificantes de la entrega</b> a la mayor brevedad. Si aun no dispone de los originales, las <b>fotografias</b> son validas como adelanto.</p>' +
        '<p style="margin-bottom: 25px;">Le recordamos que tambien debe remitirnos la <b>factura</b> y los <b>documentos de entrega originales</b> de forma fisica a nuestra oficina a la mayor brevedad posible.</p>' +
        '<p>Gracias por su colaboracion. Quedamos a su entera disposicion.</p>' +
      '</div>',
      ''
    ),
    crearPlantilla(
      'Recordatorio docs pendientes',
      'Re: {{asunto}}',
      '<div style="font-family: Arial, sans-serif; line-height: 2.0; color: #333;">' +
        '<p style="margin-bottom: 14px;">Estimad@ companer@:</p>' +
        '<p style="margin-bottom: 14px;">Esperamos que se encuentre bien. Le escribimos en relacion a la carga <b>referido al asunto</b>.</p>' +
        '<p style="margin-bottom: 14px;">Salvo error u omision, a fecha de hoy, todavia no hemos recibido los <b>documentos justificativos de la entrega</b>. Entendemos que los plazos pueden complicarse, pero le agradeceriamos enormemente que pudiera adelantarnoslos a la mayor brevedad.</p>' +
        '<p style="margin-bottom: 25px;">Le recordamos que tambien debe remitirnos la <b>factura</b> y los <b>documentos de entrega originales</b> de forma fisica a nuestra oficina a la mayor brevedad posible.</p>' +
        '<p>Agradecidos sinceramente por su gestion y atencion, quedamos a su entera disposicion.</p>' +
      '</div>',
      ''
    )
  ];
}

// Registro individual para envio desde regla (null = usar seleccion tabla)
var _registroRegla = null;

function obtenerVariablesInterpolacion(row) {
  return {
    codCar: row.codCar || '', nombreTransportista: row.nombreTransportista || '',
    codTra: row.codTra || '', emailRemitente: row.emailRemitente || '',
    interlocutor: row.interlocutor || '', referencia: row.referencia || '',
    asunto: row.asunto || '', fechaCorreo: row.fechaCorreo || '',
    estado: row.estado || '', tipoTarea: row.tipoTarea || ''
  };
}

function abrirModalRespuestaDesdeRegla(rowData, params) {
  _registroRegla = rowData;

  var dest = rowData.interlocutor || rowData.emailRemitente || '';
  document.getElementById('respuesta-destinatarios').innerHTML =
    '<strong>Para:</strong> ' + dest + (rowData.codCar ? ' — Carga ' + rowData.codCar : '');

  var select = document.getElementById('respuesta-plantilla');
  select.innerHTML = '<option value="">-- Sin plantilla --</option>';
  plantillasGuardadas.forEach(function(p) {
    var opt = document.createElement('option');
    opt.value = p.id; opt.textContent = p.alias;
    select.appendChild(opt);
  });

  if (params.nombrePlantilla) {
    var plantilla = plantillasGuardadas.find(function(p) {
      return p.alias.toLowerCase().indexOf(params.nombrePlantilla.toLowerCase()) !== -1;
    });
    if (plantilla) {
      select.value = plantilla.id;
      var vars = obtenerVariablesInterpolacion(rowData);
      document.getElementById('respuesta-asunto').value = interpolar(plantilla.asunto, vars);
      document.getElementById('respuesta-cuerpo').value = interpolar(plantilla.cuerpo, vars);
    }
  }

  var piePreview = document.getElementById('respuesta-pie-preview');
  if (pieComun) {
    piePreview.innerHTML = '<small>Pie comun:</small> ' + sanitizarHtml(pieComun);
    piePreview.style.display = '';
  } else {
    piePreview.style.display = 'none';
  }

  if (params.programarEnvio) {
    document.getElementById('chk-programar-envio').checked = true;
    document.getElementById('programar-campos').classList.remove('hidden');
    document.getElementById('btn-enviar-respuesta').textContent = 'Programar envio';

    var manana = new Date();
    manana.setDate(manana.getDate() + 1);
    var partes = (params.horaDefault || '09:00').split(':');
    manana.setHours(parseInt(partes[0], 10), parseInt(partes[1] || '0', 10), 0, 0);
    var local = new Date(manana.getTime() - manana.getTimezoneOffset() * 60000);
    document.getElementById('programar-fecha').value = local.toISOString().slice(0, 16);
  } else {
    document.getElementById('chk-programar-envio').checked = false;
    document.getElementById('programar-campos').classList.add('hidden');
    document.getElementById('btn-enviar-respuesta').textContent = 'Enviar';
  }

  document.getElementById('respuesta-error').classList.add('hidden');
  document.getElementById('preview-respuesta').classList.add('hidden');
  document.getElementById('modal-respuesta').classList.remove('hidden');
}

// --- Modal respuesta masiva ---

function abrirModalRespuesta(registrosExternos) {
  _kanbanSeleccionadosRespuesta = registrosExternos || null;
  var seleccionados = registrosExternos || (tabla ? tabla.getSelectedData() : []);
  if (seleccionados.length === 0) return;
  const resultado = validarSeleccion(seleccionados);
  if (!resultado.valido) return;

  const destContainer = document.getElementById('respuesta-destinatarios');
  const interlocutores = seleccionados.map(r => r.interlocutor || r.emailRemitente).filter(Boolean);
  const unicos = [...new Set(interlocutores)];
  destContainer.innerHTML = '<strong>Destinatarios:</strong> ' + unicos.join(', ');

  const selectPlantilla = document.getElementById('respuesta-plantilla');
  selectPlantilla.innerHTML = '<option value="">-- Sin plantilla --</option>';
  plantillasGuardadas.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.alias;
    selectPlantilla.appendChild(opt);
  });

  document.getElementById('respuesta-asunto').value = '';
  document.getElementById('respuesta-cuerpo').value = '';
  document.getElementById('respuesta-error').classList.add('hidden');
  document.getElementById('preview-respuesta').classList.add('hidden');

  const piePreview = document.getElementById('respuesta-pie-preview');
  if (pieComun) {
    piePreview.innerHTML = '<small>Pie comun:</small> ' + sanitizarHtml(pieComun);
    piePreview.style.display = '';
  } else {
    piePreview.style.display = 'none';
  }

  document.getElementById('modal-respuesta').classList.remove('hidden');
}

function alSeleccionarPlantillaRespuesta() {
  const id = document.getElementById('respuesta-plantilla').value;
  if (!id) return;
  const plantilla = plantillasGuardadas.find(p => p.id === id);
  if (!plantilla) return;
  document.getElementById('respuesta-asunto').value = plantilla.asunto;
  document.getElementById('respuesta-cuerpo').value = plantilla.cuerpo;
}

async function enviarRespuestaMasiva() {
  const seleccionados = _registroRegla ? [_registroRegla]
    : _kanbanSeleccionadosRespuesta || (tabla ? tabla.getSelectedData() : []);
  const plantilla = {
    asunto: document.getElementById('respuesta-asunto').value,
    cuerpo: document.getElementById('respuesta-cuerpo').value,
    firma: obtenerPieComun()
  };

  const payload = construirPayload(seleccionados, plantilla);
  payload.destinatarios.forEach(function(dest, i) {
    var reg = seleccionados[i];
    dest.para = reg.para || '';
    dest.cc = reg.cc || '';
    dest.cco = reg.cco || '';
  });
  payload.emailsPorMinuto = (configActual && configActual.emailsPorMinuto) || 10;
  const url = obtenerUrlActiva();
  if (!url) return;

  const btnEnviar = document.getElementById('btn-enviar-respuesta');
  btnEnviar.disabled = true;

  var tamanoTanda = (configActual && configActual.robustez && configActual.robustez.tamanoTandaEnvio) || 15;
  var tandas = dividirEnTandas(payload.destinatarios, tamanoTanda);
  var enviados = 0;
  var fallidos = 0;

  try {
    for (var i = 0; i < tandas.length; i++) {
      btnEnviar.textContent = tandas.length > 1
        ? 'Enviando tanda ' + (i + 1) + '/' + tandas.length + '...'
        : 'Enviando...';

      var tandaPayload = {
        destinatarios: tandas[i],
        emailsPorMinuto: payload.emailsPorMinuto
      };

      try {
        var response = await fetch(url + '?action=enviarRespuesta', {
          method: 'POST',
          credentials: 'omit',
          body: JSON.stringify(tandaPayload)
        });
        var data = await response.json();
        if (data.error) fallidos += tandas[i].length;
        else enviados += (data.resultados || tandas[i]).length;
      } catch (err) {
        fallidos += tandas[i].length;
      }
    }

    if (fallidos > 0) {
      var msg = 'Enviados: ' + enviados + ', fallidos: ' + fallidos;
      document.getElementById('respuesta-error').textContent = msg;
      document.getElementById('respuesta-error').classList.remove('hidden');
      mostrarToast(msg, 'error');
    } else {
      cerrarModalRespuesta();
      mostrarToast('Enviados ' + enviados + ' correos correctamente', 'ok');
    }
    await cargarDatos();
  } catch (err) {
    document.getElementById('respuesta-error').textContent = 'Error al enviar: ' + err.message;
    document.getElementById('respuesta-error').classList.remove('hidden');
  } finally {
    btnEnviar.disabled = false;
    btnEnviar.textContent = 'Enviar';
  }
}

function cerrarModalRespuesta() {
  _registroRegla = null;
  document.getElementById('modal-respuesta').classList.add('hidden');
  document.getElementById('preview-respuesta').classList.add('hidden');
}

function previsualizarRespuesta() {
  if (!tabla) return;
  const seleccionados = tabla.getSelectedData();
  const plantilla = {
    asunto: document.getElementById('respuesta-asunto').value,
    cuerpo: document.getElementById('respuesta-cuerpo').value,
    firma: obtenerPieComun()
  };
  const result = generarPrevisualizacion(seleccionados, plantilla, sanitizarHtml);
  const container = document.getElementById('preview-respuesta-contenido');
  container.innerHTML = '<p><strong>Asunto:</strong> ' + (result.asuntoPreview || '') + '</p>' + result.cuerpoPreview;
  document.getElementById('preview-respuesta').classList.remove('hidden');
}

function cargarPieEnUI() {
  const textarea = document.getElementById('pie-comun');
  if (textarea) textarea.value = pieComun || '';
}

// --- Plantillas CRUD UI ---

function renderListaPlantillas() {
  const container = document.getElementById('lista-plantillas');
  container.innerHTML = '';

  plantillasGuardadas.forEach(p => {
    const item = document.createElement('div');
    item.className = 'plantilla-item';
    item.innerHTML = '<span class="plantilla-alias">' + p.alias + '</span>' +
      '<button class="btn-editar-plantilla btn-secundario" data-id="' + p.id + '">Editar</button>' +
      '<button class="btn-eliminar-plantilla btn-secundario" data-id="' + p.id + '">Eliminar</button>';
    container.appendChild(item);
  });

  container.querySelectorAll('.btn-editar-plantilla').forEach(btn => {
    btn.addEventListener('click', () => editarPlantillaUI(btn.dataset.id));
  });
  container.querySelectorAll('.btn-eliminar-plantilla').forEach(btn => {
    btn.addEventListener('click', () => eliminarPlantillaUI(btn.dataset.id));
  });
}

function nuevaPlantillaUI() {
  plantillaEditandoId = null;
  document.getElementById('tpl-alias').value = '';
  document.getElementById('tpl-asunto').value = '';
  document.getElementById('tpl-cuerpo').value = '';
  document.getElementById('editor-plantilla').classList.remove('hidden');
  document.getElementById('preview-plantilla').classList.add('hidden');
  document.getElementById('panel-variables').classList.add('hidden');
}

function editarPlantillaUI(id) {
  const p = plantillasGuardadas.find(x => x.id === id);
  if (!p) return;
  plantillaEditandoId = id;
  document.getElementById('tpl-alias').value = p.alias;
  document.getElementById('tpl-asunto').value = p.asunto;
  document.getElementById('tpl-cuerpo').value = p.cuerpo;
  document.getElementById('editor-plantilla').classList.remove('hidden');
}

async function guardarPlantillaUI() {
  const alias = document.getElementById('tpl-alias').value.trim();
  const asunto = document.getElementById('tpl-asunto').value.trim();
  const cuerpo = document.getElementById('tpl-cuerpo').value;
  if (!alias) return;

  if (plantillaEditandoId) {
    const idx = plantillasGuardadas.findIndex(p => p.id === plantillaEditandoId);
    if (idx >= 0) {
      plantillasGuardadas[idx] = editarPlantilla(plantillasGuardadas[idx], { alias, asunto, cuerpo });
    }
  } else {
    const nueva = crearPlantilla(alias, asunto, cuerpo, '');
    plantillasGuardadas.push(nueva);
    plantillaEditandoId = nueva.id;
  }

  await chrome.storage.local.set({ [STORAGE_KEY_PLANTILLAS]: { plantillas: plantillasGuardadas } });
  renderListaPlantillas();
}

async function eliminarPlantillaUI(id) {
  plantillasGuardadas = eliminarPlantilla(id, plantillasGuardadas);
  await chrome.storage.local.set({ [STORAGE_KEY_PLANTILLAS]: { plantillas: plantillasGuardadas } });
  renderListaPlantillas();
}

function exportarPlantillas() {
  const datos = { version: 1, plantillas: plantillasGuardadas };
  if (pieComun) {
    const incluirPie = confirm('Se ha detectado un pie comun configurado.\n\nPulse Aceptar para INCLUIR el pie en la exportacion.\nPulse Cancelar para exportar SOLO las plantillas (sin pie).');
    if (incluirPie) datos.pieComun = pieComun;
  }
  const json = JSON.stringify(datos, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tarealog_plantillas_' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importarPlantillas() {
  document.getElementById('input-importar-plantillas').click();
}

async function procesarImportPlantillas(event) {
  const file = event.target.files[0];
  if (!file) return;

  const resultado = document.getElementById('plantillas-import-resultado');
  try {
    const texto = await file.text();
    const datos = JSON.parse(texto);

    if (!datos.plantillas || !Array.isArray(datos.plantillas)) {
      resultado.textContent = 'Archivo no valido: no contiene plantillas';
      resultado.className = 'error';
      resultado.classList.remove('hidden');
      return;
    }

    const tienePie = datos.pieComun !== undefined;
    let importarPie = false;
    if (tienePie) {
      importarPie = confirm('El archivo incluye un pie comun. ¿Desea importarlo tambien?\n\nPie: ' + datos.pieComun.substring(0, 80) + '...');
    }

    const modo = confirm('¿Reemplazar todas las plantillas actuales?\n\nAceptar = Reemplazar\nCancelar = Agregar a las existentes');

    if (modo) {
      plantillasGuardadas = datos.plantillas;
    } else {
      datos.plantillas.forEach(p => {
        p.id = 'tpl_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
        plantillasGuardadas.push(p);
      });
    }

    await chrome.storage.local.set({ [STORAGE_KEY_PLANTILLAS]: { plantillas: plantillasGuardadas } });
    if (importarPie) {
      pieComun = datos.pieComun;
      await chrome.storage.local.set({ [STORAGE_KEY_PIE]: pieComun });
      cargarPieEnUI();
    }

    renderListaPlantillas();
    const count = datos.plantillas.length;
    resultado.textContent = count + ' plantilla' + (count !== 1 ? 's' : '') + ' importada' + (count !== 1 ? 's' : '') + (importarPie ? ' + pie comun' : '');
    resultado.className = 'exito';
    resultado.classList.remove('hidden');
  } catch (e) {
    resultado.textContent = 'Error al leer archivo: ' + e.message;
    resultado.className = 'error';
    resultado.classList.remove('hidden');
  }
  event.target.value = '';
}

function previsualizarPlantilla() {
  const cuerpo = document.getElementById('tpl-cuerpo').value;
  const pie = obtenerPieComun();
  const datosPrueba = {
    codCar: '168345', nombreTransportista: 'Transportes Garcia SL',
    codTra: 'TRA001', emailRemitente: 'garcia@email.com',
    asunto: 'Carga 168345', fechaCorreo: '13/02/2026 15:30',
    estado: 'ENVIADO', tipoTarea: 'OPERATIVO'
  };
  const cuerpoInterpolado = interpolar(cuerpo, datosPrueba);
  const pieInterpolado = pie ? '<hr style="border:none;border-top:1px solid #ddd;margin:8px 0">' + interpolar(pie, datosPrueba) : '';
  const htmlFinal = sanitizarHtml(cuerpoInterpolado + pieInterpolado);
  document.getElementById('preview-contenido').innerHTML = htmlFinal;
  document.getElementById('preview-plantilla').classList.remove('hidden');
}

function mostrarVariablesDisponibles() {
  const vars = obtenerVariablesDisponibles();
  const tbl = document.getElementById('tabla-variables');
  tbl.innerHTML = '<tr><th>Variable</th><th>Descripcion</th></tr>' +
    vars.map(v => '<tr><td><code>{{' + v.nombre + '}}</code></td><td>' + v.descripcion + '</td></tr>').join('');
  document.getElementById('panel-variables').classList.toggle('hidden');
}
