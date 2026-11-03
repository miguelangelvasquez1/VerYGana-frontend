import {
  ClipboardList,
  Gamepad2,
  Gift,
  Headset,
  Heart,
  Home,
  Megaphone,
  MessageSquare,
  Package,
  PawPrint,
  ShoppingBag,
  Smartphone,
  Ticket,
  UserCircle,
  Zap,
} from "lucide-react";

// Navegación del celular (spec 013): datos y lógica pura, sin JSX, para poder probarla en Vitest.

// Ancho (px) desde el que los accesos de la barra de escritorio llevan texto; por debajo, solo ícono (spec 016, CA-7).
// Medido con `e2e/desktop-header.spec.ts` (consumidor, saldo 9.999, fixture "Consumidor Prueba"): a 1920 el header
// con textos necesita 1870 px (logo 174 + accesos 1014 + acciones 602 + relleno 48 + 2 respiros de 16), y 1870
// redondeado hacia arriba a múltiplo de 16 es 1872. Si cambia el ancho de un grupo, se vuelve a medir. Las clases
// `min-[1872px]:` de `NavBarFrame.tsx` son literales (Tailwind las necesita escritas) y una prueba las compara.
export const DESKTOP_NAV_LABELS_MIN_WIDTH_PX = 1872;

// Barra de escritorio: los nueve accesos del consumidor, que comparte la barra sin sesión de `/`.
export const DESKTOP_NAV_ITEMS = [
  { href: '/home',              label: 'Inicio',    Icon: Home          },
  { href: '/raffles',           label: 'Sorteos',   Icon: Gift          },
  { href: '/games',             label: 'Juegos',    Icon: Gamepad2      },
  { href: '/pet',               label: 'Mascota',    Icon: PawPrint     },
  { href: '/ads',               label: 'Anuncios',  Icon: Megaphone     },
  { href: '/surveys',           label: 'Encuestas', Icon: ClipboardList },
  { href: '/products',          label: 'Productos', Icon: Package       },
  { href: '/plans/mobile-plans',label: 'Recargas',  Icon: Smartphone    },
  { href: '/forum',             label: 'Foro',      Icon: MessageSquare },
] as const;

// Barra inferior. Perfil no está aquí: es el botón que abre el menú. Juegos ocupa el lugar de Rifas.
export const MOBILE_BAR_ITEMS = [
  { href: "/home", label: "Inicio", Icon: Home },
  { href: "/ads", label: "Anuncios", Icon: Megaphone },
  { href: "/games", label: "Juegos", Icon: Gamepad2 },
  { href: "/pet", label: "Mascota", Icon: PawPrint },
  { href: "/products", label: "Productos", Icon: Package },
] as const;

// Menú de perfil del celular: incluye las páginas que la barra inferior no alcanza (rifas, encuestas,
// recargas, foro, favoritos y participaciones), que en escritorio sí están en la barra superior.
export const MOBILE_MENU_ITEMS = [
  { href: "/explore/gamification", label: "Mi Nivel", Icon: Zap },
  { href: "/explore/profile", label: "Mi Perfil", Icon: UserCircle },
  { href: "/explore/purchases", label: "Mis compras", Icon: ShoppingBag },
  { href: "/explore/favorites", label: "Mis favoritos", Icon: Heart },
  { href: "/explore/participations", label: "Mis participaciones", Icon: Ticket },
  { href: "/explore/referrals", label: "Mis Referidos", Icon: UserCircle },
  { href: "/games", label: "Juegos", Icon: Gamepad2 },
  { href: "/raffles", label: "Sorteos", Icon: Gift },
  { href: "/surveys", label: "Encuestas", Icon: ClipboardList },
  { href: "/plans/mobile-plans", label: "Recargas", Icon: Smartphone },
  { href: "/forum", label: "Foro", Icon: MessageSquare },
  { href: "/support", label: "Soporte", Icon: Headset },
] as const;

/** Juegos se marca activo en /games y sus subrutas; los demás, solo en su ruta exacta. */
export function isMobileBarItemActive(pathname: string, item: (typeof MOBILE_BAR_ITEMS)[number]): boolean {
  if (item.href === "/games") return pathname === "/games" || pathname.startsWith("/games/");
  return pathname === item.href;
}
