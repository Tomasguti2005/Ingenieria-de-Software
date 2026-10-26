// LoginScreen.js — Pantalla de login de repartidores.
// Endpoint: POST /api/auth/mobile/login
// Rol permitido: REPARTIDOR (estado ACTIVO)
// Al hacer login exitoso, AuthContext actualiza estaAutenticado y
// AppNavigator conmuta automáticamente a ListaPedidosScreen.

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { loginRepartidor } from '../services/auth.service';
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const MAX_INTENTOS = 3;
const SEGUNDOS_BLOQUEO = 30;

export default function LoginScreen() {
  const { login } = useAuth();

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

  const timerRef = useRef(null);
  const passwordRef = useRef(null);

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
    setError(mensajeError);
    setInputConError(campo);

    const nuevosIntentos = intentosFallidos + 1;
    setIntentosFallidos(nuevosIntentos);

    if (nuevosIntentos >= MAX_INTENTOS) {
      iniciarBloqueo();
    }
  }

  async function handleSubmit() {
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
    Keyboard.dismiss();

    try {
      const respuesta = await loginRepartidor(email.trim(), password);
      // Éxito: guardar token y datos en el contexto → AppNavigator redirige solo
      await login(respuesta.data.token, respuesta.data.usuario);
    } catch (err) {
      const mensaje = err.message || 'Error al iniciar sesión. Intentá de nuevo.';

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
  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.page}>
          <View style={styles.card}>

            {/* Encabezado */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('../../assets/icon.png')}
                  style={styles.logoImg}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.title}>Repartos Ya</Text>
              <Text style={styles.subtitle}>Acceso de repartidores</Text>
            </View>

            {/* Campo Email */}
            {/* Campo Email */}
            <View style={styles.formField}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, inputConError === 'email' && styles.inputError]}
                  value={email}
                  onChangeText={setEmail}
                  editable={!bloqueado && !cargando}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  placeholder="tu@email.com"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            </View>

            {/* Campo Contraseña */}
            <View style={styles.formField}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  ref={passwordRef}
                  style={[styles.input, styles.inputWithToggle, inputConError === 'password' && styles.inputError]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!mostrarPassword}
                  editable={!bloqueado && !cargando}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.textMuted}
                />
                <TouchableOpacity
                  style={styles.togglePassword}
                  onPress={() => setMostrarPassword((v) => !v)}
                  accessibilityLabel={mostrarPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {mostrarPassword ? (
                    <FontAwesome name="eye" size={20} color={COLORS.textMuted} />
                  ) : (
                    <AntDesign name="eye-invisible" size={20} color={COLORS.textMuted} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Indicador visual de intentos */}
            {intentosFallidos > 0 && !bloqueado && (
              <View style={styles.intentosContainer} accessibilityLabel={`${intentosFallidos} de ${MAX_INTENTOS} intentos usados`}>
                {Array.from({ length: MAX_INTENTOS }).map((_, i) => (
                  <View
                    key={i}
                    style={[styles.intentoDot, i < intentosFallidos && styles.intentoDotUsado]}
                  />
                ))}
              </View>
            )}

            {/* Mensaje de error */}
            {error && !bloqueado && (
              <View style={styles.feedbackBoxError} accessibilityRole="alert">
                <Text style={styles.feedbackIcon}>⚠️</Text>
                <Text style={styles.feedbackText}>{error}</Text>
              </View>
            )}

            {/* Cuenta bloqueada con countdown */}
            {bloqueado && (
              <View style={styles.feedbackBoxBlocked} accessibilityRole="alert">
                <Text style={styles.feedbackIcon}>🔒</Text>
                <Text style={styles.feedbackText}>
                  Cuenta bloqueada temporalmente por seguridad.{' '}
                  Podés intentar de nuevo en{' '}
                  <Text style={styles.feedbackTextBold}>{segundosRestantes}s</Text>.
                </Text>
              </View>
            )}

            {/* Botón submit */}
            {!bloqueado && (
              <TouchableOpacity
                style={[styles.btnLogin, cargando && styles.btnLoginDisabled]}
                onPress={handleSubmit}
                disabled={cargando}
                accessibilityRole="button"
                accessibilityLabel="Iniciar sesión"
              >
                {cargando ? (
                  <View style={styles.btnContent}>
                    <ActivityIndicator size="small" color={COLORS.white} />
                    <Text style={styles.btnText}>Verificando...</Text>
                  </View>
                ) : (
                  <Text style={styles.btnText}>Iniciar sesión</Text>
                )}
              </TouchableOpacity>
            )}

          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

// ─── Paleta de colores (replica identidad visual del panel web) ───
const COLORS = {
  bg: '#0f172a',
  surface: '#1e293b',
  border: '#334155',
  borderFocus: '#3b82f6',
  accent: '#3b82f6',
  accentDark: '#2563eb',
  error: '#ef4444',
  errorBg: 'rgba(239, 68, 68, 0.08)',
  warning: '#f59e0b',
  warningBg: 'rgba(245, 158, 11, 0.10)',
  text: '#e2e8f0',
  textMuted: '#64748b',
  white: '#ffffff',
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  // ─── Layout de página ────────────────────────────────────────
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bg,
    padding: 24,
  },

  // ─── Card central ─────────────────────────────────────────────
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 40,
    paddingHorizontal: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 12,
  },

  // ─── Encabezado ──────────────────────────────────────────────
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },
  logoImg: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
    letterSpacing: 0.2,
  },

  // ─── Campos del formulario ────────────────────────────────────
  formField: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
    letterSpacing: 0.1,
  },
  inputWrapper: {
    width: '100%',
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: COLORS.text,
  },
  inputWithToggle: {
    paddingRight: 48,
  },
  inputError: {
    borderColor: COLORS.error,
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
  },
  togglePassword: {
    position: 'absolute',
    right: 0,
    height: 48,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 24,
    height: 24,
  },
  togglePasswordText: {
    fontSize: 16,
  },
  eyeSlash: {
    position: 'absolute',
    width: 22,
    height: 2,
    backgroundColor: COLORS.textMuted,
    borderRadius: 1,
    transform: [{ rotate: '-45deg' }],
  },

  // ─── Indicador de intentos ────────────────────────────────────
  intentosContainer: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  intentoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  intentoDotUsado: {
    backgroundColor: COLORS.error,
  },

  // ─── Feedback de error / bloqueo ─────────────────────────────
  feedbackBoxError: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: COLORS.errorBg,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  feedbackBoxBlocked: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: COLORS.warningBg,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.30)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  feedbackIcon: {
    fontSize: 14,
    marginTop: 1,
  },
  feedbackText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },
  feedbackTextBold: {
    fontWeight: '700',
    color: COLORS.warning,
  },

  // ─── Botón de login ───────────────────────────────────────────
  btnLogin: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  btnLoginDisabled: {
    opacity: 0.7,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
