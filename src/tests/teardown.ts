import { prisma } from '../database/prisma';

export default async function teardown() {
    await prisma.$disconnect();
}
