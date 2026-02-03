# UserId Deployment Checklist

## ✅ Pre-deploy

1. Backup production database.
2. Confirm environment variables are set (`DATABASE_URL`, `NEXTAUTH_SECRET`).

## ✅ Migration & Verification

3. Run `scripts/verify-user-id-migration.ts` to check current state.
4. Apply `lib/database/migrations/verify-user-id-columns.sql` if issues are found.
5. Re-run the verification script to confirm success.

## ✅ Functional Checks

6. Sign in with Google OAuth and confirm `userId` appears in session.
7. Submit an exchange request as an OAuth user and confirm `userId` saved in DB.
8. Submit an internal request as an OAuth user and confirm `userId` saved in DB.
9. Verify Telegram notifications show `userId` for both OAuth and wallet users.
10. Test internal balance credit/debit with `userId`.

## ✅ Post-deploy

11. Monitor logs for `userId`-related warnings/errors.
12. Validate profile pages show requests for OAuth users.
