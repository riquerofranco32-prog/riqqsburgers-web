import { readFileSync, writeFileSync } from 'fs';

const path = 'c:/Users/franc/OneDrive/Documentos/claude/riqqsburgers-web/app/[slug]/CatalogClient.tsx';
let src = readFileSync(path, 'utf8');

// Add a useEffect after the scroll restoration effect to check pills overflow on mount
const target = `  // ── Scroll restoration ───────────────────────────────────────────────────

  useEffect(() => {
    const key = \`scroll_\${restaurant.slug}\`;`;

const replacement = `  // ── Cat pills overflow check (hide arrow if no scroll needed) ──────────────

  useEffect(() => {
    const el = catBarRef.current;
    if (!el) return;
    const check = () => {
      setCatPillsAtEnd(el.scrollWidth <= el.clientWidth + 4);
    };
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, [restaurant.menu.categories]);

  // ── Scroll restoration ───────────────────────────────────────────────────

  useEffect(() => {
    const key = \`scroll_\${restaurant.slug}\`;`;

if (src.includes(target)) {
  src = src.replace(target, replacement);
  writeFileSync(path, src, 'utf8');
  console.log('OK - pills init effect added');
} else {
  console.log('NOT FOUND');
}
