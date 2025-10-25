"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useWalletConnection } from "@/hooks/use-wallet-connection";
import { useToast } from "@/components/ui/toast";
import Cookies from "js-cookie";

export default function LoginPage() {
  const router = useRouter();
  const { connect, isConnecting } = useWalletConnection();
  const { show } = useToast();

  const handleMetaMaskConnect = async () => {
    try {
      await connect();
      // Set cookie to indicate successful MetaMask connection
      Cookies.set('metamask_connected', 'true', { expires: 7 }); // 7 days
      show({
        title: "Кошелёк подключён",
        description: "MetaMask успешно подключён. Перенаправляем на главную страницу...",
        variant: "success",
      });
      // Redirect to home page after successful connection
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Не удалось подключить кошелёк";
      show({
        title: "Ошибка подключения",
        description: message,
        variant: "error",
      });
    }
  };

  return (
    <main className="dark:from-dark-backgroundAlt dark:to-dark-background min-h-screen bg-gradient-to-br from-backgroundAlt to-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 md:flex-row md:items-center md:justify-between md:px-10">
        <div className="flex-1 space-y-6">
          <span className="pill dark:bg-dark-surface dark:text-dark-foreground bg-surface text-foreground">
            Login
          </span>
          <h1 className="display-title text-4xl text-accent md:text-5xl">Вход в MetaWallet</h1>
          <p className="dark:text-dark-foregroundMuted max-w-xl text-base text-foregroundMuted md:text-lg">
            Авторизация доступна через корпоративный SSO либо подключение MetaMask. Подключите
            кошелёк для доступа к функциям управления токенами и просмотра баланса.
          </p>
          <div className="dark:border-dark-outline dark:bg-dark-surface flex flex-col gap-4 rounded-3xl border border-outline bg-surface p-6 shadow-card">
            <Button size="lg" fullWidth onClick={handleMetaMaskConnect} disabled={isConnecting}>
              {isConnecting ? "Подключение..." : "Подключить MetaMask"}
            </Button>
            <Button variant="outline" fullWidth disabled>
              Войти через корпоративный Email
            </Button>
            <p className="dark:text-dark-foregroundMuted text-xs text-foregroundMuted">
              При входе вы соглашаетесь с внутренней политикой доступа и NDA. Все операции
              логируются.
            </p>
          </div>
          <div className="dark:text-dark-foregroundMuted flex flex-wrap gap-4 text-xs text-foregroundMuted">
            <Link href="/requests" className="underline hover:text-accent">
              Заявки на вывод
            </Link>
            <Link href="/admin" className="underline hover:text-accent">
              Панель админа
            </Link>
            <Link href="/exchange" className="underline hover:text-accent">
              Telegram-обменник
            </Link>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <Image
            src="/metamask.png"
            alt="MetaMask Logo"
            width={300}
            height={300}
            className="object-contain"
            priority
          />
        </div>
      </div>
    </main>
  );
}
