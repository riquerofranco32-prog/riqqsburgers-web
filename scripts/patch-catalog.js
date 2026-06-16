// patch-catalog.js — aplica las 3 mejoras de UX al catálogo público
const fs = require("fs");
const path = require("path");

const filePath = path.join(
  __dirname,
  "..",
  "app",
  "[slug]",
  "CatalogClient.tsx",
);
let content = fs.readFileSync(filePath, "utf8");

// ── MEJORA 1: soldOut condition ─────────────────────────────────────────────
const OLD_SOLDOUT = "  const soldOut = item.badge === 'Agotado';";
const NEW_SOLDOUT =
  "  const soldOut = item.available === false || item.badge === 'Agotado';";

if (content.includes(OLD_SOLDOUT)) {
  content = content.replace(OLD_SOLDOUT, NEW_SOLDOUT);
  console.log("OK: soldOut condition");
} else {
  console.log("MISS: soldOut condition — already patched or changed");
}

// ── MEJORA 1: Reemplazar el interior del ProductCard (layout horizontal → vertical)
// Buscamos el bloque desde el return del componente hasta el });";" final
// Usamos markers únicos
const CARD_RETURN_MARKER = `  return (
    <div
      style={{
        animation: \`cardFadeIn 0.32s cubic-bezier(0.22,1,0.36,1) both\`,
        animationDelay: \`\${Math.min((idx ?? 0) * 0.04, 0.3)}s\`,
      }}
    >
      <div
        onClick={() => !soldOut && onOpen(item)}
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          padding: "12px 14px",`;

const CARD_END_MARKER = `          </button>
        </div>
      </div>
    </div>
  );
});`;

