import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';

export const getAllTemplates = () => {
  return prisma.emailTemplate.findMany({
    orderBy: { createdAt: 'desc' },
  });
};

export const getTemplateById = (id: string) => {
  return prisma.emailTemplate.findUnique({ where: { id } });
};

export const getActiveTemplate = () => {
  return prisma.emailTemplate.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  });
};

export const createTemplate = (data: Prisma.EmailTemplateCreateInput) => {
  return prisma.emailTemplate.create({ data });
};

export const updateTemplate = (id: string, data: Prisma.EmailTemplateUpdateInput) => {
  return prisma.emailTemplate.update({ where: { id }, data });
};

export const deleteTemplate = (id: string) => {
  return prisma.emailTemplate.delete({ where: { id } });
};
