import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateNewTODOFields1790539397785 implements MigrationInterface {
  name = 'UpdateNewTODOFields1790539397785';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "todos" ADD "description" text`);
    await queryRunner.query(
      `ALTER TABLE "todos" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "todos" DROP COLUMN "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "todos" DROP COLUMN "description"`);
  }
}
