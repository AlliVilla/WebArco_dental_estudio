import { MessageCircle, Mail, Phone } from 'lucide-react';
import type { CanalRecordatorio, EstadoEnvio, RespuestaPaciente } from '../types';

export const CANAL_CONFIG: Record<CanalRecordatorio, { icon: React.ReactNode; color: string; bg: string }> = {
    WhatsApp: { icon: <MessageCircle size={13} />, color: '#1D9E75', bg: '#ECFDF5' },
    SMS:      { icon: <Phone size={13} />,         color: '#EF9F27', bg: '#FFF8EC' },
    Correo:   { icon: <Mail size={13} />,          color: '#0BC5DF', bg: '#E6F8FB' },
};

export const ESTADO_CONFIG: Record<EstadoEnvio, { color: string; bg: string; dot: string }> = {
    Pendiente: { color: '#EF9F27', bg: '#FFF8EC', dot: '#EF9F27' },
    Enviado:   { color: '#1D9E75', bg: '#ECFDF5', dot: '#1D9E75' },
    Error:     { color: '#E24B4A', bg: '#FEF2F2', dot: '#E24B4A' },
};

export const RESPUESTA_CONFIG: Record<RespuestaPaciente, { color: string; bg: string; dot: string; label: string }> = {
    'Confirmó':      { color: '#1D9E75', bg: '#ECFDF5', dot: '#1D9E75', label: 'Confirmó'       },
    'Canceló':       { color: '#E24B4A', bg: '#FEF2F2', dot: '#E24B4A', label: 'Canceló'        },
    'Sin respuesta': { color: '#888F94', bg: '#F1F3F4', dot: '#D3D7DA', label: 'Sin respuesta'  },
};
