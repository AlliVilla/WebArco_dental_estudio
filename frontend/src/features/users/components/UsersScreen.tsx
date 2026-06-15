import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  Users,
  UserPlus,
  Info,
  Edit,
  User,
  MapPin,
  Shield,
  X,
} from "lucide-react";
import {
  DataTable,
  ConfirmModal,
  FormSection,
  FullWidthField,
} from "../../../components";
import {
  Button,
  Input,
  PasswordInput,
  Select,
  Alert,
  Toggle,
  useTheme,
} from "../../../context";
import { roleService } from "../services/roleService";
import { userService } from "../services/userService";
import { formatIdentity } from "../../../utils/formatters";
import { useResponsive } from "../../../hooks/useWindowWidth";
import type {
  RoleSummary,
  Usuario,
  CreateUsuarioInput,
  UpdateUsuarioInput,
  UserStats,
} from "../types";

const DEPARTAMENTOS_DATA = [
  { value: "1", label: "Atlántida" },
  { value: "2", label: "Choluteca" },
  { value: "3", label: "Colón" },
  { value: "4", label: "Comayagua" },
  { value: "5", label: "Copán" },
  { value: "6", label: "Cortés" },
  { value: "7", label: "El Paraíso" },
  { value: "8", label: "Francisco Morazán" },
  { value: "9", label: "Gracias a Dios" },
  { value: "10", label: "Intibucá" },
  { value: "11", label: "Islas de la Bahía" },
  { value: "12", label: "La Paz" },
  { value: "13", label: "Lempira" },
  { value: "14", label: "Ocotepeque" },
  { value: "15", label: "Olancho" },
  { value: "16", label: "Santa Bárbara" },
  { value: "17", label: "Valle" },
  { value: "18", label: "Yoro" },
];

