import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddImageUrlColumnArticleTable1731034929005
  implements MigrationInterface
{
  name = 'AddImageUrlColumnArticleTable1731034929005';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "articles" ADD "image_url" VARCHAR(255)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "articles" DROP COLUMN "image_url"`);
  }
}
