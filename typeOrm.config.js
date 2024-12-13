"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const article_entity_1 = require("./src/modules/article/entities/article.entity");
const banner_entity_1 = require("./src/modules/banner/entities/banner.entity");
const user_entity_1 = require("./src/modules/user/entities/user.entity");
const config_1 = require("@nestjs/config");
const dotenv_1 = require("dotenv");
const typeorm_1 = require("typeorm");
(0, dotenv_1.config)();
const configService = new config_1.ConfigService();
exports.default = new typeorm_1.DataSource({
    type: 'postgres',
    host: configService.getOrThrow('DATABASE_HOST'),
    port: 5432,
    database: configService.getOrThrow('DATABASE_NAME'),
    username: configService.getOrThrow('DATABASE_USERNAME'),
    password: configService.getOrThrow('DATABASE_PASS'),
    entities: [article_entity_1.Article, banner_entity_1.Banner, user_entity_1.User],
    migrations: ['src/database/migrations/**'],
    extra: {
        ssl: {
            require: true,
            rejectUnauthorized: true,
        },
    },
});
//# sourceMappingURL=typeOrm.config.js.map