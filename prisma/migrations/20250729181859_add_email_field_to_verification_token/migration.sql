/*
  Warnings:

  - Added the required column `email` to the `EmailVerificationToken` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."EmailVerificationToken" ADD COLUMN     "email" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "EmailVerificationToken_email_idx" ON "public"."EmailVerificationToken"("email");
