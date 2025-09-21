import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSiteConfig } from '@/lib/config';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Dynamic metadata function to fetch site settings
export async function generateMetadata(): Promise<Metadata> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Get public system settings directly from database
    const { data: settings, error } = await supabase
      .from('SystemSetting')
      .select('key, value')
      .eq('isPublic', true)
      .order('key');

    if (!error && settings) {
      const settingsObject = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value === 'TRUE' ? true : 
                           setting.value === 'FALSE' ? false : 
                           setting.value;
        return acc;
      }, {} as Record<string, any>);

      const config = getSiteConfig();
      const siteName = settingsObject.siteName || config.siteName;
      const siteDescription = settingsObject.siteDescription || config.siteDescription;
      
      return {
        title: `${siteName} - ${siteDescription}`,
        description: siteDescription,
      };
    }
  } catch (error) {
    console.error('Error fetching site settings for metadata:', error);
  }
  
  // Fallback metadata
  const config = getSiteConfig();
  return {
    title: `${config.siteName} - ${config.siteDescription}`,
    description: config.siteDescription,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
