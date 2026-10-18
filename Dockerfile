# Imagen del front de verYganar (Next.js 15, salida standalone).
# Construir para la instancia de beta (ARM64):
#   docker build --platform linux/arm64 \
#     --build-arg NEXT_PUBLIC_API_URL=... --build-arg NEXT_PUBLIC_WS_URL=... \
#     --build-arg NEXT_PUBLIC_PET_GAME_URL=... --build-arg NEXT_PUBLIC_RECAPTCHA_SITE_KEY=... \
#     --build-arg NEXT_PUBLIC_PET_GAME_ORIGIN=https://mascotas-beta.verygana.com \
#     -t verygana-front:<sha-corto> .
#
# Las NEXT_PUBLIC_* se hornean en el bundle de JavaScript: son PÚBLICAS, nunca
# se pasa un secreto como ARG. Los secretos de servidor (NEXTAUTH_SECRET) y las
# variables de ejecución (NEXTAUTH_URL, API_URL, MIDDLEWARE) entran solo al
# arrancar el contenedor; el build no las necesita.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables públicas de build (valores de beta, no secretos).
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_PET_GAME_URL
ARG NEXT_PUBLIC_PET_GAME_ORIGIN
ARG NEXT_PUBLIC_RECAPTCHA_SITE_KEY
ARG NEXT_PUBLIC_CONTACT_EMAIL
ARG NEXT_PUBLIC_CONTACT_PHONE
ARG NEXT_PUBLIC_CONTACT_COPYRIGHT_YEAR
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL \
    NEXT_PUBLIC_PET_GAME_URL=$NEXT_PUBLIC_PET_GAME_URL \
    NEXT_PUBLIC_PET_GAME_ORIGIN=$NEXT_PUBLIC_PET_GAME_ORIGIN \
    NEXT_PUBLIC_RECAPTCHA_SITE_KEY=$NEXT_PUBLIC_RECAPTCHA_SITE_KEY \
    NEXT_PUBLIC_CONTACT_EMAIL=$NEXT_PUBLIC_CONTACT_EMAIL \
    NEXT_PUBLIC_CONTACT_PHONE=$NEXT_PUBLIC_CONTACT_PHONE \
    NEXT_PUBLIC_CONTACT_COPYRIGHT_YEAR=$NEXT_PUBLIC_CONTACT_COPYRIGHT_YEAR

# Falla pronto si falta una pública obligatoria: sin ellas el bundle saldría
# apuntando a localhost o sin reCAPTCHA (y `next build` rompe en /register).
RUN test -n "$NEXT_PUBLIC_API_URL" -a -n "$NEXT_PUBLIC_WS_URL" \
         -a -n "$NEXT_PUBLIC_PET_GAME_URL" -a -n "$NEXT_PUBLIC_RECAPTCHA_SITE_KEY" \
    || { echo "Faltan NEXT_PUBLIC_API_URL, NEXT_PUBLIC_WS_URL, NEXT_PUBLIC_PET_GAME_URL o NEXT_PUBLIC_RECAPTCHA_SITE_KEY (--build-arg)"; exit 1; }

# El origen del build de mascotas se hornea en las reescrituras al construir;
# sin él la imagen de beta apuntaría en silencio al bucket de dev.
RUN test -n "$NEXT_PUBLIC_PET_GAME_ORIGIN" \
    || { echo "Falta NEXT_PUBLIC_PET_GAME_ORIGIN (--build-arg): origen del build de mascotas, por ejemplo https://mascotas-beta.verygana.com"; exit 1; }

RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXTAUTH_URL_INTERNAL=http://localhost:3000

# Salida standalone: server.js + node_modules mínimos; estáticos y public aparte.
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/login || exit 1
CMD ["node", "server.js"]
