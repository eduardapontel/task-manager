/*
  Warnings:

  - A unique constraint covering the columns `[user_id,team_id]` on the table `team_members` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."team_members_user_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "team_members_user_id_team_id_key" ON "team_members"("user_id", "team_id");
