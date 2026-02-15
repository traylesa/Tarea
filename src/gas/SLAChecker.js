function checkSLA(cargas, registros, umbralHoras = 2, ahora = new Date()) {
  if (!cargas || !Array.isArray(cargas)) return [];
  const regs = registros || [];

  return cargas
    .filter(carga => {
      const tieneCorreo = regs.some(
        r => r.codCar === carga.codCar && r.estado === 'ENVIADO'
      );
      if (tieneCorreo) return false;

      const horasRestantes = (carga.fechor - ahora) / (1000 * 60 * 60);
      return horasRestantes <= umbralHoras;
    })
    .map(carga => ({
      codCar: carga.codCar,
      fechor: carga.fechor,
      horasRestantes: (carga.fechor - ahora) / (1000 * 60 * 60)
    }));
}

if (typeof module !== 'undefined') module.exports = { checkSLA };
