/**
 * dashboard.js - KPIs operativos y metricas del turno
 * Logica pura: sin DOM, sin Chrome API. Testeable unitariamente.
 * Sprint 5: Dashboard operativo
 */

var MAPA_FASE_GRUPO = {
  '00': 'espera', '01': 'espera', '02': 'espera',
  '05': 'incidencia',
  '11': 'carga', '12': 'carga',
  '19': 'en_ruta',
  '21': 'descarga', '22': 'descarga',
  '25': 'incidencia',
  '29': 'vacio'
};

var DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

function _gruposVacios() {
  return {
    espera: 0, carga: 0, en_ruta: 0,
    descarga: 0, vacio: 0, incidencia: 0, sin_fase: 0
  };
}

function _grupoFase(fase) {
  if (!fase) return 'sin_fase';
  return MAPA_FASE_GRUPO[fase] || 'sin_fase';
}

function _esCerrado(reg) {
  return reg.estado === 'GESTIONADO' && reg.fase === '30';
}

function _esMismoDia(fecha1, fecha2) {
  return fecha1.getFullYear() === fecha2.getFullYear() &&
    fecha1.getMonth() === fecha2.getMonth() &&
    fecha1.getDate() === fecha2.getDate();
}

function _formatearFecha(fecha) {
  var y = fecha.getFullYear();
  var m = ('0' + (fecha.getMonth() + 1)).slice(-2);
  var d = ('0' + fecha.getDate()).slice(-2);
  return y + '-' + m + '-' + d;
}

function calcularKPIsTurno(registros, alertas, recordatorios, ahora) {
  var porGrupo = _gruposVacios();
  var activas = 0;
  var cerradasHoy = 0;
  var cerradasSemana = 0;
  var limiteInferior = new Date(ahora.getTime() - 6 * 24 * 60 * 60 * 1000);
  limiteInferior.setHours(0, 0, 0, 0);

  registros.forEach(function(reg) {
    if (_esCerrado(reg)) {
      var fecha = new Date(reg.fechaCorreo);
      if (_esMismoDia(fecha, ahora)) cerradasHoy++;
      if (fecha >= limiteInferior) cerradasSemana++;
    } else {
      activas++;
      var grupo = _grupoFase(reg.fase);
      porGrupo[grupo]++;
    }
  });

  var alertasUrgentes = alertas.filter(function(a) {
    return a.nivel === 'CRITICO';
  }).length;

  var recordatoriosHoy = recordatorios.filter(function(r) {
    return _esMismoDia(new Date(r.fechaDisparo), ahora);
  }).length;

  return {
    activas: activas,
    porGrupo: porGrupo,
    alertasUrgentes: alertasUrgentes,
    recordatoriosHoy: recordatoriosHoy,
    cerradasHoy: cerradasHoy,
    cerradasSemana: cerradasSemana
  };
}

function calcularGraficoSemanal(registros, ahora) {
  var dias = [];
  var i;
  for (i = 6; i >= 0; i--) {
    var fecha = new Date(ahora.getTime() - i * 24 * 60 * 60 * 1000);
    dias.push({
      dia: DIAS_SEMANA[fecha.getDay()],
      fecha: _formatearFecha(fecha),
      conteo: 0
    });
  }

  registros.forEach(function(reg) {
    if (!_esCerrado(reg)) return;
    var fechaStr = _formatearFecha(new Date(reg.fechaCorreo));
    for (var j = 0; j < dias.length; j++) {
      if (dias[j].fecha === fechaStr) {
        dias[j].conteo++;
        break;
      }
    }
  });

  return dias;
}

function calcularCargasPorGrupo(registros) {
  var grupos = _gruposVacios();
  registros.forEach(function(reg) {
    var grupo = _grupoFase(reg.fase);
    grupos[grupo]++;
  });
  return grupos;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    calcularKPIsTurno: calcularKPIsTurno,
    calcularGraficoSemanal: calcularGraficoSemanal,
    calcularCargasPorGrupo: calcularCargasPorGrupo
  };
}
