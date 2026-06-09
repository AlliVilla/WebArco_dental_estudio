import { ApiResponse } from '../../../types/api';
import {
  PaginatedUsuariosResponse,
  UserStats,
  Usuario,
  CreateUsuarioInput,
  UpdateUsuarioInput,
} from '../types';

// Honduras Departments and Municipios static database mapping
const mockUsers: Usuario[] = [
  {
    id_usuario: 1,
    id_persona: 101,
    username: 'hectovargas',
    id_rol: 2, // Admin
    activo: true,
    must_change_password: false,
    persona: {
      id_persona: 101,
      numero_identidad: '0801198512345',
      primer_nombre: 'Héctor',
      segundo_nombre: 'Iván',
      primer_apellido: 'Vargas',
      segundo_apellido: 'Zelaya',
      fecha_nacimiento: '1985-04-12T00:00:00.000Z',
      telefono: '9988-7766',
      correo_electronico: 'hector.vargas@webarco.com',
      id_municipio: 110,
      direccion_linea: 'Col. Florencia, Calle Principal, Casa 45',
      sexo: 'M'
    },
    rol: {
      id_rol: 2,
      nombre: 'Administrador'
    }
  },
  {
    id_usuario: 2,
    id_persona: 102,
    username: 'karita',
    id_rol: 4, // Doctor
    activo: true,
    must_change_password: false,
    persona: {
      id_persona: 102,
      numero_identidad: '0501199023456',
      primer_nombre: 'Karla',
      segundo_nombre: 'Patricia',
      primer_apellido: 'Arita',
      segundo_apellido: 'Mejía',
      fecha_nacimiento: '1990-08-25T00:00:00.000Z',
      telefono: '8877-6655',
      correo_electronico: 'karla.arita@webarco.com',
      id_municipio: 110,
      direccion_linea: 'Res. Plaza, Bloque G, Casa 12',
      sexo: 'F'
    },
    rol: {
      id_rol: 4,
      nombre: 'Doctor'
    }
  },
  {
    id_usuario: 3,
    id_persona: 103,
    username: 'msolorzano',
    id_rol: 1, // Especialista
    activo: true,
    must_change_password: false,
    persona: {
      id_persona: 103,
      numero_identidad: '0801198834567',
      primer_nombre: 'Mario',
      segundo_nombre: 'Alberto',
      primer_apellido: 'Solórzano',
      segundo_apellido: 'Ortiz',
      fecha_nacimiento: '1988-11-03T00:00:00.000Z',
      telefono: '9944-5522',
      correo_electronico: 'mario.solorzano@webarco.com',
      id_municipio: 110,
      direccion_linea: 'Col. Palmira, Ave. República de Argentina',
      sexo: 'M'
    },
    rol: {
      id_rol: 1,
      nombre: 'Especialista'
    }
  },
  {
    id_usuario: 4,
    id_persona: 104,
    username: 'lflores',
    id_rol: 4, // Doctor
    activo: false,
    must_change_password: true,
    persona: {
      id_persona: 104,
      numero_identidad: '0801199456789',
      primer_nombre: 'Lorena',
      segundo_nombre: 'Isabel',
      primer_apellido: 'Flores',
      segundo_apellido: 'Castro',
      fecha_nacimiento: '1994-02-18T00:00:00.000Z',
      telefono: '3322-1100',
      correo_electronico: 'lorena.flores@webarco.com',
      id_municipio: 110,
      direccion_linea: 'Col. Tres Caminos, Calle 2, Casa 89',
      sexo: 'F'
    },
    rol: {
      id_rol: 4,
      nombre: 'Doctor'
    }
  }
];

const LOCAL_STORAGE_KEY = 'webarco_mock_users';

function getStoredUsers(): Usuario[] {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Error parsing mock users', e);
    }
  }
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mockUsers));
  return mockUsers;
}

