import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  // ponytail: 20% de traces de performance para no gastar la cuota gratis;
  // los errores (lo que nos importa acá) siempre se capturan al 100%.
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
