export const PERMISOS = {
  USUARIOS_VER: 'usuarios.ver',
  USUARIOS_CREAR: 'usuarios.crear',
  USUARIOS_EDITAR: 'usuarios.editar',
  USUARIOS_DESACTIVAR: 'usuarios.desactivar',

  ROLES_VER: 'roles.ver',
  ROLES_ADMINISTRAR: 'roles.administrar',

  MODULOS_VER: 'modulos.ver',
  MODULOS_ADMINISTRAR: 'modulos.administrar',

  EMPRESA_CONFIGURAR: 'empresa.configurar',

  CATALOGOS_VER: 'catalogos.ver',
  CATALOGOS_ADMINISTRAR: 'catalogos.administrar',

  INVENTARIO_VER: 'inventario.ver',
  INVENTARIO_OPERAR: 'inventario.operar',
  INVENTARIO_CONFIRMAR: 'inventario.confirmar',
  INVENTARIO_ANULAR: 'inventario.anular',
  INVENTARIO_AJUSTAR: 'inventario.ajustar',

  CARGUES_VER_PROPIOS: 'cargues.ver.propios',
  CARGUES_VER_TODOS: 'cargues.ver.todos',
  CARGUES_CREAR: 'cargues.crear',
  CARGUES_CONFIRMAR: 'cargues.confirmar',
  CARGUES_ANULAR: 'cargues.anular',

  BOTELLONES_REGISTRAR: 'botellones.registrar',
  BOTELLONES_VER_PROPIOS: 'botellones.ver.propios',
  BOTELLONES_VER_TODOS: 'botellones.ver.todos',
  BOTELLONES_CONCILIAR: 'botellones.conciliar',
  BOTELLONES_RESOLVER: 'botellones.resolver',

  PRODUCCION_VER: 'produccion.ver',
  PRODUCCION_OPERAR: 'produccion.operar',
  PRODUCCION_CONFIRMAR: 'produccion.confirmar',

  MERMAS_REGISTRAR: 'mermas.registrar',
  MERMAS_APROBAR: 'mermas.aprobar',

  MEMBRESIA_VER: 'membresia.ver',
  MEMBRESIA_ADMINISTRAR: 'membresia.administrar',
  MEMBRESIA_AFILIAR: 'membresia.afiliar',

  REPORTES_VER: 'reportes.ver',
  REPORTES_EXPORTAR: 'reportes.exportar',

  AUDITORIA_VER: 'auditoria.ver',
} as const;

export type PermisoCodigo = (typeof PERMISOS)[keyof typeof PERMISOS];

export interface PermisoDefinicion {
  codigo: string;
  nombre: string;
  modulo: string;
}

