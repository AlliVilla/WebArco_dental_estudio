import { Injectable, NotFoundException, ConflictException, UnauthorizedException, BadRequestException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { verifyToken } from '../utils/jwt/verifyToken';
import { Prisma } from '@prisma/client';
import { hashPassword } from '../utils/bcrypt/hashPassword';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { UpdateStatusUsuarioDto } from './dto/update-status-usuario.dto';
import { comparePassword } from '../utils/bcrypt/comparePassword';
import { UpdateProfileDto } from './dto/perfil/update-profile.dto';
import { ChangePasswordDto } from './dto/perfil/change-password.dto';
import { getPasswordRuleErrors } from '../utils/password/password-rules';

type UsuarioFilters = {
  nombre?: string;
  correo?: string;
  rol?: string;
};

type PrismaExecutor = PrismaService | Prisma.TransactionClient;

@Injectable()
export class UsuarioService {
  constructor(private prisma: PrismaService) {}

  async validateByLogin(token: string) {
    try {
      const payload = verifyToken(token);

      const usuario = await this.prisma.usuario.findUnique({
        where: { id_usuario: payload.sub },
        include: {
          persona: true,
          rol: true,
        },
      });

      if (!usuario || !usuario.activo) {
        throw new UnauthorizedException('Usuario no encontrado o inactivo');
      }

      return {
        id_usuario: usuario.id_usuario,
        username: usuario.username,
        id_rol: usuario.id_rol,
        id_persona: usuario.id_persona,
        persona: usuario.persona,
        rol: usuario.rol,
        activo: usuario.activo,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  async getUserById(id_usuario: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id_usuario },
      include: {
        persona: true,
        rol: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario con ID ${id_usuario} no encontrado`);
    }

    return usuario;
  }

  async getUserByUsername(username: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { username },
      include: {
        persona: true,
        rol: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException(`Usuario ${username} no encontrado`);
    }

    return usuario;
  }

  async getAllUsers( page: number = 1, limit: number = 10, filters: UsuarioFilters = {}) {
    const skip = (page - 1) * limit;
    const where: Prisma.UsuarioWhereInput = {};
    const personaWhere: Prisma.PersonaWhereInput = {};

    const nombre = filters.nombre?.trim();
    const correo = filters.correo?.trim();
    const rol = filters.rol?.trim();

    if (nombre) {
      personaWhere.OR = [
        { primer_nombre: { contains: nombre, mode: 'insensitive' } },
        { segundo_nombre: { contains: nombre, mode: 'insensitive' } },
        { primer_apellido: { contains: nombre, mode: 'insensitive' } },
        { segundo_apellido: { contains: nombre, mode: 'insensitive' } },
      ];
    }

    if (correo) {
      personaWhere.correo_electronico = {
        contains: correo,
        mode: 'insensitive',
      };
    }

    if (Object.keys(personaWhere).length > 0) {
      where.persona = {
        is: personaWhere,
      };
    }

    if (rol) {
      where.rol = {
        is: {
          nombre: {
            equals: rol,
            mode: 'insensitive',
          },
        },
      };
    }

    const [usuarios, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where,
        skip,
        take: limit,
        include: {
          persona: true,
          rol: true,
        },
        orderBy: {
          id_usuario: 'asc',
        },
      }),
      this.prisma.usuario.count({ where }),
    ]);

    return {
      usuarios: usuarios.map((usuario) => this.removePassword(usuario)),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async getStats() {
    const [total, doctores, especialistas] = await Promise.all([
      this.prisma.usuario.count(),
      this.prisma.usuario.count({
        where: {
          rol: {
            is: {
              nombre: {
                equals: 'Doctor',
                mode: 'insensitive',
              },
            },
          },
        },
      }),
      this.prisma.usuario.count({
        where: {
          rol: {
            is: {
              nombre: {
                equals: 'Especialista',
                mode: 'insensitive',
              },
            },
          },
        },
      }),
    ]);

    return {
      total,
      doctores,
      especialistas,
    };
  }

  async updateAuthenticatedProfile(
    id_usuario: number,
    updateProfileDto: UpdateProfileDto,
  ) {
    const usuarioExists = await this.prisma.usuario.findUnique({
      where: { id_usuario },
      include: {
        persona: true,
        rol: true,
      },
    });

    if (!usuarioExists || !usuarioExists.activo) {
      throw new UnauthorizedException('Usuario no encontrado o inactivo.');
    }

    if (updateProfileDto.username !== undefined) {
      await this.validateUniqueUsername(updateProfileDto.username, id_usuario);
    }

    if (updateProfileDto.email !== undefined) {
      await this.validateUniquePersonaFields(
        {
          correo_electronico: updateProfileDto.email,
        },
        usuarioExists.persona.id_persona,
      );
    }

    const usuarioData: Prisma.UsuarioUpdateInput = {};
    const personaData: Prisma.PersonaUpdateInput = {};

    if (updateProfileDto.username !== undefined) {
      usuarioData.username = updateProfileDto.username;
    }

    if (updateProfileDto.email !== undefined) {
      personaData.correo_electronico = updateProfileDto.email;
    }

    if (updateProfileDto.nombre_completo !== undefined) {
      const nombreSeparado = this.splitNombreCompleto(
        updateProfileDto.nombre_completo,
      );

      personaData.primer_nombre = nombreSeparado.primer_nombre;
      personaData.segundo_nombre = nombreSeparado.segundo_nombre;
      personaData.primer_apellido = nombreSeparado.primer_apellido;
      personaData.segundo_apellido = nombreSeparado.segundo_apellido;
    }

    const usuario = await this.prisma.usuario.update({
      where: { id_usuario },
      data: {
        ...usuarioData,
        persona:
          Object.keys(personaData).length > 0
            ? {
                update: personaData,
              }
            : undefined,
      },
      include: {
        persona: true,
        rol: true,
      },
    });

    return this.mapProfile(usuario);
  }

  async changeAuthenticatedPassword(
    id_usuario: number,
    changePasswordDto: ChangePasswordDto,
  ) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id_usuario },
      select: {
        id_usuario: true,
        password: true,
        activo: true,
      },
    });

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Usuario no encontrado o inactivo.');
    }

    const isCurrentPasswordValid = await comparePassword(
      changePasswordDto.currentPassword,
      usuario.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('La contraseña actual es incorrecta.');
    }

    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      throw new UnprocessableEntityException({
        message: 'La nueva contraseña no pudo ser validada.',
        errors: [
          {
            rule: 'password_confirmation',
            message: 'La nueva contraseña y la confirmación no coinciden.',
          },
        ],
      });
    }

    const passwordErrors = getPasswordRuleErrors(changePasswordDto.newPassword);

    if (passwordErrors.length > 0) {
      throw new UnprocessableEntityException({
        message: 'La nueva contraseña no cumple las reglas de seguridad.',
        errors: passwordErrors,
      });
    }

    const isSamePassword = await comparePassword(
      changePasswordDto.newPassword,
      usuario.password,
    );

    if (isSamePassword) {
      throw new UnprocessableEntityException({
        message: 'La nueva contraseña no pudo ser validada.',
        errors: [
          {
            rule: 'same_password',
            message: 'La nueva contraseña no puede ser igual a la actual.',
          },
        ],
      });
    }

    const hashedPassword = await hashPassword(changePasswordDto.newPassword);

    await this.prisma.usuario.update({
      where: { id_usuario },
      data: {
        password: hashedPassword,
        must_change_password: false,
      },
    });

    return true;
  }

  async create(createUsuarioDto: CreateUsuarioDto) {
    const fechaNacimiento = this.parseFechaNacimiento(
      createUsuarioDto.fecha_nacimiento,
    );

    const hashedPassword = await hashPassword(
      createUsuarioDto.password_temporal,
    );

    try {
      const usuario = await this.prisma.$transaction(async (tx) => {
        await this.validateRolExists(createUsuarioDto.id_rol, tx);

        await this.validateMunicipioDepartamento(
          createUsuarioDto.id_departamento,
          createUsuarioDto.id_municipio,
          tx,
        );

        await this.validateUniqueUsername(
          createUsuarioDto.username,
          undefined,
          tx,
        );

        await this.validateUniquePersonaFields(
          {
            numero_identidad: createUsuarioDto.numero_identidad,
            correo_electronico: createUsuarioDto.correo_electronico,
            telefono: createUsuarioDto.telefono,
          },
          undefined,
          tx,
        );

        return tx.usuario.create({
          data: {
            username: createUsuarioDto.username,
            password: hashedPassword,
            firma: createUsuarioDto.firma ?? null,
            activo: true,
            must_change_password: true,

            rol: {
              connect: {
                id_rol: createUsuarioDto.id_rol,
              },
            },

            persona: {
              create: {
                numero_identidad: createUsuarioDto.numero_identidad,
                primer_nombre: createUsuarioDto.primer_nombre,
                segundo_nombre: createUsuarioDto.segundo_nombre ?? null,
                primer_apellido: createUsuarioDto.primer_apellido,
                segundo_apellido: createUsuarioDto.segundo_apellido ?? null,
                fecha_nacimiento: fechaNacimiento,
                telefono: createUsuarioDto.telefono,
                correo_electronico: createUsuarioDto.correo_electronico ?? null,
                id_municipio: createUsuarioDto.id_municipio,
                direccion_linea: createUsuarioDto.direccion_linea ?? null,
                sexo: createUsuarioDto.sexo,
              },
            },
          },
          include: {
            persona: true,
            rol: true,
          },
        });
      });

      return this.removePassword(usuario);
    } catch (error) {
      this.handlePrismaUniqueError(error);
      throw error;
    }
  }

  async update(id: number, updateUsuarioDto: UpdateUsuarioDto) {
    const usuarioExists = await this.prisma.usuario.findUnique({
      where: { id_usuario: id },
      include: {
        persona: {
          include: {
            municipio: true,
          },
        },
      },
    });

    if (!usuarioExists) {
      throw new NotFoundException(`No se encontró el usuario con id ${id}`);
    }

    if (updateUsuarioDto.id_rol !== undefined) {
      await this.validateRolExists(updateUsuarioDto.id_rol);
    }

    const idDepartamento =
      updateUsuarioDto.id_departamento ??
      usuarioExists.persona.municipio.id_departamento;

    const idMunicipio =
      updateUsuarioDto.id_municipio ?? usuarioExists.persona.id_municipio;

    await this.validateMunicipioDepartamento(idDepartamento, idMunicipio);

    if (updateUsuarioDto.username !== undefined) {
      await this.validateUniqueUsername(updateUsuarioDto.username, id);
    }

    await this.validateUniquePersonaFields(
      {
        numero_identidad: updateUsuarioDto.numero_identidad,
        correo_electronico: updateUsuarioDto.correo_electronico,
        telefono: updateUsuarioDto.telefono,
      },
      usuarioExists.persona.id_persona,
    );

    const usuarioData: Prisma.UsuarioUpdateInput = {};
    const personaData: Prisma.PersonaUpdateInput = {};

    if (updateUsuarioDto.username !== undefined) {
      usuarioData.username = updateUsuarioDto.username;
    }

    if (updateUsuarioDto.id_rol !== undefined) {
      usuarioData.rol = {
        connect: {
          id_rol: updateUsuarioDto.id_rol,
        },
      };
    }

    if (updateUsuarioDto.firma !== undefined) {
      usuarioData.firma = updateUsuarioDto.firma;
    }

    if (updateUsuarioDto.numero_identidad !== undefined) {
      personaData.numero_identidad = updateUsuarioDto.numero_identidad;
    }

    if (updateUsuarioDto.primer_nombre !== undefined) {
      personaData.primer_nombre = updateUsuarioDto.primer_nombre;
    }

    if (updateUsuarioDto.segundo_nombre !== undefined) {
      personaData.segundo_nombre = updateUsuarioDto.segundo_nombre;
    }

    if (updateUsuarioDto.primer_apellido !== undefined) {
      personaData.primer_apellido = updateUsuarioDto.primer_apellido;
    }

    if (updateUsuarioDto.segundo_apellido !== undefined) {
      personaData.segundo_apellido = updateUsuarioDto.segundo_apellido;
    }

    if (updateUsuarioDto.fecha_nacimiento !== undefined) {
      personaData.fecha_nacimiento = this.parseFechaNacimiento(
        updateUsuarioDto.fecha_nacimiento,
      );
    }

    if (updateUsuarioDto.telefono !== undefined) {
      personaData.telefono = updateUsuarioDto.telefono;
    }

    if (updateUsuarioDto.correo_electronico !== undefined) {
      personaData.correo_electronico =
        updateUsuarioDto.correo_electronico ?? null;
    }

    if (updateUsuarioDto.id_municipio !== undefined) {
      personaData.municipio = {
        connect: {
          id_municipio: updateUsuarioDto.id_municipio,
        },
      };
    }

    if (updateUsuarioDto.direccion_linea !== undefined) {
      personaData.direccion_linea = updateUsuarioDto.direccion_linea;
    }

    if (updateUsuarioDto.sexo !== undefined) {
      personaData.sexo = updateUsuarioDto.sexo;
    }

    const usuario = await this.prisma.usuario.update({
      where: { id_usuario: id },
      data: {
        ...usuarioData,
        persona:
          Object.keys(personaData).length > 0
            ? {
                update: personaData,
              }
            : undefined,
      },
      include: {
        persona: true,
        rol: true,
      },
    });

    return this.removePassword(usuario);
  }

  async updateStatus(id: number, updateStatusDto: UpdateStatusUsuarioDto) {
    const usuarioExists = await this.prisma.usuario.findUnique({
      where: { id_usuario: id },
    });

    if (!usuarioExists) {
      throw new NotFoundException(`No se encontró el usuario con id ${id}`);
    }

    const usuario = await this.prisma.usuario.update({
      where: { id_usuario: id },
      data: {
        activo: updateStatusDto.activo,
      },
      select: {
        id_usuario: true,
        username: true,
        activo: true,
        must_change_password: true,
      },
    });

    return usuario;
  }

  private async validateRolExists( id_rol: number, prismaClient: PrismaExecutor = this.prisma ) {
    const rol = await prismaClient.rol.findUnique({
      where: { id_rol },
    });

    if (!rol) {
      throw new BadRequestException(`No existe un rol con id ${id_rol}`);
    }

    return rol;
  }

  private async validateMunicipioDepartamento(
    id_departamento: number,
    id_municipio: number,
    prismaClient: PrismaExecutor = this.prisma,
  ) {
    const departamento = await prismaClient.departamento.findUnique({
      where: { id_departamento },
    });

    if (!departamento) {
      throw new BadRequestException(
        `No existe un departamento con id ${id_departamento}`,
      );
    }

    const municipio = await prismaClient.municipio.findFirst({
      where: {
        id_municipio,
        id_departamento,
      },
    });

    if (!municipio) {
      throw new BadRequestException(
        'El municipio seleccionado no pertenece al departamento indicado.',
      );
    }

    return municipio;
  }

  private async validateUniqueUsername(
    username: string,
    ignoreUserId?: number,
    prismaClient: PrismaExecutor = this.prisma,
  ) {
    const existingUsuario = await prismaClient.usuario.findUnique({
      where: { username },
    });

    if (existingUsuario && existingUsuario.id_usuario !== ignoreUserId) {
      throw new ConflictException(
        `Ya existe un usuario registrado con el username ${username}`,
      );
    }
  }

  private async validateUniquePersonaFields(
    fields: {
      numero_identidad?: string;
      correo_electronico?: string | null;
      telefono?: string;
    },
    ignorePersonaId?: number,
    prismaClient: PrismaExecutor = this.prisma,
  ) {
    if (fields.numero_identidad) {
      const existingPersonaByIdentity = await prismaClient.persona.findUnique({
        where: {
          numero_identidad: fields.numero_identidad,
        },
      });

      if (
        existingPersonaByIdentity &&
        existingPersonaByIdentity.id_persona !== ignorePersonaId
      ) {
        throw new ConflictException(
          `Ya existe una persona registrada con el número de identidad ${fields.numero_identidad}`,
        );
      }
    }

    if (fields.correo_electronico) {
      const existingPersonaByEmail = await prismaClient.persona.findUnique({
        where: {
          correo_electronico: fields.correo_electronico,
        },
      });

      if (
        existingPersonaByEmail &&
        existingPersonaByEmail.id_persona !== ignorePersonaId
      ) {
        throw new ConflictException(
          `Ya existe una persona registrada con el correo electrónico ${fields.correo_electronico}`,
        );
      }
    }

    if (fields.telefono) {
      const existingPersonaByPhone = await prismaClient.persona.findFirst({
        where: {
          telefono: fields.telefono,
        },
      });

      if (
        existingPersonaByPhone &&
        existingPersonaByPhone.id_persona !== ignorePersonaId
      ) {
        throw new ConflictException(
          `Ya existe una persona registrada con el teléfono ${fields.telefono}`,
        );
      }
    }
  }

  private handlePrismaUniqueError(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const target = Array.isArray(error.meta?.target)
        ? error.meta.target.join(', ')
        : 'campo único';

      throw new ConflictException(
        `Ya existe un registro con el mismo valor para: ${target}`,
      );
    }
  }

  private parseFechaNacimiento(fecha: string) {
    const parsedDate = new Date(fecha);

    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException(
        'La fecha de nacimiento debe tener un formato válido.',
      );
    }

    return parsedDate;
  }

  private mapProfile(usuario: any) {
    return {
      id_usuario: usuario.id_usuario,
      username: usuario.username,
      email: usuario.persona?.correo_electronico ?? null,
      nombre: this.buildNombreCompleto(usuario.persona),
      rol: usuario.rol?.nombre ?? null,
    };
  }

  private buildNombreCompleto(persona: any) {
    return [
      persona?.primer_nombre,
      persona?.segundo_nombre,
      persona?.primer_apellido,
      persona?.segundo_apellido,
    ]
      .filter(Boolean)
      .join(' ');
  }

  private splitNombreCompleto(nombreCompleto: string) {
    const partes = nombreCompleto.trim().split(/\s+/);

    if (partes.length < 2) {
      throw new UnprocessableEntityException({
        message: 'El nombre completo no pudo ser validado.',
        errors: [
          {
            rule: 'full_name',
            message: 'Debe ingresar al menos un nombre y un apellido.',
          },
        ],
      });
    }

    if (partes.length === 2) {
      return {
        primer_nombre: partes[0],
        segundo_nombre: null,
        primer_apellido: partes[1],
        segundo_apellido: null,
      };
    }

    if (partes.length === 3) {
      return {
        primer_nombre: partes[0],
        segundo_nombre: null,
        primer_apellido: partes[1],
        segundo_apellido: partes[2],
      };
    }

    return {
      primer_nombre: partes[0],
      segundo_nombre: partes.slice(1, -2).join(' '),
      primer_apellido: partes[partes.length - 2],
      segundo_apellido: partes[partes.length - 1],
    };
  }

  private removePassword(usuario: any) {
    if (!usuario) return usuario;

    const { password, ...safeUsuario } = usuario;

    return safeUsuario;
  }
}

