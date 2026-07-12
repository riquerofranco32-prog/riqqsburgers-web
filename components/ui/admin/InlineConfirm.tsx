"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

/** Compartidas para que cualquier transición de confirmación destructiva se vea igual. */
export const INLINE_CONFIRM_VARIANTS = {
  initial: { opacity: 0, scale: 0.94 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.94 },
};
export const INLINE_CONFIRM_TRANSITION = { duration: 0.18 };

const VARIANTS = INLINE_CONFIRM_VARIANTS;
const TRANSITION = INLINE_CONFIRM_TRANSITION;

/**
 * Transición compartida para el patrón "botón → confirmación inline (Sí/No)"
 * usado en eliminar producto/categoría/cupón/zona/miembro y cancelar pedido.
 * Solo anima el cambio de contenido; el comportamiento (qué hace cada acción)
 * lo definen los props `trigger`/`confirm` que le pasa cada caller.
 */
export function InlineConfirm({
  active,
  itemKey,
  trigger,
  confirm,
  fill = false,
}: {
  active: boolean;
  /** id único de la fila/ítem para que AnimatePresence no mezcle instancias distintas */
  itemKey: string;
  trigger: ReactNode;
  confirm: ReactNode;
  /** true = ocupa todo el ancho disponible (stacks verticales); false = se ajusta al contenido (toolbars/filas) */
  fill?: boolean;
}) {
  const wrapperStyle = fill
    ? { display: "block", width: "100%" }
    : { display: "inline-flex", alignItems: "center" };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {active ? (
        <motion.div
          key={`${itemKey}-confirm`}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={VARIANTS}
          transition={TRANSITION}
          style={wrapperStyle}
        >
          {confirm}
        </motion.div>
      ) : (
        <motion.div
          key={`${itemKey}-trigger`}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={VARIANTS}
          transition={TRANSITION}
          style={wrapperStyle}
        >
          {trigger}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
