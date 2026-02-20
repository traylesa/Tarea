// panel-dashboard.js — Dashboard KPIs + Reporte de turno
// Depende de globals: tabla, registros, recordatoriosCache
// Depende de: dashboard.js (calcularKPIsTurno, calcularCargasPorGrupo)
// Depende de: shift-report.js (generarDatosReporte)

function toggleDashboard() {
  var panel = document.getElementById('panel-dashboard');
  panel.classList.toggle('hidden');
  var btn = document.getElementById('btn-toggle-dashboard');
  btn.classList.toggle('active', !panel.classList.contains('hidden'));
  if (!panel.classList.contains('hidden')) renderDashboard();
  setTimeout(function() { if (tabla) tabla.setHeight(calcularAlturaTabla()); }, 50);
}

function renderDashboard() {
  var ahora = new Date();
  var alertas = [];
  var recs = recordatoriosCache || [];
  var kpis = calcularKPIsTurno(registros, alertas, recs, ahora);

  document.getElementById('dashboard-hora').textContent = ahora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  var kpisEl = document.getElementById('dashboard-kpis');
  kpisEl.innerHTML =
    '<div class="kpi-card"><div class="kpi-valor">' + kpis.activas + '</div><div class="kpi-etiqueta">Activas</div></div>' +
    '<div class="kpi-card"><div class="kpi-valor kpi-ok">' + kpis.cerradasHoy + '</div><div class="kpi-etiqueta">Cerradas hoy</div></div>' +
    '<div class="kpi-card"><div class="kpi-valor">' + kpis.cerradasSemana + '</div><div class="kpi-etiqueta">Semana</div></div>' +
    '<div class="kpi-card"><div class="kpi-valor' + (kpis.alertasUrgentes > 0 ? ' kpi-alerta' : '') + '">' + kpis.alertasUrgentes + '</div><div class="kpi-etiqueta">Alertas</div></div>' +
    '<div class="kpi-card"><div class="kpi-valor">' + kpis.recordatoriosHoy + '</div><div class="kpi-etiqueta">Recordatorios</div></div>';

  var gruposEl = document.getElementById('dashboard-grupos');
  var g = kpis.porGrupo;
  var chips = '';
  if (g.espera > 0) chips += '<span class="grupo-chip">Espera: ' + g.espera + '</span>';
  if (g.carga > 0) chips += '<span class="grupo-chip">Carga: ' + g.carga + '</span>';
  if (g.en_ruta > 0) chips += '<span class="grupo-chip">Ruta: ' + g.en_ruta + '</span>';
  if (g.descarga > 0) chips += '<span class="grupo-chip">Descarga: ' + g.descarga + '</span>';
  if (g.vacio > 0) chips += '<span class="grupo-chip grupo-vacio">Vacio: ' + g.vacio + '</span>';
  if (g.incidencia > 0) chips += '<span class="grupo-chip grupo-incidencia">Incidencia: ' + g.incidencia + '</span>';
  gruposEl.innerHTML = chips;
}

// --- Reporte de turno ---

function mostrarReporteTurno() {
  var ahora = new Date();
  var recs = recordatoriosCache || [];
  var alertas = [];
  var datos = generarDatosReporte(registros, alertas, recs, ahora);
  var grupos = calcularCargasPorGrupo(registros);

  var contenido = document.getElementById('reporte-contenido');
  contenido.innerHTML =
    '<div class="reporte-seccion">' +
      '<h4>Resumen del dia ' + ahora.toLocaleDateString('es-ES') + '</h4>' +
      '<div class="reporte-linea">Cargas gestionadas: <strong>' + datos.cargasGestionadas + '</strong></div>' +
      '<div class="reporte-linea">Incidencias activas: <strong>' + datos.incidenciasActivas + '</strong></div>' +
      '<div class="reporte-linea">Cerradas hoy: <strong>' + datos.kpis.cerradas + '</strong></div>' +
      '<div class="reporte-linea">Emails enviados: <strong>' + datos.kpis.emailsEnviados + '</strong></div>' +
      '<div class="reporte-linea">Recordatorios pendientes: <strong>' + datos.recordatoriosPendientes + '</strong></div>' +
    '</div>' +
    '<div class="reporte-seccion">' +
      '<h4>Distribucion por grupo</h4>' +
      '<div class="reporte-linea">Espera: ' + grupos.espera + ' | Carga: ' + grupos.carga + ' | Ruta: ' + grupos.en_ruta + '</div>' +
      '<div class="reporte-linea">Descarga: ' + grupos.descarga + ' | Vacio: ' + grupos.vacio + ' | Incidencia: ' + grupos.incidencia + '</div>' +
    '</div>';

  document.getElementById('modal-reporte').classList.remove('hidden');
}

function copiarReporte() {
  var texto = document.getElementById('reporte-contenido').innerText;
  navigator.clipboard.writeText(texto).then(function() {
    var btn = document.getElementById('btn-copiar-reporte');
    btn.textContent = 'Copiado!';
    setTimeout(function() { btn.textContent = 'Copiar'; }, 1500);
  });
}

function cerrarModalReporte() {
  document.getElementById('modal-reporte').classList.add('hidden');
}