const NEW_CARD_RETURN = `  return (
    <div
      style={{
        animation: \`cardFadeIn 0.32s cubic-bezier(0.22,1,0.36,1) both\`,
        animationDelay: \`\${Math.min((idx ?? 0) * 0.04, 0.3)}s\`,
      }}
    >
      <div
        onClick={() => !soldOut && onOpen(item)}
        style={{
          display: "flex",
          flexDirection: "column",
          background: hexToRgba(SURFACE, 0.92),
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderRadius: 14,
          border: \`1px solid \${qty > 0 ? accent + "30" : BORDER}\`,
          cursor: soldOut ? "default" : "pointer",
          opacity: soldOut ? 0.7 : 1,
          boxShadow:
            qty > 0
              ? \`0 3px 16px \${accent}22\`
              : "0 2px 8px rgba(0,0,0,0.07)",
          transition:
            "box-shadow 0.35s ease, border-color 0.2s, transform 0.2s",
          userSelect: "none",
          WebkitTapHighlightColor: "transparent",
          overflow: "hidden",
          position: "relative",
        }}
        onMouseEnter={(e) => {
          if (!soldOut) {
            e.currentTarget.style.boxShadow =
              qty > 0
                ? \`0 8px 24px \${accent}30\`
                : "0 6px 20px rgba(0,0,0,0.13)";
            const img = e.currentTarget.querySelector(
              ".card-img"
            ) as HTMLElement | null;
            if (img) img.style.transform = "scale(1.05)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow =
            qty > 0
              ? \`0 3px 16px \${accent}22\`
              : "0 2px 8px rgba(0,0,0,0.07)";
          const img = e.currentTarget.querySelector(
            ".card-img"
          ) as HTMLElement | null;
          if (img) img.style.transform = "scale(1)";
        }}
        onTouchStart={(e) => {
          if (!soldOut) e.currentTarget.style.transform = "scale(0.985)";
        }}
        onTouchEnd={(e) => {
          e.currentTarget.style.transform = "";
        }}
        onTouchCancel={(e) => {
          e.currentTarget.style.transform = "";
        }}
      >
        {/* Image top */}
        <div
          className="img-skeleton"
          style={{
            width: "100%",
            height: 160,
            overflow: "hidden",
            position: "relative",
            flexShrink: 0,
            background: \`linear-gradient(135deg, \${accent}14, \${accent}06)\`,
          }}
        >
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              loading="lazy"
              decoding="async"
              className="card-img"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                transition: "transform 0.35s ease",
              }}
              onLoad={(e) => {
                (
                  e.currentTarget.parentElement as HTMLElement
                ).classList.remove("img-skeleton");
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontSize: 38,
                  fontWeight: 900,
                  color: accent + "50",
                  lineHeight: 1,
                  userSelect: "none",
                }}
              >
                {item.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          {/* Badge PROMO flotante sobre la imagen */}
          {item.is_featured && !soldOut && (
            <div
              className="promo-badge-pulse"
              style={{
                position: "absolute",
                top: 8,
                left: 8,
                background: accent,
                color: onAccent,
                fontSize: 9,
                fontWeight: 800,
                padding: "3px 8px",
                borderRadius: 999,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                boxShadow: \`0 2px 8px \${accent}55\`,
                zIndex: 3,
              }}
            >
              PROMO
            </div>
          )}
          {/* Overlay Agotado */}
          {soldOut && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.55)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2,
              }}
            >
              <span
                style={{
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                }}
              >
                Agotado
              </span>
            </div>
          )}
          {/* Favorite button */}
          <button
            aria-label={
              isFavorite
                ? \`Quitar \${item.name} de favoritos\`
                : \`Guardar \${item.name} en favoritos\`
            }
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(item);
            }}
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: isFavorite ? "#EF4444" : "rgba(0,0,0,0.35)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition:
                "transform 0.18s cubic-bezier(0.34,1.56,0.64,1), background 0.15s",
              WebkitTapHighlightColor: "transparent",
              zIndex: 5,
            }}
            onMouseDown={(e) =>
              (e.currentTarget.style.transform = "scale(0.82)")
            }
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            onTouchStart={(e) =>
              (e.currentTarget.style.transform = "scale(0.82)")
            }
            onTouchEnd={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <Heart
              size={13}
              strokeWidth={isFavorite ? 0 : 2}
              fill={isFavorite ? "#fff" : "rgba(255,255,255,0.85)"}
              color={isFavorite ? "#fff" : "rgba(255,255,255,0.85)"}
            />
          </button>
        </div>

        {/* Content below image */}
        <div
          style={{
            padding: "10px 12px 12px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 4,
            position: "relative",
          }}
        >
          {item.badge && item.badge !== "" && item.badge !== "Agotado" && (
            <div>
              <Badge badge={item.badge} />
            </div>
          )}
          <span
            style={{
              fontWeight: 700,
              fontSize: 13,
              color: TEXT1,
              lineHeight: 1.3,
              display: "block",
            }}
          >
            {item.name}
          </span>
          {item.description && (
            <p
              style={{
                fontSize: 11,
                color: TEXT2,
                margin: 0,
                lineHeight: 1.4,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient:
                  "vertical" as React.CSSProperties["WebkitBoxOrient"],
                overflow: "hidden",
              }}
            >
              {item.description}
            </p>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 4,
            }}
          >
            <span
              style={{
                fontWeight: 800,
                fontSize: 15,
                color: accent,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {item.extras && item.extras.length > 0
                ? \`desde \${fmt(item.price)}\`
                : fmt(item.price)}
            </span>
          </div>

          {/* Stepper or Add button */}
          {!soldOut && (
            <div
              style={{ marginTop: 6 }}
              onClick={(e) => e.stopPropagation()}
            >
              {qty === 0 ? (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    aria-label={\`Agregar \${item.name}\`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAdd(item);
                    }}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: accent,
                      color: onAccent,
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      boxShadow: \`0 3px 10px \${accent}55\`,
                      transition:
                        "transform 0.15s cubic-bezier(0.34,1.56,0.64,1)",
                      WebkitTapHighlightColor: "transparent",
                    }}
                    onTouchStart={(e) =>
                      (e.currentTarget.style.transform = "scale(0.82)")
                    }
                    onTouchEnd={(e) =>
                      (e.currentTarget.style.transform = "scale(1)")
                    }
                    onMouseDown={(e) =>
                      (e.currentTarget.style.transform = "scale(0.88)")
                    }
                    onMouseUp={(e) =>
                      (e.currentTarget.style.transform = "scale(1)")
                    }
                  >
                    <Plus size={15} />
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 4,
                    background: SURFACE2,
                    borderRadius: 18,
                    padding: "3px 4px",
                    border: \`1px solid \${accent}30\`,
                  }}
                >
                  <button
                    aria-label={\`Quitar uno de \${item.name}\`}
                    onClick={() => onRemove(item)}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: "transparent",
                      border: "none",
                      color: accent,
                      fontSize: 16,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    −
                  </button>
                  <span
                    key={qty}
                    className="qty-flip"
                    style={{
                      fontWeight: 800,
                      fontSize: 13,
                      minWidth: 14,
                      textAlign: "center",
                      color: TEXT1,
                      display: "block",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {qty}
                  </span>
                  <button
                    aria-label={\`Agregar otro \${item.name}\`}
                    onClick={() => onAdd(item)}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: accent,
                      border: "none",
                      color: onAccent,
                      fontSize: 16,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});`;

