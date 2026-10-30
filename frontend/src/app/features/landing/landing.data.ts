export interface EnlaceNavegacion {
  id: string;
  etiqueta: string;
}

export interface Caracteristica {
  icono: string;
  titulo: string;
  texto: string;
}

export interface Modulo {
  icono: string;
  nombre: string;
  texto: string;
}

export interface Paso {
  numero: string;
  titulo: string;
  texto: string;
}

export interface Plan {
  codigo: 'basico' | 'pro' | 'empresa';
  nombre: string;
  descripcion: string;
  etiqueta?: string;
  precioMensual: number;
  precio: string;
  periodo: string;
  maxUsuarios: number | null;
  maxBodegas: number | null;
  maxReportes: number | null;
  incluye: string[];
  destacado: boolean;
}

export interface Pregunta {
  pregunta: string;
  respuesta: string;
}

export interface LimiteSeguridad {
  icono: string;
  titulo: string;
  texto: string;
}

export interface TipoNegocio {
  icono: string;
  titulo: string;
  texto: string;
}

export interface PantallaDemo {
  id: string;
  etiqueta: string;
  titulo: string;
  descripcion: string;
  kpis: Array<{ etiqueta: string; valor: string; detalle: string }>;
  filas: Array<{ nombre: string; detalle: string; estado: string; tono: 'olive' | 'ochre' | 'info' }>;
}

export const ENLACES_NAVEGACION: EnlaceNavegacion[] = [
  { id: 'caracteristicas', etiqueta: 'Características' },
  { id: 'modulos', etiqueta: 'Módulos' },
  { id: 'como-funciona', etiqueta: 'Cómo funciona' },
  { id: 'planes', etiqueta: 'Planes' },
  { id: 'preguntas', etiqueta: 'Preguntas' },
];

export const TIPOS_NEGOCIO: TipoNegocio[] = [
  {
    icono: 'bottle',
    titulo: 'Distribuidoras de agua y bebidas',
    texto: 'Botellones retornables, cargues y conciliación por vendedor.',
  },
  {
    icono: 'factory',
    titulo: 'Plantas de producción',
    texto: 'Fórmulas, órdenes, materias primas y mermas.',
  },
  {
    icono: 'building',
    titulo: 'Bodegas y distribuidores',
    texto: 'Existencias por bodega, traslados y documentos.',
  },
  {
    icono: 'truck',
    titulo: 'Operaciones con cargues',
    texto: 'Asignación a rutas y control de lo que sale y regresa.',
  },
  {
    icono: 'users',
    titulo: 'Negocios con membresías',
    texto: 'Clientes, planes, vigencias y renovaciones.',
  },
];

export const CARACTERISTICAS: Caracteristica[] = [
  {
    icono: 'building',
    titulo: 'Una empresa, un espacio aislado',
    texto:
      'Cada usuario operativo trabaja con la empresa de su sesión. El backend rechaza rutas de negocio sin empresa asignada.',
  },
  {
    icono: 'box',
    titulo: 'Inventario con historia',
    texto:
      'Entradas, salidas, traslados y ajustes con documento, consecutivo y registro de auditoría.',
  },
  {
    icono: 'users',
    titulo: 'Permisos que se respetan',
    texto:
      'Roles por empresa y validación de permisos en el backend, no solo en la interfaz.',
  },
  {
    icono: 'truck',
    titulo: 'Cargues y botellones',
    texto:
      'Asigna cargues a vendedores y controla la rotación de envases retornables con conciliación.',
  },
  {
    icono: 'factory',
    titulo: 'Producción conectada',
    texto:
      'Fórmulas, órdenes de producción y consumo de materias primas con costos internos.',
  },
  {
    icono: 'audit',
    titulo: 'Trazabilidad consultable',
    texto:
      'El módulo de auditoría conserva acción, entidad, usuario y fecha de las operaciones sensibles.',
  },
];

export const MODULOS: Modulo[] = [
  { icono: 'catalog', nombre: 'Catálogo', texto: 'Productos, categorías, unidades y presentaciones.' },
  { icono: 'box', nombre: 'Inventario', texto: 'Existencias por bodega, movimientos y documentos.' },
  { icono: 'truck', nombre: 'Cargues', texto: 'Salidas asignadas a vendedores y rutas.' },
  { icono: 'bottle', nombre: 'Botellones', texto: 'Envases retornables y conciliación de rotación.' },
  { icono: 'factory', nombre: 'Producción', texto: 'Fórmulas, órdenes y consumo de materias primas.' },
  { icono: 'users', nombre: 'Membresía', texto: 'Clientes, planes, vigencias y renovaciones.' },
  { icono: 'report', nombre: 'Reportes', texto: 'Indicadores operativos para revisar el negocio.' },
  { icono: 'audit', nombre: 'Auditoría', texto: 'Consulta de eventos y cambios registrados.' },
];

