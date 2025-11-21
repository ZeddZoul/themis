'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { colors } from '@/lib/design-system';
import { FaArrowRight } from 'react-icons/fa';

export function CTA() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div 
          className="rounded-3xl p-12 md:p-20 text-center relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${colors.primary.accent} 0%, ${colors.primary.accentActive} 100%)`,
          }}
        >
          {/* Abstract Shapes */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-900/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Ready to ship with confidence?
            </h2>
            <p className="text-xl text-white/90 mb-10">
              Join thousands of developers who use Themis to ensure their apps are compliant and ready for the store.
            </p>
            <Link href="/login">
              <Button 
                className="h-14 px-10 text-lg rounded-full bg-white hover:bg-gray-50 transition-all shadow-xl"
                style={{ color: colors.primary.accent }}
              >
                Start Checking Now
                <FaArrowRight className="ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
