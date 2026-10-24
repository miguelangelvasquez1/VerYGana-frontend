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

// Barra inferior. Perfil no está aquí: es el botón que abre el menú. Juegos ocupa el lugar de Rifas.
export const MOBILE_BAR_ITEMS = [
  { href: "/home", label: "Inicio", Icon: Home },
  { href: "/ads", label: "Anuncios", Icon: Megaphone },
  { href: "/games", label: "Juegos", Icon: Gamepad2 },
  { href: "/pet", label: "Mascota", Icon: PawPrint },
  { href: "/products", label: "Productos", Icon: Package },
] as const;

export type MobileBarItem = (typeof MOBILE_BAR_ITEMS)[number];

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
  { href: "/raffles", label: "Rifas", Icon: Gift },
  { href: "/surveys", label: "Encuestas", Icon: ClipboardList },
  { href: "/plans/mobile-plans", label: "Recargas", Icon: Smartphone },
  { href: "/forum", label: "Foro", Icon: MessageSquare },
  { href: "/support", label: "Soporte", Icon: Headset },
] as const;

/** Juegos se marca activo en /games y sus subrutas; los demás, solo en su ruta exacta. */
export function isMobileBarItemActive(pathname: string, item: Pick<MobileBarItem, "href">): boolean {
  if (item.href === "/games") return pathname === "/games" || pathname.startsWith("/games/");
  return pathname === item.href;
}