export const PASOS: Paso[] = [
  {
    numero: '01',
    titulo: 'Configura tu empresa',
    texto:
      'Crea la empresa, invita a tu equipo y define los roles con los permisos que necesita cada persona.',
  },
  {
    numero: '02',
    titulo: 'Carga tu operación',
    texto:
      'Registra productos, bodegas, presentaciones y clientes. El inventario queda listo para empezar.',
  },
  {
    numero: '03',
    titulo: 'Opera y revisa',
    texto:
      'Registra movimientos, cargues y producción. Consulta reportes y auditoría cuando necesites explicar qué pasó.',
  },
];

export const SEGURIDAD: LimiteSeguridad[] = [
  {
    icono: 'building',
    titulo: 'Datos separados por empresa',
    texto:
      'Las rutas operativas resuelven la empresa desde el usuario autenticado; no aceptan una empresa externa en el cuerpo de la petición.',
  },
  {
    icono: 'users',
    titulo: 'Permisos por rol',
    texto:
      'El backend comprueba los permisos declarados en cada operación antes de ejecutarla.',
  },
  {
    icono: 'lock',
    titulo: 'Contraseñas protegidas',
    texto:
      'Las contraseñas se almacenan con hash Argon2id y nunca se conservan en texto plano.',
  },
  {
    icono: 'audit',
    titulo: 'Registro de auditoría',
    texto:
      'El sistema registra eventos con empresa, usuario, acción, entidad y fecha para las operaciones que lo requieren.',
  },
];

export const PREGUNTAS: Pregunta[] = [
  {
    pregunta: '¿Necesito instalar algo para usar Stockora?',
    respuesta:
      'No. Stockora se usa desde el navegador. Si tu navegador lo permite, puedes agregar el acceso a la pantalla de inicio, pero no necesitas descargar una aplicación.',
  },
  {
    pregunta: '¿Cómo se separan los datos de cada empresa?',
    respuesta:
      'Cada usuario operativo tiene una empresa asignada. Las rutas de negocio toman ese identificador de la sesión y rechazan las operaciones cuando el usuario no tiene empresa.',
  },
  {
    pregunta: '¿Puedo dar permisos distintos a cada persona?',
    respuesta:
      'Sí. La plataforma incluye roles y permisos por módulo. La interfaz oculta lo que no corresponde y el backend vuelve a validar el permiso antes de ejecutar la operación.',
  },
  {
    pregunta: '¿Qué puedo controlar en el inventario?',
    respuesta:
      'Existencias por bodega, entradas, salidas, traslados y ajustes. Los movimientos se agrupan en documentos con consecutivo y quedan registrados para consulta.',
  },
  {
    pregunta: '¿Hay una aplicación móvil nativa?',
    respuesta:
      'Hoy Stockora es una aplicación web adaptable a celular, tableta y computador. No hay una aplicación nativa publicada en las tiendas.',
  },
  {
    pregunta: '¿Dónde puedo radicar una solicitud sobre mis datos?',
    respuesta:
      'En la página de derechos encuentras el formulario dispuesto para radicar solicitudes relacionadas con datos personales.',
  },
];

export const PLANES: Plan[] = [
  {
    codigo: 'basico',
    nombre: 'Básico',
    descripcion: 'Para empresas pequeñas que necesitan ordenar su inventario.',
    etiqueta: 'Punto de partida',
    precioMensual: 60000,
    precio: formatearCop(60000),
    periodo: '/ mes',
    maxUsuarios: 5,
    maxBodegas: 1,
    maxReportes: 5,
    incluye: [
      'Hasta 5 usuarios',
      '1 bodega',
      '5 reportes',
      'Usuarios, roles, catálogo, inventario y reportes',
    ],
    destacado: false,
  },
  {
    codigo: 'pro',
    nombre: 'Medio',
    descripcion: 'Para operaciones que ya mueven cargues, botellones y producción.',
    etiqueta: 'Para crecer',
    precioMensual: 90000,
    precio: formatearCop(90000),
    periodo: '/ mes',
    maxUsuarios: 10,
    maxBodegas: 3,
    maxReportes: null,
    incluye: [
      'Hasta 10 usuarios',
      '3 bodegas',
      'Reportes sin límite',
      'Incluye cargues, botellones, producción y membresías',
    ],
    destacado: true,
  },
  {
    codigo: 'empresa',
    nombre: 'Premium',
    descripcion: 'Para empresas que necesitan todos los módulos sin límites operativos.',
    etiqueta: 'Sin límites',
    precioMensual: 120000,
    precio: formatearCop(120000),
    periodo: '/ mes',
    maxUsuarios: null,
    maxBodegas: null,
    maxReportes: null,
    incluye: [
      'Usuarios sin límite',
      'Bodegas sin límite',
      'Reportes sin límite',
      'Todos los módulos de la plataforma',
    ],
    destacado: false,
  },
];

