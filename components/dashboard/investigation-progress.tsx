"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/use-translation";

interface InvestigationStage {
  id: string;
  label: string;
  completed: boolean;
  current: boolean;
}

interface InvestigationProgressProps {
  requestId?: string;
  walletAddress?: string;
  userEmail?: string;
}

export function InvestigationProgress({ requestId, walletAddress, userEmail }: InvestigationProgressProps) {
  const t = useTranslation();
  const [fetchedStages, setFetchedStages] = useState<InvestigationStage[] | null>(null);

  // Default stages with translations - updates when locale changes
  // All stages start as incomplete (0% progress) until real data is fetched
  const defaultStages: InvestigationStage[] = useMemo(
    () => [
      {
        id: "submitted",
        label: t("investigation.stages.submitted"),
        completed: false,
        current: false,
      },
      {
        id: "checking",
        label: t("investigation.stages.checking"),
        completed: false,
        current: false,
      },
      {
        id: "analyzing",
        label: t("investigation.stages.analyzing"),
        completed: false,
        current: false,
      },
      {
        id: "investigating",
        label: t("investigation.stages.investigating"),
        completed: false,
        current: false,
      },
      {
        id: "recovering",
        label: t("investigation.stages.recovering"),
        completed: false,
        current: false,
      },
      {
        id: "completed",
        label: t("investigation.stages.completed"),
        completed: false,
        current: false,
      },
    ],
    [t],
  );

  // Use fetched stages if available, otherwise use default stages
  const stages = fetchedStages || defaultStages;

  // Build URL with query parameters
  const buildUrl = useCallback((baseUrl: string) => {
    const params = new URLSearchParams();
    if (requestId) params.append('requestId', requestId);
    if (walletAddress) params.append('walletAddress', walletAddress);
    if (userEmail) params.append('userEmail', userEmail);
    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }, [requestId, walletAddress, userEmail]);

  // Fetch data immediately on mount
  useEffect(() => {
    // Skip fetch if no identifier is available yet
    if (!walletAddress && !userEmail && !requestId) {
      return;
    }

    const fetchData = async () => {
      try {
        const url = buildUrl('/api/investigation/status');
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data.stages && Array.isArray(data.stages)) {
            // Map fetched stages to include translated labels
            const mappedStages = data.stages.map((stage: InvestigationStage) => ({
              ...stage,
              label: t(`investigation.stages.${stage.id}`),
            }));
            setFetchedStages(mappedStages);
          }
        }
      } catch (error) {
        console.error("Error fetching investigation status:", error);
      }
    };

    fetchData();
  }, [buildUrl, t, walletAddress, userEmail, requestId]);

  // Listen for custom event when new request is submitted
  useEffect(() => {
    const handleNewRequest = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log(
        "[Investigation] New request submitted, fetching latest data",
        customEvent.detail,
      );
      const newRequestId = customEvent.detail?.requestId;
      const url = buildUrl('/api/investigation/status');
      fetch(url)
        .then((response) => response.json())
        .then((data) => {
          if (data.stages && Array.isArray(data.stages)) {
            // Map fetched stages to include translated labels
            const mappedStages = data.stages.map((stage: InvestigationStage) => ({
              ...stage,
              label: t(`investigation.stages.${stage.id}`),
            }));
            setFetchedStages(mappedStages);
          }
        })
        .catch((error) => console.error("Error fetching status:", error));
    };

    window.addEventListener("new-request-submitted", handleNewRequest);
    return () => window.removeEventListener("new-request-submitted", handleNewRequest);
  }, [buildUrl, t]);

  // Poll for updates from Telegram every 3 seconds
  useEffect(() => {
    // Skip polling if no identifier is available
    if (!walletAddress && !userEmail && !requestId) {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const url = buildUrl('/api/investigation/status');
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data.stages && Array.isArray(data.stages)) {
            // Map fetched stages to include translated labels
            const mappedStages = data.stages.map((stage: InvestigationStage) => ({
              ...stage,
              label: t(`investigation.stages.${stage.id}`),
            }));
            setFetchedStages(mappedStages);
          }
        }
      } catch (error) {
        console.error("Error fetching investigation status:", error);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [buildUrl, t, walletAddress, userEmail, requestId]);

  const completedCount = stages.filter((s) => s.completed).length;
  const totalStages = stages.length;
  const progressPercentage = Math.round((completedCount / totalStages) * 100);
  const isCompleted = progressPercentage === 100;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>{t("investigation.title")}</CardTitle>
          <CardDescription>{t("investigation.description")}</CardDescription>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] ${
            isCompleted
              ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
              : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          }`}
        >
          {isCompleted ? t("investigation.statusCompleted") : t("investigation.statusInProgress")}
        </span>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {/* Progress Bar */}
        <div className="space-y-3">
          <div className="dark:text-dark-foregroundMuted flex items-center justify-between text-xs text-foregroundMuted">
            <span>{t("investigation.progress")}</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="dark:bg-dark-outline h-3 w-full rounded-full bg-outline">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Stages */}
        <div className="relative">
          {stages.map((stage, index) => (
            <div key={stage.id} className="relative flex items-start gap-4 pb-4 last:pb-0">
              {/* Timeline line */}
              {index < stages.length - 1 && (
                <div
                  className={`absolute left-5 top-10 h-[calc(100%-0.5rem)] w-0.5 ${
                    stages[index + 1].completed ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              )}

              {/* Circle indicator */}
              <div
                className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                  stage.completed
                    ? "border-blue-600 bg-blue-600"
                    : stage.current
                      ? "border-blue-600 bg-blue-100 dark:bg-blue-900/30"
                      : "border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-800"
                }`}
              >
                {stage.completed ? (
                  <svg
                    className="h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : stage.current ? (
                  <div className="h-3 w-3 rounded-full bg-blue-600" />
                ) : (
                  <div className="h-3 w-3 rounded-full bg-gray-400 dark:bg-gray-600" />
                )}
              </div>

              {/* Label and description */}
              <div className="pt-1">
                <h4
                  className={`font-semibold ${
                    stage.current
                      ? "text-blue-600 dark:text-blue-400"
                      : "dark:text-dark-foreground text-foreground"
                  }`}
                >
                  {stage.label}
                </h4>
                {stage.completed && !stage.current && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("investigation.statusCompleted")}
                  </p>
                )}
                {stage.current && !isCompleted && (
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    {t("investigation.stageInProgress")}
                  </p>
                )}
                {isCompleted && stage.id === "completed" && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {t("investigation.statusCompleted")}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <p className="dark:text-dark-foregroundMuted text-xs text-foregroundMuted">
          {t("investigation.updating")}
        </p>
      </CardContent>
    </Card>
  );
}
