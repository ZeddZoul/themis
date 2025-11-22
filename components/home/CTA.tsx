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
              <button
                className="group relative inline-flex items-center justify-center px-10 py-4 text-lg font-semibold transition-all duration-300 ease-out rounded-full overflow-hidden"
                style={{ 
                  backgroundColor: '#FFFFFF',
                  color: colors.primary.accent,
                  boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.2)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(0, 0, 0, 0.3), 0 0 0 4px rgba(255, 255, 255, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 10px 30px -5px rgba(0, 0, 0, 0.2)';
                }}
              >
                {/* Shine effect on hover */}
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-red-100/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                
                <span className="relative flex items-center gap-2">
                  Start Checking Now
                  <FaArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
