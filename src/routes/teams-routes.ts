import { Router } from 'express';
import { TeamsController } from '@/controllers/teams-controller';
import { ensureAuthenticated } from '@/middlewares/ensure-authenticated';
import { verifyUserAuthorization } from '@/middlewares/verify-user-authorization';

const teamsRoutes = Router();
const teamsController = new TeamsController();

teamsRoutes.use(ensureAuthenticated);
teamsRoutes.use(verifyUserAuthorization(['admin']));
teamsRoutes.post('/', teamsController.create);
teamsRoutes.get('/', teamsController.list);
teamsRoutes.patch('/', teamsController.edit);
teamsRoutes.delete('/', teamsController.delete);

export { teamsRoutes };
