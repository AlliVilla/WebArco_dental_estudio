import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, useTheme } from '../../../context';
import { DeleteRoleModal } from './DeleteRoleModal';
import { RoleCardItem } from './RoleCardItem';
import { RoleFormModal } from './RoleFormModal';
import { roleService } from '../services/roleService';
import type { CreateRoleInput, RoleSummary, UpdateRoleInput } from '../types';

export interface RolesScreenProps {}

export function RolesScreen(_: RolesScreenProps) {
  useTheme();
  const navigate = useNavigate();

  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<RoleSummary | null>(null);

  useEffect(() => {
    void loadRoles();
  }, []);

  async function loadRoles() {
    setLoading(true);
    try {
      const response = await roleService.getAll();

      if (response.success) {
        setRoles(response.data);
        setErrorMessage(null);
      } else {
        setErrorMessage(response.message);
      }
    } catch (error) {
      const err = error as Error;
      setErrorMessage(err.message || 'Error al cargar los roles.');
    }

    setLoading(false);
  }

  async function handleCreateRole(data: CreateRoleInput) {
    setIsSaving(true);
    try {
      const response = await roleService.create(data);

      if (response.success) {
        setRoles((currentRoles) => [response.data, ...currentRoles]);
        setSuccessMessage(response.message);
        setErrorMessage(null);
        setIsCreateModalOpen(false);
        window.setTimeout(() => setSuccessMessage(null), 3500);
      } else {
        setErrorMessage(response.message);
        window.setTimeout(() => setErrorMessage(null), 3500);
      }
    } catch (error) {
      const err = error as Error;
      setErrorMessage(err.message || 'Error al crear el rol.');
      window.setTimeout(() => setErrorMessage(null), 3500);
    }

    setIsSaving(false);
  }

  async function handleUpdateRole(data: UpdateRoleInput) {
    if (!selectedRole) {
      return;
    }

    setIsSaving(true);
    try {
      const response = await roleService.update(selectedRole.id_rol, data);

      if (response.success) {
        const updatedRole = {
          ...response.data,
          usuariosActivos: selectedRole.usuariosActivos,
        };

        setRoles((currentRoles) =>
          currentRoles.map((role) => (role.id_rol === selectedRole.id_rol ? updatedRole : role)),
        );
        setSuccessMessage(response.message);
        setErrorMessage(null);
        setIsEditModalOpen(false);
        setSelectedRole(null);
        window.setTimeout(() => setSuccessMessage(null), 3500);
      } else {
        setErrorMessage(response.message);
        window.setTimeout(() => setErrorMessage(null), 3500);
      }
    } catch (error) {
      const err = error as Error;
      setErrorMessage(err.message || 'Error al actualizar el rol.');
      window.setTimeout(() => setErrorMessage(null), 3500);
    }

    setIsSaving(false);
  }

  async function handleDeleteRole() {
    if (!selectedRole) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await roleService.remove(selectedRole.id_rol);

      if (response.success) {
        setRoles((currentRoles) => currentRoles.filter((role) => role.id_rol !== selectedRole.id_rol));
        setSuccessMessage(response.message);
        setErrorMessage(null);
        window.setTimeout(() => setSuccessMessage(null), 3500);
      } else {
        setErrorMessage(response.message);
        window.setTimeout(() => setErrorMessage(null), 3500);
      }
    } catch (error) {
      const err = error as Error;
      setErrorMessage(err.message || 'Error al eliminar el rol.');
      window.setTimeout(() => setErrorMessage(null), 3500);
    }

    setIsDeleting(false);
    setIsDeleteModalOpen(false);
    setSelectedRole(null);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {errorMessage ? (
        <Alert variant="error" message={errorMessage} onClose={() => setErrorMessage(null)} />
      ) : null}
      {successMessage ? (
        <Alert variant="success" message={successMessage} onClose={() => setSuccessMessage(null)} />
      ) : null}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2 style={{ margin: 0, color: 'var(--arco-navy)', fontSize: 18, fontWeight: 600 }}>
            Gestión de Roles
          </h2>
          <p style={{ margin: 0, color: 'var(--arco-gray-500)', fontSize: 13, lineHeight: '19px' }}>
            Crea, edita o elimina los roles del sistema y configura sus privilegios de acceso.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => setIsCreateModalOpen(true)}
          style={{ minWidth: 132 }}
        >
          <Plus size={16} />
          Nuevo Rol
        </Button>
      </div>

      {loading ? (
        <div
          style={{
            border: '1px solid var(--arco-gray-300)',
            borderRadius: 12,
            background: 'var(--card)',
            padding: 24,
            color: 'var(--arco-gray-500)',
            fontSize: 14,
          }}
        >
          Cargando roles...
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: 18,
            alignItems: 'stretch',
          }}
        >
          {roles.map((role) => (
            <RoleCardItem
              key={role.id_rol}
              role={role}
              onDelete={(currentRole) => {
                setSelectedRole(currentRole);
                setIsDeleteModalOpen(true);
              }}
              onEdit={(currentRole) => {
                setSelectedRole(currentRole);
                setIsEditModalOpen(true);
              }}
              onPrivileges={(currentRole) => {
                navigate(`/users/roles/permisos?rol=${currentRole.id_rol}`);
              }}
            />
          ))}
        </div>
      )}

      <RoleFormModal
        open={isCreateModalOpen}
        loading={isSaving}
        mode="create"
        onClose={() => {
          if (!isSaving) {
            setIsCreateModalOpen(false);
          }
        }}
        onSubmit={handleCreateRole}
      />

      <RoleFormModal
        open={isEditModalOpen}
        loading={isSaving}
        mode="edit"
        role={selectedRole}
        onClose={() => {
          if (!isSaving) {
            setIsEditModalOpen(false);
            setSelectedRole(null);
          }
        }}
        onSubmit={handleUpdateRole}
      />

      <DeleteRoleModal
        open={isDeleteModalOpen}
        loading={isDeleting}
        role={selectedRole}
        onClose={() => {
          if (!isDeleting) {
            setIsDeleteModalOpen(false);
            setSelectedRole(null);
          }
        }}
        onConfirm={handleDeleteRole}
      />
    </div>
  );
}
