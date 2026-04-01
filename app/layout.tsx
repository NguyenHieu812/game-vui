import type {Metadata} from 'next';
import { Quicksand, Geist } from 'next/font/google';
import './globals.css';
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
    <html lang="en" className={cn(quicksand.variable, "font-sans", geist.variable)}>
      <body className="font-quicksand antialiased bg-blue-50 text-slate-800 min-h-screen" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
