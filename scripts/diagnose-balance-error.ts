#!/usr/bin/env tsx
/**
 * Диагностический скрипт для проверки внутреннего баланса
 * Помогает найти причину ошибки "Failed to load internal balance snapshot"
 */

import { query } from "@/lib/database/db";
import { getUserByWalletAddress } from "@/lib/database/user-queries";
import { getInternalBalanceSnapshot } from "@/lib/database/internal-balance-queries";

const WALLET_ADDRESS = process.argv[2] || "0x899CD926A9028aFE9056e76Cc01f32EE859e7a65";

async function diagnose() {
  console.log("🔍 Диагностика внутреннего баланса\n");
  console.log(`Кошелек: ${WALLET_ADDRESS}\n`);

  try {
    // Шаг 1: Проверка подключения к БД
    console.log("1️⃣ Проверка подключения к базе данных...");
    const dbCheck = await query("SELECT NOW() as current_time");
    console.log(`   ✅ Подключение к БД работает (время сервера: ${dbCheck.rows[0].current_time})\n`);

    // Шаг 2: Проверка существования таблиц
    console.log("2️⃣ Проверка существования таблиц...");
    const tablesCheck = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name IN ('internal_wallets', 'internal_balances', 'internal_ledger', 'withdraw_requests')
      ORDER BY table_name
    `);
    const foundTables = tablesCheck.rows.map((r) => r.table_name);
    const requiredTables = ["internal_balances", "internal_ledger", "internal_wallets", "withdraw_requests"];

    const missingTables = requiredTables.filter((t) => !foundTables.includes(t));
    if (missingTables.length > 0) {
      console.log(`   ❌ Отсутствуют таблицы: ${missingTables.join(", ")}`);
      console.log(`   ✅ Найдены таблицы: ${foundTables.join(", ")}`);
      console.log("\n   ⚠️  Нужно применить миграции!\n");
      return;
    }
    console.log(`   ✅ Все таблицы существуют: ${foundTables.join(", ")}\n`);

    // Шаг 3: Проверка функции update_updated_at_column
    console.log("3️⃣ Проверка функции update_updated_at_column...");
    const functionCheck = await query(`
      SELECT proname
      FROM pg_proc
      WHERE proname = 'update_updated_at_column'
    `);
    if (functionCheck.rows.length === 0) {
      console.log("   ❌ Функция update_updated_at_column не найдена!");
      console.log("   ⚠️  Нужно создать функцию!\n");
    } else {
      console.log("   ✅ Функция update_updated_at_column существует\n");
    }

    // Шаг 4: Поиск пользователя по кошельку
    console.log("4️⃣ Поиск пользователя по кошельку...");
    const normalizedWallet = WALLET_ADDRESS.toLowerCase() as `0x${string}`;
    const user = await getUserByWalletAddress(normalizedWallet);
    if (!user) {
      console.log(`   ❌ Пользователь с кошельком ${WALLET_ADDRESS} не найден!`);
      console.log("   ⚠️  Пользователь должен быть зарегистрирован в системе\n");
      return;
    }
    console.log(`   ✅ Пользователь найден: ID=${user.id}, email=${user.email || "N/A"}\n`);

    // Шаг 5: Проверка внутреннего кошелька
    console.log("5️⃣ Проверка внутреннего кошелька...");
    const walletCheck = await query(
      "SELECT * FROM internal_wallets WHERE user_id = $1 LIMIT 1",
      [user.id],
    );
    if (walletCheck.rows.length === 0) {
      console.log("   ⚠️  Внутренний кошелек не существует (будет создан автоматически)\n");
    } else {
      const wallet = walletCheck.rows[0];
      console.log(`   ✅ Внутренний кошелек существует: ID=${wallet.id}`);
      console.log(`      wallet_address=${wallet.wallet_address || "NULL"}\n`);
    }

    // Шаг 6: Попытка загрузить snapshot
    console.log("6️⃣ Попытка загрузить snapshot...");
    try {
      const snapshot = await getInternalBalanceSnapshot({
        userId: user.id,
        walletAddress: normalizedWallet,
      });
      console.log("   ✅ Snapshot загружен успешно!");
      console.log(`      Wallet ID: ${snapshot.wallet.id}`);
      console.log(`      Balance: ${snapshot.balance.balance}`);
      console.log(`      Ledger entries: ${snapshot.ledger.length}\n`);
      console.log("✅ Все проверки пройдены! Система работает корректно.\n");
    } catch (snapshotError) {
      console.log("   ❌ Ошибка при загрузке snapshot:");
      console.error(`      ${snapshotError instanceof Error ? snapshotError.message : String(snapshotError)}`);
      if (snapshotError instanceof Error && snapshotError.stack) {
        console.error(`\n      Stack trace:\n${snapshotError.stack.split("\n").slice(0, 5).join("\n")}`);
      }
      console.log("");
    }
  } catch (error) {
    console.error("\n❌ Критическая ошибка при диагностике:");
    console.error(error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error(`\nStack trace:\n${error.stack}`);
    }
    process.exit(1);
  }
}

diagnose()
  .then(() => {
    console.log("Диагностика завершена.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Неожиданная ошибка:", error);
    process.exit(1);
  });

