import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const px = (x: number, y: number, color: string) => (
  <div
    key={`${x}-${y}`}
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: 28,
      height: 28,
      borderRadius: 6,
      background: color,
    }}
  />
);

export default function AppleIcon() {
  const cream = "#F0EDE8";
  const cells: [number, number, string][] = [
    [17, 17, cream],
    [54, 17, cream],
    [90, 17, cream],
    [127, 17, cream],
    [17, 54, cream],
    [54, 54, cream],
    [90, 54, cream],
    [127, 54, cream],
    [90, 90, cream],
    [90, 127, cream],
    [54, 127, "#FF6B35"],
  ];

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "#0E1116",
        borderRadius: 34,
        position: "relative",
        display: "flex",
      }}
    >
      {cells.map(([x, y, color]) => px(x, y, color))}
    </div>,
    { ...size },
  );
}
