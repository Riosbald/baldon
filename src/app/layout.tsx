
import './globals.css';
import { Inter } from 'next/font/google';
import Image from 'next/image';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'LOG_ON AI - Voice-First Business Intelligence',
  description: 'Realtime voice-first conversational AI agent',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <link rel="icon" href="/favicon.ico" />
        <header className="sticky top-0 z-40 border-b border-white/5 bg-bg/80 backdrop-blur">
          <div className="container-app flex items-center justify-between py-3 gap-4">
            <div className="flex items-center gap-3">
              <Image src="/logo.svg" alt="LOG_ON" width={36} height={36} />
              <div className="text-lg font-semibold">LOG_ON AI</div>
              <div className="hidden md:block text-sm text-text-dim">A Realtime Voice-First Business Dialogue and Conversational AI Agent powered by LOG_ON</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="badge">⭐ 7.2K <span className="hidden sm:inline">logon_ai</span></div>
              <div className="relative">
                <details className="group">
                  <summary className="list-none btn">☰</summary>
                  <div className="absolute right-0 mt-2 w-80 p-3 card">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="font-semibold mb-2 text-text-soft">Marketplace</div>
                        <ul className="space-y-1 text-text-dim">
                          <li className="hover:text-text cursor-pointer">Pre-built Agent Templates</li>
                          <li className="hover:text-text cursor-pointer">Custom Agent Marketplace</li>
                          <li className="hover:text-text cursor-pointer">Community Configurations</li>
                          <li className="hover:text-text cursor-pointer">Premium Solutions</li>
                        </ul>
                      </div>
                      <div>
                        <div className="font-semibold mb-2 text-text-soft">Vendors</div>
                        <ul className="space-y-1 text-text-dim">
                          <li className="hover:text-text cursor-pointer">Integration Partners</li>
                          <li className="hover:text-text cursor-pointer">Service Providers</li>
                          <li className="hover:text-text cursor-pointer">API Marketplace</li>
                          <li className="hover:text-text cursor-pointer">Enterprise Solutions</li>
                        </ul>
                      </div>
                      <div>
                        <div className="font-semibold mb-2 text-text-soft">Connect With Us</div>
                        <ul className="space-y-1 text-text-dim">
                          <li className="hover:text-text cursor-pointer">Support & Documentation</li>
                          <li className="hover:text-text cursor-pointer">Community Forums</li>
                          <li className="hover:text-text cursor-pointer">Feedback</li>
                          <li className="hover:text-text cursor-pointer">Contact Us</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </details>
              </div>
              <button id="settingsBtn" className="btn" type="button" onClick={() => {
                const el = document.getElementById('settings-modal') as HTMLDialogElement | null;
                el?.showModal();
              }}>⚙️</button>
              <button className="btn btn-primary">Disconnect</button>
            </div>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
