// src/extension/shift-report.js
// Reporte de turno - logica pura sin DOM

var FASES_INCIDENCIA = ['05', '25'];
var FASE_CERRADA = '30';
var ESTADO_GESTIONADO = 'GESTIONADO';
var ESTADO_ENVIADO = 'ENVIADO';

function esMismoDia(fecha1, fecha2) {
  if (!fecha1 || !fecha2) return false;
  var d1 = new Date(fecha1);
  var d2 = new Date(fecha2);
  return d1.getUTCFullYear() === d2.getUTCFullYear()
    && d1.getUTCMonth() === d2.getUTCMonth()
    && d1.getUTCDate() === d2.getUTCDate();
}

function calcularKPIsDia(registros, ahora) {
  var cerradas = 0;
  var emailsEnviados = 0;

  for (var i = 0; i < registros.length; i++) {
    var reg = registros[i];
    if (!esMismoDia(reg.fechaCorreo, ahora)) continue;

    if (reg.estado === ESTADO_GESTIONADO && reg.fase === FASE_CERRADA) {
      cerradas++;
    }
    if (reg.estado === ESTADO_ENVIADO) {
      emailsEnviados++;
    }
  }

  return { cerradas: cerradas, emailsEnviados: emailsEnviados };
}

function generarDatosReporte(registros, alertas, recordatorios, ahora) {
  var cargasGestionadas = 0;
  var incidenciasActivas = 0;
  var ahoraMs = new Date(ahora).getTime();

  for (var i = 0; i < registros.length; i++) {
    var reg = registros[i];

    if (reg.estado === ESTADO_GESTIONADO && esMismoDia(reg.fechaCorreo, ahora)) {
      cargasGestionadas++;
    }
    if (FASES_INCIDENCIA.indexOf(reg.fase) !== -1 && esMismoDia(reg.fechaCorreo, ahora)) {
      incidenciasActivas++;
    }
  }

  var recordatoriosPendientes = 0;
  for (var j = 0; j < recordatorios.length; j++) {
    if (new Date(recordatorios[j].fechaDisparo).getTime() > ahoraMs) {
      recordatoriosPendientes++;
    }
  }

  return {
    fecha: new Date(ahora).toISOString(),
    cargasGestionadas: cargasGestionadas,
    incidenciasActivas: incidenciasActivas,
    recordatoriosPendientes: recordatoriosPendientes,
    kpis: calcularKPIsDia(registros, ahora)
  };
}

if (typeof module !== 'undefined') {
  module.exports = {
    generarDatosReporte: generarDatosReporte,
    calcularKPIsDia: calcularKPIsDia,
    esMismoDia: esMismoDia
  };
}