const startIdx = content.indexOf(CARD_RETURN_MARKER);
const endIdx = content.indexOf(CARD_END_MARKER);

if (startIdx !== -1 && endIdx !== -1) {
  const before = content.slice(0, startIdx);
  const after = content.slice(endIdx + CARD_END_MARKER.length);
  content = before + NEW_CARD_RETURN + after;
  console.log("OK: ProductCard body replaced (vertical layout)");
} else {
  console.log(
    `MISS: ProductCard body (startIdx=${startIdx}, endIdx=${endIdx})`,
  );
}

// ── MEJORA 1: Grid de productos — usar product-grid-vertical ───────────────
// Reemplazar los dos contenedores de items (search results y categories)
// con la clase de grid vertical

// En search results: flex column → grid
const OLD_SEARCH_LIST = `                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {searchResults.map((item, idx) => (`;

const NEW_SEARCH_LIST = `                    <div className="product-grid-vertical">
                      {searchResults.map((item, idx) => (`;

if (content.includes(OLD_SEARCH_LIST)) {
  content = content.replace(OLD_SEARCH_LIST, NEW_SEARCH_LIST);
  console.log("OK: search results grid");
} else {
  console.log("MISS: search results grid");
}

// En categories: flex column → grid
const OLD_CAT_LIST = `                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 8,
                              marginBottom: 4,
                            }}
                          >
                            {cat.items.map((item, idx) => (`;

const NEW_CAT_LIST = `                          <div className="product-grid-vertical" style={{ marginBottom: 4 }}>
                            {cat.items.map((item, idx) => (`;

if (content.includes(OLD_CAT_LIST)) {
  content = content.replace(OLD_CAT_LIST, NEW_CAT_LIST);
  console.log("OK: category items grid");
} else {
  console.log("MISS: category items grid");
}

// ── MEJORA 2: Category pills — fades + pill activa mejorada ────────────────
const OLD_PILL_WRAPPER = `              {/* Category pills — mobile only, desktop uses sidebar */}
              {!searchQuery && (
                <div
                  ref={catBarRef}
                  className="lg:hidden"
                  style={{
                    display: "flex",
                    gap: 6,
                    padding: "6px 16px 10px",
                    overflowX: "auto",
                    scrollbarWidth: "none",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  {restaurant.menu.categories.map((cat) => {
                    const isActive = activeCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        ref={(el) => {
                          catBtnRefs.current[cat.id] = el;
                        }}
                        onClick={() => scrollToCategory(cat.id)}
                        style={{
                          flexShrink: 0,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "8px 16px",
                          minHeight: 40,
                          borderRadius: 999,
                          border: "none",
                          fontWeight: isActive ? 600 : 500,
                          fontSize: 14,
                          cursor: "pointer",
                          transition: "all 0.18s ease",
                          background: isActive ? accent : SURFACE2,
                          color: isActive ? onAccent : TEXT2,
                          WebkitTapHighlightColor: "transparent",
                          letterSpacing: "-0.01em",
                          fontFamily:
                            "var(--font-dm, var(--font-sans, inherit))",
                        }}
                      >
                        {cat.emoji && (
                          <span style={{ fontSize: 14 }}>{cat.emoji}</span>
                        )}
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              )}`;