export const NOTA_PRECIOS = 'Precios mensuales en pesos colombianos (COP).';

export const PANTALLAS_DEMO: PantallaDemo[] = [
  {
    id: 'dashboard',
    etiqueta: 'Dashboard',
    titulo: 'Resumen de la operación',
    descripcion:
      'Una vista para revisar existencias, movimientos y órdenes abiertas antes de empezar el día.',
    kpis: [
      { etiqueta: 'Productos activos', valor: '248', detalle: 'Datos de ejemplo' },
      { etiqueta: 'Movimientos de hoy', valor: '32', detalle: 'Entradas y salidas' },
      { etiqueta: 'Órdenes abiertas', valor: '5', detalle: 'Producción' },
    ],
    filas: [
      { nombre: 'Bodega Central', detalle: 'Inventario · 1.240 unidades', estado: 'Al día', tono: 'olive' },
      { nombre: 'Planta Norte', detalle: 'Producción · Orden 184', estado: 'En proceso', tono: 'ochre' },
      { nombre: 'Ruta Vendedor 3', detalle: 'Cargues · 18 envases', estado: 'Confirmado', tono: 'info' },
    ],
  },
  {
    id: 'inventario',
    etiqueta: 'Inventario',
    titulo: 'Existencias con contexto',
    descripcion:
      'Consulta por bodega, revisa mínimos y abre el documento que explica cada movimiento.',
    kpis: [
      { etiqueta: 'Existencias', valor: '1.240', detalle: 'Unidades' },
      { etiqueta: 'Bajo mínimo', valor: '8', detalle: 'Productos por revisar' },
      { etiqueta: 'Bodegas', valor: '3', detalle: 'Sedes activas' },
    ],
    filas: [
      { nombre: 'Agua 600 ml', detalle: 'Bodega Central · 480 unidades', estado: 'Disponible', tono: 'olive' },
      { nombre: 'Botellón 20 L', detalle: 'Bodega Central · 86 unidades', estado: 'Bajo mínimo', tono: 'ochre' },
      { nombre: 'Tapas azules', detalle: 'Bodega Norte · 1.200 unidades', estado: 'Disponible', tono: 'olive' },
    ],
  },
  {
    id: 'produccion',
    etiqueta: 'Producción',
    titulo: 'Órdenes y materias primas',
    descripcion:
      'Sigue las órdenes abiertas y el consumo real de los insumos de cada fórmula.',
    kpis: [
      { etiqueta: 'Órdenes', valor: '12', detalle: 'Este mes' },
      { etiqueta: 'En proceso', valor: '4', detalle: 'Requieren seguimiento' },
      { etiqueta: 'Merma registrada', valor: '1,8 %', detalle: 'Promedio del periodo' },
    ],
    filas: [
      { nombre: 'Lote AG-2401', detalle: 'Agua 600 ml · 240 unidades', estado: 'En proceso', tono: 'ochre' },
      { nombre: 'Lote AG-2402', detalle: 'Botellón 20 L · 60 unidades', estado: 'Programada', tono: 'info' },
      { nombre: 'Lote AG-2399', detalle: 'Agua 1 L · 180 unidades', estado: 'Cerrada', tono: 'olive' },
    ],
  },
];

/**
 * Importes centralizados. El script scripts/verificar-planes.mjs compara estos
 * valores y los límites con backend/prisma/seed.ts.
 */
export const PRECIOS_PLANES = {
  basico: 60000,
  pro: 90000,
  empresa: 120000,
} as const;

function formatearCop(valor: number): string {
  return `$${valor.toLocaleString('es-CO')}`;
}
