export interface ModuloSistemaDefinicion {
  clave: string;
  nombre: string;
  descripcion: string;
  icono: string;
  orden: number;
  ruta: string;
  implementado: boolean;
}

// Módulos fijos del sistema: se siembran por cada empresa y no se pueden eliminar.
export const MODULOS_SISTEMA: ModuloSistemaDefinicion[] = [
  {
    clave: 'catalogo',
    nombre: 'Catálogo',
    descripcion: 'Productos, categorías, unidades y presentaciones',
    icono: 'box',
    orden: 1,
    ruta: '/catalogos',
    implementado: true,
  },
  {
    clave: 'inventario',
    nombre: 'Inventario',
    descripcion: 'Existencias, entradas, salidas y ajustes',
    icono: 'box',
    orden: 2,
    ruta: '/inventario',
    implementado: true,
  },
  {
    clave: 'cargues',
    nombre: 'Cargues',
    descripcion: 'Cargues de productos a vendedores',
    icono: 'truck',
    orden: 3,
    ruta: '/cargues',
    implementado: true,
  },
  {
    clave: 'produccion',
    nombre: 'Producción',
    descripcion: 'Materias primas, fórmulas y órdenes de producción',
    icono: 'factory',
    orden: 4,
    ruta: '/produccion',
    implementado: true,
  },
  {
    clave: 'membresia',
    nombre: 'Membresía',
    descripcion: 'Clientes y planes de membresía',
    icono: 'users',
    orden: 5,
    ruta: '/membresia',
    implementado: true,
  },
  {
    clave: 'reportes',
    nombre: 'Reportes',
    descripcion: 'Indicadores y reportes operativos',
    icono: 'report',
    orden: 6,
    ruta: '/reportes',
    implementado: true,
  },
  {
    clave: 'auditorias',
    nombre: 'Auditorías',
    descripcion: 'Trazabilidad de acciones y cambios',
    icono: 'audit',
    orden: 7,
    ruta: '/auditorias',
    implementado: true,
  },
];

// Iconos disponibles para los módulos configurables por el administrador.
export const ICONOS_MODULO = [
  'box',
  'truck',
  'bottle',
  'factory',
  'report',
  'audit',
  'users',
  'user',
  'shield',
  'building',
  'dashboard',
  'settings',
  'calendar',
  'spark',
  'trend-up',
  'warning',
] as const;
