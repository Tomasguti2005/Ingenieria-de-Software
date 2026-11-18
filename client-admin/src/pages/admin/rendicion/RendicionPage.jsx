// RendicionPage.jsx — Rendición de cuentas y cierres (admin).
// Ruta: /admin/rendicion

import { useState, useMemo, useRef, useEffect } from 'react';
import { obtenerRendicion, USAR_MOCK } from '../../../services/rendicion.service.js';
import './RendicionPage.css';

const MESES_NOMBRES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const MESES_CORTOS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

function formatearMoneda(valor) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(valor);
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function parseFechaISO(fechaStr) {
  const [anio, mes, dia] = fechaStr.split('-').map(Number);
  return { anio, mes: mes - 1, dia };
}

function parseMesISO(mesStr) {
  const [anio, mes] = mesStr.split('-').map(Number);
  return { anio, mes: mes - 1 };
}

export default function RendicionPage() {
  const [modo, setModo] = useState('diaria'); // 'diaria' | 'mensual'
  const [fechaDiaria, setFechaDiaria] = useState('2026-11-18');
  const [mesMensual, setMesMensual] = useState('2026-11');
  const [busqueda, setBusqueda] = useState('');
  const [datosBase, setDatosBase] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelado = false;

    async function cargarRendicion() {
      setCargando(true);
      setError(null);
      try {
        const data = await obtenerRendicion({
          modo,
          fecha: fechaDiaria,
          mes: mesMensual,
        });
        if (!cancelado) {
          setDatosBase(Array.isArray(data?.items) ? data.items : []);
        }
      } catch (err) {
        if (!cancelado) {
          setDatosBase([]);
          setError(err.message || 'No se pudo cargar la rendición de cuentas.');
        }
      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    }

    cargarRendicion();
    return () => {
      cancelado = true;
    };
  }, [modo, fechaDiaria, mesMensual]);

  // Estado del selector desplegable de fecha/mes
  const [pickerAbierto, setPickerAbierto] = useState(false);
  const [vistaCalendario, setVistaCalendario] = useState({ anio: 2026, mes: 10 });
  const [vistaAnio, setVistaAnio] = useState(2026);
  const pickerRef = useRef(null);

  useEffect(() => {
    function manejarClickAfuera(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setPickerAbierto(false);
      }
    }
    function manejarEscape(e) {
      if (e.key === 'Escape') {
        setPickerAbierto(false);
      }
    }

    if (pickerAbierto) {
      document.addEventListener('mousedown', manejarClickAfuera);
      document.addEventListener('keydown', manejarEscape);
    }
    return () => {
      document.removeEventListener('mousedown', manejarClickAfuera);
      document.removeEventListener('keydown', manejarEscape);
    };
  }, [pickerAbierto]);

  function cambiarModo(nuevoModo) {
    setModo(nuevoModo);
    setPickerAbierto(false);
  }

  function togglePicker() {
    if (!pickerAbierto) {
      if (modo === 'diaria') {
        const { anio, mes } = parseFechaISO(fechaDiaria);
        setVistaCalendario({ anio, mes });
      } else {
        const { anio } = parseMesISO(mesMensual);
        setVistaAnio(anio);
      }
    }
    setPickerAbierto((prev) => !prev);
  }

  function moverMesCalendario(delta) {
    setVistaCalendario((prev) => {
      let nuevoMes = prev.mes + delta;
      let nuevoAnio = prev.anio;
      if (nuevoMes < 0) {
        nuevoMes = 11;
        nuevoAnio -= 1;
      } else if (nuevoMes > 11) {
        nuevoMes = 0;
        nuevoAnio += 1;
      }
      return { anio: nuevoAnio, mes: nuevoMes };
    });
  }

  function seleccionarDia(dia) {
    const nuevaFecha = `${vistaCalendario.anio}-${pad2(vistaCalendario.mes + 1)}-${pad2(dia)}`;
    setFechaDiaria(nuevaFecha);
    setPickerAbierto(false);
  }

  function seleccionarMes(mesIdx) {
    const nuevoMes = `${vistaAnio}-${pad2(mesIdx + 1)}`;
    setMesMensual(nuevoMes);
    setPickerAbierto(false);
  }

  // Datos para renderizar la grilla de días del calendario
  const { anio: calAnio, mes: calMes } = vistaCalendario;
  const primerDiaSemana = (new Date(calAnio, calMes, 1).getDay() + 6) % 7; // Lunes = 0
  const diasEnMes = new Date(calAnio, calMes + 1, 0).getDate();
  const fechaSel = parseFechaISO(fechaDiaria);
  const mesSel = parseMesISO(mesMensual);

  const textoBotonPeriodo =
    modo === 'diaria'
      ? `${fechaSel.dia} de ${MESES_NOMBRES[fechaSel.mes]} de ${fechaSel.anio}`
      : `${MESES_NOMBRES[mesSel.mes]} ${mesSel.anio}`;

  const datosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return datosBase;
    return datosBase.filter((item) =>
      `${item.nombre} ${item.apellido}`.toLowerCase().includes(termino)
    );
  }, [datosBase, busqueda]);

  const totalGeneral = useMemo(
    () => datosFiltrados.reduce((acc, item) => acc + item.monto, 0),
    [datosFiltrados]
  );

  const totalEntregas = useMemo(
    () => datosFiltrados.reduce((acc, item) => acc + item.entregas, 0),
    [datosFiltrados]
  );

  const promedioPorTransportista =
    datosFiltrados.length > 0 ? totalGeneral / datosFiltrados.length : 0;

  const periodoLabel = modo === 'diaria' ? fechaDiaria : mesMensual;

  function descargarExcel() {
    if (datosFiltrados.length === 0) return;

    const tituloPeriodo =
      modo === 'diaria' ? `Rendición Diaria (${fechaDiaria})` : `Rendición Mensual (${mesMensual})`;
    const columnaMonto = modo === 'diaria' ? 'Monto Generado Diario' : 'Monto Generado Mensual';

    const filasHtml = datosFiltrados
      .map(
        (t) => `
        <tr>
          <td>${t.nombre}</td>
          <td>${t.apellido}</td>
          <td style="text-align:right;">${t.entregas}</td>
          <td style="text-align:right;">${t.monto.toFixed(2)}</td>
        </tr>`
      )
      .join('');

    const htmlExcel = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:x="urn:schemas-microsoft-com:office:excel"
            xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="UTF-8" />
        </head>
        <body>
          <table border="1" cellspacing="0" cellpadding="6">
            <thead>
              <tr>
                <th colspan="4" style="font-size:14px; font-weight:bold; background:#f3f4f6;">
                  ${tituloPeriodo}
                </th>
              </tr>
              <tr style="background:#e5e7eb; font-weight:bold;">
                <th>Nombre</th>
                <th>Apellido</th>
                <th>Entregas</th>
                <th>${columnaMonto} (ARS)</th>
              </tr>
            </thead>
            <tbody>
              ${filasHtml}
            </tbody>
            <tfoot>
              <tr style="font-weight:bold; background:#dcfce7;">
                <td colspan="2">TOTAL GENERAL</td>
                <td style="text-align:right;">${totalEntregas}</td>
                <td style="text-align:right;">${totalGeneral.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([htmlExcel], {
      type: 'application/vnd.ms-excel;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rendicion_${modo}_${periodoLabel}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rendicion-container">
      {/* Encabezado */}
      <div className="rendicion-header">
        <div className="rendicion-header-info">
          <div className="rendicion-breadcrumb">
            <span>Admin</span>
            <span>/</span>
            <span>Rendición de Cuentas</span>
          </div>
          <h1>Rendición de Cuentas</h1>
          <p>
            Visualización y exportación de montos generados por transportista de forma diaria o mensual.
          </p>
        </div>

        <button
          type="button"
          className="rendicion-btn-excel"
          onClick={descargarExcel}
          disabled={datosFiltrados.length === 0}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Descargar Excel
        </button>
      </div>

      {/* Controles */}
      <div className="rendicion-controls">
        <div className="rendicion-tabs" role="tablist" aria-label="Tipo de rendición">
          <button
            type="button"
            role="tab"
            aria-selected={modo === 'diaria'}
            className={`rendicion-tab ${modo === 'diaria' ? 'activo' : ''}`}
            onClick={() => cambiarModo('diaria')}
          >
            Diaria
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={modo === 'mensual'}
            className={`rendicion-tab ${modo === 'mensual' ? 'activo' : ''}`}
            onClick={() => cambiarModo('mensual')}
          >
            Mensual
          </button>
        </div>

        <div className="rendicion-filters">
          <div className="rendicion-filter-group">
            <label>{modo === 'diaria' ? 'Fecha:' : 'Mes:'}</label>

            <div className="rendicion-picker" ref={pickerRef}>
              <button
                type="button"
                className="rendicion-picker-btn"
                onClick={togglePicker}
                aria-expanded={pickerAbierto}
                aria-haspopup="dialog"
              >
                <span className="rendicion-picker-btn-left">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>{textoBotonPeriodo}</span>
                </span>
                <svg className="rendicion-picker-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {pickerAbierto && (
                <div className="rendicion-picker-popover" role="dialog" aria-label="Selector de período">
                  {modo === 'diaria' ? (
                    <>
                      <div className="rendicion-picker-header">
                        <button
                          type="button"
                          className="rendicion-picker-nav"
                          onClick={() => moverMesCalendario(-1)}
                          aria-label="Mes anterior"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                          </svg>
                        </button>
                        <span className="rendicion-picker-title">
                          {MESES_NOMBRES[calMes]} {calAnio}
                        </span>
                        <button
                          type="button"
                          className="rendicion-picker-nav"
                          onClick={() => moverMesCalendario(1)}
                          aria-label="Mes siguiente"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </button>
                      </div>

                      <div className="rendicion-weekdays">
                        {DIAS_SEMANA.map((d) => (
                          <span key={d}>{d}</span>
                        ))}
                      </div>

                      <div className="rendicion-days-grid">
                        {Array.from({ length: primerDiaSemana }).map((_, idx) => (
                          <span key={`empty-${idx}`} />
                        ))}
                        {Array.from({ length: diasEnMes }, (_, idx) => {
                          const dia = idx + 1;
                          const esSeleccionado =
                            fechaSel.anio === calAnio &&
                            fechaSel.mes === calMes &&
                            fechaSel.dia === dia;
                          return (
                            <button
                              key={dia}
                              type="button"
                              className={`rendicion-day-cell ${esSeleccionado ? 'seleccionado' : ''}`}
                              onClick={() => seleccionarDia(dia)}
                            >
                              {dia}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="rendicion-picker-header">
                        <button
                          type="button"
                          className="rendicion-picker-nav"
                          onClick={() => setVistaAnio((y) => y - 1)}
                          aria-label="Año anterior"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6" />
                          </svg>
                        </button>
                        <span className="rendicion-picker-title">{vistaAnio}</span>
                        <button
                          type="button"
                          className="rendicion-picker-nav"
                          onClick={() => setVistaAnio((y) => y + 1)}
                          aria-label="Año siguiente"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </button>
                      </div>

                      <div className="rendicion-months-grid">
                        {MESES_CORTOS.map((nombreMes, idx) => {
                          const esSeleccionado =
                            mesSel.anio === vistaAnio && mesSel.mes === idx;
                          return (
                            <button
                              key={nombreMes}
                              type="button"
                              className={`rendicion-month-cell ${esSeleccionado ? 'seleccionado' : ''}`}
                              onClick={() => seleccionarMes(idx)}
                            >
                              {nombreMes}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="rendicion-filter-group">
            <input
              type="text"
              className="rendicion-input"
              placeholder="Buscar transportista..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              aria-label="Buscar transportista"
            />
          </div>
        </div>
      </div>

      {/* KPIs resumen */}
      <div className="rendicion-kpis">
        <div className="rendicion-kpi-card destacada">
          <span className="rendicion-kpi-label">Monto Total Generado</span>
          <span className="rendicion-kpi-value">{formatearMoneda(totalGeneral)}</span>
          <span className="rendicion-kpi-sub">
            {modo === 'diaria' ? `Día ${fechaDiaria}` : `Mes ${mesMensual}`}
          </span>
        </div>

        <div className="rendicion-kpi-card">
          <span className="rendicion-kpi-label">Transportistas</span>
          <span className="rendicion-kpi-value">{datosFiltrados.length}</span>
          <span className="rendicion-kpi-sub">Con actividad en el período</span>
        </div>

        <div className="rendicion-kpi-card">
          <span className="rendicion-kpi-label">Entregas Totales</span>
          <span className="rendicion-kpi-value">{totalEntregas}</span>
          <span className="rendicion-kpi-sub">Pedidos completados</span>
        </div>

        <div className="rendicion-kpi-card">
          <span className="rendicion-kpi-label">Promedio por Transportista</span>
          <span className="rendicion-kpi-value">{formatearMoneda(promedioPorTransportista)}</span>
          <span className="rendicion-kpi-sub">Generado en el período</span>
        </div>
      </div>

      {/* Tabla */}
      <div className="rendicion-table-card">
        <div className="rendicion-table-header">
          <h2>
            Detalle por Transportista — {modo === 'diaria' ? 'Vista Diaria' : 'Vista Mensual'}
          </h2>
          {USAR_MOCK && (
            <span className="rendicion-badge-mock">Maqueta (datos de ejemplo)</span>
          )}
        </div>

        {cargando ? (
          <div className="rendicion-empty">Cargando rendición de cuentas...</div>
        ) : error ? (
          <div className="rendicion-empty">{error}</div>
        ) : datosFiltrados.length === 0 ? (
          <div className="rendicion-empty">
            No se encontraron transportistas para el período o filtro aplicado.
          </div>
        ) : (
          <div className="rendicion-table-wrapper">
            <table className="rendicion-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Apellido</th>
                  <th className="text-right">Entregas</th>
                  <th className="text-right">
                    {modo === 'diaria' ? 'Monto Generado (Día)' : 'Monto Generado (Mes)'}
                  </th>
                  <th className="text-right">% del Total</th>
                </tr>
              </thead>
              <tbody>
                {datosFiltrados.map((t) => {
                  const porcentaje = totalGeneral > 0 ? (t.monto / totalGeneral) * 100 : 0;
                  return (
                    <tr key={t.id}>
                      <td>{t.nombre}</td>
                      <td>{t.apellido}</td>
                      <td className="text-right">{t.entregas}</td>
                      <td className="text-right rendicion-monto">{formatearMoneda(t.monto)}</td>
                      <td className="text-right">{porcentaje.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2}>Total General ({datosFiltrados.length} transportistas)</td>
                  <td className="text-right">{totalEntregas}</td>
                  <td className="text-right rendicion-total-monto">
                    {formatearMoneda(totalGeneral)}
                  </td>
                  <td className="text-right">100.0%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
