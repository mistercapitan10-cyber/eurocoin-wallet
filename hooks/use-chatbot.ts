"use client";

import { useState, useCallback } from "react";
import { ChatMessageType } from "@/components/chatbot/types";
import type { Locale } from "@/lib/i18n/translations";

interface UseChatbotOptions {
  locale: Locale;
  walletAddress?: `0x${string}`;
}

interface UseChatbotResult {
  messages: ChatMessageType[];
  sendMessage: (text: string) => Promise<void>;
  addMessage: (message: Omit<ChatMessageType, "id" | "timestamp">) => void;
  addMessageWithId: (message: Omit<ChatMessageType, "timestamp">) => void;
  updateMessage: (messageId: string, translated: string) => void;
  loading: boolean;
  resetChat: () => void;
}

export function useChatbot({ locale, walletAddress }: UseChatbotOptions): UseChatbotResult {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [loading, setLoading] = useState(false);

  const addMessage = useCallback((message: Omit<ChatMessageType, "id" | "timestamp">) => {
    const newMessage: ChatMessageType = {
      ...message,
      id: `${message.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  }, []);

  const resetChat = useCallback(() => {
    setMessages([]);
  }, []);

  const addMessageWithId = useCallback((message: Omit<ChatMessageType, "timestamp">) => {
    const newMessage: ChatMessageType = {
      ...message,
      timestamp: new Date(),
    };
    setMessages((prev) => {
      // Check if message with this ID already exists
      if (prev.some((msg) => msg.id === message.id)) {
        return prev;
      }
      return [...prev, newMessage];
    });
  }, []);

  const updateMessage = useCallback((messageId: string, translated: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, translated, isTranslated: true } : msg)),
    );
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      // Add user message locally first
      addMessage({
        type: "user",
        text,
        isTranslated: false,
      });

      setLoading(true);

      try {
        // Send message to backend API
        const response = await fetch("/api/chatbot/send-message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress,
            message: text,
            locale,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to send message");
        }

        const data = await response.json();

        // Add bot response from API
        if (data.botResponse) {
          addMessage({
            type: "bot",
            text: data.botResponse.text,
            isTranslated: false,
          });
        }
      } catch (error) {
        console.error("Error sending message:", error);
        // Show error message to user
        addMessage({
          type: "bot",
          text:
            locale === "en"
              ? "Sorry, there was an error sending your message. Please try again."
              : "Извините, произошла ошибка при отправке сообщения. Попробуйте ещё раз.",
          isTranslated: false,
        });
      } finally {
        setLoading(false);
      }
    },
    [addMessage, walletAddress, locale],
  );

  return {
    messages,
    sendMessage,
    addMessage,
    addMessageWithId,
    updateMessage,
    loading,
    resetChat,
  };
}
