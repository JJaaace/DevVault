-- CreateEnum
CREATE TYPE "ProjectArtworkSource" AS ENUM ('NONE', 'GITHUB', 'CATALOG', 'IMPORTED', 'CURATED');

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "currentFocus" TEXT,
ADD COLUMN     "portfolioEnabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "bannerImageSource" "ProjectArtworkSource" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "publicVisible" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Skill" ADD COLUMN     "publicVisible" BOOLEAN NOT NULL DEFAULT true;

-- Preserve existing artwork without treating GitHub-imported owner avatars as curated art.
UPDATE "Project"
SET "bannerImageSource" = 'GITHUB'
WHERE "bannerImageUrl" IS NOT NULL AND BTRIM("bannerImageUrl") <> '';

-- Preserve the existing first-project convention as an explicit durable selection.
UPDATE "Project" AS project
SET "featured" = true
WHERE project."id" = (
    SELECT candidate."id"
    FROM "Project" AS candidate
    WHERE candidate."ownerClerkUserId" = project."ownerClerkUserId"
    ORDER BY candidate."displayOrder" ASC, candidate."id" ASC
    LIMIT 1
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" SERIAL NOT NULL,
    "ownerClerkUserId" TEXT NOT NULL,
    "legacyKey" TEXT,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "targetCompletion" TIMESTAMP(3),
    "description" TEXT NOT NULL,
    "why" TEXT,
    "notes" TEXT,
    "resources" JSONB NOT NULL DEFAULT '[]',
    "relatedProjectNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "relatedCertificationNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "relatedTechnologies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "milestones" JSONB NOT NULL DEFAULT '[]',
    "accent" TEXT,
    "publicVisible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certification" (
    "id" SERIAL NOT NULL,
    "ownerClerkUserId" TEXT NOT NULL,
    "legacyKey" TEXT,
    "name" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3),
    "year" INTEGER NOT NULL,
    "credentialId" TEXT,
    "credentialUrl" TEXT,
    "verifyUrl" TEXT,
    "logo" TEXT,
    "accentColor" TEXT,
    "skillsGained" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "technologies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "associatedProjects" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "publicVisible" BOOLEAN NOT NULL DEFAULT true,
    "assetData" BYTEA,
    "assetMimeType" TEXT,
    "assetName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertificationRoadmapItem" (
    "id" SERIAL NOT NULL,
    "ownerClerkUserId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CertificationRoadmapItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResumeAsset" (
    "ownerClerkUserId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
    "byteSize" INTEGER NOT NULL,
    "content" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResumeAsset_pkey" PRIMARY KEY ("ownerClerkUserId")
);

-- CreateIndex
CREATE INDEX "Goal_ownerClerkUserId_displayOrder_idx" ON "Goal"("ownerClerkUserId", "displayOrder");

-- CreateIndex
CREATE INDEX "Goal_ownerClerkUserId_status_idx" ON "Goal"("ownerClerkUserId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Goal_ownerClerkUserId_legacyKey_key" ON "Goal"("ownerClerkUserId", "legacyKey");

-- CreateIndex
CREATE INDEX "Certification_ownerClerkUserId_displayOrder_idx" ON "Certification"("ownerClerkUserId", "displayOrder");

-- CreateIndex
CREATE INDEX "Certification_ownerClerkUserId_status_idx" ON "Certification"("ownerClerkUserId", "status");

-- CreateIndex
CREATE INDEX "Certification_ownerClerkUserId_publicVisible_idx" ON "Certification"("ownerClerkUserId", "publicVisible");

-- CreateIndex
CREATE UNIQUE INDEX "Certification_ownerClerkUserId_legacyKey_key" ON "Certification"("ownerClerkUserId", "legacyKey");

-- CreateIndex
CREATE INDEX "CertificationRoadmapItem_ownerClerkUserId_displayOrder_idx" ON "CertificationRoadmapItem"("ownerClerkUserId", "displayOrder");

-- CreateIndex
CREATE INDEX "Project_ownerClerkUserId_publicVisible_idx" ON "Project"("ownerClerkUserId", "publicVisible");

-- Enforce at most one explicitly featured project per owner while allowing none.
CREATE UNIQUE INDEX "Project_one_featured_per_owner_idx"
ON "Project"("ownerClerkUserId")
WHERE "featured" = true;

-- CreateIndex
CREATE INDEX "Skill_ownerClerkUserId_publicVisible_idx" ON "Skill"("ownerClerkUserId", "publicVisible");

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_ownerClerkUserId_fkey" FOREIGN KEY ("ownerClerkUserId") REFERENCES "User"("clerkUserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_ownerClerkUserId_fkey" FOREIGN KEY ("ownerClerkUserId") REFERENCES "User"("clerkUserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CertificationRoadmapItem" ADD CONSTRAINT "CertificationRoadmapItem_ownerClerkUserId_fkey" FOREIGN KEY ("ownerClerkUserId") REFERENCES "User"("clerkUserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeAsset" ADD CONSTRAINT "ResumeAsset_ownerClerkUserId_fkey" FOREIGN KEY ("ownerClerkUserId") REFERENCES "User"("clerkUserId") ON DELETE CASCADE ON UPDATE CASCADE;
