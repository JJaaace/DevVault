-- Project showcase enhancements
ALTER TABLE "Project"
  ADD COLUMN "displayOrder" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "accentTone" TEXT,
  ADD COLUMN "keyFeatures" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Set existing projects to a stable explicit order.
UPDATE "Project"
SET "displayOrder" = "id"
WHERE "displayOrder" = 0;

-- Skill experience model enhancements
ALTER TYPE "SkillExperienceLevel" ADD VALUE IF NOT EXISTS 'ADVANCED_BEGINNER';

ALTER TABLE "Skill"
  ADD COLUMN "technologyKey" TEXT,
  ADD COLUMN "yearsExperience" INTEGER,
  ADD COLUMN "firstUsedYear" INTEGER,
  ADD COLUMN "projectsBuilt" INTEGER;
