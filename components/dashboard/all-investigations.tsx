"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/use-translation";

interface InvestigationItem {
  id: string;
  requestId: string;
  walletAddress: string;
  status: string;
  progress: number;
  currentStage: number;
}

interface InvestigationStage {
  id: string;
  label: string;
  completed: boolean;
  current: boolean;
}

const STAGES = [
  { id: "submitted", duration: 1000 },
  { id: "checking", duration: 2000 },
  { id: "analyzing", duration: 2500 },
  { id: "investigating", duration: 3000 },
  { id: "recovering", duration: 2000 },
  { id: "completed", duration: 1000 },
];

// Generate a random investigation
function generateRandomInvestigation(id: string): InvestigationItem {
  const isExchange = Math.random() > 0.5;
  const requestPrefix = isExchange ? "EX" : "INT";
  const timestamp = Date.now() - Math.floor(Math.random() * 10000000000);
  const requestId = `${requestPrefix}-${timestamp}`;
  
  // Generate random wallet address
  const walletHex = Array.from({ length: 8 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  const walletAddress = `0x${walletHex}...${Array.from({ length: 4 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('')}`;
  
  // Random progress between 0 and 90% (so they can complete)
  const progress = Math.floor(Math.random() * 90);
  const currentStage = Math.floor((progress / 100) * STAGES.length);
  
  return {
    id,
    requestId,
    walletAddress,
    status: "processing",
    progress,
    currentStage: Math.min(currentStage, STAGES.length - 2), // Don't start at completed
  };
}

// Generate initial mock investigations
function generateMockInvestigations(): InvestigationItem[] {
  return Array.from({ length: 6 }, (_, i) => 
    generateRandomInvestigation(`${i + 1}`)
  );
}

function getStagesForProgress(currentStage: number, totalStages: number): InvestigationStage[] {
  return STAGES.map((stage, index) => ({
    id: stage.id,
    label: "",
    completed: index < currentStage,
    current: index === currentStage,
  }));
}

export function AllInvestigations() {
  const t = useTranslation();
  const [investigations, setInvestigations] = useState<InvestigationItem[]>([]);
  const [animatedProgress, setAnimatedProgress] = useState<Record<string, number>>({});
  const [fadingOut, setFadingOut] = useState<Set<string>>(new Set());
  const [fadingIn, setFadingIn] = useState<Set<string>>(new Set());
  const animationsRef = useRef<Record<string, NodeJS.Timeout>>({});
  const nextIdRef = useRef(7); // Start from 7 for new investigations

  // Initialize with mock data
  useEffect(() => {
    const mockData = generateMockInvestigations();
    setInvestigations(mockData);
    // Initialize animated progress
    const initialProgress: Record<string, number> = {};
    mockData.forEach((inv) => {
      initialProgress[inv.id] = 0;
    });
    setAnimatedProgress(initialProgress);
  }, []);

  // Animate progress for each investigation
  useEffect(() => {
    if (investigations.length === 0) return;

    investigations.forEach((investigation) => {
      const targetProgress = investigation.progress;
      const invId = investigation.id;

      // Clear existing animation for this investigation
      if (animationsRef.current[invId]) {
        clearInterval(animationsRef.current[invId]);
        delete animationsRef.current[invId];
      }

      // Check current progress
      setAnimatedProgress((prev) => {
        const currentProgress = prev[invId] || 0;
        const diff = Math.abs(targetProgress - currentProgress);

        // Skip animation if already at target or very close
        if (diff < 1) {
          return {
            ...prev,
            [invId]: targetProgress,
          };
        }

        // Start animation
        const steps = 30;
        const increment = (targetProgress - currentProgress) / steps;
        const duration = 1500;
        const stepDuration = duration / steps;
        let progressValue = currentProgress;

        const animation = setInterval(() => {
          progressValue += increment;
          if (
            (increment > 0 && progressValue >= targetProgress) ||
            (increment < 0 && progressValue <= targetProgress)
          ) {
            progressValue = targetProgress;
            clearInterval(animation);
            delete animationsRef.current[invId];
          }
          setAnimatedProgress((prevProgress) => ({
            ...prevProgress,
            [invId]: Math.round(progressValue),
          }));
        }, stepDuration);

        animationsRef.current[invId] = animation;
        return prev;
      });
    });

    return () => {
      // Cleanup all animations on unmount
      Object.values(animationsRef.current).forEach((anim) => clearInterval(anim));
      animationsRef.current = {};
    };
  }, [investigations]);

  // Stage labels with translations
  const stageLabels = useMemo(
    () => [
      t("investigation.stages.submitted"),
      t("investigation.stages.checking"),
      t("investigation.stages.analyzing"),
      t("investigation.stages.investigating"),
      t("investigation.stages.recovering"),
      t("investigation.stages.completed"),
    ],
    [t],
  );

  // Simulate progress updates over time and handle completion
  useEffect(() => {
    const updateInterval = setInterval(() => {
      setInvestigations((prev) => {
        const updated = prev.map((inv) => {
          // Skip if already fading out
          if (fadingOut.has(inv.id)) {
            return inv;
          }

          // Simulate progress advancement (every 6 seconds, increase by ~3-10%)
          if (inv.progress < 100 && Math.random() > 0.5) {
            const increment = Math.random() * 10 + 3;
            const newProgress = Math.min(100, inv.progress + increment);
            const newStage = Math.floor((newProgress / 100) * STAGES.length);
            return {
              ...inv,
              progress: Math.round(newProgress),
              currentStage: Math.min(newStage, STAGES.length - 1),
              status: newProgress >= 100 ? "completed" : inv.status,
            };
          }
          return inv;
        });

        // Check for completed investigations that need to fade out
        const completed = updated.filter((inv) => inv.progress >= 100 && !fadingOut.has(inv.id));
        
        if (completed.length > 0) {
          // Start fade out animation for completed investigations
          completed.forEach((inv) => {
            setFadingOut((prev) => new Set(prev).add(inv.id));
            
            // After fade out animation (700ms), replace with new investigation
            setTimeout(() => {
              setInvestigations((current) => {
                const index = current.findIndex((i) => i.id === inv.id);
                if (index !== -1) {
                  const newInv = generateRandomInvestigation(nextIdRef.current.toString());
                  nextIdRef.current += 1;
                  const newList = [...current];
                  newList[index] = newInv;
                  
                  // Remove from fading out, add to fading in
                  setFadingOut((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(inv.id);
                    return newSet;
                  });
                  setFadingIn((prev) => new Set(prev).add(newInv.id));
                  
                  // Initialize progress animation for new investigation
                  setAnimatedProgress((prev) => ({
                    ...prev,
                    [newInv.id]: 0,
                  }));
                  
                  // Remove fade in effect after animation completes
                  setTimeout(() => {
                    setFadingIn((prev) => {
                      const newSet = new Set(prev);
                      newSet.delete(newInv.id);
                      return newSet;
                    });
                  }, 500);
                  
                  return newList;
                }
                return current;
              });
            }, 700); // Match fade out duration
          });
        }

        return updated;
      });
    }, 6000); // Update every 6 seconds

    return () => clearInterval(updateInterval);
  }, [fadingOut]);

  if (investigations.length === 0) {
    return null;
  }

  return (
    <section id="all-investigations" className="py-8">
      <div className="mb-6">
        <h2 className="mb-2 font-display text-3xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-accent to-accentAlt bg-clip-text text-transparent">
            {t("investigation.allInvestigations.title")}
          </span>
        </h2>
        <p className="dark:text-dark-foregroundMuted text-foregroundMuted">
          {t("investigation.allInvestigations.description")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {investigations.map((investigation) => {
          const stages = getStagesForProgress(investigation.currentStage, STAGES.length);
          const progress = animatedProgress[investigation.id] ?? 0;
          const isCompleted = progress >= 100;
          const isFadingOut = fadingOut.has(investigation.id);
          const isFadingIn = fadingIn.has(investigation.id);

          return (
            <Card 
              key={investigation.id} 
              className={`relative overflow-hidden transition-all duration-700 ${
                isFadingOut 
                  ? "opacity-0 scale-95 -translate-y-2" 
                  : isFadingIn
                    ? "animate-fade-in-up"
                    : "opacity-100 scale-100 translate-y-0"
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base font-semibold">
                      {investigation.requestId}
                    </CardTitle>
                    <p className="dark:text-dark-foregroundMuted mt-1 text-xs text-foregroundMuted">
                      {investigation.walletAddress}
                    </p>
                  </div>
                  <span
                    className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      isCompleted
                        ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}
                  >
                    {isCompleted
                      ? t("investigation.statusCompleted")
                      : t("investigation.statusInProgress")}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="dark:text-dark-foregroundMuted flex items-center justify-between text-xs text-foregroundMuted">
                    <span>{t("investigation.progress")}</span>
                    <span className="font-semibold">{progress}%</span>
                  </div>
                  <div className="dark:bg-dark-outline relative h-2 w-full overflow-hidden rounded-full bg-outline">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
                      style={{
                        width: `${progress}%`,
                      }}
                    >
                      {/* Shimmer effect */}
                      {progress < 100 && (
                        <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Stages Timeline */}
                <div className="relative space-y-2">
                  {stages.map((stage, index) => {
                    const stageLabel = stageLabels[index];
                    const isStageCompleted = stage.completed;
                    const isStageCurrent = stage.current;

                    return (
                      <div key={stage.id} className="relative flex items-center gap-2">
                        {/* Circle indicator */}
                        <div
                          className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                            isStageCompleted
                              ? "border-blue-600 bg-blue-600"
                              : isStageCurrent
                                ? "border-blue-600 bg-blue-100 dark:bg-blue-900/30 animate-pulse"
                                : "border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800"
                          }`}
                        >
                          {isStageCompleted ? (
                            <svg
                              className="h-3 w-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          ) : isStageCurrent ? (
                            <div className="h-2 w-2 rounded-full bg-blue-600" />
                          ) : (
                            <div className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-600" />
                          )}
                        </div>

                        {/* Stage label */}
                        <span
                          className={`text-xs transition-colors duration-300 ${
                            isStageCurrent
                              ? "font-semibold text-blue-600 dark:text-blue-400"
                              : isStageCompleted
                                ? "text-gray-700 dark:text-gray-300"
                                : "text-gray-500 dark:text-gray-500"
                          }`}
                        >
                          {stageLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

