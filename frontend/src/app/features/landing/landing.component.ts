import { Component, HostListener, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/icons';

interface Caracteristica {
  icono: string;
  titulo: string;
  texto: string;
}

interface Modulo {
  icono: string;
  nombre: string;
  texto: string;
}

interface Paso {
  numero: string;
  titulo: string;
  texto: string;
}

const CARACTERISTICAS: Caracteristica[] = [
  {
    icono: 'shield',
    titulo: 'Multiempresa con aislamiento',
    texto:
      'Cada empresa opera con sus propios datos, usuarios y permisos, sin filtraciones entre cuentas.',
  },
  {
    icono: 'box',
    titulo: 'Inventario trazable',
    texto:
      'Entradas, salidas, traslados y ajustes con documento, consecutivo y auditoría de cada cambio.',
  },
  {
    icono: 'truck',
    titulo: 'Cargues y botellones',
    texto:
      'Asigna cargues a vendedores y controla la rotación de envases retornables con conciliación.',
  },
  {
    icono: 'factory',
    titulo: 'Producción y materias primas',
    texto:
      'Fórmulas, órdenes de producción y mermas con consumo real y costos internos calculados.',
  },
  {
    icono: 'users',
    titulo: 'Clientes y membresías',
    texto:
      'Administra clientes, planes y afiliaciones con vigencia y renovación bajo control.',
  },
  {
    icono: 'audit',
    titulo: 'Permisos y auditoría',
    texto:
      'Roles configurables por empresa y registro inmutable de quién hizo qué y cuándo.',
  },
];

const MODULOS: Modulo[] = [
  { icono: 'box', nombre: 'Catálogo', texto: 'Productos, categorías y unidades' },
  { icono: 'box', nombre: 'Inventario', texto: 'Existencias y movimientos' },
  { icono: 'factory', nombre: 'Producción', texto: 'Fórmulas y órdenes' },
  { icono: 'users', nombre: 'Membresía', texto: 'Clientes y planes' },
  { icono: 'report', nombre: 'Reportes', texto: 'Indicadores operativos' },
  { icono: 'audit', nombre: 'Auditoría', texto: 'Trazabilidad completa' },
];

const PASOS: Paso[] = [
  {
    numero: '01',
    titulo: 'Configura tu empresa',
    texto:
      'Registra los datos de tu empresa y define roles con los permisos exactos para cada equipo.',
  },
  {
    numero: '02',
    titulo: 'Carga tu catálogo',
    texto:
      'Da de alta productos, bodegas y presentaciones; el inventario queda listo para operar.',
  },
  {
    numero: '03',
    titulo: 'Opera y controla',
    texto:
      'Registra movimientos, cargues y producción. Consulta reportes y la auditoría en tiempo real.',
  },
];

@Component({
  selector: 'app-landing',
  imports: [RouterLink, IconComponent],
  template: `
    <header class="lp-nav" [class.solid]="scrolled()">
      <div class="lp-nav-inner">
        <a class="lp-brand" routerLink="/">
          <span class="brand-logo">ST</span>
          <span class="brand-text">Stockora</span>
        </a>

        <nav class="lp-links">
          <a href="#caracteristicas">Características</a>
          <a href="#modulos">Módulos</a>
          <a href="#como">Cómo funciona</a>
          <a href="#planes">Planes</a>
        </nav>

        <div class="lp-nav-actions">
          <a class="btn btn-ghost" routerLink="/login">Iniciar sesión</a>
          <a class="btn btn-primary" routerLink="/login">Comenzar gratis</a>
        </div>

        <button class="lp-burger" (click)="menu.set(!menu())" title="Menú">
          <app-icon [name]="menu() ? 'close' : 'menu'" />
        </button>
      </div>

      @if (menu()) {
        <div class="lp-mobile">
          <a href="#caracteristicas" (click)="menu.set(false)">Características</a>
          <a href="#modulos" (click)="menu.set(false)">Módulos</a>
          <a href="#como" (click)="menu.set(false)">Cómo funciona</a>
          <a href="#planes" (click)="menu.set(false)">Planes</a>
          <a class="btn btn-primary" routerLink="/login" (click)="menu.set(false)">Iniciar sesión</a>
        </div>
      }
    </header>

    <section class="lp-hero">
      <div class="lp-hero-bg"></div>
      <div class="lp-hero-inner">
        <div class="lp-hero-copy anim-up">
          <span class="lp-pill">
            <app-icon name="spark" /> Inventario multiempresa en la nube
          </span>
          <h1>
            Controla tu inventario,
            <span class="grad">toda tu operación</span>
            en un solo lugar
          </h1>
          <p>
            Stockora centraliza catálogo, inventario, cargues, botellones,
            producción y membresías con trazabilidad completa y aislamiento por
            empresa.
          </p>
          <div class="lp-hero-cta">
            <a class="btn btn-primary btn-lg" routerLink="/login">
              Comenzar ahora <app-icon name="arrow-right" />
            </a>
            <a class="btn btn-outline btn-lg" href="#caracteristicas">
              Ver características
            </a>
          </div>
          <div class="lp-hero-stats">
            <div>
              <strong>6</strong>
              <span>Módulos integrados</span>
            </div>
            <div>
              <strong>100%</strong>
              <span>Trazabilidad</span>
            </div>
            <div>
              <strong>Multi</strong>
              <span>Empresa y rol</span>
            </div>
          </div>
        </div>

        <div class="lp-hero-card anim-up">
          <div class="mock-top">
            <span class="dot"></span><span class="dot"></span><span class="dot"></span>
            <span class="mock-title">Panel · Inventario</span>
          </div>
          <div class="mock-body">
            <div class="mock-kpis">
              <div class="mock-kpi">
                <app-icon name="box" />
                <div><strong>1.284</strong><span>Productos</span></div>
              </div>
              <div class="mock-kpi">
                <app-icon name="truck" />
                <div><strong>18</strong><span>Cargues activos</span></div>
              </div>
              <div class="mock-kpi">
                <app-icon name="factory" />
                <div><strong>7</strong><span>Órdenes</span></div>
              </div>
            </div>
            <div class="mock-rows">
              @for (r of mockRows; track r.nombre) {
                <div class="mock-row">
                  <span class="mock-avatar">{{ r.inicial }}</span>
                  <div class="mock-row-main">
                    <strong>{{ r.nombre }}</strong>
                    <span>{{ r.modulo }}</span>
                  </div>
                  <span class="badge" [class]="r.clase">{{ r.estado }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="lp-logos">
      <span>Todo lo que tu operación necesita, sin hojas de cálculo</span>
    </section>

    <section class="lp-section" id="caracteristicas">
      <div class="lp-head">
        <span class="lp-eyebrow">Características</span>
        <h2>Diseñado para operaciones que no pueden fallar</h2>
        <p>
          Cada función está pensada para mantener la integridad del inventario y
          la claridad de los procesos.
        </p>
      </div>
      <div class="lp-grid">
        @for (c of caracteristicas; track c.titulo) {
          <div class="lp-card">
            <div class="lp-card-icon"><app-icon [name]="c.icono" /></div>
            <h3>{{ c.titulo }}</h3>
            <p>{{ c.texto }}</p>
          </div>
        }
      </div>
    </section>

    <section class="lp-section alt" id="modulos">
      <div class="lp-head">
        <span class="lp-eyebrow">Módulos</span>
        <h2>Seis módulos que cubren todo el ciclo</h2>
        <p>Actívalos según tu plan y el tamaño de tu operación.</p>
      </div>
      <div class="lp-modules">
        @for (m of modulos; track m.nombre) {
          <div class="lp-module">
            <div class="lp-card-icon"><app-icon [name]="m.icono" /></div>
            <div>
              <h3>{{ m.nombre }}</h3>
              <p>{{ m.texto }}</p>
            </div>
          </div>
        }
      </div>
    </section>

    <section class="lp-section" id="como">
      <div class="lp-head">
        <span class="lp-eyebrow">Cómo funciona</span>
        <h2>En marcha en tres pasos</h2>
      </div>
      <div class="lp-steps">
        @for (p of pasos; track p.numero) {
          <div class="lp-step">
            <span class="lp-step-num">{{ p.numero }}</span>
            <h3>{{ p.titulo }}</h3>
            <p>{{ p.texto }}</p>
          </div>
        }
      </div>
    </section>

    <section class="lp-section alt" id="planes">
      <div class="lp-head">
        <span class="lp-eyebrow">Planes</span>
        <h2>Precios simples que crecen contigo</h2>
        <p>Sin costos ocultos. Cambia de plan cuando quieras.</p>
      </div>
      <div class="lp-plans">
        @for (pl of planes; track pl.nombre) {
          <div class="lp-plan" [class.destacado]="pl.destacado">
            @if (pl.destacado) {
              <span class="lp-plan-tag">Más elegido</span>
            }
            <h3>{{ pl.nombre }}</h3>
            <p class="lp-plan-desc">{{ pl.descripcion }}</p>
            <div class="lp-plan-price">
              <span class="lp-plan-amount">{{ pl.precio }}</span>
              <span class="lp-plan-period">{{ pl.periodo }}</span>
            </div>
            <ul>
              @for (f of pl.incluye; track f) {
                <li><app-icon name="check" /> {{ f }}</li>
              }
            </ul>
            <a class="btn btn-block" [class]="pl.destacado ? 'btn-primary' : 'btn-outline'" routerLink="/login">
              Elegir {{ pl.nombre }}
            </a>
          </div>
        }
      </div>
    </section>

    <section class="lp-cta">
      <div class="lp-cta-inner">
        <h2>Empieza a controlar tu inventario hoy</h2>
        <p>Crea tu cuenta y ten tu operación ordenada desde el primer día.</p>
        <a class="btn btn-primary btn-lg" routerLink="/login">
          Crear mi cuenta <app-icon name="arrow-right" />
        </a>
      </div>
    </section>

    <footer class="lp-footer">
      <div class="lp-footer-inner">
        <div class="lp-footer-brand">
          <a class="lp-brand" routerLink="/">
            <span class="brand-logo">ST</span>
            <span class="brand-text">Stockora</span>
          </a>
          <p>Plataforma de inventario multiempresa con trazabilidad completa.</p>
        </div>
        <div class="lp-footer-col">
          <h4>Producto</h4>
          <a href="#caracteristicas">Características</a>
          <a href="#modulos">Módulos</a>
          <a href="#planes">Planes</a>
        </div>
        <div class="lp-footer-col">
          <h4>Cuenta</h4>
          <a routerLink="/login">Iniciar sesión</a>
          <a routerLink="/login">Crear cuenta</a>
        </div>
      </div>
      <div class="lp-footer-bottom">
        © {{ anio }} Stockora · Sistema de inventario multiempresa
      </div>
    </footer>
  `,
  styleUrl: './landing.component.scss',
})
export class LandingComponent {
  readonly anio = new Date().getFullYear();
  readonly menu = signal(false);
  readonly scrolled = signal(false);

  readonly caracteristicas = CARACTERISTICAS;
  readonly modulos = MODULOS;
  readonly pasos = PASOS;

  readonly mockRows = [
    { inicial: 'A', nombre: 'Bodega Central', modulo: 'Inventario', estado: 'Activo', clase: 'badge-success' },
    { inicial: 'P', nombre: 'Planta Norte', modulo: 'Producción', estado: 'En proceso', clase: 'badge-warn' },
    { inicial: 'V', nombre: 'Ruta Vendedor 3', modulo: 'Cargues', estado: 'Confirmado', clase: 'badge-primary' },
  ];

  readonly planes = [
    {
      nombre: 'Básico',
      descripcion: 'Para equipos pequeños que inician.',
      precio: '$—',
      periodo: '/ mes',
      destacado: false,
      incluye: ['Catálogo e inventario', 'Hasta 5 usuarios', 'Reportes esenciales'],
    },
    {
      nombre: 'Pro',
      descripcion: 'Para operaciones en crecimiento.',
      precio: '$—',
      periodo: '/ mes',
      destacado: true,
      incluye: [
        'Todo lo del plan Básico',
        'Cargues y botellones',
        'Producción y membresías',
        'Reportes avanzados',
      ],
    },
    {
      nombre: 'Empresa',
      descripcion: 'Para operaciones multisede.',
      precio: '$—',
      periodo: '/ mes',
      destacado: false,
      incluye: [
        'Todo lo del plan Pro',
        'Módulos ilimitados',
        'Usuarios ilimitados',
        'Soporte prioritario',
      ],
    },
  ];

  constructor() {
    this.scrolled.set(window.scrollY > 12);
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 12);
  }
}
