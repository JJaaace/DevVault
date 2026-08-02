-- Rename legacy project status value
ALTER TYPE "ProjectStatus" RENAME VALUE 'IN_PROGRESS' TO 'BUILDING';

-- Remove deprecated completion percentage field
ALTER TABLE "Project" DROP COLUMN IF EXISTS "completionPercentage";
