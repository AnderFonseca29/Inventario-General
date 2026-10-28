export type EstadoSuscripcionEmpresa =
  | 'SIN_PLAN'
  | 'ACTIVA'
  | 'EN_GRACIA'
  | 'VENCIDA'
  | 'SUSPENDIDA'
  | 'CANCELADA';

export interface PlanSuscripcion {
  id: string;
  codigo: string;
  nombre: string;
  precioMensual: string | number;
  moneda: string;
}

/** Respuesta de GET /suscripciones/mi-plan. */
export interface MiPlan {
  estado: EstadoSuscripcionEmpresa;
  /** true cuando el backend responde 402 en las rutas de la empresa. */
  bloqueado: boolean;
  /** Dias enteros del periodo; 0 en gracia o vencido; null si no aplica. */
  diasRestantes: number | null;
  finGracia: string | null;
  fechaFin: string | null;
  esPrueba: boolean;
  plan: PlanSuscripcion | null;
}
