import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserSubTierAndAccessTable1707955411994
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    queryRunner.query(
      `CREATE TABLE "userSubappAccess" (
        "id" SERIAL NOT NULL PRIMARY KEY,
        "userId" character varying NOT NULL,
        "appId" character varying NOT NULL,
        "subscription_tier" character varying NOT NULL,
        "access_level" character varying NOT NULL DEFAULT 'basic',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now()
      )`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    queryRunner.query(`DROP TABLE "userSubappAccess"`);
  }
}
