"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = exports.param = exports.body = exports.validate = void 0;
const validate = (validations) => {
    return async (req, res, next) => {
        for (const validation of validations) {
            const result = await validation.run(req);
            if (result.errors.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: result.array(),
                });
            }
        }
        next();
    };
};
exports.validate = validate;
var express_validator_1 = require("express-validator");
Object.defineProperty(exports, "body", { enumerable: true, get: function () { return express_validator_1.body; } });
Object.defineProperty(exports, "param", { enumerable: true, get: function () { return express_validator_1.param; } });
Object.defineProperty(exports, "query", { enumerable: true, get: function () { return express_validator_1.query; } });
