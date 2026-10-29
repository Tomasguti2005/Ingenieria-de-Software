import { useState, useEffect } from 'react'
import './AsignarVehiculo.css'

const API_URL = import.meta.env.VITE_API_URL;
const MSG_EXITO = 'Vehículo vinculado exitosamente al transportista'

export default function AsignarVehiculo() {
  const [vehiculos, setVehiculos] = useState([])
  const [transportistas, setTransportistas] = useState([])
  const [vehiculoId, setVehiculoId] = useState('')
  const [transportistaId, setTransportistaId] = useState('')
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [enviando, setEnviando] = useState(false)

  // 1. Extraemos cargarDatos para poder llamarla al montar Y después de guardar
  async function cargarDatos() {
    try {
      // Petición de transportistas activos sin vehículo
      const resTrans = await fetch(`${API_URL}/transportistasVehiculo/activos`)
      const dataTrans = await resTrans.json()

      if (dataTrans.success || dataTrans.exito) {
        setTransportistas(dataTrans.data || dataTrans.datos)
      }

      // Petición para listar vehículos
      const resVeh = await fetch(`${API_URL}/vehiculos`)
      const dataVeh = await resVeh.json()

      if (dataVeh.success || Array.isArray(dataVeh)) {
        setVehiculos(dataVeh.data || dataVeh)
      }
    } catch (err) {
      console.error('Error al conectar con el servidor:', err)
      setError('No se pudo conectar con el servidor para cargar los datos.')
    }
  }

  // 2. El useEffect solo invoca la función al inicio
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarDatos()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setExito('')

    if (!transportistaId || !vehiculoId) {
      return setError('Elegí un transportista y un vehículo.')
    }

    setEnviando(true)

    try {
      const res = await fetch(`${API_URL}/transportistasVehiculo/asignar-vehiculo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transportistaId,
          patente: vehiculoId
        }),
      });

      const json = await res.json();

      // 3. Control de respuestas HTTP según los códigos que configuramos en el backend
      if (res.ok) {
        setExito(MSG_EXITO)
        setVehiculoId('')
        setTransportistaId('')
        
        // 🚀 4. RECARGA AUTOMÁTICA: Volvemos a pedir los datos frescos al servidor
        await cargarDatos()
      } else {
        // Manejo de errores específicos por código HTTP
        if (res.status === 409) {
          return setError('El transportista o el vehículo ya tienen una asignación activa.');
        }
        if (res.status === 404) {
          return setError('El transportista o el vehículo seleccionado ya no existen.');
        }
        return setError(json.detail || json.error || 'Debe completar todos los campos obligatorios.');
      }

    } catch (err) {
      setError(err || 'No se pudo conectar con el servidor.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="asignar-container">
      <form className="asignar-form" onSubmit={handleSubmit}>
        <h2>Asignar vehículo a transportista</h2>

        <label className="asignar-label">
          Transportista
          <select
            value={transportistaId}
            onChange={(e) => setTransportistaId(e.target.value)}
          >
            <option value="">Seleccioná un transportista</option>
            {transportistas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre} {t.apellido}
                { ' (activo)' }
              </option>
            ))}
          </select>
        </label>

        <label className="asignar-label">
          Vehículo
          <select
            value={vehiculoId}
            onChange={(e) => setVehiculoId(e.target.value)}
          >
            <option value="">Seleccioná un vehículo</option>
            {vehiculos.map((v) => (
              <option key={v.id || v.patente} value={v.patente}>
                {v.patente} - {v.modelo}
              </option>
            ))}
          </select>
        </label>

        {error && <p className="asignar-mensaje error">{error}</p>}
        {exito && <p className="asignar-mensaje exito">{exito}</p>}

        <button className="asignar-boton" type="submit" disabled={enviando}>
          {enviando ? 'Asignando...' : 'Asignar vehículo'}
        </button>
      </form>
    </div>
  )
}
