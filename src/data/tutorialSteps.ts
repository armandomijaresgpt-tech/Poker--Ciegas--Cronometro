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
      'Tu director de torneo de póker 100% offline. Funciona sin internet ni datos móviles en teléfonos, tablets y televisores, usando siempre «fichas» virtuales y avisos sonoros distintos para cada evento.',
    tip: 'Todos tus cambios, estructuras, jugadores y ligas se guardan automáticamente en este dispositivo.',
  },
  {
    id: 'navigation',
    tab: 'clock',
    targetSelector: '[data-tour="nav-tabs"]',
    category: 'Inicio',
    title: 'Las 5 secciones principales',
    description:
      'Muévete entre Reloj (la partida en vivo), Estructura (ciegas, fichas y premios), Liga (jugadores, asientos e historial), Botes (All-In y manos) y Ajustes (sonidos, temas y respaldo).',
    tip: 'En móvil o tablet esta barra aparece abajo para que alcances todo cómodamente con el pulgar.',
  },
  {
    id: 'clock-header',
    tab: 'clock',
    targetSelector: '[data-tour="clock-header"]',
    category: 'Reloj',
    title: 'Título del torneo y nivel activo',
    description:
      'Toca el nombre del torneo (ej. «Póker entre Amigos») para escribir el título de tu partida. Justo debajo ves el número de nivel o descanso, la estructura cargada y el aviso de último minuto.',
    tip: 'Si activas «Pre-Game Intro» en Ajustes, verás una portada con el reparto de fichas antes de empezar el Nivel 1.',
  },
  {
    id: 'clock-timer',
    tab: 'clock',
    targetSelector: '[data-tour="clock-timer"]',
    category: 'Reloj',
    title: 'Cronómetro y barra interactiva',
    description:
      'Aquí ves el tiempo restante de la ronda. Puedes hacer clic o deslizar sobre la barra de progreso para avanzar o retroceder dentro del nivel, ajustar ±1 minuto o reiniciar la ronda actual.',
    tip: 'También ves el tiempo total acumulado, cuánto falta para el próximo descanso y cuándo cierran los rebuys.',
  },
  {
    id: 'clock-controls',
    tab: 'clock',
    targetSelector: '[data-tour="clock-playback"]',
    category: 'Reloj',
    title: 'Iniciar, pausar y cambiar de nivel',
    description:
      'Usa el botón central para poner en marcha o pausar el reloj, y las flechas laterales para saltar manualmente al nivel anterior o siguiente en cualquier momento.',
    tip: 'En ordenador usa la tecla Espacio para pausar/iniciar y las flechas ← / → para cambiar de nivel.',
  },
  {
    id: 'clock-blinds',
    tab: 'clock',
    targetSelector: '[data-tour="clock-blinds"]',
    category: 'Reloj',
    title: 'Ciegas actuales, Anterior y Siguiente',
    description:
      'Muestra en grande la Ciega Pequeña, la Ciega Grande y el Ante (si está activo). Debajo siempre tienes la referencia de la ronda anterior y lo que viene en el siguiente nivel o descanso.',
    tip: 'Puedes elegir entre Ante por jugador, Big Blind Ante o sin Ante desde la pestaña Estructura.',
  },
  {
    id: 'call-clock',
    tab: 'clock',
    targetSelector: '[data-tour="call-clock"]',
    category: 'Reloj',
    title: 'Call the Clock y modos de pantalla',
    description:
      'Pulsa «Call Clock» cuando un jugador tarde demasiado en decidir: abrirá una cuenta regresiva independiente (15s–60s) con alarma propia. A su lado tienes el Modo Minimalista (pantalla dividida gigante) y Pantalla Completa / Modo TV.',
    tip: 'El Modo Minimalista es ideal para dejar un móvil o tablet en el centro de la mesa visible desde todos los asientos.',
  },
  {
    id: 'table-stats',
    tab: 'clock',
    targetSelector: '[data-tour="table-stats"]',
    category: 'Reloj',
    title: 'Control de mesa en vivo y Deshacer',
    description:
      'Registra al instante nuevos jugadores (+Jugador), recompras (+Rebuy), Add-ons (+Add-on) o eliminaciones (-Jugador). El stack promedio en fichas y en Big Blinds (BB) se recalcula solo.',
    tip: 'Si tocas un botón por error, pulsa «Deshacer» o usa los ajustes finos (-1 Entrada, -1 Rebuy, -1 Add-on, -1 KO) debajo.',
  },
  {
    id: 'clock-sidebar',
    tab: 'clock',
    targetSelector: '[data-tour="clock-sidebar"]',
    category: 'Reloj',
    title: 'Bote, fichas, guía de manos y escalera',
    description:
      'En este panel lateral ves el bote acumulado en fichas y cuánto cobra cada puesto, los colores de tus fichas, la guía rápida de manos y la lista completa de niveles (puedes tocar cualquiera para saltar directo a él).',
    tip: 'Puedes ocultar o mostrar cualquiera de estos bloques desde Ajustes según el tamaño de tu pantalla.',
  },
  {
    id: 'structure-presets',
    tab: 'structure',
    targetSelector: '[data-tour="structure-presets"]',
    category: 'Estructura',
    title: 'Estructuras, Quick Setup y editor',
    description:
      'Elige entre Normal, Turbo, Deep Stack o Sit & Go, márcalas con ★ como favoritas o pulsa «Quick Setup» para que un asistente genere ciegas, descansos y reparto de fichas automáticamente según la duración que quieras.',
    tip: 'Usa los botones - y + de cada fila o escribe directamente las ciegas, el ante y los minutos. También puedes reordenar o añadir descansos.',
  },
  {
    id: 'structure-subtabs',
    tab: 'structure',
    targetSelector: '[data-tour="structure-subtabs"]',
    category: 'Estructura',
    title: 'Entradas en fichas, premios y maletín',
    description:
      'Cambia entre las sub-pestañas «Entradas, Rebuys y Premios» (para definir el coste en fichas y porcentajes 1.º/2.º/3.º...) y «Fichas y Stack» (para personalizar colores/valores de tu maletín y ver cuántas fichas dar a cada jugador).',
    tip: 'Comprueba que la suma de porcentajes de premios llegue al 100% para repartir el bote exacto.',
  },
  {
    id: 'league-roster',
    tab: 'league',
    targetSelector: '[data-tour="league-section"]',
    category: 'Liga',
    title: 'Jugadores, Asientos, Historial y Liga',
    description:
      'Añade los nombres de tus amigos, sortea mesas y asientos con «Sortear asientos», controla sus rebuys/KOs individuales y al terminar pulsa «Finalizar y guardar partida» para registrar el ganador.',
    tip: 'Cada partida guardada alimenta automáticamente el Historial, las Estadísticas (Balance en fichas y ROI) y la clasificación de tu Liga por temporada.',
  },
  {
    id: 'tools-sidepot',
    tab: 'tools',
    targetSelector: '[data-tour="tools-sidepot"]',
    category: 'Botes',
    title: 'Calculadora de Botes Paralelos (All-In)',
    description:
      '¿Varios jugadores fueron All-In con distintas cantidades de fichas? Introduce la apuesta total de cada uno y marca «Fold» si alguien se retiró. La app divide el bote principal y los botes paralelos explicando cada tramo paso a paso.',
    tip: 'A su lado siempre tienes la tabla completa de Orden de Manos de Póker con ejemplos de cartas.',
  },
  {
    id: 'settings-section',
    tab: 'settings',
    targetSelector: '[data-tour="settings-sounds"]',
    category: 'Ajustes',
    title: 'Temas, sonidos distintos y respaldo offline',
    description:
      'Elige uno de los 6 colores de mesa, prueba cada timbre (inicio, cambio de ciegas, 1 min, cuenta regresiva, descanso y Call Clock), activa la pantalla siempre encendida y exporta o importa copias de seguridad en JSON sin internet.',
    tip: 'También puedes activar o desactivar los tooltips flotantes o repetir este tutorial siempre que quieras desde el botón ? arriba.',
  },
];
