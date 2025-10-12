import { Router } from "express";
import { UsersControllers } from "@/controllers/users-controllers";

const usersRoutes = Router();
const usersControllers = new UsersControllers();

usersRoutes.post('/', usersControllers.create);

export { usersRoutes };