DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Skill" WHERE "percentage" <> 0) THEN
    RAISE EXCEPTION 'Refusing to remove Skill.percentage because non-zero values exist';
  END IF;
END $$;

ALTER TABLE "Skill" DROP COLUMN "percentage";
