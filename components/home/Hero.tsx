'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { colors } from '@/lib/design-system';
import { FaArrowRight } from 'react-icons/fa';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Modern White Background with Animated Blobs */}
      <div className="absolute inset-0 z-0">
        {/* Base white background */}
        <div 
          className="absolute inset-0"
          style={{
            background: '#FFFFFF',
          }}
        />
        
        {/* Animated gradient blobs - More visible and vibrant */}
        {/* Top left - Large brown blob */}
        <div 
          className="absolute -top-20 -left-20 w-[700px] h-[700px] rounded-full animate-pulse"
          style={{
            background: 'linear-gradient(135deg, #8B4513 0%, #D2691E 100%)',
            filter: 'blur(100px)',
            opacity: 0.5,
            animationDuration: '8s',
          }}
        />
        
        {/* Top right - Large blue blob */}
        <div 
          className="absolute -top-10 -right-10 w-[800px] h-[800px] rounded-full animate-pulse"
          style={{
            background: 'linear-gradient(135deg, #1E40AF 0%, #60A5FA 100%)',
            filter: 'blur(100px)',
            opacity: 0.45,
            animationDuration: '10s',
            animationDelay: '1s',
          }}
        />
        
        {/* Center left - Medium red blob */}
        <div 
          className="absolute top-1/3 -left-32 w-[600px] h-[600px] rounded-full animate-pulse"
          style={{
            background: 'linear-gradient(135deg, #DC2626 0%, #F87171 100%)',
            filter: 'blur(90px)',
            opacity: 0.4,
            animationDuration: '12s',
            animationDelay: '2s',
          }}
        />
        
        {/* Center right - Medium amber blob */}
        <div 
          className="absolute top-1/2 -right-20 w-[650px] h-[650px] rounded-full animate-pulse"
          style={{
            background: 'linear-gradient(135deg, #B45309 0%, #FBBF24 100%)',
            filter: 'blur(95px)',
            opacity: 0.38,
            animationDuration: '9s',
            animationDelay: '3s',
          }}
        />
        
        {/* Bottom center - Large purple-blue blob */}
        <div 
          className="absolute -bottom-32 left-1/4 w-[750px] h-[750px] rounded-full animate-pulse"
          style={{
            background: 'linear-gradient(135deg, #5B21B6 0%, #818CF8 100%)',
            filter: 'blur(110px)',
            opacity: 0.42,
            animationDuration: '11s',
            animationDelay: '1.5s',
          }}
        />
        
        {/* Bottom right - Medium orange blob */}
        <div 
          className="absolute -bottom-20 right-1/4 w-[550px] h-[550px] rounded-full animate-pulse"
          style={{
            background: 'linear-gradient(135deg, #EA580C 0%, #FDBA74 100%)',
            filter: 'blur(85px)',
            opacity: 0.35,
            animationDuration: '13s',
            animationDelay: '4s',
          }}
        />
        
        {/* Floating center blob - Rose accent */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full animate-pulse"
          style={{
            background: 'linear-gradient(135deg, #BE123C 0%, #FDA4AF 100%)',
            filter: 'blur(100px)',
            opacity: 0.3,
            animationDuration: '14s',
            animationDelay: '2.5s',
          }}
        />
        
        {/* Lighter gradient overlay for better text readability */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.85) 100%)',
          }}
        />
      </div>

      <div className="container mx-auto px-4 z-10 relative pt-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span 
              className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-6 border backdrop-blur-sm"
              style={{ 
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                borderColor: 'rgba(220, 38, 38, 0.3)',
                color: colors.primary.accentActive
              }}
            >
              ✨ Now with Gemini 2.5
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold mb-6 tracking-tight"
            style={{ color: '#1F2937' }}
          >
            Automated Compliance for <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r" style={{ backgroundImage: `linear-gradient(to right, ${colors.primary.accent}, ${colors.primary.accentActive})` }}>
              Mobile Applications
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed"
            style={{ color: '#6B7280' }}
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
              <button
                className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white transition-all duration-300 ease-out rounded-full overflow-hidden"
                style={{ 
                  backgroundColor: colors.primary.accent,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 20px 40px -10px rgba(220, 38, 38, 0.4), 0 0 0 4px rgba(220, 38, 38, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(220, 38, 38, 0.3)';
                }}
              >
                {/* Shine effect on hover */}
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                
                <span className="relative flex items-center gap-2">
                  Get Started Free
                  <FaArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </button>
            </Link>
          </motion.div>

          {/* Stats/Trust */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-16 pt-8 border-t grid grid-cols-2 md:grid-cols-4 gap-8"
            style={{ borderColor: 'rgba(0, 0, 0, 0.1)' }}
          >
            {[
              { label: 'Checks Run', value: '10k+' },
              { label: 'Issues Found', value: '50k+' },
              { label: 'Time Saved', value: '1000h+' },
              { label: 'Accuracy', value: '99.9%' },
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-3xl font-bold mb-1" style={{ color: colors.primary.accent }}>{stat.value}</div>
                <div className="text-sm uppercase tracking-wider" style={{ color: '#6B7280' }}>{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
