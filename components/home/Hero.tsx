'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { colors } from '@/lib/design-system';
import { FaArrowRight } from 'react-icons/fa';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/hero-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-white" />
      </div>

      <div className="container mx-auto px-4 z-10 relative pt-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span 
              className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-6 border backdrop-blur-md"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: '#FFE5E0' // Light red tint
              }}
            >
              ✨ Now with Gemini 3.0 Pro AI
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold mb-6 tracking-tight text-white"
          >
            Automated Compliance for <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-800" style={{ backgroundImage: `linear-gradient(to right, ${colors.primary.accent}, ${colors.primary.accentActive})` }}>
              Mobile Applications
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl mb-10 text-gray-300 max-w-2xl mx-auto leading-relaxed"
          >
            Ensure your iOS and Android apps meet App Store and Play Store guidelines before you submit. Powered by advanced AI.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/login">
              <Button 
                className="h-14 px-8 text-lg rounded-full shadow-lg shadow-red-900/25 hover:shadow-red-900/40 transition-all"
                style={{ backgroundColor: colors.primary.accent }}
              >
                Get Started Free
                <FaArrowRight className="ml-2" />
              </Button>
            </Link>
          </motion.div>

          {/* Stats/Trust */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-16 pt-8 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {[
              { label: 'Checks Run', value: '10k+' },
              { label: 'Issues Found', value: '50k+' },
              { label: 'Time Saved', value: '1000h+' },
              { label: 'Accuracy', value: '99.9%' },
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-gray-400 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
