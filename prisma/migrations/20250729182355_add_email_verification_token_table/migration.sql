/*
  Warnings:

  - You are about to drop the column `email` on the `EmailVerificationToken` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."EmailVerificationToken_email_idx";

-- AlterTable
ALTER TABLE "public"."EmailVerificationToken" DROP COLUMN "email";