const NEW_PILL_WRAPPER = `              {/* Category pills — mobile only, desktop uses sidebar */}
              {!searchQuery && (
                <div className="lg:hidden cat-pills-wrapper">
                  {/* Fade overlays */}
                  <div className="cat-pills-fade-left" />
                  <div className="cat-pills-fade-right" />
                  <div
                    ref={catBarRef}
                    style={{
                      display: "flex",
                      gap: 6,
                      padding: "6px 16px 10px",
                      overflowX: "auto",
                      scrollbarWidth: "none" as const,
                      WebkitOverflowScrolling: "touch",
                    }}
                  >
                    {restaurant.menu.categories.map((cat) => {
                      const isActive = activeCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          ref={(el) => {
                            catBtnRefs.current[cat.id] = el;
                          }}
                          onClick={() => {
                            scrollToCategory(cat.id);
                            catBtnRefs.current[cat.id]?.scrollIntoView({
                              behavior: "smooth",
                              block: "nearest",
                              inline: "center",
                            });
                          }}
                          style={{
                            flexShrink: 0,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "8px 16px",
                            minHeight: 36,
                            borderRadius: 999,
                            border: isActive
                              ? "none"
                              : \`1px solid \${BORDER}\`,
                            fontWeight: isActive ? 700 : 500,
                            fontSize: 14,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            background: isActive ? accent : SURFACE2,
                            color: isActive ? onAccent : TEXT2,
                            WebkitTapHighlightColor: "transparent",
                            letterSpacing: "-0.01em",
                            fontFamily:
                              "var(--font-dm, var(--font-sans, inherit))",
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.borderColor = accent;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.borderColor = BORDER;
                            }
                          }}
                        >
                          {cat.emoji && (
                            <span style={{ fontSize: 14 }}>{cat.emoji}</span>
                          )}
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}`;

if (content.includes(OLD_PILL_WRAPPER)) {
  content = content.replace(OLD_PILL_WRAPPER, NEW_PILL_WRAPPER);
  console.log("OK: category pills improved");
} else {
  console.log("MISS: category pills wrapper");
}

// ── MEJORA 3: Cart bar — pill centrada ────────────────────────────────────
const OLD_CART_BAR = `              <button
                onClick={() => {
                  vibrate(50);
                  setCartOpen(true);
                }}
                style={
                  {
                    position: "fixed",
                    bottom: \`max(16px, env(safe-area-inset-bottom, 16px))\`,
                    left: 16,
                    right: 16,
                    zIndex: 60,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: accent,
                    color: onAccent,
                    border: "none",
                    borderRadius: 16,
                    padding: "14px 18px",
                    cursor: "pointer",
                    boxShadow: \`0 6px 28px \${accent}50\`,
                    WebkitTapHighlightColor: "transparent",
                    maxWidth: 608,
                    marginLeft: "auto",
                    marginRight: "auto",
                    animation: cartBounce
                      ? "cartPop 0.35s cubic-bezier(0.36,0.07,0.19,0.97)"
                      : "cartEnter 0.3s cubic-bezier(0.22,1,0.36,1)",
                  } as React.CSSProperties
                }
              >
                {/* Icon + count */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "rgba(255,255,255,0.2)",
                    borderRadius: 10,
                    padding: "5px 10px",
                    flexShrink: 0,
                  }}
                >
                  <ShoppingCart
                    size={16}
                    strokeWidth={2}
                    style={{
                      animation: cartBounce ? "badgePop 0.35s ease" : undefined,
                    }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>
                    {totalItems}
                  </span>
                </div>
                {/* Label */}
                <span
                  style={{
                    flex: 1,
                    textAlign: "center",
                    fontWeight: 600,
                    fontSize: 15,
                    letterSpacing: "-0.01em",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: 180,
                  }}
                >
                  {totalItems === 1
                    ? (cart[0]?.name?.split(" ").slice(0, 3).join(" ") ??
                      "Ver pedido")
                    : \`\${totalItems} ítems\`}
                </span>
                {/* Price */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontWeight: 800, fontSize: 15 }}>
                    {fmt(subtotal)}
                  </span>
                  {hasDelivery && (
                    <span style={{ fontSize: 10, opacity: 0.7 }}>
                      + envío {fmt(restaurant.delivery_cost)}
                    </span>
                  )}
                </div>
              </button>`;

