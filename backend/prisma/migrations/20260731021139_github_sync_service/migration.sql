-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "githubLastSyncedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "githubArchivedAt" TIMESTAMP(3),
ADD COLUMN     "githubDescription" TEXT,
ADD COLUMN     "githubForks" INTEGER,
ADD COLUMN     "githubFullName" TEXT,
ADD COLUMN     "githubHomepage" TEXT,
ADD COLUMN     "githubLanguages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "githubPushedAt" TIMESTAMP(3),
ADD COLUMN     "githubRepoId" INTEGER,
ADD COLUMN     "githubStars" INTEGER,
ADD COLUMN     "githubTopics" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "githubUpdatedAt" TIMESTAMP(3);
