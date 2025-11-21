import { Hero } from '@/components/home/Hero';
import { Features } from '@/components/home/Features';
import { HowItWorks } from '@/components/home/HowItWorks';
import { CTA } from '@/components/home/CTA';

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Hero />
      <Features />
      <HowItWorks />
      <CTA />
      
      {/* Footer */}
      <footer className="bg-gray-50 py-12 border-t border-gray-100">
        <div className="container mx-auto px-4 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} Themis. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
