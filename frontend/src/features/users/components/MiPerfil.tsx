import React, { useState } from 'react';
import { User, Key, LogOut, Shield, ChevronRight } from 'lucide-react';

import { FormSection, FullWidthField, ConfirmModal } from '../../../components';
import { Button, Input, Card, useTheme } from '../../../context';
import profileTooth from '../../../assets/profile-tooth.png';

export interface MiPerfilProps { }

export function MiPerfil(_props: MiPerfilProps) {
  useTheme();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const handleSave = () => { };

  const handleLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 24, maxWidth: 1150, margin: '0 auto', width: '100%' }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: 'var(--foreground)', margin: '0 0 4px 0' }}>Mi Perfil</h1>
        <p style={{ fontSize: 14, color: 'var(--muted-foreground)', margin: 0 }}>Gestiona tu información personal y configuración de seguridad</p>
      </div>

      <div
        style={{
          position: 'relative',
          borderRadius: 12,
          padding: '24px 32px',
          overflow: 'hidden',
          background: 'linear-gradient(360deg, #0DC8E2 0%, #0BC5DF 50%, #0bb1c7ff 100%)',
          display: 'flex',
          alignItems: 'center',
          minHeight: 140,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, zIndex: 1 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.25)',
              border: '1px solid #ffffff',
              boxShadow: '0 4px 14px rgba(32, 63, 73, 0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              fontWeight: 600,

              color: '#ffffff',
              flexShrink: 0,
            }}
          >
            KA
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#ffffff', margin: '0 0 6px 0' }}>
              Karlos Alberto Admin
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, color: '#ffffff' }}>
              <span>@karlos.admin</span>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#ffffff', flexShrink: 0 }} />
              <span
                style={{
                  background: 'rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  padding: '2px 10px',
                  borderRadius: 12,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                Administrador
              </span>
            </div>
          </div>
        </div>

        <img
          src={profileTooth}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: -10,
            bottom: -55,
            width: 200,
            height: 200,
            objectFit: 'contain',
            opacity: 0.2,
            mixBlendMode: 'lighten',
            pointerEvents: 'none',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div style={{
          width: 722,
          flexShrink: 0,
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)',
          overflow: 'hidden'
        }}>
          <FormSection
            icon={
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#E6F8FB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={16} color="#0BC5DF" />
              </div>
            }
            title="Editar Perfil"
            columns={2}
          >
            <Input label="Username" badge="required" defaultValue="karlos.admin" />
            <Input label="Correo electrónico" badge="required" defaultValue="karlos@arco.com" />
            <FullWidthField>
              <Input label="Nombre completo" badge="required" defaultValue="Karlos Alberto Admin" />
            </FullWidthField>
            <FullWidthField style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <Button variant="primary" onClick={handleSave} style={{ width: 153 }}>Guardar cambios</Button>
            </FullWidthField>
          </FormSection>
        </div>

        <div style={{
          width: 349,
          height: 400,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
          {/* Account Actions Card */}
          <Card style={{
            padding: '26px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05)',
            border: 'none'
          }}>
            <h3 style={{
              fontSize: 14,
              fontWeight: 600,
              color: '#203F49',
              margin: '0 0 4px 0'
            }}>
              Acciones de cuenta
            </h3>

            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              width: '100%',
              border: '0.5px solid #D3D7DA',
              borderRadius: 10,
              padding: '0 16px',
              height: 66,
              cursor: 'pointer',
              background: '#E6F8FB',
              fontFamily: 'inherit',
              fontSize: 14,
              textAlign: 'left'
            }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: '#0BC5DF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                flexShrink: 0
              }}>
                <User size={16} />
              </div>
              <span style={{ flex: 1, color: '#203F49' }}>Editar Perfil</span>
              <ChevronRight size={16} color="#888F94" />
            </button>

            <button
              onClick={() => setShowPasswordModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                border: '0.5px solid #D3D7DA',
                borderRadius: 10,
                padding: '0 16px',
                height: 66,
                cursor: 'pointer',
                background: '#fff',
                fontFamily: 'inherit',
                fontSize: 14,
                textAlign: 'left'
              }}
            >
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: '#E6F8FB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#203F49',
                flexShrink: 0
              }}>
                <Key size={16} />
              </div>
              <span style={{ flex: 1, color: '#203F49' }}>Cambiar Contraseña</span>
              <ChevronRight size={16} color="#888F94" />
            </button>

            <button
              onClick={() => setShowLogoutModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                border: '0.5px solid #D3D7DA',
                borderRadius: 10,
                padding: '0 16px',
                height: 66,
                cursor: 'pointer',
                background: '#fff',
                fontFamily: 'inherit',
                fontSize: 14,
                textAlign: 'left'
              }}
            >
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: '#F8F9FA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#E24B4A',
                flexShrink: 0
              }}>
                <LogOut size={16} />
              </div>
              <span style={{ flex: 1, color: '#E24B4A' }}>Cerrar Sesión</span>
              <ChevronRight size={16} color="#E24B4A" />
            </button>
          </Card>

          {/* Security Card */}
          <Card style={{
            padding: '20px 16px',
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
            background: 'var(--background)',
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(184, 49, 49, 0.08), 0 4px 12px rgba(0,0,0,0.05)',
            border: 'none'
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: '#0BC5DF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              flexShrink: 0
            }}>
              <Shield size={18} />
            </div>
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: '#203F49', margin: '0 0 4px 0' }}>Seguridad de la cuenta</h4>
              <p style={{ fontSize: 13, color: '#5F656A', margin: 0, lineHeight: 1.4 }}>
                Mantén tu cuenta segura actualizando tu contraseña regularmente.
              </p>
            </div>
          </Card>
        </div>
      </div>

      <ConfirmModal
        open={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        variant="danger"
        title="Cerrar Sesión"
        description="¿Estás seguro de que deseas cerrar sesión? Tendrás que volver a ingresar tus credenciales para acceder."
        confirmLabel="Cerrar Sesión"
      />

    </div>
  );
}
