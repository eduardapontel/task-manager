-- DropForeignKey
ALTER TABLE "public"."tasks_history" DROP CONSTRAINT "tasks_history_changed_by_fkey";

-- AddForeignKey
ALTER TABLE "tasks_history" ADD CONSTRAINT "tasks_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
