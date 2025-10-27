"use client";

import { useEffect, useRef } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { useChatbot } from "@/hooks/use-chatbot";
import { useTransactionAnalysis } from "@/hooks/use-transaction-analysis";
import { ChatMessage as ChatMessageComponent } from "./chat-message";
import { ChatInput } from "./chat-input";

interface ChatWindowProps {
  onClose?: () => void;
  userAddress?: `0x${string}`;
}

export function ChatWindow({ userAddress }: ChatWindowProps) {
  const { locale } = useLanguage();
  const { messages, sendMessage, addMessage, loading } = useChatbot({
    locale,
    walletAddress: userAddress as `0x${string}` | undefined,
  });
  const { analyzeTransaction, loading: analyzing } = useTransactionAnalysis();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Add welcome message on mount only once
  useEffect(() => {
    // Check if welcome message already added in this session
    const welcomeAdded = sessionStorage.getItem("chatbot-welcome-added");

    if (!welcomeAdded && messages.length === 0) {
      // Add welcome message immediately
      addMessage({
        type: "bot",
        text:
          locale === "ru"
            ? "Здравствуйте! Подозреваете, что стали жертвой мошенников? Мы поможем разобраться! Опишите ситуацию – и получите рекомендации по возврату денег.\n\nС помощью прямого доступа к сети Ethereum и кошельку MetaMask, мы можем провести прямое расследование подозрительных транзакций."
            : "Hello! Suspect you've become a victim of fraudsters? We will help you figure it out! Describe the situation – and get recommendations for getting your money back.\n\nWith direct access to the Ethereum network and your MetaMask wallet, we can conduct direct investigations of suspicious transactions.",
        isTranslated: false,
      });

      // Mark as added
      if (typeof window !== "undefined") {
        sessionStorage.setItem("chatbot-welcome-added", "true");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll for new admin messages - optimized to avoid visual flickering
  const lastMessageCountRef = useRef(messages.length);

  useEffect(() => {
    if (!userAddress) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/chatbot/get-messages?walletAddress=${userAddress}`);
        if (response.ok) {
          const data = await response.json();
          const newMessages = data.messages || [];

          // Only process if there are actually new messages
          if (newMessages.length > lastMessageCountRef.current) {
            console.log(
              "[chat-window] Detected new messages:",
              newMessages.length,
              "current:",
              lastMessageCountRef.current,
            );
            lastMessageCountRef.current = newMessages.length;

            // Compare with current messages and add new ones silently
            const currentMessageIds = new Set(messages.map((m) => m.id));
            const messagesToAdd = newMessages.filter(
              (msg: { id: string; type: string; text: string }) => !currentMessageIds.has(msg.id),
            );

            if (messagesToAdd.length > 0) {
              console.log("[chat-window] Adding", messagesToAdd.length, "new messages");
              // Add new messages without causing a full re-render
              messagesToAdd.forEach((msg: { id: string; type: string; text: string }) => {
                const messageType = msg.type === "admin" ? "bot" : msg.type;
                addMessage({
                  type: messageType as "user" | "bot",
                  text: msg.text,
                  isTranslated: false,
                });
              });
            }
          }
        }
      } catch (error) {
        console.error("[chat-window] Error polling messages:", error);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [userAddress, messages, addMessage]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    await sendMessage(text);

    // Check if message contains a transaction hash
    const txHashMatch = text.match(/0x[a-fA-F0-9]{64}/);
    if (txHashMatch) {
      const txHash = txHashMatch[0] as `0x${string}`;

      // Start analysis
      const result = await analyzeTransaction(txHash);

      if (result) {
        // Add analysis results
        const analysisText =
          locale === "ru"
            ? `Анализ завершен. Статус: ${result.isSuspicious ? "⚠️ Подозрительная" : "✅ Нормальная"}\n\nДетали:\n- От: ${result.transactionDetails.from.slice(0, 10)}...\n- К: ${result.transactionDetails.to.slice(0, 10)}...\n- Сумма: ${result.transactionDetails.value} ETH\n- Газ: ${result.transactionDetails.gasUsed}\n\n${result.recommendations.join("\n\n")}`
            : `Analysis complete. Status: ${result.isSuspicious ? "⚠️ Suspicious" : "✅ Normal"}\n\nDetails:\n- From: ${result.transactionDetails.from.slice(0, 10)}...\n- To: ${result.transactionDetails.to.slice(0, 10)}...\n- Amount: ${result.transactionDetails.value} ETH\n- Gas: ${result.transactionDetails.gasUsed}\n\n${result.recommendations.join("\n\n")}`;

        addMessage({
          type: "bot",
          text: analysisText,
          isTranslated: false,
        });
      } else {
        addMessage({
          type: "bot",
          text:
            locale === "ru"
              ? "Не удалось проанализировать транзакцию. Проверьте правильность хеша."
              : "Failed to analyze transaction. Please check the hash correctness.",
          isTranslated: false,
        });
      }
    }
  };

  return (
    <div className="flex h-[600px] w-full max-w-md flex-col bg-white shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-blue-300 bg-blue-600 p-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-blue-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/specialist.png"
              alt="Support specialist"
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <h3 className="font-bold text-white">Поддержка</h3>
            <p className="flex items-center gap-1 text-xs text-blue-100">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
              Антифрод консультант
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto bg-white p-4">
        {messages.map((message) => (
          <ChatMessageComponent
            key={message.id}
            message={message}
            currentLocale={locale}
            onTranslate={() => {
              // Translate logic will be handled by hook if needed
            }}
          />
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <div className="flex gap-1">
              <div className="h-2 w-2 animate-bounce rounded-full bg-blue-600" />
              <div className="h-2 w-2 animate-bounce rounded-full bg-blue-600 [animation-delay:0.2s]" />
              <div className="h-2 w-2 animate-bounce rounded-full bg-blue-600 [animation-delay:0.4s]" />
            </div>
            <span>💬 {locale === "ru" ? "Бот печатает..." : "Bot is typing..."}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={handleSendMessage} disabled={loading || analyzing} />
    </div>
  );
}
