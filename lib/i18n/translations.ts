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
        token: "Токен",
        requests: "Заявки",
        reviews: "Отзывы",
        admin: "Админ",
        exchange: "Обменник",
        faq: "FAQ",
        contact: "Контакты",
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
    faq: {
      title: "❓ Часто задаваемые вопросы — возврат средств от брокера-мошенника",
      description: "Ответы на основные вопросы о процедуре возврата средств",
      questions: {
        q1: {
          question: "1. Как в целом проходит процедура возврата средств?",
          answer:
            "Мы проводим комплексное расследование: технический анализ блокчейн-транзакций, сбор доказательств и подача заявлений в регуляторные и правоохранительные органы. По результатам проверки мы инициируем процесс блокировки/перевода активов и юридического оформления возврата средств на ваш кошелёк.",
        },
        q2: {
          question: "2. В какие органы вы подаёте заявления?",
          answer:
            "Мы направляем обращения и жалобы в профильные национальные и международные органы, включая (как пример): FCA (Financial Conduct Authority, Великобритания), CySEC (Cyprus Securities and Exchange Commission), BaFin (ФРГ), ASIC (Австралия), SEC (США), FINMA (Швейцария), MAS (Сингапур), CNMV / CONSOB (Испания / Италия), FinCEN (США, финансовая разведка), Интерпол / подразделения по финансовым киберпреступлениям. (Перечень носит иллюстративный характер и может расширяться в зависимости от юрисдикции мошенника и места проживания клиента.)",
        },
        q3: {
          question:
            '3. Вы говорите, что работаете "напрямую с Ethereum и MetaMask" — что это значит?',
          answer:
            "Наша платформа работает в экосистеме Ethereum и интегрирована с MetaMask — это позволяет нам отслеживать транзакции в сети, взаимодействовать с адресами-источниками и безопасно переводить подтверждённые активы на ваш персональный MetaMask-кошелёк в эфире (ETH) или в токенах стандарта ERC.",
        },
        q4: {
          question: '4. Как именно "замораживаются" деньги у мошенников?',
          answer:
            "При сборе доказательств и взаимодействии с партнёрами и регуляторами мы инициируем комплекс действий по блокировке подозрительных адресов и транзакций на уровне смарт-контрактов и записей в блокчейне. После юридического подтверждения факта мошенничества средства изолируются для последующей передачи клиенту в рамках правового механизма (возможность и скорость зависят от конкретного случая и юрисдикции).",
        },
        q5: {
          question: "5. Что такое смарт-контракт и зачем вы его создаёте?",
          answer:
            "Для безопасного и прозрачного перевода восстановленных средств мы создаём индивидуальный смарт-контракт в сети Ethereum. Смарт-контракт обеспечивает условный автоматический перевод средств на ваш кошелёк и фиксирует условия дальнейшего вывода/конвертации. При необходимости мы проводим юридическую верификацию активов, после чего средства могут быть переведены на ваш банковский счёт в соответствии с AML/KYC требованиями.",
        },
        q6: {
          question: "6. Можно ли «легализовать» средства и вывести их на банковский счёт?",
          answer:
            "Да — после прохождения юридической проверки и соответствующей процедуры конвертации (включая соблюдение требований AML/KYC и налогового учёта) средства переводятся с вашего MetaMask-кошелька на банковский счёт. Смарт-контракт и юридические документы подтверждают происхождение средств и обеспечивают «белый» статус переводимых сумм.",
        },
        q7: {
          question: "7. Когда и как вы берёте оплату за свои услуги?",
          answer:
            "Мы работаем по успех-модели: оплата услуг производится только после успешного поступления средств на ваш кошелёк. Нет предварительных платы или скрытых комиссий — только прозрачный процент/фиксированная сумма по согласованию.",
        },
        q8: {
          question: "8. Возможно ли вернуть средства, если деньги были потеряны 2–3 года назад?",
          answer:
            "Да, это реально. Мы уже имели кейсы возврата активов, потерянных более 5 лет назад. Ключевое условие успешной проверки — чтобы исходные транзакции могли быть подтверждены в сети Ethereum и имелась возможность проследить цепочку движений средств.",
        },
        q9: {
          question: "9. Какие документы и доказательства мне нужно предоставить?",
          answer:
            "После регистрации необходимо заполнить заявку и загрузить все доступные подтверждающие документы: чеки и квитанции; банковские/платёжные выписки; скриншоты переписок с брокером; договоры и счета; иные документы, подтверждающие деловые отношения с компанией-противником. Чем больше данных вы предоставите — тем выше шансы на успешную проверку и возврат средств.",
        },
        q10: {
          question: "10. Сколько времени занимает весь процесс?",
          answer:
            "Сроки зависят от сложности дела, юрисдикции мошенника и скорости взаимодействия регуляторов и партнёров. Некоторые дела решаются в течение недель, сложные международные кейсы — в несколько месяцев. (Примечание: сроки приведены ориентировочно.)",
        },
      },
      contact: {
        title: "🧾 Контакт и начало процедуры",
        description:
          "Зарегистрируйтесь в личном кабинете и отправьте заявку с документами — наши специалисты начнут предварительный анализ сразу после получения информации.",
      },
    },
    tokenSection: {
      mainTitle: "Возврат средств и защита ваших цифровых активов",
      walletConnection: {
        title: "Подключение кошелька",
        description:
          "MetaMask + wagmi v2. После подключения доступны операции токена и мониторинг.",
      },
      recovery: {
        p1: "Работаем на основе инфраструктуры Ethereum и интеграции с MetaMask",
        p2: "Наша платформа помогает клиентам вернуть средства, потерянные у брокеров-мошенников, и замораживает до 90% подозрительных транзакций для проведения юридической и технической проверки.",
        p3: "Мы используем блокчейн-анализ и международные стандарты комплаенса, чтобы обеспечить прозрачность, безопасность и законность каждой операции.",
      },
      legal: {
        title: "Юридическая защита и финансовая экспертиза",
        p1: "Команда юристов и аналитиков проводит всесторонний анализ транзакций, чтобы выявить признаки мошенничества и инициировать процесс возврата средств.",
        p2: "Мы действуем в соответствии с международными нормами AML/KYC, обеспечивая полную конфиденциальность персональных данных и сохранность предоставленной информации.",
      },
      process: {
        title: "Как проходит процесс",
        step1: "Регистрация — создайте личный кабинет для доступа к системе анализа.",
        step2:
          "Подача заявки — заполните форму и приложите чеки, квитанции, выписки или иные документы, подтверждающие отношения с брокером или платформой.",
        step3:
          "Проверка транзакций — наши специалисты проводят технический и юридический аудит всех операций.",
        step4:
          "Заморозка и возврат — при подтверждении мошеннических действий средства блокируются, после чего запускается процедура возврата.",
      },
      whyChooseUs: {
        title: "Почему выбирают нас",
        item1: "Работаем на основе Ethereum и интеграции с MetaMask",
        item2: "Международная юридическая поддержка",
        item3: "Современные методы блокчейн-аналитики",
        item4: "Высокая вероятность возврата средств",
        item5: "Полная конфиденциальность клиентов",
      },
      checkToday: {
        title: "Проверьте возможность возврата уже сегодня",
        p1: "Зарегистрируйтесь сейчас, чтобы пройти бесплатный предварительный анализ транзакций.",
        p2: "Наши специалисты свяжутся с вами в течение 24 часов для начала процедуры проверки.",
      },
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
        token: "Token",
        requests: "Requests",
        reviews: "Reviews",
        admin: "Admin",
        exchange: "Exchange",
        faq: "FAQ",
        contact: "Contact",
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
    faq: {
      title: "✅ FAQ: Fund Recovery from Fraudulent Brokers",
      description: "Answers to common questions about fund recovery procedures",
      questions: {
        q1: {
          question: "1. What does the fund recovery procedure look like?",
          answer:
            "We conduct a comprehensive investigation — including blockchain transaction analysis, collection of evidence, and submission of claims to regulatory and law enforcement authorities. Based on the findings, we initiate the process of asset verification and legal fund recovery.",
        },
        q2: {
          question: "2. Which regulators do you work with?",
          answer:
            "We submit claims and complaints to national and international authorities, such as: FCA (Financial Conduct Authority, UK), CySEC (Cyprus Securities and Exchange Commission), BaFin (Germany), ASIC (Australia), SEC (U.S. Securities and Exchange Commission), FINMA (Switzerland), MAS (Singapore), CNMV / CONSOB (Spain / Italy), FinCEN (U.S. Financial Crimes Enforcement Network), Interpol – Financial Cybercrime Division. (The list is illustrative and may vary depending on the jurisdiction of the fraudulent entity and the client's country of residence.)",
        },
        q3: {
          question: '3. What does "working directly with Ethereum and MetaMask" mean?',
          answer:
            "Our platform operates within the Ethereum ecosystem and is integrated with MetaMask, enabling us to trace transactions, verify sources, and securely transfer confirmed assets to your personal MetaMask wallet in ETH or ERC tokens.",
        },
        q4: {
          question: '4. How are fraudulent funds "frozen"?',
          answer:
            "Through technical analysis, evidence gathering, and communication with partners and regulators, we initiate actions aimed at isolating suspicious wallet addresses or transactions on the blockchain. Once fraud is verified, funds can be held for transfer to the rightful owner in accordance with applicable legal frameworks.",
        },
        q5: {
          question: "5. What is a smart contract and why do you create one?",
          answer:
            "To ensure safe and transparent fund transfers, we develop a custom smart contract on the Ethereum network. It automates conditional fund delivery to your wallet and records all transaction terms, providing legal traceability and protection.",
        },
        q6: {
          question: "6. Can recovered funds be transferred to a bank account?",
          answer:
            "Yes. After legal verification and AML/KYC compliance, recovered funds can be transferred from your MetaMask wallet to your personal bank account. The accompanying documentation and smart contract help verify the source and legitimacy of your assets.",
        },
        q7: {
          question: "7. When do I pay for your services?",
          answer:
            "We operate on a success-based model — payment is due only after the recovered funds are deposited into your wallet. There are no upfront or hidden fees.",
        },
        q8: {
          question: "8. Is it possible to recover funds lost 2–3 years ago?",
          answer:
            "Yes. We have successfully assisted clients in recovering assets lost over 5 years ago, provided that the original transactions were traceable within the Ethereum network.",
        },
        q9: {
          question: "9. What documents do I need to provide?",
          answer:
            "After registration, please submit your claim and upload available supporting materials: receipts or payment confirmations; bank or crypto exchange statements; screenshots of communication with the broker; contracts or invoices; any other documents confirming your relationship with the company. The more evidence you provide, the higher your chances of successful recovery.",
        },
        q10: {
          question: "10. How long does the process take?",
          answer:
            "The timeline depends on case complexity, jurisdiction, and regulatory response times. Some cases are resolved within weeks, while complex international cases may take several months.",
        },
      },
      contact: {
        title: "🧾 Start your claim",
        description:
          "Register in your personal account and upload your documents. Our specialists will begin the preliminary analysis immediately.",
      },
    },
    tokenSection: {
      mainTitle: "Fund Recovery and Protection of Your Digital Assets",
      walletConnection: {
        title: "Wallet Connection",
        description:
          "MetaMask + wagmi v2. Token operations and monitoring become available after connection.",
      },
      recovery: {
        p1: "We operate on the basis of Ethereum infrastructure and integration with MetaMask.",
        p2: "Our platform helps clients recover funds lost to fraudulent brokers and freezes up to 90% of suspicious transactions for legal and technical verification.",
        p3: "We use blockchain analysis and international compliance standards to ensure transparency, security, and legality of every operation.",
      },
      legal: {
        title: "Legal Protection and Financial Expertise",
        p1: "A team of lawyers and analysts conducts a comprehensive analysis of transactions to identify signs of fraud and initiate the fund recovery process.",
        p2: "We act in accordance with international AML/KYC norms, ensuring full confidentiality of personal data and security of provided information.",
      },
      process: {
        title: "How the Process Works",
        step1: "Registration — create a personal account to access the analysis system.",
        step2:
          "Application Submission — fill out the form and attach checks, receipts, statements, or other documents confirming your relationship with the broker or platform.",
        step3:
          "Transaction Verification — our specialists conduct a technical and legal audit of all operations.",
        step4:
          "Freezing and Recovery — upon confirmation of fraudulent actions, funds are blocked, after which the recovery procedure is initiated.",
      },
      whyChooseUs: {
        title: "Why Choose Us",
        item1: "We operate on the basis of Ethereum and integration with MetaMask",
        item2: "International legal support",
        item3: "Modern blockchain analytics methods",
        item4: "High probability of fund recovery",
        item5: "Full client confidentiality",
      },
      checkToday: {
        title: "Check the Possibility of Recovery Today",
        p1: "Register now to undergo a free preliminary transaction analysis.",
        p2: "Our specialists will contact you within 24 hours to start the verification procedure.",
      },
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
