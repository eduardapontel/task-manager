import request from 'supertest';
import { app } from '@/app';
import { prisma } from '@/database/prisma';
import { hash } from 'bcrypt';

export async function authenticateUser() {
  const email = `authuser${crypto.randomUUID()}@example.com`;
  
  let user = await prisma.user.findFirst({ where: { email } });

  if (!user) {
    const passwordHash = await hash('password123', 8);
    user = await prisma.user.create({
      data: {
        name: 'Auth Test User',
        email,
        password: passwordHash,
      },
    });
  }

  user = await prisma.user.update({
    where: { id: user.id },
    data: { role: 'admin' },
  });

  const sessionResponse = await request(app)
    .post('/sessions')
    .send({ email, password: 'password123' });

  const token = sessionResponse.body.token;

  return { token, user };
}
