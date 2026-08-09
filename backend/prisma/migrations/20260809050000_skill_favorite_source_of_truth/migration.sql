ALTER TABLE "Skill"
ADD COLUMN "favorite" BOOLEAN NOT NULL DEFAULT false;

WITH preferred_skill AS (
  SELECT DISTINCT ON (skill."ownerClerkUserId")
    skill."id"
  FROM "Skill" AS skill
  INNER JOIN "Profile" AS profile
    ON profile."clerkUserId" = skill."ownerClerkUserId"
  WHERE lower(skill."name") = lower(COALESCE(profile."favoriteLanguage", profile."favoriteFramework"))
  ORDER BY skill."ownerClerkUserId", skill."id"
)
UPDATE "Skill"
SET "favorite" = true
WHERE "id" IN (SELECT "id" FROM preferred_skill);

CREATE UNIQUE INDEX "Skill_one_favorite_per_owner"
ON "Skill"("ownerClerkUserId")
WHERE "favorite" = true;
