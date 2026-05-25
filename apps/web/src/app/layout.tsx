import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zusk CEO",
  description: "A satirical idle game about Marlon Zusk automating his company with AI."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(()=>{try{const p=new URLSearchParams(location.search).get('theme');const s=localStorage.getItem('zusk-theme');const t=p==='dark'||p==='light'?p:s==='dark'?'dark':'light';document.documentElement.dataset.theme=t;}catch{}})();"
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
