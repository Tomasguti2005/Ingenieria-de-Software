// LoginPage.jsx — Pantalla de login del administrador.
// Endpoint: POST /api/auth/admin/login (solo rol ADMIN)
// Almacena el JWT en sessionStorage vía AuthContext y redirige al panel admin.

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { loginAdmin } from '../../services/auth.service.js';
import logoImg from '../../assets/logo.png';
import './LoginPage.css';

const MAX_INTENTOS = 3;
const SEGUNDOS_BLOQUEO = 30;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, estaAutenticado } = useAuth();

  // ── Estado del formulario ──────────────────────────────────────
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);

  // ── Estado de UI ───────────────────────────────────────────────
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);       // 'id invalido' | 'contraseña incorrecta' | null
  const [inputConError, setInputConError] = useState(null); // 'email' | 'password' | null

  // ── Estado de intentos y bloqueo ──────────────────────────────
  const [intentosFallidos, setIntentosFallidos] = useState(0);
  const [bloqueado, setBloqueado] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(0);
  const [shakeKey, setShakeKey] = useState(0); // fuerza re-render para re-disparar animación

  const timerRef = useRef(null);

  // Si ya está autenticado, redirigir directamente
  useEffect(() => {
    if (estaAutenticado) {
      navigate('/admin/transportistas', { replace: true });
    }
  }, [estaAutenticado, navigate]);

  // Limpieza del timer al desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ── Manejadores ────────────────────────────────────────────────
  function iniciarBloqueo() {
    setBloqueado(true);
    setSegundosRestantes(SEGUNDOS_BLOQUEO);

    timerRef.current = setInterval(() => {
      setSegundosRestantes((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setBloqueado(false);
          setIntentosFallidos(0);
          setError(null);
          setInputConError(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function registrarFallo(mensajeError, campo) {
    // Animación de sacudida
    setShakeKey((k) => k + 1);
    setError(mensajeError);
    setInputConError(campo);

    const nuevosIntentos = intentosFallidos + 1;
    setIntentosFallidos(nuevosIntentos);

    if (nuevosIntentos >= MAX_INTENTOS) {
      iniciarBloqueo();
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (bloqueado || cargando) return;

    // Validación básica de campos vacíos
    if (!email.trim()) {
      setError('Ingresá tu email para continuar.');
      setInputConError('email');
      return;
    }
    if (!password) {
      setError('Ingresá tu contraseña para continuar.');
      setInputConError('password');
      return;
    }

    setError(null);
    setInputConError(null);
    setCargando(true);

    try {
      const respuesta = await loginAdmin(email.trim(), password);
      // Éxito: guardar token y datos en el contexto
      login(respuesta.data.token, respuesta.data.usuario);
      // La redirección la maneja el useEffect de arriba
    } catch (err) {
      const mensaje = err.message || 'Error al iniciar sesión. Intentá de nuevo.';

      // Determinar qué campo tiene el error para resaltarlo
      if (mensaje === 'id invalido') {
        registrarFallo('Email inválido. No existe una cuenta con ese email.', 'email');
      } else if (mensaje === 'contraseña incorrecta') {
        registrarFallo('Contraseña incorrecta. Verificá e intentá de nuevo.', 'password');
      } else {
        registrarFallo(mensaje, null);
      }
    } finally {
      setCargando(false);
    }
  }

  // ── Render ─────────────────────────────────────────────────────
  const cardClass = `login-card ${shakeKey > 0 ? 'shake' : ''}`;

  return (
    <div className="login-page">
      <div className={cardClass} key={shakeKey}>

        {/* Encabezado */}
        <div className="login-header">
          <div className="login-logo">
            <img src={logoImg} alt="Logo" className="login-logo-img" />
          </div>
          <h1 className="login-title">Repartos Ya</h1>
          <p className="login-subtitle">Panel de administración</p>
        </div>

        {/* Formulario */}
        <form className="login-form" onSubmit={handleSubmit} noValidate>

          {/* Campo Email */}
          <div className="form-field">
            <label htmlFor="login-email" className="form-label">
              Email
            </label>
            <div className="input-wrapper">
              <input
                id="login-email"
                type="email"
                className={`form-input${inputConError === 'email' ? ' input-error' : ''}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={bloqueado || cargando}
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div className="form-field">
            <label htmlFor="login-password" className="form-label">
              Contraseña
            </label>
            <div className="input-wrapper">
              <input
                id="login-password"
                type={mostrarPassword ? 'text' : 'password'}
                className={`form-input has-toggle${inputConError === 'password' ? ' input-error' : ''}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={bloqueado || cargando}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setMostrarPassword((v) => !v)}
                aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                tabIndex={-1}
              >
                {mostrarPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Indicador visual de intentos (solo si hubo al menos 1 fallo) */}
          {intentosFallidos > 0 && !bloqueado && (
            <div className="intentos-indicator" aria-label={`${intentosFallidos} de ${MAX_INTENTOS} intentos usados`}>
              {Array.from({ length: MAX_INTENTOS }).map((_, i) => (
                <div
                  key={i}
                  className={`intento-dot${i < intentosFallidos ? ' usado' : ''}`}
                />
              ))}
            </div>
          )}

          {/* Escenario 2 y 3: mensajes de error */}
          {error && !bloqueado && (
            <div className="feedback-box error" role="alert">
              <span className="feedback-icon" aria-hidden="true">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Escenario 4: cuenta bloqueada con countdown */}
          {bloqueado && (
            <div className="feedback-box blocked" role="alert">
              <span className="feedback-icon" aria-hidden="true">🔒</span>
              <span>
                Cuenta bloqueada temporalmente por seguridad.
                Podés intentar de nuevo en <strong>{segundosRestantes}s</strong>.
              </span>
            </div>
          )}

          {/* Botón submit (se oculta cuando la cuenta está bloqueada) */}
          {!bloqueado && (
            <button
              id="btn-iniciar-sesion"
              type="submit"
              className="btn-login"
              disabled={cargando}
            >
              {cargando ? (
                <>
                  <span className="spinner" aria-hidden="true" />
                  Verificando...
                </>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          )}

        </form>
      </div>
    </div>
  );
}
