'use client';

import { useState, useEffect } from 'react';
import Lottie from 'lottie-react';
import { colors } from '@/lib/design-system';

interface SimpleLoadingProps {
  onComplete?: () => void;
  checkRunId?: string;
  enableRealTimeSync?: boolean;
  title?: string;
  subtitle?: string;
}

export function SimpleLoading({ 
  onComplete,
  checkRunId,
  enableRealTimeSync = false,
  title = "Running Compliance Check",
  subtitle = "Themis is analyzing your repository"
}: SimpleLoadingProps) {
  const [animationData, setAnimationData] = useState<any>(null);
  const [currentMessage, setCurrentMessage] = useState("Starting compliance analysis...");
  const [isComplete, setIsComplete] = useState(false);

  // Load Lottie animation
  useEffect(() => {
    const loadAnimation = async () => {
      try {
        const response = await fetch('/loading-animation.json');
        if (!response.ok) {
          throw new Error(`Failed to load animation: ${response.status}`);
        }
        
        const data = await response.json();
        const customizedData = applyCustomColors(data);
        setAnimationData(customizedData);
      } catch (error) {
        console.error('Failed to load Lottie animation:', error);
      }
    };

    loadAnimation();
  }, []);

  // Apply custom colors to Lottie animation
  const applyCustomColors = (animationData: any) => {
    if (!animationData || !animationData.layers) return animationData;

    const primaryColor = '#8D240C'; // Brown
    const secondaryColor = '#1A2833'; // Periwinkle
    
    const hexToRgb = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      return [r, g, b, 1];
    };

    const primaryRgb = hexToRgb(primaryColor);
    const secondaryRgb = hexToRgb(secondaryColor);
    const customData = JSON.parse(JSON.stringify(animationData));

    const getDiagonalColor = (index: number) => {
      return (index === 0 || index === 3) ? primaryRgb : secondaryRgb;
    };

    let elementIndex = 0;

    const updateColors = (obj: any) => {
      if (Array.isArray(obj)) {
        obj.forEach((item) => updateColors(item));
      } else if (obj && typeof obj === 'object') {
        if (obj.c && obj.c.k && Array.isArray(obj.c.k) && obj.c.k.length >= 3) {
          const targetColor = getDiagonalColor(elementIndex % 4);
          obj.c.k = [...targetColor];
          elementIndex++;
        }
        
        if (obj.fc && obj.fc.k && Array.isArray(obj.fc.k) && obj.fc.k.length >= 3) {
          const targetColor = getDiagonalColor(elementIndex % 4);
          obj.fc.k = [...targetColor];
          elementIndex++;
        }
        
        if (obj.sc && obj.sc.k && Array.isArray(obj.sc.k) && obj.sc.k.length >= 3) {
          const targetColor = getDiagonalColor(elementIndex % 4);
          obj.sc.k = [...targetColor];
          elementIndex++;
        }
        
        Object.keys(obj).forEach(key => {
          updateColors(obj[key]);
        });
      }
    };

    updateColors(customData);
    return customData;
  };

  // Real-time progress tracking
  useEffect(() => {
    if (!enableRealTimeSync || !checkRunId) {
      return;
    }

    const checkProgress = async () => {
      try {
        const response = await fetch(`/api/v1/checks/${checkRunId}/progress`);
        if (response.ok) {
          const data = await response.json();
          
          // Simple message - just wait until complete
          if (data.status === 'COMPLETED') {
            setCurrentMessage("Analysis complete!");
          } else if (data.status === 'FAILED') {
            setCurrentMessage("Analysis failed. Please try again.");
          } else {
            setCurrentMessage("Themis is generating compliance report...");
          }
          
          if (data.status === 'COMPLETED' || data.status === 'FAILED') {
            setIsComplete(true);
            setCurrentMessage("Analysis complete!");
            // Show completion message briefly before navigating
            setTimeout(() => onComplete?.(), 1500);
            return; // Stop polling
          } else {
            setTimeout(checkProgress, 1000);
          }
        } else {
          setTimeout(checkProgress, 3000);
        }
      } catch (error) {
        console.error('Failed to check progress:', error);
        setTimeout(checkProgress, 3000);
      }
    };

    checkProgress();
  }, [enableRealTimeSync, checkRunId, onComplete]);

  // Realistic message cycling that matches backend process
  useEffect(() => {
    if (enableRealTimeSync && checkRunId) return; // Skip if real-time sync is enabled
    
    const messages = [
      "Starting compliance analysis...",
      "Fetching repository files...",
      "Running deterministic rules engine...",
      "Checking compliance violations...",
      "Running Themis content validation...",
      "Starting Themis augmentation for issues...",
      "Themis analyzing violations and suggesting fixes..."
      // Note: "Finalizing analysis results..." and "Analysis complete!" 
      // will be shown only when API actually completes
    ];
    
    let messageIndex = 0;
    const intervals: NodeJS.Timeout[] = [];
    
    const updateMessage = (message: string, delay: number) => {
      const timer = setTimeout(() => {
        if (!isComplete) {
          setCurrentMessage(message);
        }
      }, delay);
      intervals.push(timer);
    };
    
    // Show messages at realistic intervals, but stop before completion messages
    const timings = [0, 8000, 20000, 35000, 50000, 65000, 80000]; // milliseconds
    
    messages.forEach((message, index) => {
      updateMessage(message, timings[index]);
    });
    
    // After the last timed message, keep showing the last analysis message
    // until the API actually completes
    
    return () => {
      intervals.forEach(timer => clearTimeout(timer));
    };
  }, [enableRealTimeSync, checkRunId, isComplete]);

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm"
      style={{ 
        backgroundColor: colors.background.main + 'F0',
        backgroundImage: `radial-gradient(circle at 25% 25%, ${colors.primary.accent}08 0%, transparent 50%), radial-gradient(circle at 75% 75%, #6B2C9108 0%, transparent 50%)`
      }}
    >
      <div className="max-w-lg w-full mx-4 text-center">
          {/* Lottie Animation */}
          <div className="flex justify-center mb-6">
            {animationData && (
              <div className="w-32 h-32 relative">
                <Lottie
                  animationData={{
                    ...animationData,
                    fr: animationData.fr ? animationData.fr * 0.8 : 30 * 0.8
                  }}
                  loop={true}
                  autoplay={true}
                  style={{
                    width: '100%',
                    height: '100%',
                  }}
                  rendererSettings={{
                    preserveAspectRatio: 'xMidYMid slice',
                    progressiveLoad: false,
                    hideOnTransparent: true,
                  }}
                />
                
                {/* Subtle rotating ring around animation */}
                <div 
                  className="absolute inset-0 rounded-full border-2 border-dashed animate-spin opacity-20"
                  style={{ 
                    borderColor: colors.primary.accent,
                    animationDuration: '8s'
                  }}
                />
              </div>
            )}
          </div>

          {/* Title and Subtitle */}
          <h2 
            className="text-2xl font-bold mb-2"
            style={{ color: colors.text.primary }}
          >
            {title}
          </h2>
          <p 
            className="text-base mb-6"
            style={{ color: colors.text.secondary }}
          >
            {subtitle}
          </p>

          {/* Progress Message */}
          <div className="min-h-[2.5rem] flex items-center justify-center">
            <div 
              className="animate-fadeIn transition-all duration-500"
              key={currentMessage} // Force re-render for animation
            >
              <div className="flex items-center justify-center space-x-2">
                {isComplete ? (
                  // Show checkmark when complete
                  <div 
                    className="w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: colors.status.success }}
                  >
                    <svg 
                      className="w-2.5 h-2.5 text-white" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  </div>
                ) : (
                  // Show pulsing dot while loading
                  <div 
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: colors.primary.accent }}
                  />
                )}
                <p 
                  className="text-sm font-medium"
                  style={{ 
                    color: isComplete ? colors.status.success : colors.text.primary 
                  }}
                >
                  {currentMessage}
                </p>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}