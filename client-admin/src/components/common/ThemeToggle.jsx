// ThemeToggle.jsx — Switch de tema con micro-animación e iconos vectoriales SVG traslúcidos.

import { useTheme } from '../../context/ThemeContext.jsx';
import './ThemeToggle.css';

export default function ThemeToggle({ className = '' }) {
  const { tema, toggleTema, esOscuro } = useTheme();

  return (
    <button
      type="button"
      className={`theme-toggle-btn ${className}`}
      onClick={toggleTema}
      role="switch"
      aria-checked={!esOscuro}
      aria-label={`Cambiar a modo ${esOscuro ? 'claro' : 'oscuro'}`}
      title={`Modo actual: ${esOscuro ? 'Oscuro' : 'Claro'}. Clic para cambiar.`}
    >
      {/* Icono Sol (Izquierda) */}
      <span className="theme-toggle-icon sun" aria-hidden="true">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      </span>

      {/* Icono Luna (Derecha) */}
      <span className="theme-toggle-icon moon" aria-hidden="true">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      </span>

      {/* Perilla deslizante animada */}
      <span className="theme-toggle-thumb" aria-hidden="true" />
    </button>
  );
}
