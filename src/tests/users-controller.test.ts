import request from 'supertest';
import { prisma } from '@/database/prisma';
import { authenticateUser } from './utils/authenticate-user';
import { app } from '@/app';

describe('UsersController', () => {
    let userId: string;
    let token: string;

    beforeAll(async () => {
        const auth = await authenticateUser();
        token = auth.token;
    });

    afterAll(async () => {
        await prisma.user.delete({ where: { id: userId } });
    });

    it('should create a new user successfully', async () => {
        await prisma.user.deleteMany({
            where: { email: 'testuser@example.com' },
        });

        const response = await request(app).post('/users').send({
            name: 'Test User',
            email: 'testuser@example.com',
            password: 'password123',
        });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('name', 'Test User');
        expect(response.body).toHaveProperty('email', 'testuser@example.com');

        userId = response.body.id;
    });

    it('should not create a user with an existing email', async () => {
        const response = await request(app).post('/users').send({
            name: 'Another User',
            email: 'testuser@example.com',
            password: 'password123',
        });

        expect(response.status).toBe(409);
        expect(response.body).toHaveProperty('message', 'Email already in use.');
    });

    it('should throw a validation error for invalid email', async () => {
        const response = await request(app).post('/users').send({
            name: 'Invalid Email User',
            email: 'invalid-email',
            password: 'password123',
        });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('message', 'Validation error');
    });

    it('should update user details successfully', async () => {
        const response = await request(app)
            .patch('/users')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Updated User',
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id', userId);
        expect(response.body).toHaveProperty('name', 'Updated User');
        expect(response.body).toHaveProperty('email', 'testuser@example.com');
    });

    it('should delete a user successfully', async () => {
        const response = await request(app)
        .delete(`/users`)
        .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'User deleted successfully.');
    });
});
