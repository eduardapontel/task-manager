-- DropForeignKey
ALTER TABLE "public"."team_members" DROP CONSTRAINT "team_members_user_id_fkey";

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
