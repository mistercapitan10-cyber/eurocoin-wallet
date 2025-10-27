"use client";

import { ChatMessageType } from "./types";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { TranslateButton } from "./translate-button";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: ChatMessageType;
  currentLocale: "ru" | "en";
  onTranslate: () => void;
}

export function ChatMessage({ message, onTranslate }: ChatMessageProps) {
  const isUser = message.type === "user";
  const displayText =
    message.isTranslated && message.translated ? message.translated : message.text;

  // Check if this is an automated message (bot auto-response)
  const isAutomatedMessage =
    message.text.includes("Thank you for your message") ||
    message.text.includes("Спасибо за ваше сообщение. Я передал его оператору");

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar container with online indicator */}
      <div className="relative">
        {/* Avatar */}
        <div
          className={cn(
            "h-10 w-10 shrink-0 overflow-hidden rounded-full",
            isUser ? "bg-blue-700" : "",
          )}
        >
          {isUser ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/user.png" alt="User avatar" className="h-full w-full object-cover" />
            </>
          ) : isAutomatedMessage ? (
            // Bot avatar for automated messages
            <div className="flex h-full w-full items-center justify-center bg-blue-600 text-white">
              🤖
            </div>
          ) : (
            // Specialist avatar for human responses
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/specialist.png"
                alt="Support specialist"
                className="h-full w-full object-cover"
              />
            </>
          )}
        </div>
      </div>

      {/* Message bubble */}
      <div className={cn("flex max-w-[80%] flex-col gap-1", isUser ? "items-end" : "items-start")}>
        {/* Text bubble */}
        <div
          className={cn(
            "rounded-lg px-4 py-3",
            isUser ? "bg-blue-600 text-white" : "bg-blue-500 text-white",
          )}
        >
          <p className="whitespace-pre-wrap break-words text-sm text-white">{displayText}</p>
        </div>

        {/* Timestamp and translate button */}
        <div className={cn("flex items-center gap-2", isUser ? "flex-row-reverse" : "flex-row")}>
          <span className="dark:text-dark-foregroundMuted text-xs text-foregroundMuted">
            {format(message.timestamp, "HH:mm", { locale: ru })}
          </span>
          <TranslateButton message={message} onTranslate={onTranslate} />
        </div>
      </div>
    </div>
  );
}
