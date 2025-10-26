"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RequestCard } from "./request-card";
import { RequestDetailsModal, RequestData } from "./request-details-modal";
import { RequestStatus } from "./request-status-badge";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface UserRequestsProps {
  walletAddress: string;
}

type RequestType = "all" | "exchange" | "internal";

interface RequestItem {
  id: string;
  type: "exchange" | "internal";
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  details: Record<string, string | undefined>;
}

export function UserRequests({ walletAddress }: UserRequestsProps) {
  const [activeTab, setActiveTab] = useState<RequestType>("all");
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RequestData | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchRequests = useCallback(
    async (type: RequestType) => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/user/requests?walletAddress=${walletAddress}&type=${type}`,
        );

        if (!response.ok) {
          throw new Error("Failed to fetch requests");
        }

        const data = await response.json();
        const allRequests: RequestItem[] = [];

        // Process exchange requests
        if (data.exchangeRequests) {
          data.exchangeRequests.forEach((req: Record<string, string>) => {
            allRequests.push({
              id: req.id,
              type: "exchange",
              status: req.status as RequestStatus,
              createdAt: req.created_at,
              updatedAt: req.updated_at,
              details: {
                "Сумма токенов": req.token_amount,
                "Сумма фиата": req.fiat_amount,
                Курс: req.rate,
                Комиссия: req.commission,
                "Адрес кошелька": req.wallet_address,
                Email: req.email,
                ...(req.comment && { Комментарий: req.comment }),
              },
            });
          });
        }

        // Process internal requests
        if (data.internalRequests) {
          data.internalRequests.forEach((req: Record<string, string>) => {
            allRequests.push({
              id: req.id,
              type: "internal",
              status: req.status as RequestStatus,
              createdAt: req.created_at,
              updatedAt: req.updated_at,
              details: {
                Запрашивающий: req.requester,
                Отдел: req.department,
                "Тип запроса": req.request_type,
                Приоритет: req.priority,
                Описание: req.description,
                ...(req.email && { Email: req.email }),
              },
            });
          });
        }

        setRequests(allRequests);
      } catch (error) {
        console.error("Error fetching requests:", error);
        toast.error("Ошибка при загрузке заявок");
      } finally {
        setLoading(false);
      }
    },
    [walletAddress],
  );

  useEffect(() => {
    fetchRequests(activeTab);
  }, [activeTab, fetchRequests]);

  const handleRequestClick = (request: RequestItem) => {
    setSelectedRequest(request as RequestData);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedRequest(null);
  };

  const tabs = [
    { id: "all" as RequestType, label: "Все заявки" },
    { id: "exchange" as RequestType, label: "Обмен" },
    { id: "internal" as RequestType, label: "Внутренние" },
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Мои заявки</CardTitle>
          <CardDescription>Просмотр и отслеживание всех ваших заявок</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Tabs */}
          <div className="mb-6 flex gap-2 border-b">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "border-accent text-accent"
                    : "border-transparent text-foregroundMuted hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Loading state */}
          {loading && (
            <div className="py-8 text-center">
              <p className="text-foregroundMuted">Загрузка заявок...</p>
            </div>
          )}

          {/* Empty state */}
          {!loading && requests.length === 0 && (
            <div className="py-12 text-center">
              <p className="mb-2 text-lg font-semibold text-foreground">Нет заявок</p>
              <p className="text-foregroundMuted">Вы еще не создавали заявок</p>
            </div>
          )}

          {/* Requests list */}
          {!loading && requests.length > 0 && (
            <div className="space-y-3">
              {requests.map((request) => (
                <RequestCard
                  key={request.id}
                  id={request.id}
                  type={request.type}
                  status={request.status}
                  createdAt={request.createdAt}
                  updatedAt={request.updatedAt}
                  details={{
                    title: request.type === "exchange" ? "Обмен токенов" : "Внутренняя заявка",
                    subtitle:
                      request.type === "exchange"
                        ? `${request.details["Сумма токенов"]} → ${request.details["Сумма фиата"]}`
                        : `${request.details["Запрашивающий"]} - ${request.details["Отдел"]}`,
                    amount:
                      request.type === "exchange" ? `${request.details["Сумма фиата"]}` : undefined,
                  }}
                  onDetailsClick={() => handleRequestClick(request)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      <RequestDetailsModal open={modalOpen} onClose={handleCloseModal} request={selectedRequest} />
    </>
  );
}
