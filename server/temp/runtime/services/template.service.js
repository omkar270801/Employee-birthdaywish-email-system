"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTemplate = exports.updateTemplate = exports.createTemplate = exports.getActiveTemplate = exports.getTemplateById = exports.getAllTemplates = void 0;
const prisma_1 = require("../utils/prisma");
const getAllTemplates = () => {
    return prisma_1.prisma.emailTemplate.findMany({
        orderBy: { createdAt: 'desc' },
    });
};
exports.getAllTemplates = getAllTemplates;
const getTemplateById = (id) => {
    return prisma_1.prisma.emailTemplate.findUnique({ where: { id } });
};
exports.getTemplateById = getTemplateById;
const getActiveTemplate = () => {
    return prisma_1.prisma.emailTemplate.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
    });
};
exports.getActiveTemplate = getActiveTemplate;
const createTemplate = (data) => {
    return prisma_1.prisma.emailTemplate.create({ data });
};
exports.createTemplate = createTemplate;
const updateTemplate = (id, data) => {
    return prisma_1.prisma.emailTemplate.update({ where: { id }, data });
};
exports.updateTemplate = updateTemplate;
const deleteTemplate = (id) => {
    return prisma_1.prisma.emailTemplate.delete({ where: { id } });
};
exports.deleteTemplate = deleteTemplate;
