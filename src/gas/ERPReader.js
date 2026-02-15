function parseCsv(csvText) {
  if (!csvText) return [];
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(';').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(';').map(v => v.trim());
    const row = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    return row;
  });
}

function createERPReader({ pedcli = '', transpor = '', viatelef = '' } = {}) {
  const cargas = parseCsv(pedcli);
  const transportistas = parseCsv(transpor);
  const contactos = parseCsv(viatelef);

  function findCarga(codCar) {
    if (codCar == null) return null;
    const codStr = String(codCar);
    const row = cargas.find(r => r.CODCAR === codStr);
    if (!row) return null;
    return {
      codCar: parseInt(row.CODCAR, 10),
      codTra: row.CODTRA,
      codVia: row.CODVIA,
      fechor: row.FECHOR,
      referencia: row.REFERENCIA
    };
  }

  function findTransportista(codTra) {
    if (!codTra) return null;
    const row = transportistas.find(r => r.CODIGO === codTra);
    if (!row) return null;
    return {
      codigo: row.CODIGO,
      nombre: row.NOMBRE,
      nif: row.NIF,
      direccion: row.DIRECCION
    };
  }

  function findEmailContacto(codVia) {
    if (!codVia) return null;
    const row = contactos.find(r => r.CODVIA === codVia);
    return row ? row.NUMERO : null;
  }

  return { findCarga, findTransportista, findEmailContacto };
}

if (typeof module !== 'undefined') module.exports = { parseCsv, createERPReader };
