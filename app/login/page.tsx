import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LoginPage(): JSX.Element {
  return (
    <main className="min-h-screen bg-gradient-to-br from-backgroundAlt to-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 md:flex-row md:items-center md:justify-between md:px-10">
        <div className="flex-1 space-y-6">
          <span className="pill bg-surface text-foreground">Login</span>
          <h1 className="display-title text-4xl text-accent md:text-5xl">Вход в MetaWallet</h1>
          <p className="max-w-xl text-base text-foregroundMuted md:text-lg">
            Авторизация доступна через корпоративный SSO либо подключение MetaMask. В демо-версии вход
            выполняется по кнопке ниже и открывает интерфейсы без проверки прав.
          </p>
          <div className="flex flex-col gap-4 rounded-3xl border border-outline bg-surface p-6 shadow-card">
            <Button size="lg" fullWidth>
              Подключить MetaMask
            </Button>
            <Button variant="outline" fullWidth disabled>
              Войти через корпоративный Email
            </Button>
            <p className="text-xs text-foregroundMuted">
              При входе вы соглашаетесь с внутренней политикой доступа и NDA. Все операции логируются.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-foregroundMuted">
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
          <div className="relative aspect-square w-full max-w-md overflow-hidden rounded-[48px] border border-outline bg-gradient-to-b from-accent/70 via-surface to-accentAlt/70 shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.45),_transparent_65%)]" />
            <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-surface/80 p-4 text-sm text-foreground">
              <p className="font-semibold">Demo access</p>
              <p className="text-xs text-foregroundMuted">MetaWallet build 0.4 · internal preview</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
