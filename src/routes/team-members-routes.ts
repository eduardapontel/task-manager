import { Router } from 'express';
import { TeamMembersController } from '@/controllers/team-members-controller';
import { ensureAuthenticated } from '@/middlewares/ensure-authenticated';
import { verifyUserAuthorization } from '@/middlewares/verify-user-authorization';

const teamMembersRoutes = Router();
const teamMembersController = new TeamMembersController();

teamMembersRoutes.use(ensureAuthenticated);
teamMembersRoutes.post('/', verifyUserAuthorization(['admin']), teamMembersController.create);
teamMembersRoutes.get('/', teamMembersController.list);
teamMembersRoutes.delete('/', verifyUserAuthorization(['admin']), teamMembersController.delete);

export { teamMembersRoutes };
