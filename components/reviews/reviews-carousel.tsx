"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { useLanguage } from "@/components/providers/language-provider";

interface Review {
  id: string;
  author: string;
  department: string;
  rating: number;
  text: string;
  date: string;
  avatar?: string;
}

const mockReviewsRu: Review[] = [
  {
    id: "1",
    author: "Анна Петрова",
    department: "Киев, Украина",
    rating: 5,
    text: "Не могу поверить! Мне вернули 15 000 USD через эту систему. Меня обманули мошенники, перевел им все деньги на 0x адрес, думал потерял навсегда. Но благодаря службе поддержки удалось отследить транзакцию и вернуть средства. Анонимные консультанты работали днями, очень профессионально!",
    date: "20.01.2025",
  },
  {
    id: "2",
    author: "Михаил Козлов",
    department: "Москва, Россия",
    rating: 5,
    text: "Перевел 8.5 ETH на поддельный контракт. Мошенники украли криптовалюту за считанные минуты. Обратился за помощью - через 2 недели мне вернули 100% средств. Специалисты провели полное расследование блокчейна, нашли подозрительные паттерны и вернули мои деньги. Благодарен всей команде!",
    date: "18.01.2025",
  },
  {
    id: "3",
    author: "Елена Смирнова",
    department: "Санкт-Петербург, Россия",
    rating: 5,
    text: "Стала жертвой фишингового сайта, украли 25 000 USDT. Думала, что деньги потеряны навсегда. Но служба поддержки буквально спасла меня! Провели глубокий анализ транзакций Ethereum, отследили движение средств и вернули все мои токены. Профессионалы высшего класса!",
    date: "15.01.2025",
  },
  {
    id: "4",
    author: "Дмитрий Волков",
    department: "Алматы, Казахстан",
    rating: 5,
    text: "Мошенники похитили у меня 50 000 USD через поддельный DeFi протокол. Все средства ушли на неизвестный адрес 0x... Обратился сюда в отчаянии. Невероятно, но мне помогли! Специалисты использовали прямую интеграцию с Ethereum и MetaMask для расследования. Вернули 100% средств. Спасибо!",
    date: "12.01.2025",
  },
  {
    id: "5",
    author: "Ольга Морозова",
    department: "Минск, Беларусь",
    rating: 5,
    text: "Потеряла 32 ETH из-за поддельного NFT marketplace. Мошенники украли все через вредоносный смарт-контракт. Антифрод команда провела расследование подозрительных транзакций с помощью прямого доступа к сети Ethereum. Буквально через неделю вернули весь ETH обратно в мой MetaMask кошелек. Я в шоке от такого уровня сервиса!",
    date: "10.01.2025",
  },
];

const mockReviewsEn: Review[] = [
  {
    id: "1",
    author: "Anna Petrova",
    department: "Kyiv, Ukraine",
    rating: 5,
    text: "I can't believe it! They recovered 15,000 USD for me through this system. I was scammed by fraudsters, transferred all my money to a 0x address, thought I lost it forever. But thanks to the support service, they were able to track the transaction and recover the funds. Anonymous consultants worked for days, very professional!",
    date: "20.01.2025",
  },
  {
    id: "2",
    author: "Mikhail Kozlov",
    department: "Moscow, Russia",
    rating: 5,
    text: "I sent 8.5 ETH to a fake contract. The fraudsters stole the cryptocurrency in minutes. I contacted for help - within 2 weeks they recovered 100% of my funds. Specialists conducted a full blockchain investigation, found suspicious patterns and recovered my money. Grateful to the entire team!",
    date: "18.01.2025",
  },
  {
    id: "3",
    author: "Elena Smirnova",
    department: "Saint Petersburg, Russia",
    rating: 5,
    text: "I became a victim of a phishing site, 25,000 USDT was stolen. I thought the money was lost forever. But the support service literally saved me! They conducted a deep analysis of Ethereum transactions, tracked the fund movement and recovered all my tokens. Top-class professionals!",
    date: "15.01.2025",
  },
  {
    id: "4",
    author: "Dmitry Volkov",
    department: "Almaty, Kazakhstan",
    rating: 5,
    text: "Fraudsters stole 50,000 USD from me through a fake DeFi protocol. All funds went to an unknown 0x address... I contacted them in despair. Incredibly, they helped me! Specialists used direct integration with Ethereum and MetaMask for the investigation. They recovered 100% of the funds. Thank you!",
    date: "12.01.2025",
  },
  {
    id: "5",
    author: "Olga Morozova",
    department: "Minsk, Belarus",
    rating: 5,
    text: "Lost 32 ETH due to a fake NFT marketplace. The fraudsters stole everything through a malicious smart contract. The antifraud team conducted an investigation of suspicious transactions with direct access to the Ethereum network. Literally within a week, they returned all the ETH back to my MetaMask wallet. I'm amazed by this level of service!",
    date: "10.01.2025",
  },
];

