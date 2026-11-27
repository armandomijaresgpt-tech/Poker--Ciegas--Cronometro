import { AppTab } from '../types/poker';

export interface TutorialStep {
  id: string;
  tab: AppTab;
  targetSelector: string | null;
  category: 'Inicio' | 'Reloj' | 'Estructura' | 'Liga' | 'Botes' | 'Ajustes';
  title: string;
  description: string;
  tip: string;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    tab: 'clock',
    targetSelector: null,
    category: 'Inicio',
    title: 'Bienvenido a MesaPoker',
    description:
      'Reloj de póker 100 % offline para móvil, tablet y TV. Usa «fichas» virtuales y sonidos distintos por ronda.',
    tip: 'Todo se guarda automáticamente en este dispositivo sin conexión.',
  },
  {
    id: 'navigation',
    tab: 'clock',
    targetSelector: '[data-tour="nav-tabs"]',
    category: 'Inicio',
    title: 'Las 5 secciones principales',
    description:
      'Cambia entre Reloj, Estructura (ciegas y fichas), Liga (jugadores e historial), Botes (All-In) y Ajustes.',
    tip: 'En móvil esta barra queda abajo para alcanzar todo con el pulgar.',
  },
  {
    id: 'clock-header',
    tab: 'clock',
    targetSelector: '[data-tour="clock-header"]',
    category: 'Reloj',
    title: 'Título y nivel actual',
    description:
      'Toca el nombre para editar el título del torneo. Debajo ves el nivel activo, estructura y aviso de 1 min.',
    tip: 'Activa «Pre-Game Intro» en Ajustes para mostrar las fichas antes de empezar.',
  },
  {
    id: 'clock-timer',
    tab: 'clock',
    targetSelector: '[data-tour="clock-timer"]',
    category: 'Reloj',
    title: 'Cronómetro y barra táctil',
    description:
      'Desliza o toca la barra de progreso para avanzar o retroceder tiempo, sumar/restar ±1m o reiniciar el nivel.',
    tip: 'También ves el tiempo total jugado y cuánto falta para el próximo descanso.',
  },
  {
    id: 'clock-controls',
    tab: 'clock',
    targetSelector: '[data-tour="clock-playback"]',
    category: 'Reloj',
    title: 'Play / Pausa y niveles',
    description:
      'El botón central inicia o pausa el reloj; las flechas laterales saltan al nivel anterior o siguiente.',
    tip: 'En PC usa Espacio para pausar y ← / → para cambiar de nivel.',
  },
  {
    id: 'clock-blinds',
    tab: 'clock',
    targetSelector: '[data-tour="clock-blinds"]',
    category: 'Reloj',
    title: 'Ciegas actuales y siguientes',
    description:
      'Muestra Ciega Pequeña, Ciega Grande y Ante actuales, junto con la referencia de la ronda anterior y siguiente.',
    tip: 'Cambia el tipo de Ante (Sin Ante, Por jugador o BB Ante) en Estructura.',
  },
  {
    id: 'call-clock',
    tab: 'clock',
    targetSelector: '[data-tour="call-clock"]',
    category: 'Reloj',
    title: 'Call the Clock y Modo TV',
    description:
      'Usa «Call Clock» para dar tiempo límite a una jugada, o cambia entre Modo Minimalista y Pantalla Completa.',
    tip: 'El Modo Minimalista muestra números gigantes para poner el móvil en el centro.',
  },
  {
    id: 'table-stats',
    tab: 'clock',
    targetSelector: '[data-tour="table-stats"]',
    category: 'Reloj',
    title: 'Control de mesa en vivo',
    description:
      'Suma jugadores (+Jugador), recompras (+Rebuy), Add-ons o eliminaciones (-Jugador) recalculando el stack medio.',
    tip: 'Si te equivocas al tocar, usa «Deshacer» o los ajustes -1 de abajo.',
  },
  {
    id: 'clock-sidebar',
    tab: 'clock',
    targetSelector: '[data-tour="clock-sidebar"]',
    category: 'Reloj',
    title: 'Bote, fichas y escalera',
    description:
      'Consulta el bote en fichas, reparto por puestos, valores de tus fichas y toca cualquier nivel de la lista para saltar.',
    tip: 'Puedes mostrar u ocultar cada bloque desde Ajustes.',
  },
  {
    id: 'structure-presets',
    tab: 'structure',
    targetSelector: '[data-tour="structure-presets"]',
    category: 'Estructura',
    title: 'Plantillas y Quick Setup',
    description:
      'Elige Normal, Turbo, Deep Stack o Sit & Go, o abre «Quick Setup» para crear una estructura automática a medida.',
    tip: 'Edita cualquier ciega, ante o descanso con los botones - / + de cada fila.',
  },
  {
    id: 'structure-subtabs',
    tab: 'structure',
    targetSelector: '[data-tour="structure-subtabs"]',
    category: 'Estructura',
    title: 'Entradas, premios y fichas',
    description:
      'Configura entradas y porcentajes de premios en fichas, o personaliza colores y reparto inicial de tu maletín.',
    tip: 'Procura que los porcentajes de premios sumen 100 %.',
  },
  {
    id: 'league-roster',
    tab: 'league',
    targetSelector: '[data-tour="league-section"]',
    category: 'Liga',
    title: 'Jugadores, Asientos y Liga',
    description:
      'Añade amigos, sortea mesas con «Sortear asientos», anota KOs y guarda la partida para actualizar ROI y Liga.',
    tip: 'Cada torneo guardado alimenta el Historial y la clasificación por temporada.',
  },
  {
    id: 'tools-sidepot',
    tab: 'tools',
    targetSelector: '[data-tour="tools-sidepot"]',
    category: 'Botes',
    title: 'Botes Paralelos (All-In)',
    description:
      'Introduce las fichas apostadas por cada jugador y marca «Fold» si alguien se retiró para dividir el bote exacto.',
    tip: 'Al lado tienes la tabla completa de Orden de Manos de póker.',
  },
  {
    id: 'settings-section',
    tab: 'settings',
    targetSelector: '[data-tour="settings-sounds"]',
    category: 'Ajustes',
    title: 'Sonidos, temas y respaldo',
    description:
      'Elige color, prueba cada timbre (ciegas, descanso, 1m, 10s y Call Clock) y exporta copias JSON sin internet.',
    tip: 'Puedes activar el Modo Explorar Tooltips para tocar cualquier botón y ver qué hace.',
  },
];
