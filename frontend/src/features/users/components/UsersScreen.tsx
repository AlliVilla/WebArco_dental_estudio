import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Info,
  Edit,
  User,
  MapPin,
  Shield,
} from 'lucide-react';
import { DataTable, ConfirmModal, FormSection, FullWidthField } from '../../../components';
import {
  Button,
  Input,
  PasswordInput,
  Select,
  Card,
  Alert,
  Toggle,
  useTheme,
} from '../../../context';
import { roleService } from '../services/roleService';
import { userService } from '../services/userService';
import { formatIdentity } from '../../../utils/formatters';
import type { RoleSummary, Usuario, CreateUsuarioInput, UpdateUsuarioInput, UserStats } from '../types';


// Honduras Departments and Municipios static database mapping
const DEPARTAMENTOS_DATA = [
  { value: '1', label: 'Atlántida' },
  { value: '2', label: 'Choluteca' },
  { value: '3', label: 'Colón' },
  { value: '4', label: 'Comayagua' },
  { value: '5', label: 'Copán' },
  { value: '6', label: 'Cortés' },
  { value: '7', label: 'El Paraíso' },
  { value: '8', label: 'Francisco Morazán' },
  { value: '9', label: 'Gracias a Dios' },
  { value: '10', label: 'Intibucá' },
  { value: '11', label: 'Islas de la Bahía' },
  { value: '12', label: 'La Paz' },
  { value: '13', label: 'Lempira' },
  { value: '14', label: 'Ocotepeque' },
  { value: '15', label: 'Olancho' },
  { value: '16', label: 'Santa Bárbara' },
  { value: '17', label: 'Valle' },
  { value: '18', label: 'Yoro' },
];

