import { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL
import './RegistroVehiculo.css';

export default function VehiculoForm() {
  const [patente, setPatente] = useState('')
  const [modelo, setModelo] = useState('')
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setExito('')

    const patenteLimpia = patente.replace(/\s/g, '').toUpperCase()
    const modeloLimpio = modelo.trim()

    if (!patenteLimpia || !modeloLimpio) {
      setError('Completá la patente y el modelo.')
      return
    }

    setCargando(true)
    try {
      const res = await fetch(`${API_URL}/vehiculos/registrar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ patente: patenteLimpia, modelo: modeloLimpio }),
      })
      const json = await res.json()

      if (!res.ok || !json.success) {
        if (res.status === 201) {
          setPatente('')
          setModelo('')
          return setExito('Vehículo registrado correctamente.')
        }
         return setError(
          res.status === 401
            ? 'Ya existe un vehículo con esa patente.'
            : json.error || 'No se pudo registrar el vehículo.'
        )
       
      }
    } catch {
      setError('No se pudo conectar con el servidor.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="container">
    <form onSubmit={handleSubmit} className="form">
      <h1 className="title">Registrar vehículo</h1>

      <label className="label">
        Patente
        <input
          type="text"
          value={patente}
          onChange={(e) => setPatente(e.target.value)}
          placeholder="AB123CD"
          className="input"
        />
      </label>

      <label className="label">
        Modelo
        <input
          type="text"
          value={modelo}
          onChange={(e) => setModelo(e.target.value)}
          placeholder="Fiat Fiorino 2020"
          className="input"
        />
      </label>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {exito && <p style={{ color: 'green' }}>{exito}</p>}

      <button type="submit" disabled={cargando} className="button">
        {cargando ? 'Guardando...' : 'Registrar'}
      </button>
    </form>
    </div>
  )
}