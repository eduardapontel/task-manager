-- DropForeignKey
ALTER TABLE "public"."tasks_history" DROP CONSTRAINT "tasks_history_task_id_fkey";

-- AddForeignKey
ALTER TABLE "tasks_history" ADD CONSTRAINT "tasks_history_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