const MUNICIPIOS_DATA: Record<string, { value: string; label: string }[]> = {
  '1': [
    { value: '1', label: 'La Ceiba' },
    { value: '2', label: 'El Porvenir' },
    { value: '3', label: 'Tela' },
    { value: '4', label: 'Jutiapa' },
    { value: '5', label: 'La Masica' },
    { value: '6', label: 'San Francisco' },
    { value: '7', label: 'Arizona' },
    { value: '8', label: 'Esparta' },
  ],
  '2': [
    { value: '9', label: 'Choluteca' },
    { value: '10', label: 'Apacilagua' },
    { value: '11', label: 'Concepción de María' },
    { value: '12', label: 'Duyure' },
    { value: '13', label: 'El Corpus' },
    { value: '14', label: 'El Triunfo' },
    { value: '15', label: 'Marcovia' },
    { value: '16', label: 'Morolica' },
    { value: '17', label: 'Namasigüe' },
    { value: '18', label: 'Orocuina' },
    { value: '19', label: 'Pespire' },
    { value: '20', label: 'San Antonio de Flores' },
    { value: '21', label: 'San Isidro' },
    { value: '22', label: 'San José' },
    { value: '23', label: 'San Marcos de Colón' },
    { value: '24', label: 'Santa Ana de Yusguare' },
  ],
  '3': [
    { value: '25', label: 'Trujillo' },
    { value: '26', label: 'Balfate' },
    { value: '27', label: 'Iriona' },
    { value: '28', label: 'Limón' },
    { value: '29', label: 'Sabá' },
    { value: '30', label: 'Santa Fe' },
    { value: '31', label: 'Santa Rosa de Aguán' },
    { value: '32', label: 'Sonaguera' },
    { value: '33', label: 'Tocoa' },
    { value: '34', label: 'Bonito Oriental' },
  ],
  '4': [
    { value: '35', label: 'Comayagua' },
    { value: '36', label: 'Ajuterique' },
    { value: '37', label: 'El Rosario' },
    { value: '38', label: 'Esquías' },
    { value: '39', label: 'Humuya' },
    { value: '40', label: 'La Libertad' },
    { value: '41', label: 'Lamaní' },
    { value: '42', label: 'La Trinidad' },
    { value: '43', label: 'Lejamaní' },
    { value: '44', label: 'Meámbar' },
    { value: '45', label: 'Minas de Oro' },
    { value: '46', label: 'Ojos de Agua' },
    { value: '47', label: 'San Jerónimo' },
    { value: '48', label: 'San José de Comayagua' },
    { value: '49', label: 'San José del Potrero' },
    { value: '50', label: 'San Luis' },
    { value: '51', label: 'San Sebastián' },
    { value: '52', label: 'Siguatepeque' },
    { value: '53', label: 'Villa de San Antonio' },
    { value: '54', label: 'Las Lajas' },
    { value: '55', label: 'Taulabé' },
  ],
  '5': [
    { value: '56', label: 'Santa Rosa de Copán' },
    { value: '57', label: 'Cabañas' },
    { value: '58', label: 'Concepción' },
    { value: '59', label: 'Copan Ruinas' },
    { value: '60', label: 'Corquín' },
    { value: '61', label: 'Cucuyagua' },
    { value: '62', label: 'Dolores' },
    { value: '63', label: 'Dulce Nombre' },
    { value: '64', label: 'El Paraíso' },
    { value: '65', label: 'Florida' },
    { value: '66', label: 'La Jigua' },
    { value: '67', label: 'La Unión' },
    { value: '68', label: 'Nueva Arcadia' },
    { value: '69', label: 'San Agustín' },
    { value: '70', label: 'San Antonio' },
    { value: '71', label: 'San Jerónimo' },
    { value: '72', label: 'San José' },
    { value: '73', label: 'San Juan de Opoa' },
    { value: '74', label: 'San Nicolás' },
    { value: '75', label: 'San Pedro' },
    { value: '76', label: 'Santa Rita' },
    { value: '77', label: 'Trinidad de Copán' },
    { value: '78', label: 'Veracruz' },
  ],
  '6': [
    { value: '79', label: 'San Pedro Sula' },
    { value: '80', label: 'Choloma' },
    { value: '81', label: 'Omoa' },
    { value: '82', label: 'Pimienta' },
    { value: '83', label: 'Potrerillos' },
    { value: '84', label: 'Puerto Cortés' },
    { value: '85', label: 'San Antonio de Cortés' },
    { value: '86', label: 'San Francisco de Yojoa' },
    { value: '87', label: 'San Manuel' },
    { value: '88', label: 'Santa Cruz de Yojoa' },
    { value: '89', label: 'Villanueva' },
    { value: '90', label: 'La Lima' },
  ],
  '7': [
    { value: '91', label: 'Yuscarán' },
    { value: '92', label: 'Alauca' },
    { value: '93', label: 'Danlí' },
    { value: '94', label: 'El Paraíso' },
    { value: '95', label: 'Güinope' },
    { value: '96', label: 'Jacaleapa' },
    { value: '97', label: 'Liure' },
    { value: '98', label: 'Morocelí' },
    { value: '99', label: 'Oropolí' },
    { value: '100', label: 'Potrerillos' },
    { value: '101', label: 'San Antonio de Flores' },
    { value: '102', label: 'San Lucas' },
    { value: '103', label: 'San Matías' },
    { value: '104', label: 'Soledad' },
    { value: '105', label: 'Teupasenti' },
    { value: '106', label: 'Texiguat' },
    { value: '107', label: 'Vado Ancho' },
    { value: '108', label: 'Yauyupe' },
    { value: '109', label: 'Trojes' },
  ],
  '8': [
    { value: '110', label: 'Tegucigalpa' },
    { value: '111', label: 'Alubarén' },
    { value: '112', label: 'Cedros' },
    { value: '113', label: 'Curarén' },
    { value: '114', label: 'El Porvenir' },
    { value: '115', label: 'Guaimaca' },
    { value: '116', label: 'La Libertad' },
    { value: '117', label: 'La Venta' },
    { value: '118', label: 'Lepaterique' },
    { value: '119', label: 'Maraita' },
    { value: '120', label: 'Marale' },
    { value: '121', label: 'Nueva Armenia' },
    { value: '122', label: 'Ojojona' },
    { value: '123', label: 'Orica' },
    { value: '124', label: 'Reitoca' },
    { value: '125', label: 'Sabanagrande' },
    { value: '126', label: 'San Antonio de Oriente' },
    { value: '127', label: 'San Buenaventura' },
    { value: '128', label: 'San Ignacio' },
    { value: '129', label: 'Cantarranas' },
    { value: '130', label: 'San Miguelito' },
    { value: '131', label: 'Santa Ana' },
    { value: '132', label: 'Santa Lucía' },
    { value: '133', label: 'Talanga' },
    { value: '134', label: 'Tatumbla' },
    { value: '135', label: 'Valle de Ángeles' },
    { value: '136', label: 'Villa de San Francisco' },
    { value: '137', label: 'Vallecillo' },
  ],
  // Keep dropdown functional for other departments with placeholder capital city
  '9': [{ value: '138', label: 'Puerto Lempira' }],
  '10': [{ value: '144', label: 'La Esperanza' }],
  '11': [{ value: '161', label: 'Roatán' }],
  '12': [{ value: '165', label: 'La Paz' }],
  '13': [{ value: '185', label: 'Gracias' }],
  '14': [{ value: '214', label: 'Ocotepeque' }],
  '15': [{ value: '230', label: 'Juticalpa' }],
  '16': [{ value: '254', label: 'Santa Bárbara' }],
  '17': [{ value: '283', label: 'Nacaome' }],
  '18': [{ value: '292', label: 'Yoro' }],
};

