import { eq } from "drizzle-orm";
import { db } from "./drizzle";
import { users } from "./auth-schema";

type UserInsert = typeof users.$inferInsert;
type UserSelect = typeof users.$inferSelect;

export interface UpsertWalletUserInput {
  walletAddress: `0x${string}`;
  email?: string;
  name?: string;
}

export interface UpsertWalletUserResult {
  id: string;
  isNewUser: boolean;
  linkedExistingAccount: boolean;
}

/**
 * Create or update a wallet-authenticated user record.
 * - If a user with the wallet address exists, refresh metadata.
 * - Otherwise, link to an email user if present.
 * - Finally, create a new user record.
 */
export async function upsertWalletUser(
  input: UpsertWalletUserInput,
): Promise<UpsertWalletUserResult> {
  const walletAddress = input.walletAddress;
  const now = new Date();

  const [existingByWallet] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
    })
    .from(users)
    .where(eq(users.walletAddress, walletAddress))
    .limit(1);

  if (existingByWallet) {
    const updateFields: Partial<UserInsert> = {
      authType: "wallet",
      updatedAt: now,
    };

    const cleanEmail = input.email && input.email.trim() !== '' ? input.email : null;
    const cleanName = input.name && input.name.trim() !== '' ? input.name : null;

    if (cleanEmail && cleanEmail !== existingByWallet.email) {
      updateFields.email = cleanEmail;
    }

    if (cleanName && cleanName !== existingByWallet.name) {
      updateFields.name = cleanName;
    }

    if (Object.keys(updateFields).length > 0) {
      await db.update(users).set(updateFields).where(eq(users.id, existingByWallet.id));
    }

    return {
      id: existingByWallet.id,
      isNewUser: false,
      linkedExistingAccount: Boolean(existingByWallet.email),
    };
  }

  if (input.email) {
    const [existingByEmail] = await db
      .select({
        id: users.id,
        walletAddress: users.walletAddress,
      })
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (existingByEmail) {
      const updateFields: Partial<UserInsert> = {
        walletAddress,
        authType: "wallet",
        updatedAt: now,
      };

      const cleanName = input.name && input.name.trim() !== '' ? input.name : null;
      if (cleanName) {
        updateFields.name = cleanName;
      }

      await db.update(users).set(updateFields).where(eq(users.id, existingByEmail.id));

      return {
        id: existingByEmail.id,
        isNewUser: false,
        linkedExistingAccount: true,
      };
    }
  }

  const insertValues: UserInsert = {
    walletAddress,
    email: input.email && input.email.trim() !== '' ? input.email : null,
    name: input.name && input.name.trim() !== '' ? input.name : null,
    authType: "wallet",
    createdAt: now,
    updatedAt: now,
  };

  const [created] = await db
    .insert(users)
    .values(insertValues)
    .returning({
      id: users.id,
    });

  return {
    id: created.id,
    isNewUser: true,
    linkedExistingAccount: Boolean(input.email),
  };
}

/**
 * Convenience helper to fetch a user by wallet address.
 */
export async function getUserByWalletAddress(
  walletAddress: `0x${string}`,
): Promise<UserSelect | null> {
  try {
    console.log("[user-queries] getUserByWalletAddress called:", {
      walletAddress,
      normalized: walletAddress.toLowerCase(),
      hasDb: !!db,
    });

    const normalizedAddress = walletAddress.toLowerCase() as `0x${string}`;
    
    // Try direct SQL query first as fallback
    try {
      const { query } = await import("./db");
      console.log("[user-queries] Attempting direct SQL query as fallback");
      const result = await query(
        'SELECT id, name, email, "emailVerified", image, auth_type as "authType", wallet_address as "walletAddress", created_at as "createdAt", updated_at as "updatedAt" FROM users WHERE LOWER(wallet_address) = $1 LIMIT 1',
        [normalizedAddress],
      );
      
      if (result.rows.length > 0) {
        const user = result.rows[0] as UserSelect;
        console.log("[user-queries] User found via direct SQL:", { userId: user.id, email: user.email });
        return user;
      } else {
        console.log("[user-queries] User not found via direct SQL for wallet:", normalizedAddress);
        return null;
      }
    } catch (sqlError) {
      console.error("[user-queries] Direct SQL query failed, trying Drizzle:", {
        error: sqlError instanceof Error ? sqlError.message : String(sqlError),
      });
    }

    // Try Drizzle ORM query
    console.log("[user-queries] Attempting Drizzle ORM query");
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.walletAddress, normalizedAddress))
      .limit(1);

    if (user) {
      console.log("[user-queries] User found via Drizzle:", { userId: user.id, email: user.email });
    } else {
      console.log("[user-queries] User not found via Drizzle for wallet:", normalizedAddress);
    }

    return user ?? null;
  } catch (error) {
    console.error("[user-queries] Error in getUserByWalletAddress:", {
      walletAddress,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      errorCode: (error as any)?.code,
      errorDetail: (error as any)?.detail,
      errorHint: (error as any)?.hint,
    });
    throw error;
  }
}

