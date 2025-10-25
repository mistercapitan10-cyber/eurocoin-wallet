import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ConnectButton,
  DisconnectButton,
  NetworkSwitcher,
  UnsupportedNetworkAlert,
  WalletAddress,
  WalletStatus,
  WalletDashboard,
} from "@/components/wallet";

export default function Home(): JSX.Element {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-10 md:px-12">
        <header className="flex flex-col gap-4">
          <span className="text-sm uppercase tracking-[0.28em] text-emerald-400">
            Внутренний дашборд
          </span>
          <h1 className="text-3xl font-semibold text-white md:text-4xl">
            Управление токеном компании
          </h1>
          <p className="max-w-2xl text-base text-zinc-400 md:text-lg">
            Подключите MetaMask, чтобы управлять токеном: отслеживайте баланс, контролируйте
            комиссии и проводите операции в поддерживаемых сетях Ethereum.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-6">
              <div className="flex flex-col gap-3">
                <CardTitle className="text-2xl text-white">Подключение кошелька</CardTitle>
                <CardDescription>
                  Поддерживаются MetaMask и сети Sepolia / Ethereum Mainnet. После подключения будут
                  доступны операции с токеном и просмотр баланса.
                </CardDescription>
              </div>
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.25em] text-emerald-400">
                Фаза 2
              </span>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <ConnectButton />
              <WalletStatus />
              <WalletAddress />
              <UnsupportedNetworkAlert />
              <NetworkSwitcher />
              <div className="flex justify-end">
                <DisconnectButton />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-white">Статус разработки</CardTitle>
              <CardDescription className="text-zinc-400">
                Контрольная сводка прогресса по фазам проекта.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-zinc-300">
              <div className="rounded-xl border border-white/5 bg-black/20 p-4">
                <p className="font-semibold text-white">Фаза 1 — выполнена</p>
                <ul className="mt-2 space-y-1 text-zinc-400">
                  <li>• Базовые конфиги и структура проекта</li>
                  <li>• wagmi, React Query и Tailwind готовы к работе</li>
                  <li>• Настроена тёмная тема и общие UI паттерны</li>
                </ul>
              </div>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <p className="font-semibold text-emerald-200">Фаза 2 — выполнена</p>
                <ul className="mt-2 space-y-1 text-emerald-100/80">
                  <li>• Реализованы кнопки подключения и отключения</li>
                  <li>• Отображение статуса кошелька и сети</li>
                  <li>• Уведомления и базовые модальные компоненты</li>
                </ul>
              </div>
              <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-4">
                <p className="font-semibold text-sky-200">Фаза 3 — в процессе</p>
                <ul className="mt-2 space-y-1 text-sky-100/80">
                  <li>• Подключено чтение контракта ERC-20 через wagmi</li>
                  <li>• Реализована карточка баланса и форматирование значений</li>
                  <li>• Созданы хуки useTokenInfo и useTokenBalance</li>
                </ul>
              </div>
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                <p className="font-semibold text-amber-200">Фаза 4 — в процессе</p>
                <ul className="mt-2 space-y-1 text-amber-100/80">
                  <li>• Добавлен расчёт USD-эквивалента и компонент курса</li>
                  <li>• Настроено кеширование цен с fallback на фиксированный курс</li>
                  <li>• Реализован расчёт комиссии и калькулятор tax</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        <WalletDashboard />
      </div>
    </main>
  );
}
