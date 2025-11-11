"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

interface NewsletterModalProps {
  open: boolean;
  onClose: () => void;
}

export function NewsletterModal({ open, onClose }: NewsletterModalProps) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "verify" | "subscribed">("email");
  const [loading, setLoading] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const checkSubscription = async (emailToCheck: string) => {
    if (!emailToCheck || !emailToCheck.includes("@")) {
      return false;
    }

    setCheckingSubscription(true);
    try {
      const response = await fetch("/api/newsletter/check-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToCheck }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.subscribed === true;
    } catch (error) {
      console.error("Error checking subscription:", error);
      return false;
    } finally {
      setCheckingSubscription(false);
    }
  };

  const handleSendCode = async () => {
    if (!email || !email.includes("@")) {
      toast.error("Введите корректный email");
      return;
    }

    // Проверяем, подписан ли пользователь
    const subscribed = await checkSubscription(email);
    if (subscribed) {
      setIsSubscribed(true);
      setStep("subscribed");
      return;
    }

    setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 секунд таймаут

      const response = await fetch("/api/newsletter/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = "Ошибка при отправке кода";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        toast.error(errorMessage);
        return;
      }

      const data = await response.json();
      toast.success("Код отправлен на вашу почту!");
      setStep("verify");
    } catch (error) {
      if ((error as { name?: string }).name === "AbortError") {
        toast.error("Превышено время ожидания. Проверьте подключение к интернету.");
      } else {
        console.error("Error sending code:", error);
        toast.error("Ошибка при отправке кода. Попробуйте позже.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!email || !email.includes("@")) {
      toast.error("Введите корректный email");
      return;
    }

    setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 секунд таймаут

      const response = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = "Ошибка при отписке";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        toast.error(errorMessage);
        return;
      }

      toast.success("Вы успешно отписались от рассылки");
      setIsSubscribed(false);
      setStep("email");
      setEmail("");
    } catch (error) {
      if ((error as { name?: string }).name === "AbortError") {
        toast.error("Превышено время ожидания. Проверьте подключение к интернету.");
      } else {
        console.error("Error unsubscribing:", error);
        toast.error("Ошибка при отписке. Попробуйте позже.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      toast.error("Введите 6-значный код");
      return;
    }

    setLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 секунд таймаут

      const response = await fetch("/api/newsletter/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = "Неверный код";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        toast.error(errorMessage);
        return;
      }

      const data = await response.json();
      toast.success("Спасибо за подписку!");
      onClose();
      setEmail("");
      setCode("");
      setStep("email");
    } catch (error) {
      if ((error as { name?: string }).name === "AbortError") {
        toast.error("Превышено время ожидания. Проверьте подключение к интернету.");
      } else {
        console.error("Error verifying code:", error);
        toast.error("Ошибка при проверке кода. Попробуйте позже.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setCode("");
    setStep("email");
    setIsSubscribed(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Подписка на рассылку">
      <div className="space-y-6">
        {step === "subscribed" ? (
          <>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <svg
                  className="h-8 w-8 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground dark:text-dark-foreground">
                Вы уже подписаны на рассылку
              </h3>
              <p className="mb-6 text-sm text-foregroundMuted dark:text-dark-foregroundMuted">
                Вы получаете новости и обновления на адрес {email}
              </p>
            </div>
            <Button
              onClick={handleUnsubscribe}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? "Отписка..." : "Отменить подписку"}
            </Button>
            <Button onClick={handleClose} variant="ghost" className="w-full">
              Закрыть
            </Button>
          </>
        ) : step === "email" ? (
          <>
            <p className="text-sm text-foregroundMuted dark:text-dark-foregroundMuted">
              Введите ваш email для подписки на новости и обновления EuroCoin
            </p>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground dark:text-dark-foreground">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-lg border border-outline bg-surface px-4 py-3 text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 dark:border-dark-outline dark:bg-dark-surface dark:text-dark-foreground"
              />
            </div>
            <Button
              onClick={handleSendCode}
              disabled={loading || checkingSubscription}
              className="w-full"
            >
              {checkingSubscription ? "Проверка..." : loading ? "Отправка..." : "Отправить код"}
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-foregroundMuted dark:text-dark-foregroundMuted">
              Мы отправили код подтверждения на {email}
            </p>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground dark:text-dark-foreground">
                Код подтверждения
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full rounded-lg border border-outline bg-surface px-4 py-3 text-center text-2xl tracking-widest text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 dark:border-dark-outline dark:bg-dark-surface dark:text-dark-foreground"
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleVerifyCode} disabled={loading} className="flex-1">
                {loading ? "Проверка..." : "Подтвердить"}
              </Button>
              <Button onClick={() => setStep("email")} variant="outline" className="flex-1">
                Изменить email
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
