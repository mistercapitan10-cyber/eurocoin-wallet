export type Locale = "ru" | "en";

type TranslationTree = Record<string, string | TranslationTree>;

type Messages = Record<Locale, TranslationTree>;

const translations: Messages = {
  ru: {
    common: {
      brand: {
        badge: "Внутренний доступ",
        report: "Отчёт",
        version: "v0.4 internal",
      },
      nav: {
        dashboard: "Дашборд",
        requests: "Заявки",
        reviews: "Отзывы",
        admin: "Админ",
        exchange: "Обменник",
        faq: "FAQ",
      },
      footer: {
        contact: "Контакты: treasury@company.io",
        policy: "Политика безопасности",
        copyright: "© {year} TOKEN Labs. Только для внутреннего использования.",
        version: "v0.4.0-beta",
      },
      buttons: {
        update: "Обновление…",
        refresh: "Обновить",
        submitRequest: "Отправить заявку",
        clear: "Очистить",
        disabled: "Недоступно в демо",
        approve: "Одобрить",
        decline: "Отказать",
        send: "Отправить",
        copy: "Скопировать",
        download: "Скачать",
      },
    },
    language: {
      title: "Язык",
      russian: "Русский",
      english: "English",
    },
    home: {
      hero: {
        badge: "MetaMask стиль",
        title: "Контроль токена компании",
        description:
          "Подключите MetaMask, чтобы управлять корпоративным токеном: проверяйте баланс, отслеживайте курс и контролируйте комиссии в едином дашборде, оформленном в фирменном стиле MetaMask.",
        chip1: "Sepolia · Ethereum Mainnet",
        chip2: "Реактивные обновления баланса",
        chip3: "Эквивалент USD и калькулятор tax",
        statusTitle: "Статус интеграции",
        statusLine1: "• Подключение MetaMask и управление сетями",
        statusLine2: "• Чтение баланса ERC-20 и отображение USD",
        statusLine3: "• Форма внутренних заявок активна",
        checklistTitle: "Регламент QA",
        checklist1: "Проверено на десктопах (1440px)",
        checklist2: "Рекомендуется авторизационный флоу MetaMask",
        checklist3: "Все операции проводятся в тестовой сети до релиза",
      },
      walletSection: {
        title: "Подключение кошелька",
        description:
          "MetaMask + wagmi v2. После подключения доступны операции токена и мониторинг.",
        phase: "Фаза 2",
      },
      status: {
        title: "Статус разработки",
        description: "Прогресс MVP по фазам: архитектура, подключение и аналитика.",
        phase1Title: "Фаза 1 — выполнена",
        phase1List1: "• Базовые конфиги и структура проекта",
        phase1List2: "• Tailwind, ESLint, absolute imports",
        phase1List3: "• Провайдеры wagmi и React Query",
        phase2Title: "Фаза 2 — закрыта",
        phase3Title: "Фаза 3 — готово",
        phase4Title: "Фаза 4 — активна",
        phase2List1: "• Подключение/отключение MetaMask",
        phase2List2: "• Статус сети и переключатель",
        phase2List3: "• UI-компоненты в фирменном стиле",
        phase3List1: "• Чтение баланса ERC-20 и форматтеры",
        phase3List2: "• Интеграция viem + React Query",
        phase3List3: "• Балансовая карточка с fallback-логикой",
        phase4List1: "• USD-эквивалент, кеш цены, CoinGecko fallback",
        phase4List2: "• Калькулятор комиссии и конфиг tax",
        phase4List3: "• Внутренние заявки на операции",
      },
    },
    eurocoin: {
      sectionTitle: "Презентация EuroCoin",
      sectionDescription:
        "Интерактивная 3D модель корпоративного токена с техническими характеристиками",
      title: "EuroCoin — Корпоративный токен",
      description: "Интерактивная 3D модель золотой монеты с детальными характеристиками токена",
      features: {
        title: "Ключевые особенности",
        feature1: "ERC-20 стандарт совместимости",
        feature2: "Автоматическое обновление курса",
        feature3: "Интеграция с MetaMask",
      },
      specs: {
        title: "Технические характеристики",
        spec1: "Сеть: Ethereum Mainnet / Sepolia",
        spec2: "Децимализация: 18 знаков",
        spec3: "Максимальная эмиссия: 1,000,000 токенов",
      },
    },
    timer: {
      title: "Таймер разблокировки средств",
      description:
        "Средства в ожидании вывода. После истечения таймера команда казначейства подтвердит транзакцию.",
      status: "В обработке",
      hours: "Часы",
      minutes: "Минуты",
      seconds: "Секунды",
      progress: "Прогресс",
      meta: "Последняя проверка AML: 23.10.2025 13:45 · Ответственный: Казначейство",
    },
    internalForm: {
      badge: "Внутренние",
      title: "Заявка на операции с токеном",
      description:
        "Форма для внутренних команд: отправьте запрос на пополнение, списание или проверку токенов. Укажите детали операции, чтобы ускорить её обработку.",
      regulationTitle: "Регламент",
      regulation1: "• Время отклика: до 2 часов",
      regulation2: "• Срочные заявки помечайте приоритетом High",
      regulation3: "• Укажите ссылку на тикет или задачу при необходимости",
      requester: "Инициатор*",
      department: "Отдел*",
      requestType: "Тип заявки*",
      priority: "Приоритет",
      descriptionField: "Описание задачи / детали операции*",
      helper: "Поля, отмеченные *, обязательны. После отправки заявка попадёт в общий дашборд.",
      placeholders: {
        requester: "ФИО или корпоративный email",
        description: "Укажите адрес кошелька, сумму, дедлайн, ID тикета и другие детали...",
        department: "Выберите отдел",
        type: "Укажите тип",
      },
      requestTypes: {
        topUp: "Пополнение токенов",
        withdraw: "Списание токенов",
        balance: "Проверка баланса",
        report: "Запрос отчёта",
      },
      departments: {
        finance: "Финансовый отдел",
        aml: "Отдел AML/KYC",
        investment: "Инвестиционный отдел",
        support: "Поддержка клиентов",
      },
      validationTitle: "Заполните обязательные поля",
      validationDescription: "Пожалуйста, укажите инициатора, отдел, тип заявки и описание.",
      successTitle: "Заявка отправлена",
      successDescription: "Команда обработает запрос в течение рабочего дня.",
      buttons: {
        submit: "Отправить заявку",
        clear: "Очистить",
      },
      priorities: {
        low: "low",
        normal: "normal",
        high: "high",
      },
    },
    wallet: {
      connect: "Подключить MetaMask",
      connecting: "Подключение...",
      connector: "Доступный коннектор: {connector}",
      install: "Установите расширение MetaMask и разрешите доступ к сайту.",
      error: "Ошибка подключения",
      connectSuccessTitle: "Кошелёк подключён",
      connectSuccessDescription: "MetaMask успешно подключён к приложению.",
      statusDisconnected: "Не подключён",
      status: {
        label: "Статус",
        connector: "Коннектор: {connector}",
        network: "Сеть: {network}",
        connectedAddress: "Подключённый адрес",
      },
      networkAlert: {
        title: "Неподдерживаемая сеть",
        message: "Для работы приложения переключитесь на {chain}.",
        button: "Переключиться на {chain}",
      },
      networkLabel: "Сеть",
      balanceCard: {
        title: "Баланс токена",
        description: "Отображается баланс подключённого кошелька в токене компании.",
        refresh: "Обновить",
        loading: "Обновление…",
        usdLabel: "Эквивалент в USD",
        rate: "Курс",
        fallbackRate: "Не удалось получить актуальный курс. Используется резервное значение.",
        autoRefresh: "Данные обновляются автоматически каждые 30 секунд.",
        staticSource: "фиксированное значение",
        status: {
          notConfigured:
            "Укажите адрес токена в переменных окружения, чтобы активировать чтение данных.",
          notConnected: "Подключите MetaMask, чтобы просматривать баланс токена.",
          unsupported:
            "Переключитесь на Sepolia или Ethereum Mainnet для отображения данных токена.",
          infoUnavailable:
            "Не удалось получить информацию о токене. Проверьте адрес контракта и RPC.",
          error: "Ошибка чтения данных",
        },
      },
      priceTicker: {
        title: "Курс токена (USD)",
        description: "Обновляется каждые 60 секунд.",
        source: "Источник: {source}",
        updated: "Обновлено: {time}",
        fallback: "Не удалось получить актуальные данные курса. Отображается резервное значение.",
      },
      taxCard: {
        title: "Комиссии (Tax)",
        description: "Процент комиссии при операциях с токеном и быстрый калькулятор.",
        current: "Текущая комиссия",
        calculatorLabel: "Сумма транзакции (в токенах)",
        resultFee: "Комиссия ({tax})",
        resultNet: "Итого после комиссии",
        placeholder: "Введите сумму",
        invalid: "Введите корректное число для расчёта комиссии.",
        fallback: "Не удалось получить данные из контракта. Используется резервное значение.",
        sourceContract: "контракт",
        sourceFallback: "конфигурация (.env)",
      },
    },
    requests: {
      title: "Заявки на вывод средств",
      description:
        "Управляйте запросами на вывод средств. Все действия выполняются вручную и требуют подтверждения финансового отдела. Данные ниже представлены для демонстрации.",
      formTitle: "Форма заявки",
      formDescription:
        "UI-заглушка для внутренних операций. Форма отправляет уведомление в Slack/Email.",
      smartReceiptTitle: "Smart Receipt",
      smartReceiptDescription: "NFT-квитанция подачи заявки. Пока используется мок.",
      historyTitle: "История заявок",
      historyDescription: "Демонстрационная таблица статусов без привязки к API.",
    },
    reviews: {
      title: "Отзывы команд",
      description:
        "Сбор обратной связи от внутренних команд помогает сформировать backlog перед этапами интеграции. Все данные ниже — заглушки для демонстрации.",
      videoButton: "Смотреть плейбек",
      formTitle: "Добавить отзыв",
      formDescription: "Форма для сотрудников. Логика будет реализована на следующих фазах.",
      moderationTitle: "Модерация",
      moderationDescription: "Инструменты админа — пока заглушки.",
    },
    login: {
      title: "Вход в MetaWallet",
      description:
        "Авторизация доступна через корпоративный SSO либо подключение MetaMask. В демо-версии вход выполняется по кнопке ниже и открывает интерфейсы без проверки прав.",
      connect: "Подключить MetaMask",
      corporate: "Войти через корпоративный Email",
      disclaimer:
        "При входе вы соглашаетесь с внутренней политикой доступа и NDA. Все операции логируются.",
      demo: "Демо-доступ",
      demoDescription: "MetaWallet build 0.4 · внутренний превью",
    },
    admin: {
      title: "Панель администратора",
      description:
        "Управление заявками на вывод токенов, мониторинг статусов и ручные проверки. UI отражает структуру будущей панели без активной логики.",
      filtersTitle: "Фильтры",
      filtersDescription: "Выбор критериев для поиска заявок.",
      tableTitle: "Текущие заявки",
      tableDescription: "Таблица для ручной модерации операций.",
    },
    exchange: {
      title: "Telegram-обменник",
      description:
        "Интерфейс для конвертации корпоративных токенов в фиатные средства с передачей заявки через Telegram-бота. Функционал представляется в виде заглушек.",
      calculatorTitle: "Калькулятор обмена",
      calculatorDescription: "Введите сумму и получите предварительный расчёт. Значения статичны.",
      qrTitle: "QR-код связи",
      qrDescription: "Сканируйте, чтобы открыть чат с корпоративным ботом.",
      faqTitle: "FAQ по обмену",
      faqDescription: "Аккордеон будет интерактивным на следующей фазе.",
      chatbotTitle: "Чат-бот",
      chatbotDescription: "Макет интерфейса общения с ботом.",
    },
  },
  en: {
    common: {
      brand: {
        badge: "Internal access",
        report: "Report",
        version: "v0.4 internal",
      },
      nav: {
        dashboard: "Dashboard",
        requests: "Requests",
        reviews: "Reviews",
        admin: "Admin",
        exchange: "Exchange",
        faq: "FAQ",
      },
      footer: {
        contact: "Contact: treasury@company.io",
        policy: "Security policy",
        copyright: "© {year} EuroCoin Labs. Internal use only.",
        version: "v0.4.0-beta",
      },
      buttons: {
        update: "Updating…",
        refresh: "Refresh",
        submitRequest: "Submit request",
        clear: "Clear",
        disabled: "Disabled in demo",
        approve: "Approve",
        decline: "Decline",
        send: "Send",
        copy: "Copy",
        download: "Download",
      },
    },
    language: {
      title: "Language",
      russian: "Русский",
      english: "English",
    },
    home: {
      hero: {
        badge: "MetaMask style",
        title: "Company token control",
        description:
          "Connect MetaMask to manage the corporate token: review balances, track the rate and control fees in a MetaMask-inspired dashboard.",
        chip1: "Sepolia · Ethereum Mainnet",
        chip2: "Reactive balance updates",
        chip3: "USD equivalent & tax calculator",
        statusTitle: "Integration status",
        statusLine1: "• MetaMask connection & network control",
        statusLine2: "• ERC-20 balance readout & USD display",
        statusLine3: "• Internal request form is active",
        checklistTitle: "QA checklist",
        checklist1: "Validated on desktop (1440px)",
        checklist2: "MetaMask auth flow recommended",
        checklist3: "All actions run on testnet until release",
      },
      walletSection: {
        title: "Wallet connection",
        description:
          "MetaMask + wagmi v2. Token operations and monitoring become available after connection.",
        phase: "Phase 2",
      },
      status: {
        title: "Delivery status",
        description: "MVP progress: architecture, connection and analytics milestones.",
        phase1Title: "Phase 1 — completed",
        phase1List1: "• Project scaffolding & configuration",
        phase1List2: "• Tailwind, ESLint, absolute imports",
        phase1List3: "• Wagmi and React Query providers",
        phase2Title: "Phase 2 — done",
        phase3Title: "Phase 3 — ready",
        phase4Title: "Phase 4 — in progress",
        phase2List1: "• MetaMask connect/disconnect flow",
        phase2List2: "• Network status & switcher",
        phase2List3: "• MetaMask-inspired UI components",
        phase3List1: "• ERC-20 balance reading & formatters",
        phase3List2: "• viem + React Query integration",
        phase3List3: "• Balance card with fallback logic",
        phase4List1: "• USD equivalent, cached rates, CoinGecko fallback",
        phase4List2: "• Tax calculator & config",
        phase4List3: "• Internal operation requests",
      },
    },
    eurocoin: {
      sectionTitle: "EuroCoin Presentation",
      sectionDescription: "Interactive 3D model of corporate token with technical specifications",
      title: "EuroCoin — Corporate Token",
      description: "Interactive 3D model of gold coin with detailed token specifications",
      features: {
        title: "Key Features",
        feature1: "ERC-20 standard compatibility",
        feature2: "Automatic rate updates",
        feature3: "MetaMask integration",
      },
      specs: {
        title: "Technical Specifications",
        spec1: "Network: Ethereum Mainnet / Sepolia",
        spec2: "Decimals: 18 digits",
        spec3: "Max supply: 1,000,000 tokens",
      },
    },
    timer: {
      title: "Funds unlock timer",
      description:
        "Funds are pending withdrawal. Treasury will approve the transaction once the timer elapses.",
      status: "Processing",
      hours: "Hours",
      minutes: "Minutes",
      seconds: "Seconds",
      progress: "Progress",
      meta: "Last AML check: 23 Oct 2025 13:45 · Owner: Treasury",
    },
    internalForm: {
      badge: "Internal",
      title: "Token operation request",
      description:
        "Internal teams can request top-ups, withdrawals or balance reviews. Provide as many details as possible to speed up validation.",
      regulationTitle: "Guidelines",
      regulation1: "• Response time: up to 2 hours",
      regulation2: "• Mark urgent requests with priority High",
      regulation3: "• Include a ticket/task link when relevant",
      requester: "Requester*",
      department: "Department*",
      requestType: "Request type*",
      priority: "Priority",
      descriptionField: "Task description / details*",
      helper:
        "Fields marked with * are required. After submission the request appears in the internal dashboard.",
      placeholders: {
        requester: "Full name or corporate email",
        description: "Wallet address, amount, deadline, ticket ID…",
        department: "Select department",
        type: "Choose type",
      },
      requestTypes: {
        topUp: "Token top-up",
        withdraw: "Token withdrawal",
        balance: "Balance review",
        report: "Report request",
      },
      departments: {
        finance: "Finance department",
        aml: "AML/KYC department",
        investment: "Investment team",
        support: "Customer support",
      },
      validationTitle: "Fill in the required fields",
      validationDescription: "Specify requester, department, request type and description.",
      successTitle: "Request submitted",
      successDescription: "Treasury will review it within the business day.",
      buttons: {
        submit: "Submit request",
        clear: "Clear",
      },
      priorities: {
        low: "low",
        normal: "normal",
        high: "high",
      },
    },
    wallet: {
      connect: "Connect MetaMask",
      connecting: "Connecting...",
      connector: "Available connector: {connector}",
      install: "Install MetaMask and allow access to the site.",
      error: "Connection error",
      connectSuccessTitle: "Wallet connected",
      connectSuccessDescription: "MetaMask successfully connected to the app.",
      statusDisconnected: "Not connected",
      status: {
        label: "Status",
        connector: "Connector: {connector}",
        network: "Network: {network}",
        connectedAddress: "Connected address",
      },
      networkAlert: {
        title: "Unsupported network",
        message: "Please switch to {chain} to continue.",
        button: "Switch to {chain}",
      },
      networkLabel: "Network",
      balanceCard: {
        title: "Token balance",
        description: "Shows the connected wallet balance of the corporate token.",
        refresh: "Refresh",
        loading: "Refreshing…",
        usdLabel: "USD equivalent",
        rate: "Rate",
        fallbackRate: "Failed to fetch live rate. Using fallback value.",
        autoRefresh: "Data refreshes automatically every 30 seconds.",
        staticSource: "fixed value",
        status: {
          notConfigured: "Set the token address in environment variables to enable data.",
          notConnected: "Connect MetaMask to display the token balance.",
          unsupported: "Switch to Sepolia or Ethereum Mainnet to load token data.",
          infoUnavailable: "Unable to fetch token info. Verify contract address and RPC.",
          error: "Failed to read data",
        },
      },
      priceTicker: {
        title: "Token price (USD)",
        description: "Refreshes every 60 seconds.",
        source: "Source: {source}",
        updated: "Updated: {time}",
        fallback: "Failed to fetch latest price. Showing fallback value.",
      },
      taxCard: {
        title: "Fees (Tax)",
        description: "Commission percentage for token operations along with a quick calculator.",
        current: "Current fee",
        calculatorLabel: "Transaction amount (in tokens)",
        resultFee: "Fee ({tax})",
        resultNet: "Net after fee",
        placeholder: "Enter amount",
        invalid: "Enter a valid number to calculate the fee.",
        fallback: "Failed to fetch fee from contract. Using fallback configuration value.",
        sourceContract: "contract",
        sourceFallback: "configuration (.env)",
      },
    },
    requests: {
      title: "Withdrawal requests",
      description:
        "Manage withdrawal requests. Every action requires manual confirmation by the finance team. The data below is for demonstration purposes.",
      formTitle: "Request form",
      formDescription: "UI placeholder for internal operations. Form will send Slack/Email later.",
      smartReceiptTitle: "Smart receipt",
      smartReceiptDescription: "NFT receipt for the submitted request. Placeholder for now.",
      historyTitle: "Request history",
      historyDescription: "Demo table of statuses without API wiring.",
    },
    reviews: {
      title: "Team feedback",
      description:
        "Collect feedback from internal teams to prepare the backlog before integration phases. All entries below are placeholders.",
      videoButton: "Watch playback",
      formTitle: "Submit feedback",
      formDescription: "Employee form. Functionality will arrive in later phases.",
      moderationTitle: "Moderation",
      moderationDescription: "Admin tools — placeholders for now.",
    },
    login: {
      title: "MetaWallet login",
      description:
        "Auth via corporate SSO or MetaMask. In the demo access is unlocked with the button below and opens the UI without permission checks.",
      connect: "Connect MetaMask",
      corporate: "Sign in with corporate email",
      disclaimer:
        "By signing in you accept the internal access policy and NDA. All actions are logged.",
      demo: "Demo access",
      demoDescription: "MetaWallet build 0.4 · internal preview",
    },
    admin: {
      title: "Admin panel",
      description:
        "Manage withdrawal requests, monitor statuses and perform manual checks. The UI reflects the upcoming panel without active logic.",
      filtersTitle: "Filters",
      filtersDescription: "Choose criteria to search for requests.",
      tableTitle: "Current requests",
      tableDescription: "Table for manual moderation.",
    },
    exchange: {
      title: "Telegram exchange",
      description:
        "Interface for converting corporate tokens to fiat with a request sent via Telegram bot. Presented as placeholders.",
      calculatorTitle: "Conversion calculator",
      calculatorDescription: "Enter an amount to see a pre-calculated value. Static for now.",
      qrTitle: "QR code",
      qrDescription: "Scan to open a chat with the corporate bot.",
      faqTitle: "Exchange FAQ",
      faqDescription: "Accordion will become interactive in the next phase.",
      chatbotTitle: "Chat bot",
      chatbotDescription: "Mock chat interface.",
    },
  },
};

export function getTranslation(
  locale: Locale,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const parts = key.split(".");
  let value: string | TranslationTree | undefined = translations[locale];

  for (const part of parts) {
    if (typeof value === "object" && value !== null && part in value) {
      value = (value as TranslationTree)[part];
    } else {
      value = undefined;
      break;
    }
  }

  if (value === undefined) {
    value = parts.reduce<TranslationTree | string | undefined>((acc, part) => {
      if (typeof acc === "object" && acc !== null && part in acc) {
        return (acc as TranslationTree)[part];
      }
      return undefined;
    }, translations.ru);
  }

  if (typeof value !== "string") {
    return key;
  }

  if (!vars) {
    return value;
  }

  return Object.entries(vars).reduce(
    (result, [placeholder, replacement]) => result.replace(`{${placeholder}}`, String(replacement)),
    value,
  );
}

export const availableLocales: Locale[] = ["ru", "en"];

export const defaultLocale: Locale = "ru";

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "ru" || value === "en";
}

export const translationsRaw = translations;
