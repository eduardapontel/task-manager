import { Router } from "express";
import { UsersController } from "@/controllers/users-controller";
import { ensureAuthenticated } from '@/middlewares/ensure-authenticated';

const usersRoutes = Router();
const usersControllers = new UsersController();

usersRoutes.post('/', usersControllers.create);
usersRoutes.patch('/', ensureAuthenticated, usersControllers.update);
usersRoutes.delete('/', ensureAuthenticated, usersControllers.delete);

export { usersRoutes };