export const CATALOGO_PERMISOS: PermisoDefinicion[] = [
  { codigo: PERMISOS.USUARIOS_VER, nombre: 'Ver usuarios', modulo: 'usuarios' },
  {
    codigo: PERMISOS.USUARIOS_CREAR,
    nombre: 'Crear usuarios',
    modulo: 'usuarios',
  },
  {
    codigo: PERMISOS.USUARIOS_EDITAR,
    nombre: 'Editar usuarios',
    modulo: 'usuarios',
  },
  {
    codigo: PERMISOS.USUARIOS_DESACTIVAR,
    nombre: 'Desactivar usuarios',
    modulo: 'usuarios',
  },

  { codigo: PERMISOS.ROLES_VER, nombre: 'Ver roles', modulo: 'roles' },
  {
    codigo: PERMISOS.ROLES_ADMINISTRAR,
    nombre: 'Administrar roles',
    modulo: 'roles',
  },

  { codigo: PERMISOS.MODULOS_VER, nombre: 'Ver modulos', modulo: 'modulos' },
  {
    codigo: PERMISOS.MODULOS_ADMINISTRAR,
    nombre: 'Administrar modulos de la empresa',
    modulo: 'modulos',
  },

  {
    codigo: PERMISOS.EMPRESA_CONFIGURAR,
    nombre: 'Configurar empresa',
    modulo: 'empresa',
  },

  {
    codigo: PERMISOS.CATALOGOS_VER,
    nombre: 'Ver catalogos',
    modulo: 'catalogos',
  },
  {
    codigo: PERMISOS.CATALOGOS_ADMINISTRAR,
    nombre: 'Administrar catalogos',
    modulo: 'catalogos',
  },

  {
    codigo: PERMISOS.INVENTARIO_VER,
    nombre: 'Ver inventario',
    modulo: 'inventario',
  },
  {
    codigo: PERMISOS.INVENTARIO_OPERAR,
    nombre: 'Registrar operaciones de inventario',
    modulo: 'inventario',
  },
  {
    codigo: PERMISOS.INVENTARIO_CONFIRMAR,
    nombre: 'Confirmar documentos de inventario',
    modulo: 'inventario',
  },
  {
    codigo: PERMISOS.INVENTARIO_ANULAR,
    nombre: 'Anular documentos de inventario',
    modulo: 'inventario',
  },
  {
    codigo: PERMISOS.INVENTARIO_AJUSTAR,
    nombre: 'Registrar ajustes de inventario',
    modulo: 'inventario',
  },

  {
    codigo: PERMISOS.CARGUES_VER_PROPIOS,
    nombre: 'Ver cargues propios',
    modulo: 'cargues',
  },
  {
    codigo: PERMISOS.CARGUES_VER_TODOS,
    nombre: 'Ver todos los cargues',
    modulo: 'cargues',
  },
  {
    codigo: PERMISOS.CARGUES_CREAR,
    nombre: 'Crear cargues',
    modulo: 'cargues',
  },
  {
    codigo: PERMISOS.CARGUES_CONFIRMAR,
    nombre: 'Confirmar cargues',
    modulo: 'cargues',
  },
  {
    codigo: PERMISOS.CARGUES_ANULAR,
    nombre: 'Anular cargues',
    modulo: 'cargues',
  },

  {
    codigo: PERMISOS.BOTELLONES_REGISTRAR,
    nombre: 'Registrar movimientos de botellon',
    modulo: 'botellones',
  },
  {
    codigo: PERMISOS.BOTELLONES_VER_PROPIOS,
    nombre: 'Ver botellones propios',
    modulo: 'botellones',
  },
  {
    codigo: PERMISOS.BOTELLONES_VER_TODOS,
    nombre: 'Ver todos los botellones',
    modulo: 'botellones',
  },
  {
    codigo: PERMISOS.BOTELLONES_CONCILIAR,
    nombre: 'Conciliar botellones',
    modulo: 'botellones',
  },
  {
    codigo: PERMISOS.BOTELLONES_RESOLVER,
    nombre: 'Resolver diferencias de botellones',
    modulo: 'botellones',
  },

  {
    codigo: PERMISOS.PRODUCCION_VER,
    nombre: 'Ver produccion',
    modulo: 'produccion',
  },
  {
    codigo: PERMISOS.PRODUCCION_OPERAR,
    nombre: 'Operar produccion',
    modulo: 'produccion',
  },
  {
    codigo: PERMISOS.PRODUCCION_CONFIRMAR,
    nombre: 'Confirmar produccion',
    modulo: 'produccion',
  },

  {
    codigo: PERMISOS.MERMAS_REGISTRAR,
    nombre: 'Registrar mermas',
    modulo: 'mermas',
  },
  {
    codigo: PERMISOS.MERMAS_APROBAR,
    nombre: 'Aprobar mermas',
    modulo: 'mermas',
  },

  {
    codigo: PERMISOS.MEMBRESIA_VER,
    nombre: 'Ver clientes y membresias',
    modulo: 'membresia',
  },
  {
    codigo: PERMISOS.MEMBRESIA_ADMINISTRAR,
    nombre: 'Administrar clientes y planes de membresia',
    modulo: 'membresia',
  },
  {
    codigo: PERMISOS.MEMBRESIA_AFILIAR,
    nombre: 'Afiliar y renovar membresias',
    modulo: 'membresia',
  },

  { codigo: PERMISOS.REPORTES_VER, nombre: 'Ver reportes', modulo: 'reportes' },
  {
    codigo: PERMISOS.REPORTES_EXPORTAR,
    nombre: 'Exportar reportes',
    modulo: 'reportes',
  },

  {
    codigo: PERMISOS.AUDITORIA_VER,
    nombre: 'Ver auditoria',
    modulo: 'auditoria',
  },
];

export const ROLES_SISTEMA = {
  ADMINISTRADOR: 'Administrador',
  VENDEDOR: 'Vendedor',
  BODEGA: 'Bodega',
  PRODUCCION: 'Produccion',
} as const;

export const PERMISOS_POR_ROL_SISTEMA: Record<string, string[]> = {
  [ROLES_SISTEMA.ADMINISTRADOR]: Object.values(PERMISOS),
  [ROLES_SISTEMA.VENDEDOR]: [
    PERMISOS.CARGUES_VER_PROPIOS,
    PERMISOS.BOTELLONES_REGISTRAR,
    PERMISOS.BOTELLONES_VER_PROPIOS,
  ],
  [ROLES_SISTEMA.BODEGA]: [
    PERMISOS.CATALOGOS_VER,
    PERMISOS.INVENTARIO_VER,
    PERMISOS.INVENTARIO_OPERAR,
    PERMISOS.INVENTARIO_CONFIRMAR,
    PERMISOS.CARGUES_VER_TODOS,
    PERMISOS.CARGUES_CONFIRMAR,
    PERMISOS.BOTELLONES_VER_TODOS,
    PERMISOS.BOTELLONES_CONCILIAR,
    PERMISOS.REPORTES_VER,
  ],
  [ROLES_SISTEMA.PRODUCCION]: [
    PERMISOS.CATALOGOS_VER,
    PERMISOS.INVENTARIO_VER,
    PERMISOS.PRODUCCION_VER,
    PERMISOS.PRODUCCION_OPERAR,
    PERMISOS.PRODUCCION_CONFIRMAR,
    PERMISOS.MERMAS_REGISTRAR,
  ],
};
