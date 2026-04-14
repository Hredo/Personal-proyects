import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VetHospital 24h | Gestión Veterinaria Profesional",
  description: "Sistema integral de gestión para hospitales veterinarios 24 horas. Cuidado experto para todo tipo de animales.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
