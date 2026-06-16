import { readFileSync, writeFileSync } from 'fs';

const path = 'c:/Users/franc/OneDrive/Documentos/claude/riqqsburgers-web/app/[slug]/CatalogClient.tsx';
let src = readFileSync(path, 'utf8');

const oldBlock = `                  ) : (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "64px 0",
                        color: TEXTM,
                      }}
                    >
                      <div
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: "50%",
                          background: SURFACE2,
                          margin: "0 auto 14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <SearchX size={24} strokeWidth={1.5} color={TEXTM} />
                      </div>
                      <p
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: TEXT2,
                          marginBottom: 6,
                        }}
                      >
                        Sin resultados
                      </p>
                      <p style={{ fontSize: 13 }}>
                        No encontramos &ldquo;{searchQuery}&rdquo;
                      </p>
                    </div>
                  )}`;

const newBlock = `                  ) : (
                    <div
                      style={{
                        textAlign: "center",
                        padding: "56px 24px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 52,
                          lineHeight: 1,
                          marginBottom: 4,
                        }}
                      >
                        🔍
                      </div>
                      <p
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: TEXT1,
                          margin: 0,
                        }}
                      >
                        Sin resultados para &ldquo;{searchQuery}&rdquo;
                      </p>
                      <p
                        style={{
                          fontSize: 13,
                          color: TEXT2,
                          margin: 0,
                          lineHeight: 1.5,
                        }}
                      >
                        Probá con otro término o revisá la ortografía
                      </p>
                      <button
                        onClick={() => setSearchQuery("")}
                        style={{
                          marginTop: 8,
                          padding: "10px 22px",
                          borderRadius: 999,
                          background: accent,
                          color: onAccent,
                          border: "none",
                          fontSize: 14,
                          fontWeight: 700,
                          cursor: "pointer",
                          WebkitTapHighlightColor: "transparent",
                        }}
                      >
                        Limpiar búsqueda
                      </button>
                    </div>
                  )}`;

if (src.includes(oldBlock)) {
  src = src.replace(oldBlock, newBlock);
  writeFileSync(path, src, 'utf8');
  console.log('OK - empty state replaced');
} else {
  console.log('NOT FOUND');
  // find partial
  const partialIdx = src.indexOf('Sin resultados\n                      </p>');
  console.log('Partial idx:', partialIdx);
}