const MUNICIPIOS_DATA: Record<string, { value: string; label: string }[]> = {
  "1": [
    { value: "1", label: "La Ceiba" },
    { value: "2", label: "El Porvenir" },
    { value: "3", label: "Tela" },
    { value: "4", label: "Jutiapa" },
    { value: "5", label: "La Masica" },
    { value: "6", label: "San Francisco" },
    { value: "7", label: "Arizona" },
    { value: "8", label: "Esparta" },
  ],
  "2": [
    { value: "9", label: "Choluteca" },
    { value: "10", label: "Apacilagua" },
    { value: "11", label: "Concepción de María" },
    { value: "12", label: "Duyure" },
    { value: "13", label: "El Corpus" },
    { value: "14", label: "El Triunfo" },
    { value: "15", label: "Marcovia" },
    { value: "16", label: "Morolica" },
    { value: "17", label: "Namasigüe" },
    { value: "18", label: "Orocuina" },
    { value: "19", label: "Pespire" },
    { value: "20", label: "San Antonio de Flores" },
    { value: "21", label: "San Isidro" },
    { value: "22", label: "San José" },
    { value: "23", label: "San Marcos de Colón" },
    { value: "24", label: "Santa Ana de Yusguare" },
  ],
  "3": [
    { value: "25", label: "Trujillo" },
    { value: "26", label: "Balfate" },
    { value: "27", label: "Iriona" },
    { value: "28", label: "Limón" },
    { value: "29", label: "Sabá" },
    { value: "30", label: "Santa Fe" },
    { value: "31", label: "Santa Rosa de Aguán" },
    { value: "32", label: "Sonaguera" },
    { value: "33", label: "Tocoa" },
    { value: "34", label: "Bonito Oriental" },
  ],
  "4": [
    { value: "35", label: "Comayagua" },
    { value: "36", label: "Ajuterique" },
    { value: "37", label: "El Rosario" },
    { value: "38", label: "Esquías" },
    { value: "39", label: "Humuya" },
    { value: "40", label: "La Libertad" },
    { value: "41", label: "Lamaní" },
    { value: "42", label: "La Trinidad" },
    { value: "43", label: "Lejamaní" },
    { value: "44", label: "Meámbar" },
    { value: "45", label: "Minas de Oro" },
    { value: "46", label: "Ojos de Agua" },
    { value: "47", label: "San Jerónimo" },
    { value: "48", label: "San José de Comayagua" },
    { value: "49", label: "San José del Potrero" },
    { value: "50", label: "San Luis" },
    { value: "51", label: "San Sebastián" },
    { value: "52", label: "Siguatepeque" },
    { value: "53", label: "Villa de San Antonio" },
    { value: "54", label: "Las Lajas" },
    { value: "55", label: "Taulabé" },
  ],
  "5": [
    { value: "56", label: "Santa Rosa de Copán" },
    { value: "57", label: "Cabañas" },
    { value: "58", label: "Concepción" },
    { value: "59", label: "Copan Ruinas" },
    { value: "60", label: "Corquín" },
    { value: "61", label: "Cucuyagua" },
    { value: "62", label: "Dolores" },
    { value: "63", label: "Dulce Nombre" },
    { value: "64", label: "El Paraíso" },
    { value: "65", label: "Florida" },
    { value: "66", label: "La Jigua" },
    { value: "67", label: "La Unión" },
    { value: "68", label: "Nueva Arcadia" },
    { value: "69", label: "San Agustín" },
    { value: "70", label: "San Antonio" },
    { value: "71", label: "San Jerónimo" },
    { value: "72", label: "San José" },
    { value: "73", label: "San Juan de Opoa" },
    { value: "74", label: "San Nicolás" },
    { value: "75", label: "San Pedro" },
    { value: "76", label: "Santa Rita" },
    { value: "77", label: "Trinidad de Copán" },
    { value: "78", label: "Veracruz" },
  ],
  "6": [
    { value: "79", label: "San Pedro Sula" },
    { value: "80", label: "Choloma" },
    { value: "81", label: "Omoa" },
    { value: "82", label: "Pimienta" },
    { value: "83", label: "Potrerillos" },
    { value: "84", label: "Puerto Cortés" },
    { value: "85", label: "San Antonio de Cortés" },
    { value: "86", label: "San Francisco de Yojoa" },
    { value: "87", label: "San Manuel" },
    { value: "88", label: "Santa Cruz de Yojoa" },
    { value: "89", label: "Villanueva" },
    { value: "90", label: "La Lima" },
  ],
  "7": [
    { value: "91", label: "Yuscarán" },
    { value: "92", label: "Alauca" },
    { value: "93", label: "Danlí" },
    { value: "94", label: "El Paraíso" },
    { value: "95", label: "Güinope" },
    { value: "96", label: "Jacaleapa" },
    { value: "97", label: "Liure" },
    { value: "98", label: "Morocelí" },
    { value: "99", label: "Oropolí" },
    { value: "100", label: "Potrerillos" },
    { value: "101", label: "San Antonio de Flores" },
    { value: "102", label: "San Lucas" },
    { value: "103", label: "San Matías" },
    { value: "104", label: "Soledad" },
    { value: "105", label: "Teupasenti" },
    { value: "106", label: "Texiguat" },
    { value: "107", label: "Vado Ancho" },
    { value: "108", label: "Yauyupe" },
    { value: "109", label: "Trojes" },
  ],
  "8": [
    { value: "110", label: "Tegucigalpa" },
    { value: "111", label: "Alubarén" },
    { value: "112", label: "Cedros" },
    { value: "113", label: "Curarén" },
    { value: "114", label: "El Porvenir" },
    { value: "115", label: "Guaimaca" },
    { value: "116", label: "La Libertad" },
    { value: "117", label: "La Venta" },
    { value: "118", label: "Lepaterique" },
    { value: "119", label: "Maraita" },
    { value: "120", label: "Marale" },
    { value: "121", label: "Nueva Armenia" },
    { value: "122", label: "Ojojona" },
    { value: "123", label: "Orica" },
    { value: "124", label: "Reitoca" },
    { value: "125", label: "Sabanagrande" },
    { value: "126", label: "San Antonio de Oriente" },
    { value: "127", label: "San Buenaventura" },
    { value: "128", label: "San Ignacio" },
    { value: "129", label: "Cantarranas" },
    { value: "130", label: "San Miguelito" },
    { value: "131", label: "Santa Ana" },
    { value: "132", label: "Santa Lucía" },
    { value: "133", label: "Talanga" },
    { value: "134", label: "Tatumbla" },
    { value: "135", label: "Valle de Ángeles" },
    { value: "136", label: "Villa de San Francisco" },
    { value: "137", label: "Vallecillo" },
  ],
  "9": [{ value: "138", label: "Puerto Lempira" }],
  "10": [{ value: "144", label: "La Esperanza" }],
  "11": [{ value: "161", label: "Roatán" }],
  "12": [{ value: "165", label: "La Paz" }],
  "13": [{ value: "185", label: "Gracias" }],
  "14": [{ value: "214", label: "Ocotepeque" }],
  "15": [{ value: "230", label: "Juticalpa" }],
  "16": [{ value: "254", label: "Santa Bárbara" }],
  "17": [{ value: "283", label: "Nacaome" }],
  "18": [{ value: "292", label: "Yoro" }],
};

// ── Drawer ────────────────────────────────────────────────────────────────────
function StatsDrawer({
  open,
  title,
  subtitle,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { isMobile, width: w } = useResponsive();
  const panelStyle: React.CSSProperties = isMobile
    ? {
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        maxHeight: "85vh",
        background: "#fff",
        borderRadius: "20px 20px 0 0",
        boxShadow: "0 -4px 24px rgba(0,0,0,0.15)",
        zIndex: 201,
        display: "flex",
        flexDirection: "column",
        transform: open ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.3s ease",
      }
    : {
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: Math.min(w - 32, 420),
        background: "#fff",
        boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
        zIndex: 201,
        display: "flex",
        flexDirection: "column",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.25s ease",
      };
  return (
    <>
      {open && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 200,
          }}
        />
      )}
      <div style={panelStyle}>
        {isMobile && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "12px 0 4px",
            }}
          >
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 9999,
                background: "#D3D7DA",
              }}
            />
          </div>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            padding: isMobile ? "12px 20px 16px" : "20px 24px",
            borderBottom: "1px solid #D3D7DA",
            flexShrink: 0,
          }}
        >
          <div>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#203F49",
                margin: 0,
              }}
            >
              {title}
            </h3>
            <p style={{ fontSize: 13, color: "#888F94", margin: "4px 0 0" }}>
              {subtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: 6,
              border: "none",
              background: "none",
              cursor: "pointer",
              color: "#888F94",
              display: "flex",
              borderRadius: 6,
            }}
          >
            <X size={20} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {children}
        </div>
      </div>
    </>
  );
}

