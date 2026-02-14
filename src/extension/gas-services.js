/**
 * gas-services.js - Gestion de multiples URLs de servicio GAS
 * Logica pura sin dependencias DOM/storage.
 */

let contadorSvc = 0;

function generarId() {
  contadorSvc++;
  return 'svc_' + Date.now() + '_' + contadorSvc;
}

function agregarServicio(alias, url, datos) {
  const nuevo = { id: generarId(), alias, url };
  return {
    ...datos,
    services: [...datos.services, nuevo]
  };
}

function eliminarServicio(id, datos) {
  const services = datos.services.filter(s => s.id !== id);
  let activeServiceId = datos.activeServiceId;

  if (activeServiceId === id) {
    activeServiceId = services.length > 0 ? services[0].id : null;
  }

  return { services, activeServiceId };
}

function obtenerServicioActivo(datos) {
  if (!datos.services || datos.services.length === 0) return null;
  return datos.services.find(s => s.id === datos.activeServiceId) || datos.services[0];
}

function cambiarServicioActivo(id, datos) {
  const existe = datos.services.some(s => s.id === id);
  if (!existe) return { ...datos };

  return { ...datos, activeServiceId: id };
}

function validarUrlServicio(url) {
  if (!url || url.trim() === '') {
    return { valido: false, error: 'URL no puede estar vacia' };
  }
  if (!url.startsWith('https://')) {
    return { valido: false, error: 'URL debe comenzar con https://' };
  }
  try {
    new URL(url);
    return { valido: true };
  } catch {
    return { valido: false, error: 'URL no tiene formato valido' };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    agregarServicio,
    eliminarServicio,
    obtenerServicioActivo,
    cambiarServicioActivo,
    validarUrlServicio
  };
}
