export type SharePlatform = 'whatsapp' | 'facebook' | 'twitter' | 'email';

// URLs de "compartir a" por plataforma: cada una abre su propio compositor con el
// mensaje y el enlace ya rellenos, sin pasar por la API de esa red social.
export function buildShareUrls(message: string, link: string): Record<SharePlatform, string> {
  const text = `${message} ${link}`;

  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
    email: `mailto:?subject=${encodeURIComponent(message)}&body=${encodeURIComponent(text)}`,
  };
}
