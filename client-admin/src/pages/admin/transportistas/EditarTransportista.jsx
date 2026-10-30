// EditarTransportistaPage.jsx — Página dedicada para modificar un transportista.
// Ruta sugerida: /admin/transportistas/:id/editar

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './TransportistasPage.css'; // O tus estilos correspondientes

const API_URL = import.meta.env.VITE_API_URL;

export default function EditarTransportistaPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [estado, setEstado] = useState('ACTIVO');
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [cargandoGuardado, setCargandoGuardado] = useState(false);

  // 1. Cargar los datos actuales del transportista al montar la página
  useEffect(() => {
    async function obtenerTransportistaPorId() {
      try {
        const res = await fetch(`${API_URL}/transportistas/${id}`);
        const {data} = await res.json();

        console.log('Datos del transportista obtenidos:', data);
        if (res.ok) {
          setNombre(data.nombre || '');
          setApellido(data.apellido || '');
          setEmail(data.email || '');
          setTelefono(data.telefono || '');
          setEstado(data.estado || 'INACTIVO');
        } else {
          setError('No se pudieron cargar los datos del transportista.');
        }
      } catch (err) {
        setError(err || 'No se pudo conectar con el servidor.');
      } finally {
        setCargandoDatos(false);
      }
    }

    obtenerTransportistaPorId();
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setExito('');

    // Limpieza de datos
    const nombreLimpio = nombre.trim();
    const apellidoLimpio = apellido.trim();
    const emailLimpio = email.trim().toLowerCase();
    const telefonoLimpio = telefono.replace(/\s/g, '');

    // Validación 1: Campos obligatorios no vacíos
    if (!nombreLimpio || !apellidoLimpio || !emailLimpio || !telefonoLimpio || !estado) {
      setError('Debe completar todos los campos obligatorios con un formato válido');
      return;
    }

    // Validación 2: Formato de mail exacto (nombre@gmail.com)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailLimpio)) {
      setError('Debe completar todos los campos obligatorios con un formato válido');
      return;
    }

    // Validación 3: Teléfono todo seguido sin espacios
    const telefonoRegex = /^\+?[0-9]{9,15}$/;
    if (!telefonoRegex.test(telefonoLimpio)) {
      setError('Debe completar todos los campos obligatorios con un formato válido');
      return;
    }

    setCargandoGuardado(true);
    try {
      const res = await fetch(`${API_URL}/transportistas/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: nombreLimpio,
          apellido: apellidoLimpio,
          email: emailLimpio,
          telefono: telefonoLimpio,
          estado,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        // Escenario 3: Modificación rechazada por correo duplicado
       
        if (res.status === 409 ) {
          return setError('El correo electrónico ya se encuentra registrado');
        } 
        return setError(json.error || 'Debe completar todos los campos obligatorios con un formato válido');
      }
       if(res.status===200){
          setExito('Los datos del transportista han sido actualizados con éxito');
          return navigate('/admin/transportistas');
        }
    } catch (err) {
      setError(err || 'No se pudo conectar con el servidor.');
    } finally {
      setCargandoGuardado(false);
    }
  }

  if (cargandoDatos) {
    return (
      <div className="transportistas-container">
        <div className="state-card loading">
          <div className="minimal-spinner" />
          <span className="loading-text">Cargando datos del transportista...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="transportistas-container">
      <header className="page-header">
        <div className="header-meta">
          <div className="header-breadcrumb">
            <span>Repartos Ya</span>
            <span className="breadcrumb-separator">/</span>
            <span
              className="breadcrumb-link"
              onClick={() => navigate('/admin/transportistas')}
              style={{ cursor: 'pointer' }}
            >
              Transportistas
            </span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">Editar Datos</span>
          </div>
          <h1 className="header-title">Modificar Transportista</h1>
        </div>
      </header>

      <div className="form-page-container" style={{ maxWidth: '600px', margin: '2rem auto', background: '#0f1117', padding: '2rem', border: '1px solid #1f2430', borderRadius: '8px' }}>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" htmlFor="nombre">Nombre</label>
            <input
              id="nombre"
              type="text"
              className="form-input"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" htmlFor="apellido">Apellido</label>
            <input
              id="apellido"
              type="text"
              className="form-input"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" htmlFor="email">Correo electrónico (ej: nombre@gmail.com)</label>
            <input
              id="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@gmail.com"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" htmlFor="telefono">Teléfono (todo seguido sin espacios)</label>
            <input
              id="telefono"
              type="text"
              className="form-input font-mono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="1123456789"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label" htmlFor="estado">Estado actual</label>
            <select
              id="estado"
              className="minimal-select full-width"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              style={{ width: '100%', padding: '0.625rem', background: '#161b22', color: '#e6edf3', border: '1px solid #30363d', borderRadius: '6px' }}
            >
              <option value="ACTIVO">ACTIVO</option>
              <option value="INACTIVO">INACTIVO</option>
            </select>
          </div>

          {error && <div className="form-alert error" style={{ marginBottom: '1rem' }}>{error}</div>}
          {exito && <div className="form-alert success" style={{ marginBottom: '1rem' }}>{exito}</div>}

          <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button
              type="button"
              className="btn-action-secondary"
              onClick={() => navigate('/admin/transportistas')}
              style={{ background: 'transparent', border: '1px solid #30363d', color: '#c9d1d9', padding: '0.625rem 1rem', borderRadius: '6px', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-action-primary"
              disabled={cargandoGuardado}
              style={{ background: '#238636', border: 'none', color: '#ffffff', padding: '0.625rem 1.25rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
            >
              {cargandoGuardado ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}