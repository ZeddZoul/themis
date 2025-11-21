'use client';

import { motion } from 'framer-motion';
import { colors } from '@/lib/design-system';

const steps = [
  {
    number: '01',
    title: 'Connect Repository',
    description: 'Link your GitHub account and select the mobile app repository you want to analyze.',
  },
  {
    number: '02',
    title: 'AI Analysis',
    description: 'Themis scans your codebase against thousands of store policies using Gemini 3.0 Pro.',
  },
  {
    number: '03',
    title: 'Fix & Submit',
    description: 'Review issues, copy suggested fixes, and export a compliance report for your records.',
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 relative overflow-hidden" style={{ backgroundColor: colors.background.subtle }}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: colors.text.primary }}>
            How Themis Works
          </h2>
          <p className="text-xl text-gray-600">
            From connection to compliance in three simple steps.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gray-200 -z-10 transform -translate-y-1/2" />

          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="relative"
            >
              <div className="bg-white w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg border-4 border-white relative z-10">
                <span className="text-3xl font-bold" style={{ color: colors.primary.accent }}>
                  {step.number}
                </span>
              </div>
              <div className="text-center px-4">
                <h3 className="text-xl font-bold mb-3" style={{ color: colors.text.primary }}>
                  {step.title}
                </h3>
                <p className="text-gray-600">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