export function UsersScreen() {
  useTheme();

  // Stats state
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    doctores: 0,
    especialistas: 0,
  });

  // Data state
  const [users, setUsers] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Pagination and filter params
  const [serverParams, setServerParams] = useState<{
    page: number;
    search: string;
    filters: Record<string, string>;
  }>({
    page: 1,
    search: '',
    filters: {},
  });

  // Modal and form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);

  // Status toggle confirmation states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [statusTargetUser, setStatusTargetUser] = useState<Usuario | null>(null);
  const [statusTargetValue, setStatusTargetValue] = useState(true);

  // Form Fields
  const [primerNombre, setPrimerNombre] = useState('');
  const [segundoNombre, setSegundoNombre] = useState('');
  const [primerApellido, setPrimerApellido] = useState('');
  const [segundoApellido, setSegundoApellido] = useState('');
  const [numeroIdentidad, setNumeroIdentidad] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [sexo, setSexo] = useState<'M' | 'F'>('M');
  const [telefono, setTelefono] = useState('');
  const [correoElectronico, setCorreoElectronico] = useState('');
  const [idDepartamento, setIdDepartamento] = useState('');
  const [idMunicipio, setIdMunicipio] = useState('');
  const [direccionLinea, setDireccionLinea] = useState('');
  const [username, setUsername] = useState('');
  const [idRol, setIdRol] = useState('4'); // Default to Doctor
  const [passwordTemporal, setPasswordTemporal] = useState('');

  const getDefaultRoleId = useCallback(() => {
    const doctorRole = roles.find((role) => role.nombre.toLowerCase() === 'doctor');
    return String(doctorRole?.id_rol ?? roles[0]?.id_rol ?? 4);
  }, [roles]);

  // Fetch stats on mount and whenever lists change
  const fetchStats = useCallback(async () => {
    try {
      const response = await userService.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStats();
  }, [fetchStats]);

  const fetchRoles = useCallback(async () => {
    try {
      const response = await roleService.getAll();
      if (response.success) {
        setRoles(response.data);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  }, []);

  useEffect(() => {
    void fetchRoles();
  }, [fetchRoles]);

  // Fetch users whenever parameters change
  const fetchUsers = useCallback(async () => {
    try {
      const rolFilter = serverParams.filters.rol === 'all' ? undefined : serverParams.filters.rol;
      const response = await userService.getAll({
        page: serverParams.page,
        limit: 10,
        nombre: serverParams.search || undefined,
        rol: rolFilter || undefined,
      });

      if (response.success) {
        setUsers(response.data.usuarios);
        setTotalRecords(response.data.total);
        setErrorMessage(null);
      } else {
        setErrorMessage(response.message);
      }
    } catch (error) {
      const err = error as Error;
      setErrorMessage(err.message || 'Error al cargar los usuarios.');
    }
  }, [serverParams]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, [fetchUsers]);

  // Handle server-side param changes from DataTable
  const handleServerParamsChange = useCallback((params: {
    page: number;
    search: string;
    filters: Record<string, string>;
  }) => {
    setServerParams(params);
  }, []);

  // Open creation or edit form
  const handleOpenForm = (user?: Usuario) => {
    setFormErrors({});
    if (user) {
      setEditingUser(user);
      setPrimerNombre(user.persona.primer_nombre);
      setSegundoNombre(user.persona.segundo_nombre || '');
      setPrimerApellido(user.persona.primer_apellido);
      setSegundoApellido(user.persona.segundo_apellido || '');
      setNumeroIdentidad(user.persona.numero_identidad);
      setFechaNacimiento(user.persona.fecha_nacimiento ? user.persona.fecha_nacimiento.split('T')[0] : '');
      setSexo(user.persona.sexo);
      setTelefono(user.persona.telefono);
      setCorreoElectronico(user.persona.correo_electronico || '');
      // Determine department ID from municipio ID mapping
      let foundDept = '8'; // default
      for (const [deptId, municipios] of Object.entries(MUNICIPIOS_DATA)) {
        if (municipios.some(m => Number(m.value) === user.persona.id_municipio)) {
          foundDept = deptId;
          break;
        }
      }
      setIdDepartamento(foundDept);
      setIdMunicipio(String(user.persona.id_municipio));
      setDireccionLinea(user.persona.direccion_linea || '');
      setUsername(user.username);
      setIdRol(String(user.id_rol));
      setPasswordTemporal('');
    } else {
      setEditingUser(null);
      setPrimerNombre('');
      setSegundoNombre('');
      setPrimerApellido('');
      setSegundoApellido('');
      setNumeroIdentidad('');
      setFechaNacimiento('');
      setSexo('M');
      setTelefono('');
      setCorreoElectronico('');
      setIdDepartamento('8'); // Francisco Morazán by default
      setIdMunicipio('110'); // Tegucigalpa by default
      setDireccionLinea('');
      setUsername('');
      setIdRol(getDefaultRoleId());
      setPasswordTemporal('');
    }
    setIsFormOpen(true);
  };

  // Handle submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitLoading(true);
    setFormErrors({});

    // Client-side validations
    const errors: Record<string, string> = {};
    if (!primerNombre.trim()) errors.primerNombre = 'El primer nombre es obligatorio';
    if (!primerApellido.trim()) errors.primerApellido = 'El primer apellido es obligatorio';
    if (!numeroIdentidad.trim() || numeroIdentidad.trim().length !== 13 || !/^\d+$/.test(numeroIdentidad)) {
      errors.numeroIdentidad = 'El número de identidad debe tener exactamente 13 dígitos numéricos';
    }
    if (!fechaNacimiento) errors.fechaNacimiento = 'La fecha de nacimiento es obligatoria';
    if (!telefono.trim()) errors.telefono = 'El teléfono es obligatorio';
    if (!username.trim()) errors.username = 'El nombre de usuario es obligatorio';
    if (!idDepartamento) errors.idDepartamento = 'El departamento es obligatorio';
    if (!idMunicipio) errors.idMunicipio = 'El municipio es obligatorio';
    if (!editingUser && (!passwordTemporal || passwordTemporal.length < 8)) {
      errors.passwordTemporal = 'La contraseña temporal es obligatoria y debe tener al menos 8 caracteres';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setIsSubmitLoading(false);
      return;
    }

    try {
      if (editingUser) {
        const payload: UpdateUsuarioInput = {
          numero_identidad: numeroIdentidad,
          primer_nombre: primerNombre,
          segundo_nombre: segundoNombre || undefined,
          primer_apellido: primerApellido,
          segundo_apellido: segundoApellido || undefined,
          fecha_nacimiento: fechaNacimiento,
          telefono,
          correo_electronico: correoElectronico || undefined,
          id_departamento: Number(idDepartamento),
          id_municipio: Number(idMunicipio),
          direccion_linea: direccionLinea || undefined,
          sexo,
          username,
          id_rol: Number(idRol),
        };
        const response = await userService.update(editingUser.id_usuario, payload);
        if (response.success) {
          setSuccessMessage('Usuario actualizado correctamente.');
          setIsFormOpen(false);
          fetchUsers();
          fetchStats();
          setTimeout(() => setSuccessMessage(null), 4000);
        } else {
          setFormErrors({ form: response.message });
        }
      } else {
        const payload: CreateUsuarioInput = {
          numero_identidad: numeroIdentidad,
          primer_nombre: primerNombre,
          segundo_nombre: segundoNombre || undefined,
          primer_apellido: primerApellido,
          segundo_apellido: segundoApellido || undefined,
          fecha_nacimiento: fechaNacimiento,
          telefono,
          correo_electronico: correoElectronico || undefined,
          id_departamento: Number(idDepartamento),
          id_municipio: Number(idMunicipio),
          direccion_linea: direccionLinea || undefined,
          sexo,
          username,
          id_rol: Number(idRol),
          password_temporal: passwordTemporal,
        };
        const response = await userService.create(payload);
        if (response.success) {
          setSuccessMessage(`Usuario creado con éxito. Credenciales temporales listas para el primer inicio.`);
          setIsFormOpen(false);
          fetchUsers();
          fetchStats();
          setTimeout(() => setSuccessMessage(null), 5000);
        } else {
          setFormErrors({ form: response.message });
        }
      }
    } catch (error) {
      const err = error as Error;
      setFormErrors({ form: err.message || 'Ocurrió un error en el servidor.' });
    } finally {
      setIsSubmitLoading(false);
    }
  };

  // Initiate status toggle
  const handleToggleStatusClick = (user: Usuario, currentVal: boolean) => {
    setStatusTargetUser(user);
    setStatusTargetValue(!currentVal);
    setConfirmOpen(true);
  };

  // Confirm status toggle
  const handleToggleStatusConfirm = async () => {
    if (!statusTargetUser) return;
    try {
      const response = await userService.updateStatus(statusTargetUser.id_usuario, statusTargetValue);
      if (response.success) {
        setSuccessMessage(`Usuario ${statusTargetValue ? 'activado' : 'desactivado'} con éxito.`);
        fetchUsers();
        fetchStats();
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(response.message);
        setTimeout(() => setErrorMessage(null), 4000);
      }
    } catch (error) {
      const err = error as Error;
      setErrorMessage(err.message || 'Error al cambiar el estado del usuario.');
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setConfirmOpen(false);
      setStatusTargetUser(null);
    }
  };

  // DataTable columns definition
  const columns = useMemo(() => [
    {
      key: 'nombre',
      label: 'Usuario',
      render: (_: unknown, row: Usuario) => {
        const initials = `${row.persona.primer_nombre.charAt(0)}${row.persona.primer_apellido.charAt(0)}`.toUpperCase();
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-on-primary)',
              fontSize: 12,
              fontWeight: 600
            }}>
              {initials}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: 13 }}>
                {row.persona.primer_nombre} {row.persona.primer_apellido}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                @{row.username}
              </span>
            </div>
          </div>
        );
      }
    },
    {
      key: 'correo',
      label: 'Correo',
      render: (_: unknown, row: Usuario) => (
        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          {row.persona.correo_electronico || 'N/A'}
        </span>
      )
    },
    {
      key: 'rol',
      label: 'Rol',
      render: (_: unknown, row: Usuario) => (
        <span style={{
          fontSize: 11,
          fontWeight: 500,
          padding: '2px 8px',
          borderRadius: 12,
          backgroundColor: 'var(--primary-light)',
          color: 'var(--primary)'
        }}>
          {row.rol.nombre}
        </span>
      )
    },
    {
      key: 'identidad',
      label: 'Identidad',
      render: (_: unknown, row: Usuario) => (
        <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: 13 }}>
          {formatIdentity(row.persona.numero_identidad)}
        </span>
      )
    },
    {
      key: 'activo',
      label: 'Estado',
      align: 'center' as const,
      render: (_: unknown, row: Usuario) => (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Toggle
            checked={row.activo}
            onChange={() => handleToggleStatusClick(row, row.activo)}
          />
        </div>
      )
    }
  ], []);

  // Actions for table rows
  const getRowActions = (row: Usuario) => [
    {
      icon: <Edit size={16} />,
      label: 'Editar',
      onClick: () => handleOpenForm(row)
    }
  ];

  const roleOptions = useMemo(() => ([
    { value: 'all', label: 'Todos los roles' },
    ...roles.map((role) => ({
      value: role.nombre,
      label: role.nombre,
    })),
  ]), [roles]);

  const formRoleOptions = useMemo(() => (
    roles.map((role) => ({
      value: String(role.id_rol),
      label: role.nombre,
    }))
  ), [roles]);

  const sexOptions = [
    { value: 'M', label: 'Masculino' },
    { value: 'F', label: 'Femenino' },
  ];

  // Filter municipios dynamically based on selected department ID
  const selectedMunicipios = useMemo(() => {
    return MUNICIPIOS_DATA[idDepartamento] || [];
  }, [idDepartamento]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Messages */}
      {errorMessage && <Alert variant="error" message={errorMessage} onClose={() => setErrorMessage(null)} />}
      {successMessage && <Alert variant="success" message={successMessage} onClose={() => setSuccessMessage(null)} />}

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <Card style={{ display: 'flex', alignItems: 'center', gap: 16, borderLeft: '4px solid var(--primary)', backgroundColor: 'var(--bg-surface)', borderTop: 'none', borderRight: 'none', borderBottom: 'none' }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 8,
            backgroundColor: 'var(--primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)'
          }}>
            <Users size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Usuarios</div>
            <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-main)', marginTop: 2 }}>{stats.total}</div>
          </div>
        </Card>

        <Card style={{ display: 'flex', alignItems: 'center', gap: 16, borderLeft: '4px solid var(--success)', backgroundColor: 'var(--bg-surface)', borderTop: 'none', borderRight: 'none', borderBottom: 'none' }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 8,
            backgroundColor: 'var(--success-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--success)'
          }}>
            <Users size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Doctores</div>
            <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-main)', marginTop: 2 }}>{stats.doctores}</div>
          </div>
        </Card>

        <Card style={{ display: 'flex', alignItems: 'center', gap: 16, borderLeft: '4px solid var(--warning)', backgroundColor: 'var(--bg-surface)', borderTop: 'none', borderRight: 'none', borderBottom: 'none' }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 8,
            backgroundColor: 'var(--warning-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--warning)'
          }}>
            <Users size={20} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Especialistas</div>
            <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-main)', marginTop: 2 }}>{stats.especialistas}</div>
          </div>
        </Card>
      </div>

      {/* Data Table */}
      <DataTable<Usuario>
        title="Gestión de Usuarios"
        description="Administra los usuarios del sistema, sus roles de seguridad y accesos a módulos."
        columns={columns}
        data={users}
        searchable={true}
        searchPlaceholder="Buscar por nombre o apellido..."
        filters={[
          {
            key: 'rol',
            placeholder: 'Filtrar por Rol',
            options: roleOptions,
          }
        ]}
        pageSize={10}
        totalRecords={totalRecords}
        isServerSide={true}
        onServerParamsChange={handleServerParamsChange}
        primaryAction={{
          label: 'Nuevo Usuario',
          icon: <UserPlus size={16} />,
          onClick: () => handleOpenForm()
        }}
        rowActions={getRowActions}
        getRowKey={(row) => String(row.id_usuario)}
        emptyMessage="No se encontraron usuarios que coincidan con la búsqueda."
      />

      {/* Confirmation Modal for status updates */}
      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleToggleStatusConfirm}
        variant={statusTargetValue ? 'info' : 'danger'}
        title={statusTargetValue ? 'Activar Usuario' : 'Desactivar Usuario'}
        description={
          statusTargetValue
            ? `¿Está seguro de activar al usuario ${statusTargetUser?.persona.primer_nombre} ${statusTargetUser?.persona.primer_apellido}? Se habilitará de inmediato su acceso al sistema.`
            : `¿Está seguro de desactivar al usuario ${statusTargetUser?.persona.primer_nombre} ${statusTargetUser?.persona.primer_apellido}? Perderá el acceso de inmediato.`
        }
        confirmLabel={statusTargetValue ? 'Activar' : 'Desactivar'}
        cancelLabel="Cancelar"
      />

      {/* Add / Edit Form Modal */}
      {isFormOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(32, 63, 73, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 16,
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            borderRadius: 12,
            width: '100%',
            maxWidth: 760,
            boxShadow: 'var(--shadow-lg)',
            maxHeight: '90vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid var(--border-color)'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--bg-app)',
              borderTopLeftRadius: 11,
              borderTopRightRadius: 11
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <UserPlus size={18} style={{ color: 'var(--primary)' }} />
                <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: 16, fontWeight: 600 }}>
                  {editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
                </h3>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  fontSize: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 4
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {formErrors.form && (
                <Alert variant="error" message={formErrors.form} />
              )}

              {/* Section 1: Información Personal */}
              <FormSection icon={<User size={18} />} title="Información Personal" columns={2}>
                <Input
                  label="Primer Nombre"
                  badge="required"
                  placeholder="Ej: Juan"
                  value={primerNombre}
                  onChange={(e) => setPrimerNombre(e.target.value)}
                  error={formErrors.primerNombre}
                />
                <Input
                  label="Segundo Nombre"
                  badge="optional"
                  placeholder="Ej: Carlos"
                  value={segundoNombre}
                  onChange={(e) => setSegundoNombre(e.target.value)}
                />
                <Input
                  label="Primer Apellido"
                  badge="required"
                  placeholder="Ej: Pérez"
                  value={primerApellido}
                  onChange={(e) => setPrimerApellido(e.target.value)}
                  error={formErrors.primerApellido}
                />
                <Input
                  label="Segundo Apellido"
                  badge="optional"
                  placeholder="Ej: López"
                  value={segundoApellido}
                  onChange={(e) => setSegundoApellido(e.target.value)}
                />
                <Input
                  label="Número de Identidad"
                  badge="required"
                  placeholder="Sin guiones, ej: 0801199012345"
                  value={numeroIdentidad}
                  onChange={(e) => setNumeroIdentidad(e.target.value)}
                  error={formErrors.numeroIdentidad}
                  maxLength={13}
                />
                <Input
                  label="Fecha de Nacimiento"
                  badge="required"
                  type="date"
                  value={fechaNacimiento}
                  onChange={(e) => setFechaNacimiento(e.target.value)}
                  error={formErrors.fechaNacimiento}
                />
                <Select
                  label="Sexo"
                  badge="required"
                  options={sexOptions}
                  value={sexo}
                  onChange={(v) => setSexo(v as 'M' | 'F')}
                />
              </FormSection>

              {/* Section 2: Contacto y Ubicación */}
              <FormSection icon={<MapPin size={18} />} title="Contacto y Ubicación" columns={2}>
                <Input
                  label="Teléfono"
                  badge="required"
                  placeholder="Ej: 99999999"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  error={formErrors.telefono}
                />
                <Input
                  label="Correo Electrónico"
                  badge="optional"
                  type="email"
                  placeholder="Ej: correo@ejemplo.com"
                  value={correoElectronico}
                  onChange={(e) => setCorreoElectronico(e.target.value)}
                />
                <Select
                  label="Departamento"
                  badge="required"
                  options={DEPARTAMENTOS_DATA}
                  value={idDepartamento}
                  onChange={(v) => {
                    setIdDepartamento(v);
                    setIdMunicipio(''); // Clear municipality when department changes
                  }}
                  placeholder="Seleccione..."
                />
                <Select
                  label="Ciudad / Municipio"
                  badge="required"
                  options={selectedMunicipios}
                  value={idMunicipio}
                  onChange={(v) => setIdMunicipio(v)}
                  disabled={!idDepartamento}
                  placeholder={idDepartamento ? "Seleccione..." : "Primero elija departamento"}
                  error={formErrors.idMunicipio}
                />
                <FullWidthField>
                  <Input
                    label="Dirección"
                    badge="optional"
                    placeholder="Dirección exacta de residencia..."
                    value={direccionLinea}
                    onChange={(e) => setDireccionLinea(e.target.value)}
                  />
                </FullWidthField>
              </FormSection>

              {/* Section 3: Seguridad y Acceso */}
              <FormSection icon={<Shield size={18} />} title="Seguridad y Acceso" columns={2}>
                <Input
                  label="Nombre de Usuario (Username)"
                  badge="required"
                  placeholder="Ej: jperez"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  error={formErrors.username}
                />
                <Select
                  label="Rol del Usuario"
                  badge="required"
                  options={formRoleOptions}
                  value={idRol}
                  onChange={(v) => setIdRol(v)}
                />

                {!editingUser && (
                  <>
                    <FullWidthField>
                      <PasswordInput
                        label="Contraseña Temporal"
                        badge="required"
                        placeholder="Mínimo 8 caracteres"
                        value={passwordTemporal}
                        onChange={(e) => setPasswordTemporal(e.target.value)}
                        error={formErrors.passwordTemporal}
                      />
                    </FullWidthField>
                    <FullWidthField>
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        background: 'var(--info-bg)',
                        borderRadius: 8,
                        padding: '10px 12px',
                        border: '1px solid var(--info)'
                      }}>
                        <Info size={16} style={{ color: 'var(--info)', flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 12, color: 'var(--info)', lineHeight: 1.4 }}>
                          El usuario deberá cambiar su contraseña de seguridad obligatoriamente en su primer inicio de sesión.
                        </span>
                      </div>
                    </FullWidthField>
                  </>
                )}
              </FormSection>

              {/* Modal Footer / Action buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 12,
                borderTop: '1px solid var(--border-color)',
                paddingTop: 16,
                marginTop: 8
              }}>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  disabled={isSubmitLoading}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  loading={isSubmitLoading}
                >
                  {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
