import { AppError } from '@/utils/AppError';
import { Request, Response } from 'express';
import { prisma } from '@/database/prisma';
import { authConfig } from '@/configs/auth';
import { sign, SignOptions } from 'jsonwebtoken';
import { compare } from 'bcrypt';
import { z } from 'zod';

class SessionsController {
    async create(request: Request, response: Response) {
        const bodySchema = z.object({
            email: z.string().email(),
            password: z.string().min(6),
        });

        const { email, password } = bodySchema.parse(request.body);

        const user = await prisma.user.findFirst({
            where: { email },
        });

        if (!user) {
            throw new AppError('Email or password incorrect!', 401);
        }

        const isPasswordCorrect = await compare(password, user.password);

        if (!isPasswordCorrect) {
            throw new AppError('Email or password incorrect!', 401);
        }

        const payload = { role: user.role ?? 'member' };
        const secret = authConfig.jwt.secret;
        const options: SignOptions = {
            subject: user.id,
            expiresIn: authConfig.jwt.expiresIn as SignOptions['expiresIn'],
        };

        const token = sign(payload, secret, options);

        const { password: hashedPassword, ...userWithoutPassword } = user;

        return response.json({ token, user: userWithoutPassword });
    }
}

export { SessionsController };
