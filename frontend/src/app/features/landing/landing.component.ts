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
      'Entradas, salidas, traslados y ajustes con documento, consecutivo y auditorÃ­a de cada cambio.',
  },
  {
    icono: 'truck',
    titulo: 'Cargues y botellones',
    texto:
      'Asigna cargues a vendedores y controla la rotaciÃ³n de envases retornables con conciliaciÃ³n.',
  },
  {
    icono: 'factory',
    titulo: 'ProducciÃ³n y materias primas',
    texto:
      'FÃ³rmulas, Ã³rdenes de producciÃ³n y mermas con consumo real y costos internos calculados.',
  },
  {
    icono: 'users',
    titulo: 'Clientes y membresÃ­as',
    texto:
      'Administra clientes, planes y afiliaciones con vigencia y renovaciÃ³n bajo control.',
  },
  {
    icono: 'audit',
    titulo: 'Permisos y auditorÃ­a',
    texto:
      'Roles configurables por empresa y registro inmutable de quiÃ©n hizo quÃ© y cuÃ¡ndo.',
  },
];

const MODULOS: Modulo[] = [
  { icono: 'box', nombre: 'CatÃ¡logo', texto: 'Productos, categorÃ­as y unidades' },
  { icono: 'box', nombre: 'Inventario', texto: 'Existencias y movimientos' },
  { icono: 'factory', nombre: 'ProducciÃ³n', texto: 'FÃ³rmulas y Ã³rdenes' },
  { icono: 'users', nombre: 'MembresÃ­a', texto: 'Clientes y planes' },
  { icono: 'report', nombre: 'Reportes', texto: 'Indicadores operativos' },
  { icono: 'audit', nombre: 'AuditorÃ­a', texto: 'Trazabilidad completa' },
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
    titulo: 'Carga tu catÃ¡logo',
    texto:
      'Da de alta productos, bodegas y presentaciones; el inventario queda listo para operar.',
  },
  {
    numero: '03',
    titulo: 'Opera y controla',
    texto:
      'Registra movimientos, cargues y producciÃ³n. Consulta reportes y la auditorÃ­a en tiempo real.',
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
          <a href="#caracteristicas">CaracterÃ­sticas</a>
          <a href="#modulos">MÃ³dulos</a>
          <a href="#como">CÃ³mo funciona</a>
          <a href="#planes">Planes</a>
        </nav>

        <div class="lp-nav-actions">
          <a class="btn btn-ghost" routerLink="/login">Iniciar sesiÃ³n</a>
          <a class="btn btn-primary" routerLink="/registro">Comenzar gratis</a>
        </div>

        <button class="lp-burger" (click)="menu.set(!menu())" title="MenÃº" aria-label="Abrir menÃº" [attr.aria-expanded]="menu()">
          <app-icon [name]="menu() ? 'close' : 'menu'" />
        </button>
      </div>

      @if (menu()) {
        <div class="lp-mobile">
          <a href="#caracteristicas" (click)="menu.set(false)">CaracterÃ­sticas</a>
          <a href="#modulos" (click)="menu.set(false)">MÃ³dulos</a>
          <a href="#como" (click)="menu.set(false)">CÃ³mo funciona</a>
          <a href="#planes" (click)="menu.set(false)">Planes</a>
          <a class="btn btn-primary" routerLink="/registro" (click)="menu.set(false)">Crear cuenta</a>
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
            <span class="grad">toda tu operaciÃ³n</span>
            en un solo lugar
          </h1>
          <p>
            Stockora centraliza catÃ¡logo, inventario, cargues, botellones,
            producciÃ³n y membresÃ­as con trazabilidad completa y aislamiento por
            empresa.
          </p>
          <div class="lp-hero-cta">
            <a class="btn btn-primary btn-lg" routerLink="/registro">
              Comenzar ahora <app-icon name="arrow-right" />
            </a>
            <a class="btn btn-outline btn-lg" href="#caracteristicas">
              Ver caracterÃ­sticas
            </a>
          </div>
          <div class="lp-hero-stats">
            <div>
              <strong>6</strong>
              <span>MÃ³dulos integrados</span>
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
            <span class="mock-title">Panel Â· Inventario</span>
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
                <div><strong>7</strong><span>Ã“rdenes</span></div>
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
      <span>Todo lo que tu operaciÃ³n necesita, sin hojas de cÃ¡lculo</span>
    </section>

    <section class="lp-section" id="caracteristicas">
      <div class="lp-head">
        <span class="lp-eyebrow">CaracterÃ­sticas</span>
        <h2>DiseÃ±ado para operaciones que no pueden fallar</h2>
        <p>
          Cada funciÃ³n estÃ¡ pensada para mantener la integridad del inventario y
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
        <span class="lp-eyebrow">MÃ³dulos</span>
        <h2>Seis mÃ³dulos que cubren todo el ciclo</h2>
        <p>ActÃ­valos segÃºn tu plan y el tamaÃ±o de tu operaciÃ³n.</p>
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
        <span class="lp-eyebrow">CÃ³mo funciona</span>
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
              <span class="lp-plan-tag">MÃ¡s elegido</span>
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
            <a class="btn btn-block" [class]="pl.destacado ? 'btn-primary' : 'btn-outline'" routerLink="/registro">
              Elegir {{ pl.nombre }}
            </a>
          </div>
        }
      </div>
    </section>

    <section class="lp-cta">
      <div class="lp-cta-inner">
        <h2>Empieza a controlar tu inventario hoy</h2>
        <p>Crea tu cuenta y ten tu operaciÃ³n ordenada desde el primer dÃ­a.</p>
            <a class="btn btn-primary btn-lg" routerLink="/registro">
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
          <a href="#caracteristicas">CaracterÃ­sticas</a>
          <a href="#modulos">MÃ³dulos</a>
          <a href="#planes">Planes</a>
        </div>
        <div class="lp-footer-col">
          <h4>Cuenta</h4>
          <a routerLink="/login">Iniciar sesiÃ³n</a>
          <a routerLink="/registro">Crear cuenta</a>
        </div>
      </div>
      <div class="lp-footer-bottom">
        Â© {{ anio }} Stockora Â· Sistema de inventario multiempresa
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
    { inicial: 'P', nombre: 'Planta Norte', modulo: 'ProducciÃ³n', estado: 'En proceso', clase: 'badge-warn' },
    { inicial: 'V', nombre: 'Ruta Vendedor 3', modulo: 'Cargues', estado: 'Confirmado', clase: 'badge-primary' },
  ];

  readonly planes = [
    {
      nombre: 'BÃ¡sico',
      descripcion: 'Para equipos pequeÃ±os que inician.',
      precio: '$â€”',
      periodo: '/ mes',
      destacado: false,
      incluye: ['CatÃ¡logo e inventario', 'Hasta 5 usuarios', 'Reportes esenciales'],
    },
    {
      nombre: 'Pro',
      descripcion: 'Para operaciones en crecimiento.',
      precio: '$â€”',
      periodo: '/ mes',
      destacado: true,
      incluye: [
        'Todo lo del plan BÃ¡sico',
        'Cargues y botellones',
        'ProducciÃ³n y membresÃ­as',
        'Reportes avanzados',
      ],
    },
    {
      nombre: 'Empresa',
      descripcion: 'Para operaciones multisede.',
      precio: '$â€”',
      periodo: '/ mes',
      destacado: false,
      incluye: [
        'Todo lo del plan Pro',
        'MÃ³dulos ilimitados',
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
