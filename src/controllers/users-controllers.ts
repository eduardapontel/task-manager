import { Request, Response } from 'express';

class UsersControllers {
    create(request: Request, response: Response) {
        return response.json({ message: 'User created!' });
    }
}

export { UsersControllers };