// ── Card de usuario para móvil ────────────────────────────────────────────────
function UserCard({
  user,
  onEdit,
  onToggle,
}: {
  user: Usuario;
  onEdit: () => void;
  onToggle: () => void;
}) {
  const initials = `${user.persona.primer_nombre.charAt(
    0,
  )}${user.persona.primer_apellido.charAt(0)}`.toUpperCase();
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        border: "1px solid #D3D7DA",
        padding: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 12,
          gap: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <p
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#203F49",
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user.persona.primer_nombre} {user.persona.primer_apellido}
            </p>
            <p style={{ fontSize: 12, color: "#888F94", margin: "2px 0 0" }}>
              @{user.username}
            </p>
          </div>
        </div>
        <button
          onClick={onEdit}
          style={{
            padding: 6,
            borderRadius: 8,
            border: "none",
            background: "#F8F9FA",
            cursor: "pointer",
            color: "#203F49",
            display: "flex",
            flexShrink: 0,
          }}
        >
          <Edit size={15} />
        </button>
      </div>
      <div style={{ borderTop: "1px solid #F8F9FA", paddingTop: 4 }}>
        <div
          style={{
            padding: "7px 0",
            borderBottom: "1px solid #F8F9FA",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 12, color: "#888F94" }}>Correo</span>
          <span style={{ fontSize: 13, color: "#203F49" }}>
            {user.persona.correo_electronico || "N/A"}
          </span>
        </div>
        <div
          style={{
            padding: "7px 0",
            borderBottom: "1px solid #F8F9FA",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 12, color: "#888F94" }}>Rol</span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              padding: "2px 8px",
              borderRadius: 12,
              background: "var(--primary-light)",
              color: "var(--primary)",
            }}
          >
            {user.rol.nombre}
          </span>
        </div>
        <div
          style={{
            padding: "7px 0",
            borderBottom: "1px solid #F8F9FA",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 12, color: "#888F94" }}>Identidad</span>
          <span
            style={{ fontSize: 12, color: "#203F49", fontFamily: "monospace" }}
          >
            {formatIdentity(user.persona.numero_identidad)}
          </span>
        </div>
        <div
          style={{
            padding: "7px 0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 12, color: "#888F94" }}>Estado</span>
          <Toggle checked={user.activo} onChange={onToggle} />
        </div>
      </div>
    </div>
  );
}

