const { PrismaClient } = require('@prisma/client');

// Optionally call prisma.$connect() when starting long-lived processes.
const prisma = new PrismaClient();
module.exports = prisma;
