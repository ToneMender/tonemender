import "./globals.css";

export const metadata = {
  title: "ToneMender",
  description: "Say it better. Save it together.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}