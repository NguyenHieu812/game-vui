import type {Metadata} from 'next';
import { Quicksand } from 'next/font/google';
import './globals.css'; // Global styles

const quicksand = Quicksand({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-quicksand',
});

export const metadata: Metadata = {
  title: 'Kids Game Studio',
  description: 'A fun game studio for kids featuring a Duck Race and a Lucky Wheel.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${quicksand.variable}`}>
      <body className="font-quicksand antialiased bg-blue-50 text-slate-800 min-h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
