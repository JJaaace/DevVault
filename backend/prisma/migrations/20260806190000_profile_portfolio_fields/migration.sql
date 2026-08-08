-- Add profile fields already represented by the application schema.
ALTER TABLE "Profile"
  ADD COLUMN IF NOT EXISTS "tagline" TEXT,
  ADD COLUMN IF NOT EXISTS "pronouns" TEXT,
  ADD COLUMN IF NOT EXISTS "openToWork" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "jobType" TEXT,
  ADD COLUMN IF NOT EXISTS "twitterUrl" TEXT;