function saveStoredUsers(users: Usuario[]) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(users));
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export const userService = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    nombre?: string;
    correo?: string;
    rol?: string;
  }): Promise<ApiResponse<PaginatedUsuariosResponse>> => {
    await sleep(350); // Simulate network latency
    const users = getStoredUsers();
    
    let filtered = [...users];

    // Filter by name (primer_nombre, primer_apellido, username)
    if (params?.nombre) {
      const term = params.nombre.toLowerCase();
      filtered = filtered.filter(u => 
        u.persona.primer_nombre.toLowerCase().includes(term) ||
        u.persona.primer_apellido.toLowerCase().includes(term) ||
        (u.persona.segundo_nombre && u.persona.segundo_nombre.toLowerCase().includes(term)) ||
        (u.persona.segundo_apellido && u.persona.segundo_apellido.toLowerCase().includes(term)) ||
        u.username.toLowerCase().includes(term)
      );
    }

    // Filter by role name
    if (params?.rol) {
      const rolName = params.rol.toLowerCase();
      filtered = filtered.filter(u => u.rol.nombre.toLowerCase() === rolName);
    }

    const total = filtered.length;
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);
    const pages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        usuarios: paginated,
        total,
        page,
        limit,
        pages
      },
      message: 'Usuarios obtenidos exitosamente.'
    };
  },

  getStats: async (): Promise<ApiResponse<UserStats>> => {
    await sleep(200); // Simulate network latency
    const users = getStoredUsers();
    const total = users.length;
    const doctores = users.filter(u => u.id_rol === 4).length;
    const especialistas = users.filter(u => u.id_rol === 1).length;

    return {
      success: true,
      data: {
        total,
        doctores,
        especialistas
      },
      message: 'Estadísticas obtenidas exitosamente.'
    };
  },

  create: async (data: CreateUsuarioInput): Promise<ApiResponse<Usuario>> => {
    await sleep(400); // Simulate network latency
    const users = getStoredUsers();

    // Check if username already exists
    if (users.some(u => u.username.toLowerCase() === data.username.toLowerCase())) {
      return {
        success: false,
        data: null as unknown as Usuario,
        message: 'El nombre de usuario ya está registrado.'
      };
    }

    // Check if identity already exists
    if (users.some(u => u.persona.numero_identidad === data.numero_identidad)) {
      return {
        success: false,
        data: null as unknown as Usuario,
        message: 'El número de identidad ya está registrado.'
      };
    }

    const newIdUsuario = users.length > 0 ? Math.max(...users.map(u => u.id_usuario)) + 1 : 1;
    const newIdPersona = users.length > 0 ? Math.max(...users.map(u => u.persona.id_persona)) + 1 : 101;

    const roleMap: Record<number, string> = {
      1: 'Especialista',
      2: 'Administrador',
      3: 'Contador',
      4: 'Doctor'
    };

    const newUsuario: Usuario = {
      id_usuario: newIdUsuario,
      id_persona: newIdPersona,
      username: data.username,
      id_rol: data.id_rol,
      activo: true,
      must_change_password: true,
      rol: {
        id_rol: Number(data.id_rol),
        nombre: roleMap[Number(data.id_rol)] || 'Usuario'
      },
      persona: {
        id_persona: newIdPersona,
        numero_identidad: data.numero_identidad,
        primer_nombre: data.primer_nombre,
        segundo_nombre: data.segundo_nombre || null,
        primer_apellido: data.primer_apellido,
        segundo_apellido: data.segundo_apellido || null,
        fecha_nacimiento: data.fecha_nacimiento,
        telefono: data.telefono,
        correo_electronico: data.correo_electronico || null,
        id_municipio: Number(data.id_municipio),
        direccion_linea: data.direccion_linea || null,
        sexo: data.sexo
      }
    };

    users.push(newUsuario);
    saveStoredUsers(users);

    return {
      success: true,
      data: newUsuario,
      message: 'Usuario registrado exitosamente.'
    };
  },

  update: async (id: number, data: UpdateUsuarioInput): Promise<ApiResponse<Usuario>> => {
    await sleep(400); // Simulate network latency
    const users = getStoredUsers();
    const idx = users.findIndex(u => u.id_usuario === id);

    if (idx === -1) {
      return {
        success: false,
        data: null as unknown as Usuario,
        message: 'Usuario no encontrado.'
      };
    }

    const existing = users[idx];

    // Check username duplication
    if (data.username && users.some(u => u.id_usuario !== id && u.username.toLowerCase() === data.username!.toLowerCase())) {
      return {
        success: false,
        data: null as unknown as Usuario,
        message: 'El nombre de usuario ya está en uso por otro registro.'
      };
    }

    // Check identity duplication
    if (data.numero_identidad && users.some(u => u.id_usuario !== id && u.persona.numero_identidad === data.numero_identidad)) {
      return {
        success: false,
        data: null as unknown as Usuario,
        message: 'El número de identidad ya está registrado en otro usuario.'
      };
    }

    const roleMap: Record<number, string> = {
      1: 'Especialista',
      2: 'Administrador',
      3: 'Contador',
      4: 'Doctor'
    };

    if (data.id_rol !== undefined) {
      existing.id_rol = Number(data.id_rol);
      existing.rol = {
        id_rol: Number(data.id_rol),
        nombre: roleMap[Number(data.id_rol)] || 'Usuario'
      };
    }

    if (data.username !== undefined) {
      existing.username = data.username;
    }

    existing.persona = {
      ...existing.persona,
      numero_identidad: data.numero_identidad !== undefined ? data.numero_identidad : existing.persona.numero_identidad,
      primer_nombre: data.primer_nombre !== undefined ? data.primer_nombre : existing.persona.primer_nombre,
      segundo_nombre: data.segundo_nombre !== undefined ? data.segundo_nombre : existing.persona.segundo_nombre,
      primer_apellido: data.primer_apellido !== undefined ? data.primer_apellido : existing.persona.primer_apellido,
      segundo_apellido: data.segundo_apellido !== undefined ? data.segundo_apellido : existing.persona.segundo_apellido,
      fecha_nacimiento: data.fecha_nacimiento !== undefined ? data.fecha_nacimiento : existing.persona.fecha_nacimiento,
      telefono: data.telefono !== undefined ? data.telefono : existing.persona.telefono,
      correo_electronico: data.correo_electronico !== undefined ? data.correo_electronico : existing.persona.correo_electronico,
      id_municipio: data.id_municipio !== undefined ? Number(data.id_municipio) : existing.persona.id_municipio,
      direccion_linea: data.direccion_linea !== undefined ? data.direccion_linea : existing.persona.direccion_linea,
      sexo: data.sexo !== undefined ? data.sexo : existing.persona.sexo,
    };

    saveStoredUsers(users);

    return {
      success: true,
      data: existing,
      message: 'Usuario actualizado exitosamente.'
    };
  },

  updateStatus: async (id: number, activo: boolean): Promise<ApiResponse<{ id_usuario: number; username: string; activo: boolean }>> => {
    await sleep(250); // Simulate network latency
    const users = getStoredUsers();
    const idx = users.findIndex(u => u.id_usuario === id);

    if (idx === -1) {
      return {
        success: false,
        data: null as unknown as { id_usuario: number; username: string; activo: boolean },
        message: 'Usuario no encontrado.'
      };
    }

    users[idx].activo = activo;
    saveStoredUsers(users);

    return {
      success: true,
      data: {
        id_usuario: users[idx].id_usuario,
        username: users[idx].username,
        activo
      },
      message: `Usuario ${activo ? 'activado' : 'desactivado'} exitosamente.`
    };
  },
};

export default userService;
