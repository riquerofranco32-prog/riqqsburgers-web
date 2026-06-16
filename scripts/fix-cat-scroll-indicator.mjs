import { readFileSync, writeFileSync } from 'fs';

const path = 'c:/Users/franc/OneDrive/Documentos/claude/riqqsburgers-web/app/[slug]/CatalogClient.tsx';
let src = readFileSync(path, 'utf8');

// 1. Add catPillsAtEnd state after catBtnRefs declaration
const stateInsertTarget = `  const isScrollingToCat = useRef(false);`;
const stateInsertReplacement = `  const isScrollingToCat = useRef(false);
  const [catPillsAtEnd, setCatPillsAtEnd] = React.useState(false);`;

// Use simple useState instead — React is imported via named import so we use useState
// Actually useState is already imported, just use it
const stateInsertReplacement2 = `  const isScrollingToCat = useRef(false);
  const [catPillsAtEnd, setCatPillsAtEnd] = useState(false);`;

if (src.includes(stateInsertTarget)) {
  src = src.replace(stateInsertTarget, stateInsertReplacement2);
  console.log('OK - catPillsAtEnd state added');
} else {
  console.log('NOT FOUND: isScrollingToCat');
}

// 2. Add onScroll to catBarRef div — replace the pills wrapper div
const pillsScrollDiv = `                  <div
                    ref={catBarRef}
                    style={{
                      display: "flex",
                      gap: 6,
                      padding: "6px 16px 10px",
                      overflowX: "auto",
                      scrollbarWidth: "none" as const,
                      WebkitOverflowScrolling: "touch",
                    }}
                  >`;

const pillsScrollDivNew = `                  <div
                    ref={catBarRef}
                    onScroll={(e) => {
                      const el = e.currentTarget;
                      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
                      setCatPillsAtEnd(atEnd);
                    }}
                    style={{
                      display: "flex",
                      gap: 6,
                      padding: "6px 16px 10px",
                      overflowX: "auto",
                      scrollbarWidth: "none" as const,
                      WebkitOverflowScrolling: "touch",
                    }}
                  >`;

if (src.includes(pillsScrollDiv)) {
  src = src.replace(pillsScrollDiv, pillsScrollDivNew);
  console.log('OK - onScroll added to catBarRef div');
} else {
  console.log('NOT FOUND: catBarRef div');
}

// 3. Replace the cat-pills-fade-right div with a conditional arrow indicator
const fadeRightOld = `                  <div className="cat-pills-fade-right" />`;
const fadeRightNew = `                  {!catPillsAtEnd && (
                    <div
                      style={{
                        position: "absolute",
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: 48,
                        pointerEvents: "none",
                        zIndex: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        paddingRight: 8,
                        background: \`linear-gradient(to left, \${BG}ee, transparent)\`,
                        transition: "opacity 0.2s",
                      }}
                    >
                      <ChevronRight
                        size={16}
                        style={{ color: accent, opacity: 0.7 }}
                      />
                    </div>
                  )}`;

if (src.includes(fadeRightOld)) {
  src = src.replace(fadeRightOld, fadeRightNew);
  console.log('OK - cat pills scroll indicator added');
} else {
  console.log('NOT FOUND: cat-pills-fade-right div');
}

writeFileSync(path, src, 'utf8');
console.log('Done');