export function UsersScreen() {
  useTheme();
  const { isMobile } = useResponsive();

  const [stats, setStats] = useState<UserStats>({
    total: 0,
    doctores: 0,
    especialistas: 0,
  });
  const [openDrawer, setOpenDrawer] = useState<
    "total" | "doctores" | "especialistas" | null
  >(null);
  const [users, setUsers] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // Fix: useRef para timers en vez de setTimeout sueltos
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [serverParams, setServerParams] = useState<{
    page: number;
    search: string;
    filters: Record<string, string>;
  }>({ page: 1, search: "", filters: {} });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function scrollModalToTop() {
    setTimeout(() => {
      if (modalContainerRef.current) modalContainerRef.current.scrollTop = 0;
    }, 0);
  }

  function scrollToFirstError(errors: Record<string, string>) {
    setTimeout(() => {
      if (!modalContainerRef.current || !formRef.current) return;
      // Si hay error de servidor (form), ir al top donde está el Alert
      if (errors.form) {
        modalContainerRef.current.scrollTop = 0;
        return;
      }
      // Para errores de campo: buscar el primer elemento con data-field-error
      const firstError =
        formRef.current.querySelector<HTMLElement>("[data-field-error]");
      if (firstError) {
        const containerRect = modalContainerRef.current.getBoundingClientRect();
        const errorRect = firstError.getBoundingClientRect();
        const relativeTop =
          errorRect.top -
          containerRect.top +
          modalContainerRef.current.scrollTop -
          80;
        modalContainerRef.current.scrollTop = Math.max(0, relativeTop);
      }
    }, 0);
  }
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [statusTargetUser, setStatusTargetUser] = useState<Usuario | null>(
    null,
  );
  const [statusTargetValue, setStatusTargetValue] = useState(true);

  // Form fields
  const [primerNombre, setPrimerNombre] = useState("");
  const [segundoNombre, setSegundoNombre] = useState("");
  const [primerApellido, setPrimerApellido] = useState("");
  const [segundoApellido, setSegundoApellido] = useState("");
  const [numeroIdentidad, setNumeroIdentidad] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [sexo, setSexo] = useState<"M" | "F">("M");
  const [telefono, setTelefono] = useState("");
  const [correoElectronico, setCorreoElectronico] = useState("");
  const [idDepartamento, setIdDepartamento] = useState("");
  const [idMunicipio, setIdMunicipio] = useState("");
  const [direccionLinea, setDireccionLinea] = useState("");
  const [username, setUsername] = useState("");
  const [idRol, setIdRol] = useState("4");
  const [passwordTemporal, setPasswordTemporal] = useState("");

  // Fix: cleanup de timers al desmontar
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  function addTimer(fn: () => void, ms: number) {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
  }

  const getDefaultRoleId = useCallback(() => {
    const doctorRole = roles.find((r) => r.nombre.toLowerCase() === "doctor");
    return String(doctorRole?.id_rol ?? roles[0]?.id_rol ?? 4);
  }, [roles]);

  // Fix: ref para evitar setState en componente desmontado
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await userService.getStats();
      if (mountedRef.current && res.success) setStats(res.data);
    } catch {
      /* silencioso */
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const res = await roleService.getAll();
      if (mountedRef.current && res.success) setRoles(res.data);
    } catch {
      /* silencioso */
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await userService.getAll();
      if (!mountedRef.current) return;
      if (res.success) {
        setUsers(res.data.usuarios);
        setTotalRecords(res.data.total);
        setErrorMessage(null);
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: unknown) {
      if (mountedRef.current)
        setErrorMessage(
          err instanceof Error ? err.message : "Error al cargar los usuarios.",
        );
    }
  }, []);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);
  useEffect(() => {
    void fetchRoles();
  }, [fetchRoles]);
  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const handleServerParamsChange = useCallback(
    (params: {
      page: number;
      search: string;
      filters: Record<string, string>;
    }) => {
      setServerParams(params);
    },
    [],
  );

  const handleOpenForm = (user?: Usuario) => {
    setFormErrors({});
    if (user) {
      setEditingUser(user);
      setPrimerNombre(user.persona.primer_nombre);
      setSegundoNombre(user.persona.segundo_nombre || "");
      setPrimerApellido(user.persona.primer_apellido);
      setSegundoApellido(user.persona.segundo_apellido || "");
      setNumeroIdentidad(user.persona.numero_identidad);
      setFechaNacimiento(
        user.persona.fecha_nacimiento
          ? user.persona.fecha_nacimiento.split("T")[0]
          : "",
      );
      setSexo(user.persona.sexo);
      setTelefono(user.persona.telefono);
      setCorreoElectronico(user.persona.correo_electronico || "");
      let foundDept = "8";
      for (const [deptId, municipios] of Object.entries(MUNICIPIOS_DATA)) {
        if (
          municipios.some((m) => Number(m.value) === user.persona.id_municipio)
        ) {
          foundDept = deptId;
          break;
        }
      }
      setIdDepartamento(foundDept);
      setIdMunicipio(String(user.persona.id_municipio));
      setDireccionLinea(user.persona.direccion_linea || "");
      setUsername(user.username);
      setIdRol(String(user.id_rol));
      setPasswordTemporal("");
    } else {
      setEditingUser(null);
      setPrimerNombre("");
      setSegundoNombre("");
      setPrimerApellido("");
      setSegundoApellido("");
      setNumeroIdentidad("");
      setFechaNacimiento("");
      setSexo("M");
      setTelefono("");
      setCorreoElectronico("");
      setIdDepartamento("8");
      setIdMunicipio("110");
      setDireccionLinea("");
      setUsername("");
      setIdRol(getDefaultRoleId());
      setPasswordTemporal("");
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitLoading(true);
    setFormErrors({});

    const errors: Record<string, string> = {};
    if (!primerNombre.trim())
      errors.primerNombre = "El primer nombre es obligatorio";
    if (!primerApellido.trim())
      errors.primerApellido = "El primer apellido es obligatorio";
    if (
      !numeroIdentidad.trim() ||
      numeroIdentidad.trim().length !== 13 ||
      !/^\d+$/.test(numeroIdentidad)
    )
      errors.numeroIdentidad =
        "El número de identidad debe tener exactamente 13 dígitos numéricos";
    if (!fechaNacimiento)
      errors.fechaNacimiento = "La fecha de nacimiento es obligatoria";
    if (!telefono.trim()) errors.telefono = "El teléfono es obligatorio";
    if (!correoElectronico.trim())
      errors.correoElectronico = "El correo electrónico es obligatorio";
    if (!username.trim())
      errors.username = "El nombre de usuario es obligatorio";
    if (!idDepartamento)
      errors.idDepartamento = "El departamento es obligatorio";
    if (!idMunicipio) errors.idMunicipio = "El municipio es obligatorio";
    if (!editingUser && (!passwordTemporal || passwordTemporal.length < 8))
      errors.passwordTemporal =
        "La contraseña temporal es obligatoria y debe tener al menos 8 caracteres";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      scrollToFirstError(errors);
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
        const res = await userService.update(editingUser.id_usuario, payload);
        if (res.success) {
          setSuccessMessage("Usuario actualizado correctamente.");
          setIsFormOpen(false);
          void fetchUsers();
          void fetchStats();
          addTimer(() => setSuccessMessage(null), 4000);
        } else {
          setFormErrors({ form: res.message });
          scrollToFirstError({ form: res.message });
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
        const res = await userService.create(payload);
        if (res.success) {
          setSuccessMessage(
            "Usuario creado con éxito. Credenciales temporales listas para el primer inicio.",
          );
          setIsFormOpen(false);
          void fetchUsers();
          void fetchStats();
          addTimer(() => setSuccessMessage(null), 5000);
        } else {
          setFormErrors({ form: res.message });
          scrollToFirstError({ form: res.message });
        }
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Ocurrió un error en el servidor.";
      setFormErrors({ form: msg });
      scrollToFirstError({ form: msg });
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleToggleStatusClick = (user: Usuario, currentVal: boolean) => {
    setStatusTargetUser(user);
    setStatusTargetValue(!currentVal);
    setConfirmOpen(true);
  };

  const handleToggleStatusConfirm = async () => {
    if (!statusTargetUser) return;
    try {
      const res = await userService.updateStatus(
        statusTargetUser.id_usuario,
        statusTargetValue,
      );
      if (res.success) {
        setSuccessMessage(
          `Usuario ${statusTargetValue ? "activado" : "desactivado"} con éxito.`,
        );
        void fetchUsers();
        void fetchStats();
        addTimer(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(res.message);
        addTimer(() => setErrorMessage(null), 4000);
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Error al cambiar el estado del usuario.",
      );
      addTimer(() => setErrorMessage(null), 4000);
    } finally {
      setConfirmOpen(false);
      setStatusTargetUser(null);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: "nombre",
        label: "Usuario",
        render: (_: unknown, row: Usuario) => {
          const initials = `${row.persona.primer_nombre.charAt(
            0,
          )}${row.persona.primer_apellido.charAt(0)}`.toUpperCase();
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  backgroundColor: "var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-on-primary)",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {initials}
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    fontWeight: 500,
                    color: "var(--text-main)",
                    fontSize: 13,
                  }}
                >
                  {row.persona.primer_nombre} {row.persona.primer_apellido}
                </span>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  @{row.username}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        key: "correo",
        label: "Correo",
        render: (_: unknown, row: Usuario) => (
          <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
            {row.persona.correo_electronico || "N/A"}
          </span>
        ),
      },
      {
        key: "rol",
        label: "Rol",
        render: (_: unknown, row: Usuario) => (
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              padding: "2px 8px",
              borderRadius: 12,
              backgroundColor: "var(--primary-light)",
              color: "var(--primary)",
            }}
          >
            {row.rol.nombre}
          </span>
        ),
      },
      {
        key: "identidad",
        label: "Identidad",
        render: (_: unknown, row: Usuario) => (
          <span
            style={{
              color: "var(--text-muted)",
              fontFamily: "monospace",
              fontSize: 13,
            }}
          >
            {formatIdentity(row.persona.numero_identidad)}
          </span>
        ),
      },
      {
        key: "activo",
        label: "Estado",
        align: "center" as const,
        render: (_: unknown, row: Usuario) => (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Toggle
              checked={row.activo}
              onChange={() => handleToggleStatusClick(row, row.activo)}
            />
          </div>
        ),
      },
    ],
    [],
  );

  const getRowActions = (row: Usuario) => [
    {
      icon: <Edit size={16} />,
      label: "Editar",
      onClick: () => handleOpenForm(row),
    },
  ];

  const roleOptions = useMemo(
    () => [
      { value: "all", label: "Todos los roles" },
      ...roles.map((r) => ({ value: r.nombre, label: r.nombre })),
    ],
    [roles],
  );

  const formRoleOptions = useMemo(
    () => roles.map((r) => ({ value: String(r.id_rol), label: r.nombre })),
    [roles],
  );
  const sexOptions = [
    { value: "M", label: "Masculino" },
    { value: "F", label: "Femenino" },
  ];
  const selectedMunicipios = useMemo(
    () => MUNICIPIOS_DATA[idDepartamento] || [],
    [idDepartamento],
  );

  // Búsqueda local para vista móvil (misma lógica que serverParams)
  const [mobileSearch, setMobileSearch] = useState("");
  const [mobileFilterRol, setMobileFilterRol] = useState("");
  const normalize = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const filteredUsers = useMemo(
    () =>
      users.filter((u) => {
        const matchRol = !mobileFilterRol || u.rol.nombre === mobileFilterRol;
        const searchStr = mobileSearch.trim();
        if (!searchStr) return matchRol;
        const searchWords = normalize(searchStr).split(/\s+/).filter(Boolean);
        const fullName = normalize(
          `${u.persona.primer_nombre} ${u.persona.segundo_nombre || ""} ${u.persona.primer_apellido} ${u.persona.segundo_apellido || ""} ${u.username}`,
        );
        const matchSearch = searchWords.every((word) =>
          fullName.includes(word),
        );
        return matchSearch && matchRol;
      }),
    [users, mobileSearch, mobileFilterRol],
  );

  const filteredUsersDesktop = useMemo(
    () =>
      users.filter((u) => {
        const rolFilter = serverParams.filters.rol;
        const matchRol =
          !rolFilter || rolFilter === "all" || u.rol.nombre === rolFilter;
        const searchStr = serverParams.search.trim();
        if (!searchStr) return matchRol;
        const searchWords = normalize(searchStr).split(/\s+/).filter(Boolean);
        const fullName = normalize(
          `${u.persona.primer_nombre} ${u.persona.segundo_nombre || ""} ${u.persona.primer_apellido} ${u.persona.segundo_apellido || ""} ${u.username}`,
        );
        const matchSearch = searchWords.every((word) =>
          fullName.includes(word),
        );
        return matchRol && matchSearch;
      }),
    [users, serverParams.filters.rol, serverParams.search],
  );

  const paginatedUsersDesktop = useMemo(() => {
    const startIndex = (serverParams.page - 1) * 10;
    return filteredUsersDesktop.slice(startIndex, startIndex + 10);
  }, [filteredUsersDesktop, serverParams.page]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: isMobile ? 16 : 24,
      }}
    >
      {errorMessage && (
        <Alert
          variant="error"
          message={errorMessage}
          onClose={() => setErrorMessage(null)}
        />
      )}
      {successMessage && (
        <Alert
          variant="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)",
          gap: isMobile ? 10 : 16,
        }}
      >
        {[
          {
            key: "total" as const,
            label: "Total Usuarios",
            value: stats.total,
            color: "var(--primary)",
            bg: "var(--primary-light)",
          },
          {
            key: "doctores" as const,
            label: "Doctores",
            value: stats.doctores,
            color: "var(--success)",
            bg: "var(--success-bg)",
          },
          {
            key: "especialistas" as const,
            label: "Especialistas",
            value: stats.especialistas,
            color: "var(--warning)",
            bg: "var(--warning-bg)",
          },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setOpenDrawer(s.key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              borderLeft: `4px solid ${s.color}`,
              borderTop: "none",
              borderRight: "none",
              borderBottom: "none",
              background: "var(--bg-surface)",
              borderRadius: 8,
              padding: 16,
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
              transition: "box-shadow 0.15s, opacity 0.15s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)";
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: s.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: s.color,
                flexShrink: 0,
              }}
            >
              <Users size={18} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontSize: isMobile ? 20 : 24,
                  fontWeight: 600,
                  color: "var(--text-main)",
                  marginTop: 2,
                }}
              >
                {s.value}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Móvil: cards / Tablet+Desktop: DataTable */}
      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Búsqueda + Nuevo */}
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={mobileSearch}
              onChange={(e) => setMobileSearch(e.target.value)}
              placeholder="Buscar usuario..."
              style={{
                flex: 1,
                height: 42,
                padding: "0 12px",
                border: "1px solid #D3D7DA",
                borderRadius: 8,
                background: "#F5F7FA",
                fontSize: 13,
                color: "#203F49",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <Button
              variant="primary"
              onClick={() => handleOpenForm()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexShrink: 0,
              }}
            >
              <UserPlus size={15} /> Nuevo
            </Button>
          </div>
          {/* Filtro por rol */}
          <select
            value={mobileFilterRol}
            onChange={(e) => setMobileFilterRol(e.target.value)}
            style={{
              width: "100%",
              height: 42,
              padding: "0 10px",
              border: "1px solid #D3D7DA",
              borderRadius: 8,
              background: "#fff",
              fontSize: 13,
              color: mobileFilterRol ? "#203F49" : "#888F94",
              outline: "none",
            }}
          >
            <option value="">Todos los roles</option>
            {roles.map((r) => (
              <option key={r.id_rol} value={r.nombre}>
                {r.nombre}
              </option>
            ))}
          </select>
          {filteredUsers.map((u) => (
            <UserCard
              key={u.id_usuario}
              user={u}
              onEdit={() => handleOpenForm(u)}
              onToggle={() => handleToggleStatusClick(u, u.activo)}
            />
          ))}
        </div>
      ) : (
        <DataTable<Usuario>
          title="Gestión de Usuarios"
          description="Administra los usuarios del sistema, sus roles de seguridad y accesos a módulos."
          columns={columns}
          data={paginatedUsersDesktop}
          searchable
          searchPlaceholder="Buscar por nombre o apellido..."
          filters={[
            {
              key: "rol",
              placeholder: "Filtrar por Rol",
              options: roleOptions,
            },
          ]}
          pageSize={10}
          totalRecords={filteredUsersDesktop.length}
          isServerSide
          onServerParamsChange={handleServerParamsChange}
          primaryAction={{
            label: "Nuevo Usuario",
            icon: <UserPlus size={16} />,
            onClick: () => handleOpenForm(),
          }}
          rowActions={getRowActions}
          getRowKey={(row) => String(row.id_usuario)}
          emptyMessage="No se encontraron usuarios que coincidan con la búsqueda."
        />
      )}

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleToggleStatusConfirm}
        variant={statusTargetValue ? "info" : "danger"}
        title={statusTargetValue ? "Activar Usuario" : "Desactivar Usuario"}
        description={
          statusTargetValue
            ? `¿Está seguro de activar al usuario ${statusTargetUser?.persona.primer_nombre} ${statusTargetUser?.persona.primer_apellido}? Se habilitará de inmediato su acceso al sistema.`
            : `¿Está seguro de desactivar al usuario ${statusTargetUser?.persona.primer_nombre} ${statusTargetUser?.persona.primer_apellido}? Perderá el acceso de inmediato.`
        }
        confirmLabel={statusTargetValue ? "Activar" : "Desactivar"}
        cancelLabel="Cancelar"
      />

      {/* Modal crear/editar */}
      {isFormOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(32,63,73,0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: isMobile ? "flex-end" : "center",
            justifyContent: "center",
            zIndex: 200,
            padding: isMobile ? 0 : 16,
          }}
        >
          <div
            ref={modalContainerRef}
            style={{
              background: "var(--bg-surface)",
              borderRadius: isMobile ? "16px 16px 0 0" : 12,
              width: "100%",
              maxWidth: isMobile ? "100%" : 760,
              boxShadow: "0 24px 64px rgba(0,0,0,0.24)",
              maxHeight: isMobile ? "92vh" : "90vh",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              border: "1px solid var(--border-color)",
            }}
          >
            {/* Handle en móvil */}
            {isMobile && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: "12px 0 4px",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 4,
                    borderRadius: 9999,
                    background: "#D3D7DA",
                  }}
                />
              </div>
            )}
            {/* Header */}
            <div
              style={{
                padding: isMobile ? "12px 20px 16px" : "16px 24px",
                borderBottom: "1px solid var(--border-color)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "var(--bg-app)",
                borderTopLeftRadius: isMobile ? 16 : 11,
                borderTopRightRadius: isMobile ? 16 : 11,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <UserPlus size={18} style={{ color: "var(--primary)" }} />
                <h3
                  style={{
                    margin: 0,
                    color: "var(--text-main)",
                    fontSize: 16,
                    fontWeight: 600,
                  }}
                >
                  {editingUser ? "Editar Usuario" : "Crear Nuevo Usuario"}
                </h3>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  fontSize: 20,
                  display: "flex",
                  alignItems: "center",
                  padding: 4,
                }}
              >
                ×
              </button>
            </div>

            {/* Form */}
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              style={{
                padding: isMobile ? "16px 16px" : 24,
                display: "flex",
                flexDirection: "column",
                gap: 20,
              }}
            >
              {formErrors.form && (
                <Alert variant="error" message={formErrors.form} />
              )}

              <FormSection
                icon={<User size={18} />}
                title="Información Personal"
                columns={isMobile ? 1 : 2}
              >
                <div
                  {...(formErrors.primerNombre
                    ? { "data-field-error": true }
                    : {})}
                >
                  <Input
                    label="Primer Nombre"
                    badge="required"
                    placeholder="Ej: Juan"
                    value={primerNombre}
                    onChange={(e) => setPrimerNombre(e.target.value)}
                    error={formErrors.primerNombre}
                  />
                </div>
                <Input
                  label="Segundo Nombre"
                  badge="optional"
                  placeholder="Ej: Carlos"
                  value={segundoNombre}
                  onChange={(e) => setSegundoNombre(e.target.value)}
                />
                <div
                  {...(formErrors.primerApellido
                    ? { "data-field-error": true }
                    : {})}
                >
                  <Input
                    label="Primer Apellido"
                    badge="required"
                    placeholder="Ej: Pérez"
                    value={primerApellido}
                    onChange={(e) => setPrimerApellido(e.target.value)}
                    error={formErrors.primerApellido}
                  />
                </div>
                <Input
                  label="Segundo Apellido"
                  badge="optional"
                  placeholder="Ej: López"
                  value={segundoApellido}
                  onChange={(e) => setSegundoApellido(e.target.value)}
                />
                <div
                  {...(formErrors.numeroIdentidad
                    ? { "data-field-error": true }
                    : {})}
                >
                  <Input
                    label="Número de Identidad"
                    badge="required"
                    placeholder="Sin guiones, ej: 0801199012345"
                    value={numeroIdentidad}
                    onChange={(e) => setNumeroIdentidad(e.target.value)}
                    error={formErrors.numeroIdentidad}
                    maxLength={13}
                  />
                </div>
                <div
                  {...(formErrors.fechaNacimiento
                    ? { "data-field-error": true }
                    : {})}
                >
                  <Input
                    label="Fecha de Nacimiento"
                    badge="required"
                    type="date"
                    value={fechaNacimiento}
                    onChange={(e) => setFechaNacimiento(e.target.value)}
                    error={formErrors.fechaNacimiento}
                  />
                </div>
                <Select
                  label="Sexo"
                  badge="required"
                  options={sexOptions}
                  value={sexo}
                  onChange={(v) => setSexo(v as "M" | "F")}
                />
              </FormSection>

              <FormSection
                icon={<MapPin size={18} />}
                title="Contacto y Ubicación"
                columns={isMobile ? 1 : 2}
              >
                <div
                  {...(formErrors.telefono ? { "data-field-error": true } : {})}
                >
                  <Input
                    label="Teléfono"
                    badge="required"
                    placeholder="Ej: 99999999"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    error={formErrors.telefono}
                  />
                </div>
                <div
                  {...(formErrors.correoElectronico
                    ? { "data-field-error": true }
                    : {})}
                >
                  <Input
                    label="Correo Electrónico"
                    badge="required"
                    type="email"
                    placeholder="Ej: correo@ejemplo.com"
                    value={correoElectronico}
                    onChange={(e) => setCorreoElectronico(e.target.value)}
                    error={formErrors.correoElectronico}
                  />
                </div>
                <Select
                  label="Departamento"
                  badge="required"
                  options={DEPARTAMENTOS_DATA}
                  value={idDepartamento}
                  onChange={(v) => {
                    setIdDepartamento(v);
                    setIdMunicipio("");
                  }}
                  placeholder="Seleccione..."
                />
                <div
                  {...(formErrors.idMunicipio
                    ? { "data-field-error": true }
                    : {})}
                >
                  <Select
                    label="Ciudad / Municipio"
                    badge="required"
                    options={selectedMunicipios}
                    value={idMunicipio}
                    onChange={(v) => setIdMunicipio(v)}
                    disabled={!idDepartamento}
                    placeholder={
                      idDepartamento
                        ? "Seleccione..."
                        : "Primero elija departamento"
                    }
                    error={formErrors.idMunicipio}
                  />
                </div>
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

              <FormSection
                icon={<Shield size={18} />}
                title="Seguridad y Acceso"
                columns={isMobile ? 1 : 2}
              >
                <div
                  {...(formErrors.username ? { "data-field-error": true } : {})}
                >
                  <Input
                    label="Nombre de Usuario (Username)"
                    badge="required"
                    placeholder="Ej: jperez"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    error={formErrors.username}
                  />
                </div>
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
                      <div
                        {...(formErrors.passwordTemporal
                          ? { "data-field-error": true }
                          : {})}
                      >
                        <PasswordInput
                          label="Contraseña Temporal"
                          badge="required"
                          placeholder="Mínimo 8 caracteres"
                          value={passwordTemporal}
                          onChange={(e) => setPasswordTemporal(e.target.value)}
                          error={formErrors.passwordTemporal}
                        />
                      </div>
                    </FullWidthField>
                    <FullWidthField>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                          background: "var(--info-bg)",
                          borderRadius: 8,
                          padding: "10px 12px",
                          border: "1px solid var(--info)",
                        }}
                      >
                        <Info
                          size={16}
                          style={{
                            color: "var(--info)",
                            flexShrink: 0,
                            marginTop: 2,
                          }}
                        />
                        <span
                          style={{
                            fontSize: 12,
                            color: "var(--info)",
                            lineHeight: 1.4,
                          }}
                        >
                          El usuario deberá cambiar su contraseña de seguridad
                          obligatoriamente en su primer inicio de sesión.
                        </span>
                      </div>
                    </FullWidthField>
                  </>
                )}
              </FormSection>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 12,
                  borderTop: "1px solid var(--border-color)",
                  paddingTop: 16,
                  marginTop: 8,
                }}
              >
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
                  {editingUser ? "Guardar Cambios" : "Crear Usuario"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer: Total Usuarios */}
      <StatsDrawer
        open={openDrawer === "total"}
        title="Total de Usuarios"
        subtitle="Todos los usuarios registrados en el sistema"
        onClose={() => setOpenDrawer(null)}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {users.map((u) => {
            const initials = `${u.persona.primer_nombre.charAt(
              0,
            )}${u.persona.primer_apellido.charAt(0)}`.toUpperCase();
            return (
              <div
                key={u.id_usuario}
                style={{
                  padding: 14,
                  borderRadius: 10,
                  border: "1px solid #D3D7DA",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#203F49",
                      margin: 0,
                    }}
                  >
                    {u.persona.primer_nombre} {u.persona.primer_apellido}
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: "#888F94",
                      margin: "2px 0 0",
                    }}
                  >
                    @{u.username}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    padding: "2px 8px",
                    borderRadius: 12,
                    background: "var(--primary-light)",
                    color: "var(--primary)",
                    flexShrink: 0,
                  }}
                >
                  {u.rol.nombre}
                </span>
              </div>
            );
          })}
          {users.length === 0 && (
            <p
              style={{
                textAlign: "center",
                color: "#888F94",
                fontSize: 14,
                padding: 24,
              }}
            >
              No hay usuarios registrados.
            </p>
          )}
        </div>
      </StatsDrawer>

      {/* Drawer: Doctores */}
      <StatsDrawer
        open={openDrawer === "doctores"}
        title="Doctores"
        subtitle="Usuarios con rol de Doctor"
        onClose={() => setOpenDrawer(null)}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {users
            .filter((u) => u.rol.nombre.toLowerCase() === "doctor")
            .map((u) => {
              const initials = `${u.persona.primer_nombre.charAt(
                0,
              )}${u.persona.primer_apellido.charAt(0)}`.toUpperCase();
              return (
                <div
                  key={u.id_usuario}
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    border: "1px solid #D3D7DA",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "var(--success)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#203F49",
                        margin: 0,
                      }}
                    >
                      {u.persona.primer_nombre} {u.persona.primer_apellido}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: "#888F94",
                        margin: "2px 0 0",
                      }}
                    >
                      @{u.username} ·{" "}
                      {u.persona.correo_electronico || "Sin correo"}
                    </p>
                  </div>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: u.activo ? "var(--success)" : "#D3D7DA",
                      flexShrink: 0,
                    }}
                    title={u.activo ? "Activo" : "Inactivo"}
                  />
                </div>
              );
            })}
          {users.filter((u) => u.rol.nombre.toLowerCase() === "doctor")
            .length === 0 && (
            <p
              style={{
                textAlign: "center",
                color: "#888F94",
                fontSize: 14,
                padding: 24,
              }}
            >
              No hay doctores registrados.
            </p>
          )}
        </div>
      </StatsDrawer>

      {/* Drawer: Especialistas */}
      <StatsDrawer
        open={openDrawer === "especialistas"}
        title="Especialistas"
        subtitle="Usuarios con rol de Especialista"
        onClose={() => setOpenDrawer(null)}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {users
            .filter((u) => u.rol.nombre.toLowerCase() === "especialista")
            .map((u) => {
              const initials = `${u.persona.primer_nombre.charAt(
                0,
              )}${u.persona.primer_apellido.charAt(0)}`.toUpperCase();
              return (
                <div
                  key={u.id_usuario}
                  style={{
                    padding: 14,
                    borderRadius: 10,
                    border: "1px solid #D3D7DA",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "var(--warning)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 600,
                      flexShrink: 0,
                    }}
                  >
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#203F49",
                        margin: 0,
                      }}
                    >
                      {u.persona.primer_nombre} {u.persona.primer_apellido}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: "#888F94",
                        margin: "2px 0 0",
                      }}
                    >
                      @{u.username} ·{" "}
                      {u.persona.correo_electronico || "Sin correo"}
                    </p>
                  </div>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: u.activo ? "var(--success)" : "#D3D7DA",
                      flexShrink: 0,
                    }}
                    title={u.activo ? "Activo" : "Inactivo"}
                  />
                </div>
              );
            })}
          {users.filter((u) => u.rol.nombre.toLowerCase() === "especialista")
            .length === 0 && (
            <p
              style={{
                textAlign: "center",
                color: "#888F94",
                fontSize: 14,
                padding: 24,
              }}
            >
              No hay especialistas registrados.
            </p>
          )}
        </div>
      </StatsDrawer>
    </div>
  );
}
