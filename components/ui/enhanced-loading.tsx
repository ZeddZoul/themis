'use client';

import { useState, useEffect, useCallback } from 'react';
import Lottie from 'lottie-react';
import { colors } from '@/lib/design-system';

interface EnhancedLoadingProps {
  title?: string;
  subtitle?: string;
  checkRunId?: string;
  onComplete?: () => void;
  enableRealTimeSync?: boolean; // New prop to enable real-time backend sync
  platform?: string;
  fileCount?: number;
}

export function EnhancedLoading({ 
  title = "Running Compliance Check",
  subtitle = "Themis is analyzing your repository",
  checkRunId,
  onComplete,
  enableRealTimeSync = false,
  platform,
  fileCount: initialFileCount,
}: EnhancedLoadingProps) {
  const [currentMessage, setCurrentMessage] = useState("Starting compliance analysis...");
  const [animationData, setAnimationData] = useState<any>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileCount, setFileCount] = useState(0);


  // Load Lottie animation and apply custom colors
  useEffect(() => {
    const loadAnimation = async () => {
      try {
        // Load the JSON animation (primary choice)
        const response = await fetch('/loading-animation.json');
        if (!response.ok) {
          throw new Error(`Failed to load animation: ${response.status}`);
        }
        
        const data = await response.json();
        const customizedData = applyCustomColors(data);
        setAnimationData(customizedData);
        console.log('Lottie animation loaded and customized successfully');
      } catch (error) {
        console.error('Failed to load Lottie animation:', error);
      }
    };

    loadAnimation();
  }, []);

  // Function to apply custom colors to Lottie animation data
  const applyCustomColors = (animationData: any) => {
    if (!animationData || !animationData.layers) return animationData;

    const primaryColor = '#8D240C'; // Brown - for top-left and bottom-right
    const secondaryColor = '#1A2833'; // Periwinkle - for top-right and bottom-left
    
    // Convert hex to RGB values for Lottie (0-1 range)
    const hexToRgb = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      return [r, g, b, 1]; // RGBA
    };

    const primaryRgb = hexToRgb(primaryColor);
    const secondaryRgb = hexToRgb(secondaryColor);

    // Deep clone the animation data to avoid mutations
    const customData = JSON.parse(JSON.stringify(animationData));

    // For 4-box animation: apply colors diagonally
    // Top-left (0) and bottom-right (3) = primary color
    // Top-right (1) and bottom-left (2) = secondary color
    const getDiagonalColor = (index: number) => {
      // Diagonal pattern: 0,3 = primary, 1,2 = secondary
      return (index === 0 || index === 3) ? primaryRgb : secondaryRgb;
    };

    let elementIndex = 0;

    // Recursively update colors in the animation data
    const updateColors = (obj: any, depth: number = 0) => {
      if (Array.isArray(obj)) {
        obj.forEach((item, index) => updateColors(item, depth + 1));
      } else if (obj && typeof obj === 'object') {
        // Look for various color properties in Lottie format
        if (obj.c && obj.c.k) {
          // Solid color
          if (Array.isArray(obj.c.k) && obj.c.k.length >= 3) {
            const targetColor = getDiagonalColor(elementIndex % 4);
            obj.c.k = [...targetColor];
            elementIndex++;
          }
        }
        
        // Look for fill colors
        if (obj.fc && obj.fc.k && Array.isArray(obj.fc.k) && obj.fc.k.length >= 3) {
          const targetColor = getDiagonalColor(elementIndex % 4);
          obj.fc.k = [...targetColor];
          elementIndex++;
        }
        
        // Look for stroke colors
        if (obj.sc && obj.sc.k && Array.isArray(obj.sc.k) && obj.sc.k.length >= 3) {
          const targetColor = getDiagonalColor(elementIndex % 4);
          obj.sc.k = [...targetColor];
          elementIndex++;
        }
        
        // Recursively process nested objects
        Object.keys(obj).forEach(key => {
          updateColors(obj[key], depth + 1);
        });
      }
    };

    updateColors(customData);
    console.log(`Applied diagonal colors to ${elementIndex} elements: top-left/bottom-right (${primaryColor}), top-right/bottom-left (${secondaryColor})`);
    return customData;
  };

  // Real-time progress tracking - no simulation mode
  useEffect(() => {
    console.log('Enhanced Loading Effect - enableRealTimeSync:', enableRealTimeSync, 'checkRunId:', checkRunId, 'isComplete:', isComplete);
    
    if (!enableRealTimeSync || !checkRunId || isComplete) {
      console.log('Skipping progress tracking - conditions not met');
      return;
    }

    console.log('Starting real-time progress tracking for checkRunId:', checkRunId);
    
    const checkProgress = async () => {
      if (isComplete) return; // Don't check if already complete
      
      try {
        const response = await fetch(`/api/v1/checks/${checkRunId}/progress`);
        if (response.ok) {
          const data = await response.json();
          
          // Map backend progress to user-friendly messages
          const getThemisMessage = (step: string, status: string) => {
            if (status === 'COMPLETED') return "Analysis complete!";
            if (status === 'FAILED') return "Analysis failed. Please try again.";
            
            if (step.includes('Starting analysis')) return "Themis is starting analysis...";
            if (step.includes('Fetching') || step.includes('files')) return "Themis is scanning repository files...";
            if (step.includes('deterministic rules')) return "Themis is checking compliance rules...";
            if (step.includes('violations')) return "Themis found compliance issues...";
            if (step.includes('content validation')) return "Themis is validating content...";
            if (step.includes('augmentation') || step.includes('analyzing')) return "Themis is analyzing issues...";
            
            return step; // Fallback to original message
          };
          
          const themisMessage = getThemisMessage(data.currentStep || '', data.status);
          setCurrentMessage(themisMessage);
          setProgress(data.progress || 0);
          setFileCount(data.fileCount || 0);
          
          if (data.status === 'COMPLETED' || data.status === 'FAILED') {
            setIsComplete(true);
            console.log('Analysis completed, navigating to results');
            setTimeout(() => onComplete?.(), 1500);
          } else {
            // Check again in 1 second if not complete (faster for better UX)
            setTimeout(checkProgress, 1000);
          }
        } else {
          console.error(`Progress API returned ${response.status}: ${response.statusText}`);
          // Keep trying every 3 seconds instead of giving up
          setTimeout(checkProgress, 3000);
        }
      } catch (error) {
        console.error('Failed to check progress:', error);
        // Keep trying every 3 seconds instead of giving up
        setTimeout(checkProgress, 3000);
      }
    };

    // Start checking progress immediately
    checkProgress();

  }, [enableRealTimeSync, checkRunId, isComplete, onComplete]);

  // Brief simulation for completed analyses to show message progression
  useEffect(() => {
    if (enableRealTimeSync && checkRunId) return; // Skip if real-time sync is enabled
    
    // Quick message progression for when analysis is already complete
    const intervals: NodeJS.Timeout[] = [];
    
    const updateMessage = (message: string, delay: number) => {
      const timer = setTimeout(() => {
        setCurrentMessage(message);
      }, delay);
      intervals.push(timer);
    };
    
    // Quick progression (3 seconds total)
    updateMessage("Themis is starting analysis...", 200);
    updateMessage("Themis is checking compliance rules...", 800);
    updateMessage("Themis is analyzing issues...", 1400);
    updateMessage("Analysis complete!", 2000);
    
    const completeTimer = setTimeout(() => {
      setIsComplete(true);
      setTimeout(() => onComplete?.(), 1000);
    }, 2500);
    
    intervals.push(completeTimer);
    
    return () => {
      intervals.forEach(timer => clearTimeout(timer));
    };
  }, [enableRealTimeSync, checkRunId, onComplete]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{ 
        backgroundColor: colors.background.main,
      }}
    >
      {/* Main container - centered content */}
      <div className="flex flex-col items-center justify-center max-w-md w-full px-4">
        {/* Title and subtitle */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ color: colors.text.primary }}>
            {title}
          </h1>
          <p className="text-base sm:text-lg" style={{ color: colors.text.secondary }}>
            {subtitle}
          </p>
        </div>
        <div 
          className="p-8"
          style={{ 
            backgroundColor: 'transparent',
          }}
        >
          {/* Lottie Animation with enhanced styling */}
          <div className="flex justify-center mb-8">
            {animationData && (
              <div 
                className="w-40 h-40 relative"
                style={{
                  filter: 'drop-shadow(0 8px 16px rgba(141, 36, 12, 0.15))',
                }}
              >
                <Lottie
                  animationData={{
                    ...animationData,
                    // Reduce animation speed to 0.7x for smoother feel
                    fr: animationData.fr ? animationData.fr * 0.7 : 30 * 0.7
                  }}
                  loop={!isComplete}
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

          {/* Title and Subtitle with enhanced styling */}
          <h2 
            className="text-3xl font-bold mb-3 bg-gradient-to-r bg-clip-text text-transparent"
            style={{ 
              backgroundImage: `linear-gradient(135deg, ${colors.text.primary} 0%, ${colors.primary.accent} 100%)`
            }}
          >
            {title}
          </h2>
          <p 
            className="text-lg mb-8 leading-relaxed"
            style={{ color: colors.text.secondary }}
          >
            {subtitle}
          </p>



          {/* Enhanced Status Messages */}
          <div className="min-h-[4rem] flex items-center justify-center mb-8">
            <div 
              className="animate-fadeIn transition-all duration-500 transform"
              key={currentMessage} // Force re-render for animation
            >
              <div 
                className="flex items-center justify-center space-x-3 px-6 py-3 rounded-full border"
                style={{ 
                  backgroundColor: colors.primary.accent + '08',
                  borderColor: colors.primary.accent + '20'
                }}
              >
                {/* Animated pulse dot */}
                <div className="relative">
                  <div 
                    className="w-3 h-3 rounded-full animate-pulse"
                    style={{ backgroundColor: colors.primary.accent }}
                  />
                  <div 
                    className="absolute inset-0 w-3 h-3 rounded-full animate-ping opacity-75"
                    style={{ backgroundColor: colors.primary.accent }}
                  />
                </div>
                
                <p 
                  className="text-lg font-semibold tracking-wide"
                  style={{ color: colors.text.primary }}
                >
                  {currentMessage}
                </p>
              </div>
            </div>
          </div>



          {/* Enhanced Completion Check */}
          {isComplete && (
            <div className="flex justify-center animate-bounce">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transform scale-110"
                style={{ 
                  backgroundColor: colors.status.success,
                  boxShadow: `0 8px 25px -5px ${colors.status.success}40`
                }}
              >
                <svg 
                  className="w-7 h-7 text-white animate-pulse" 
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

