import { redirect } from "next/navigation";

// /software-gastronomico → canonical en /software-restaurantes para evitar contenido duplicado
// Redirect 308 permanent — Google transfiere el PageRank
export default function SoftwareGastronomicoPage() {
  redirect("/software-restaurantes");
}
