import { Router } from 'express';
import { TasksController } from '@/controllers/tasks-controller';
import { ensureAuthenticated } from '@/middlewares/ensure-authenticated';
import { verifyRoleOrAssignment } from '@/middlewares/verify-role-or-assignment';
import { verifyUserAuthorization } from '@/middlewares/verify-user-authorization';

const tasksRoutes = Router();
const tasksController = new TasksController();

tasksRoutes.use(ensureAuthenticated);

tasksRoutes.post('/', verifyUserAuthorization(['admin']), tasksController.create);
tasksRoutes.get('/', tasksController.list);
tasksRoutes.patch('/:id', verifyRoleOrAssignment(['admin']), tasksController.update);
tasksRoutes.patch('/:id/assign', verifyUserAuthorization(['admin']), tasksController.assign);
tasksRoutes.delete('/:id', verifyRoleOrAssignment(['admin']), tasksController.delete);
tasksRoutes.get('/:id/history', verifyUserAuthorization(['admin']), tasksController.history);

export { tasksRoutes };