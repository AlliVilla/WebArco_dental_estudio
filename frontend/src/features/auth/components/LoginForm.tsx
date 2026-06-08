import React, { useState } from 'react';
import { useAuthStore } from '../hooks/useAuthStore';
import { KeyRound, User as UserIcon, Lock, Sparkles, CheckCircle2 } from 'lucide-react';

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { login, error, isLoading, clearError } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showHelpers, setShowHelpers] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    
    try {
      await login(username, password);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      // Handled in store
    }
  };

  const fillCredentials = (user: string, pass: string) => {
    clearError();
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div className="glass-card animate-slide" style={{ padding: '2.5rem', width: '100%', maxWidth: '440px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{
          display: 'inline-flex',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, hsla(var(--hue-primary), 85%, 45%, 0.1), hsla(var(--hue-secondary), 75%, 55%, 0.1))',
          color: 'var(--primary)',
          marginBottom: '1rem'
        }}>
          <KeyRound size={28} />
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          WebArco <span className="gradient-text">Dental Studio</span>
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Inicia sesión para gestionar el sistema
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="badge badge-danger animate-fade" style={{ 
            width: '100%', 
            padding: '0.75rem 1rem', 
            borderRadius: 'var(--radius-sm)', 
            marginBottom: '1.25rem', 
            textTransform: 'none',
            letterSpacing: 'normal',
            display: 'block',
            lineHeight: '1.4'
          }}>
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="form-label" htmlFor="username" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <UserIcon size={14} /> Usuario
          </label>
          <input
            id="username"
            type="text"
            className="form-input"
            placeholder="ej. maria.admin"
            value={username}
            onChange={(e) => {
              clearError();
              setUsername(e.target.value);
            }}
            required
            autoComplete="username"
          />
        </div>

        <div className="form-group" style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label className="form-label" htmlFor="password" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: 0 }}>
              <Lock size={14} /> Contraseña
            </label>
            <a href="#forgot" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
              ¿Olvidaste tu contraseña?
            </a>
          </div>
          <input
            id="password"
            type="password"
            className="form-input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              clearError();
              setPassword(e.target.value);
            }}
            required
            autoComplete="current-password"
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ width: '100%', padding: '0.9rem' }}
          disabled={isLoading}
        >
          {isLoading ? (
            <div style={{ 
              width: '20px', 
              height: '20px', 
              border: '2px solid rgba(255,255,255,0.3)', 
              borderTopColor: '#fff', 
              borderRadius: '50%', 
              animation: 'spinSlow 1s linear infinite' 
            }} />
          ) : (
            'Ingresar al Sistema'
          )}
        </button>
      </form>

      {showHelpers && (
        <div style={{ 
          marginTop: '2rem', 
          paddingTop: '1.5rem', 
          borderTop: '1px solid var(--border-color)',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Sparkles size={14} style={{ color: 'var(--warning)' }} /> Cuentas de prueba (Seed):
            </span>
            <button 
              onClick={() => setShowHelpers(false)} 
              style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', fontWeight: 600 }}
            >
              ocultar
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button 
              onClick={() => fillCredentials('maria.admin', 'admin123')} 
              className="btn btn-secondary"
              style={{ padding: '0.4rem', fontSize: '0.75rem', justifyContent: 'flex-start', borderRadius: '6px' }}
            >
              <CheckCircle2 size={10} style={{ color: 'var(--success)' }} /> Administrador
            </button>
            <button 
              onClick={() => fillCredentials('ana.doctor', 'doctor123')} 
              className="btn btn-secondary"
              style={{ padding: '0.4rem', fontSize: '0.75rem', justifyContent: 'flex-start', borderRadius: '6px' }}
            >
              <CheckCircle2 size={10} style={{ color: 'var(--success)' }} /> Doctor/a
            </button>
            <button 
              onClick={() => fillCredentials('juan.specialist', 'specialist123')} 
              className="btn btn-secondary"
              style={{ padding: '0.4rem', fontSize: '0.75rem', justifyContent: 'flex-start', borderRadius: '6px' }}
            >
              <CheckCircle2 size={10} style={{ color: 'var(--success)' }} /> Especialista
            </button>
            <button 
              onClick={() => fillCredentials('carlos.contador', 'contador123')} 
              className="btn btn-secondary"
              style={{ padding: '0.4rem', fontSize: '0.75rem', justifyContent: 'flex-start', borderRadius: '6px' }}
            >
              <CheckCircle2 size={10} style={{ color: 'var(--success)' }} /> Contador
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default LoginForm;