export function ReviewsCarousel() {
  const t = useTranslation();
  const { locale } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const prevLocale = useRef(locale);

  const mockReviews = useMemo(() => {
    return locale === "en" ? mockReviewsEn : mockReviewsRu;
  }, [locale]);

  // Reset to first review when language changes
  // Note: setState in effect is appropriate here to reset carousel on language change
  useEffect(() => {
    if (prevLocale.current !== locale) {
      prevLocale.current = locale;
      setCurrentIndex(0);
    }
    // eslint-disable-next-line
  }, [locale]);

  useEffect(() => {
    setTimeout(() => {
      setIsMounted(true);
    }, 100);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % mockReviews.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isMounted, mockReviews.length]);

  const nextReview = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % mockReviews.length);
  };

  const prevReview = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + mockReviews.length) % mockReviews.length);
  };

  const goToReview = (index: number) => {
    setCurrentIndex(index);
  };

  if (!isMounted) {
    return (
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-8 text-center">
            <h2 className="dark:text-dark-foreground mb-4 text-3xl font-bold text-foreground">
              {t("reviews.title")}
            </h2>
            <p className="dark:text-dark-foregroundMuted text-foregroundMuted">
              {t("reviews.subtitle")}
            </p>
          </div>
          <div className="dark:bg-dark-surfaceAlt h-64 animate-pulse rounded-lg bg-surfaceAlt" />
        </div>
      </section>
    );
  }

  const currentReview = mockReviews[currentIndex];

  return (
    <section id="reviews" className="py-16">
      <div className="mx-auto max-w-4xl px-6">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="dark:text-dark-foreground mb-4 text-3xl font-bold text-foreground">
            {t("reviews.title")}
          </h2>
          <p className="dark:text-dark-foregroundMuted text-lg text-foregroundMuted">
            {t("reviews.subtitle")}
          </p>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Review Card */}
          <Card className="overflow-hidden shadow-card-elevated">
            <CardContent className="p-8">
              <div className="text-center">
                {/* Rating Stars */}
                <div className="mb-6 flex justify-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`h-6 w-6 ${
                        i < currentReview.rating
                          ? "text-accentAlt"
                          : "dark:text-dark-outline text-outline"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                {/* Review Text */}
                <blockquote className="dark:text-dark-foregroundMuted mb-8 text-lg italic text-foregroundMuted">
                  &quot;{currentReview.text}&quot;
                </blockquote>

                {/* Author Info */}
                <div className="flex items-center justify-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accentAlt">
                    <span className="text-lg font-semibold text-white">
                      {currentReview.author
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div className="text-left">
                    <h4 className="dark:text-dark-foreground font-semibold text-foreground">
                      {currentReview.author}
                    </h4>
                    <p className="dark:text-dark-foregroundMuted text-sm text-foregroundMuted">
                      {currentReview.department}
                    </p>
                    <p className="dark:text-dark-foregroundMuted text-xs text-foregroundMuted">
                      {currentReview.date}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-center gap-4">
            {/* Previous Button */}
            <Button variant="ghost" size="sm" onClick={prevReview} className="rounded-full p-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Button>

            {/* Dots */}
            <div className="flex gap-2">
              {mockReviews.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToReview(index)}
                  className={`h-3 w-3 rounded-full transition-colors ${
                    index === currentIndex ? "bg-accent" : "dark:bg-dark-outline bg-outline"
                  }`}
                />
              ))}
            </div>

            {/* Next Button */}
            <Button variant="ghost" size="sm" onClick={nextReview} className="rounded-full p-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Button>
          </div>

          {/* Review Counter */}
          <div className="mt-4 text-center">
            <span className="dark:text-dark-foregroundMuted text-sm text-foregroundMuted">
              {t("reviews.counter", { current: currentIndex + 1, total: mockReviews.length })}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="text-center">
            <div className="text-3xl font-bold text-accent">92%</div>
            <div className="dark:text-dark-foregroundMuted text-sm text-foregroundMuted">
              {t("reviews.stats.success")}
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-accent">127K+</div>
            <div className="dark:text-dark-foregroundMuted text-sm text-foregroundMuted">
              {t("reviews.stats.recovered")}
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-accent">24/7</div>
            <div className="dark:text-dark-foregroundMuted text-sm text-foregroundMuted">
              {t("reviews.stats.support")}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
