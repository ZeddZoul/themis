'use client';

import { motion } from 'framer-motion';
import { colors } from '@/lib/design-system';
import { FaRobot, FaShieldAlt, FaCode, FaChartLine, FaMobileAlt, FaBolt } from 'react-icons/fa';

const features = [
  {
    icon: FaRobot,
    title: 'AI-Powered Analysis',
    description: 'Leverages Gemini 3.0 Pro to understand context and nuance in your code, going beyond simple regex checks.',
    color: 'text-red-600',
    bg: 'bg-red-50',
  },
  {
    icon: FaMobileAlt,
    title: 'Store Policy Expert',
    description: 'Always up-to-date with the latest Apple App Store and Google Play Store review guidelines.',
    color: 'text-red-700',
    bg: 'bg-red-50',
  },
  {
    icon: FaCode,
    title: 'Intelligent Fixes',
    description: 'Doesn\'t just find problems—suggests actual code fixes you can copy and paste directly into your IDE.',
    color: 'text-red-600',
    bg: 'bg-red-50',
  },
  {
    icon: FaShieldAlt,
    title: 'Privacy First',
    description: 'Your code is analyzed in memory and never stored. We respect your intellectual property.',
    color: 'text-red-700',
    bg: 'bg-red-50',
  },
  {
    icon: FaChartLine,
    title: 'Historical Trends',
    description: 'Track your compliance score over time and visualize improvements with detailed dashboards.',
    color: 'text-red-600',
    bg: 'bg-red-50',
  },
  {
    icon: FaBolt,
    title: 'CI/CD Integration',
    description: 'Automate checks in your workflow with our GitHub Action and CLI tools. Catch issues before review.',
    color: 'text-red-700',
    bg: 'bg-red-50',
  },
];

export function Features() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl font-bold mb-4" style={{ color: colors.text.primary }}>
            Everything you need for <br />
            <span style={{ color: colors.primary.accent }}>
              Worry-Free App Submission
            </span>
          </h2>
          <p className="text-xl text-gray-600">
            Themis combines static analysis with advanced LLMs to provide the most comprehensive compliance checking available.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-8 rounded-2xl border border-gray-100 hover:border-red-100 hover:shadow-xl hover:shadow-red-900/5 transition-all duration-300 bg-white group"
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${feature.bg} ${feature.color} group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: colors.text.primary }}>
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