const NEW_CART_BAR = `              <button
                onClick={() => {
                  vibrate(50);
                  setCartOpen(true);
                }}
                style={
                  {
                    position: "fixed",
                    bottom: \`calc(16px + env(safe-area-inset-bottom, 0px))\`,
                    left: "50%",
                    transform: cartBounce
                      ? "translateX(-50%) scale(1.04)"
                      : "translateX(-50%) translateY(0)",
                    zIndex: 60,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: accent,
                    color: onAccent,
                    border: "none",
                    borderRadius: 999,
                    padding: "14px 24px",
                    cursor: "pointer",
                    boxShadow: \`0 4px 20px rgba(0,0,0,0.25), 0 2px 12px \${accent}55\`,
                    WebkitTapHighlightColor: "transparent",
                    whiteSpace: "nowrap",
                    animation: cartBounce
                      ? undefined
                      : "cartEnter 0.3s cubic-bezier(0.22,1,0.36,1)",
                    transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1), box-shadow 0.2s",
                  } as React.CSSProperties
                }
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = \`0 8px 28px rgba(0,0,0,0.28), 0 4px 16px \${accent}66\`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = \`0 4px 20px rgba(0,0,0,0.25), 0 2px 12px \${accent}55\`;
                }}
              >
                {/* Cart icon */}
                <ShoppingCart
                  size={16}
                  strokeWidth={2}
                />
                {/* Label */}
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 15,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Ver pedido
                </span>
                {/* Badge cantidad */}
                <span
                  key={totalItems}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(255,255,255,0.25)",
                    borderRadius: 999,
                    minWidth: 24,
                    height: 24,
                    padding: "0 6px",
                    fontSize: 12,
                    fontWeight: 800,
                    animation: cartBounce ? "badgePop 0.2s cubic-bezier(0.34,1.56,0.64,1)" : undefined,
                  }}
                >
                  {totalItems}
                </span>
                {/* Precio */}
                <span style={{ fontWeight: 800, fontSize: 15 }}>
                  {fmt(subtotal)}
                </span>
              </button>`;

if (content.includes(OLD_CART_BAR)) {
  content = content.replace(OLD_CART_BAR, NEW_CART_BAR);
  console.log("OK: cart bar → pill centrada");
} else {
  console.log("MISS: cart bar");
}

// ── MEJORA 3: también agregar CSS de hide del cart bar cuando qty=0 ─────────
// La animación de salida no existe todavía — el cart bar aparece/desaparece por condicional
// Agregar keyframe de entrada con translateX en el <style> inline
const OLD_CART_ENTER_KF = `        @keyframes cartEnter {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }`;

const NEW_CART_ENTER_KF = `        @keyframes cartEnter {
          from { transform: translateX(-50%) translateY(20px); opacity: 0; }
          to   { transform: translateX(-50%) translateY(0);    opacity: 1; }
        }`;

if (content.includes(OLD_CART_ENTER_KF)) {
  content = content.replace(OLD_CART_ENTER_KF, NEW_CART_ENTER_KF);
  console.log("OK: cartEnter keyframe updated for pill");
} else {
  console.log("MISS: cartEnter keyframe");
}

fs.writeFileSync(filePath, content, "utf8");
console.log("\nDone — CatalogClient.tsx written.");
