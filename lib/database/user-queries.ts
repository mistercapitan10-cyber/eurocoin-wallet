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

    if (input.email && input.email !== existingByWallet.email) {
      updateFields.email = input.email;
    }

    if (input.name && input.name !== existingByWallet.name) {
      updateFields.name = input.name;
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

      if (input.name) {
        updateFields.name = input.name;
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
    email: input.email ?? null,
    name: input.name ?? null,
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
  const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress)).limit(1);
  return user ?? null;
}

