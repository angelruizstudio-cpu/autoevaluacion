import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Autoevaluación de liderazgo",
  description: "Seis maneras de dirigir — evaluación de estilos de liderazgo",
  robots: { index: false, follow: false }   // instrumento privado, no indexar
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Karla:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body><div className="wrap">{children}</div></body>
    </html>
  );
}
