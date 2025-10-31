'use client';

import { useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useSupportMessages } from '@/hooks/use-support-messages';
import { useTypingIndicator } from '@/hooks/use-typing-indicator';
import { useNotificationSound } from '@/hooks/use-notification-sound';
import { useTranslation } from '@/hooks/use-translation';

interface SupportMessengerProps {
  onClose?: () => void;
}

export function SupportMessenger({ onClose }: SupportMessengerProps) {
  const { address } = useAccount();
  const t = useTranslation();

  const { messages, sendMessage, sending, error } = useSupportMessages({
    walletAddress: address,
    enabled: !!address,
  });

  const { isTyping, adminUsername } = useTypingIndicator({
    walletAddress: address,
    enabled: !!address,
  });

  const { playNotification } = useNotificationSound();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastMessageCountRef = useRef(0);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Play sound for new admin messages
  useEffect(() => {
    if (messages.length > lastMessageCountRef.current) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.type === 'admin') {
        playNotification();
      }
    }
    lastMessageCountRef.current = messages.length;
  }, [messages, playNotification]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = inputRef.current;
    if (!input || !input.value.trim()) return;

    try {
      await sendMessage(input.value);
      input.value = '';
    } catch (err) {
      // Error handled in hook
    }
  };

  if (!address) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          Подключите кошелек для общения с поддержкой
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white dark:bg-dark-surface">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-dark-border p-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Техническая поддержка
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            Нет сообщений. Напишите нам!
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                msg.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-dark-surfaceAlt text-gray-900 dark:text-gray-100'
              }`}
            >
              {msg.type === 'admin' && msg.adminUsername && (
                <div className="text-xs font-semibold mb-1 opacity-70">
                  {msg.adminUsername}
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
              <div className="text-xs mt-1 opacity-70">
                {new Date(msg.createdAt).toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="max-w-[70%] rounded-lg px-4 py-2 bg-gray-100 dark:bg-dark-surfaceAlt">
              <div className="text-xs font-semibold mb-1 text-gray-700 dark:text-gray-300">
                {adminUsername}
              </div>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 dark:border-dark-border p-4">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Напишите сообщение..."
            disabled={sending}
            className="flex-1 rounded-lg border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-surfaceAlt px-4 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            maxLength={2000}
          />
          <button
            type="submit"
            disabled={sending}
            className="rounded-lg bg-blue-500 hover:bg-blue-600 px-6 py-2 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? '...' : 'Отправить'}
          </button>
        </div>
      </form>
    </div>
  );
}
