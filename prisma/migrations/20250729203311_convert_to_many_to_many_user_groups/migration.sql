/*
  Warnings:

  - You are about to drop the `Permission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserPermission` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."UserPermission" DROP CONSTRAINT "UserPermission_permissionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."UserPermission" DROP CONSTRAINT "UserPermission_userId_fkey";

-- DropTable
DROP TABLE "public"."Permission";

-- DropTable
DROP TABLE "public"."UserPermission";

-- CreateTable
CREATE TABLE "public"."Group" (
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "public"."UserGroup" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,

    CONSTRAINT "UserGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserGroup_userId_groupName_key" ON "public"."UserGroup"("userId", "groupName");

-- AddForeignKey
ALTER TABLE "public"."UserGroup" ADD CONSTRAINT "UserGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserGroup" ADD CONSTRAINT "UserGroup_groupName_fkey" FOREIGN KEY ("groupName") REFERENCES "public"."Group"("name") ON DELETE CASCADE ON UPDATE CASCADE;
