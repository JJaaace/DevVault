const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')
dotenv.config({ path: path.join(__dirname, '..', '.env') })
const { prisma } = require('../src/db/prisma')

const EXPECTED_SOURCE_SHA256 = '99bea99440ca69da5c1e2d96fd23f65313fdd552f11c5e882100bdfe37035531'
const SOURCE_PATH = path.join(__dirname, '..', '.data', 'devvault-local-store.json')
const IMPORT_OWNER_ID = 'dev-local-user'
const EXCLUDED_PROFILE_ID = 'dev-db-user'

function fail(message) {
  throw new Error(message)
}

function readSource() {
  const sourceBuffer = fs.readFileSync(SOURCE_PATH)
  const checksum = crypto.createHash('sha256').update(sourceBuffer).digest('hex')
  if (checksum !== EXPECTED_SOURCE_SHA256) {
    fail(`Source checksum mismatch. Expected ${EXPECTED_SOURCE_SHA256}, received ${checksum}.`)
  }

  return {
    checksum,
    store: JSON.parse(sourceBuffer.toString('utf8')),
  }
}

function asDate(value) {
  return value ? new Date(value) : null
}

function buildImport(source) {
  const profile = source.profiles.find((item) => item.clerkUserId === IMPORT_OWNER_ID)
  const excludedProfile = source.profiles.find((item) => item.clerkUserId === EXCLUDED_PROFILE_ID)
  const projects = source.projects.filter((item) => item.ownerClerkUserId === IMPORT_OWNER_ID)
  const skills = source.skills.filter((item) => item.ownerClerkUserId === IMPORT_OWNER_ID)
  const projectIds = new Set(projects.map((project) => project.id))
  const relationships = skills.flatMap((skill) => (
    (skill.relatedProjectIds || []).map((projectId) => ({ skillId: skill.id, projectId }))
  ))

  if (!profile || profile.username !== 'JJaaace') {
    fail('The expected dev-local-user / JJaaace profile was not found.')
  }
  if (!excludedProfile || excludedProfile.username !== 'jace-db') {
    fail('The expected dev-db-user / jace-db exclusion record was not found.')
  }
  if (projects.length !== 5 || skills.length !== 17 || relationships.length !== 23) {
    fail(`Unexpected source counts: ${projects.length} projects, ${skills.length} skills, ${relationships.length} relationships.`)
  }
  if (new Set(projects.map((item) => item.id)).size !== projects.length) {
    fail('Duplicate project IDs exist in the source.')
  }
  if (new Set(skills.map((item) => item.id)).size !== skills.length) {
    fail('Duplicate skill IDs exist in the source.')
  }
  if (relationships.some((item) => !projectIds.has(item.projectId))) {
    fail('A source skill relationship points to a missing project.')
  }
  if (projects.some((item) => item.ownerClerkUserId !== IMPORT_OWNER_ID)
      || skills.some((item) => item.ownerClerkUserId !== IMPORT_OWNER_ID)) {
    fail('Unexpected ownership exists in the selected import records.')
  }

  return { profile, projects, skills, relationships }
}

function profileData(profile) {
  return {
    clerkUserId: profile.clerkUserId,
    username: profile.username,
    firstName: profile.firstName,
    lastName: profile.lastName,
    bio: profile.bio,
    profileImageUrl: profile.profileImageUrl || null,
    school: profile.school || null,
    graduationYear: profile.graduationYear ?? null,
    major: profile.major || null,
    location: profile.location || null,
    dreamCompanies: profile.dreamCompanies || [],
    currentRole: profile.currentRole || null,
    favoriteLanguage: profile.favoriteLanguage || null,
    favoriteFramework: profile.favoriteFramework || null,
    yearsCoding: profile.yearsCoding ?? null,
    interests: profile.interests || [],
    tagline: profile.tagline || null,
    pronouns: profile.pronouns || null,
    openToWork: Boolean(profile.openToWork),
    jobType: profile.jobType || null,
    githubUrl: profile.githubUrl || null,
    linkedinUrl: profile.linkedinUrl || null,
    websiteUrl: profile.websiteUrl || null,
    twitterUrl: profile.twitterUrl || null,
    githubLastSyncedAt: asDate(profile.githubLastSyncedAt),
  }
}

function projectData(project) {
  return {
    id: project.id,
    ownerClerkUserId: project.ownerClerkUserId,
    displayOrder: project.displayOrder ?? 0,
    title: project.title,
    description: project.description,
    githubUrl: project.githubUrl || null,
    githubRepoId: project.githubRepoId ?? null,
    githubFullName: project.githubFullName || null,
    githubDescription: project.githubDescription || null,
    githubStars: project.githubStars ?? null,
    githubForks: project.githubForks ?? null,
    githubLanguages: project.githubLanguages || [],
    githubTopics: project.githubTopics || [],
    githubHomepage: project.githubHomepage || null,
    githubUpdatedAt: asDate(project.githubUpdatedAt),
    githubPushedAt: asDate(project.githubPushedAt),
    githubArchivedAt: asDate(project.githubArchivedAt),
    liveDemoUrl: project.liveDemoUrl || null,
    bannerImageUrl: project.bannerImageUrl || null,
    accentTone: project.accentTone || null,
    techStack: project.techStack || [],
    keyFeatures: project.keyFeatures || [],
    status: project.status,
    dateStarted: asDate(project.dateStarted),
    targetCompletion: asDate(project.targetCompletion),
    challenges: project.challenges || null,
    lessonsLearned: project.lessonsLearned || null,
    createdAt: asDate(project.createdAt),
    updatedAt: asDate(project.updatedAt),
  }
}

function skillData(skill, relationships) {
  return {
    id: skill.id,
    ownerClerkUserId: skill.ownerClerkUserId,
    name: skill.name,
    technologyKey: skill.technologyKey || null,
    category: skill.category,
    experienceLevel: skill.experienceLevel,
    yearsExperience: skill.yearsExperience ?? null,
    firstUsedYear: skill.firstUsedYear ?? null,
    projectsBuilt: relationships.filter((item) => item.skillId === skill.id).length,
    color: skill.color,
    lastUsed: asDate(skill.lastUsed),
    notes: skill.notes || null,
    createdAt: asDate(skill.createdAt),
    updatedAt: asDate(skill.updatedAt),
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    fail('DATABASE_URL is required.')
  }

  const apply = process.argv.includes('--apply')
  const { checksum, store } = readSource()
  const imported = buildImport(store)
  try {
    const counts = {
      users: await prisma.user.count(),
      profiles: await prisma.profile.count(),
      projects: await prisma.project.count(),
      skills: await prisma.skill.count(),
      relationships: await prisma.skillProject.count(),
    }

    const preview = {
      mode: apply ? 'apply' : 'preview',
      checksum,
      currentDatabaseCounts: counts,
      import: {
        profile: { clerkUserId: imported.profile.clerkUserId, username: imported.profile.username },
        excludedProfile: { clerkUserId: EXCLUDED_PROFILE_ID, username: 'jace-db' },
        projects: imported.projects.map(({ id, ownerClerkUserId, title }) => ({ id, ownerClerkUserId, title })),
        skills: imported.skills.map(({ id, ownerClerkUserId, name }) => ({ id, ownerClerkUserId, name })),
        relationships: imported.relationships.length,
      },
    }
    console.log(JSON.stringify(preview, null, 2))

    if (!apply) {
      return
    }

    if (Object.values(counts).some((count) => count !== 0)) {
      fail('Target tables are not empty; refusing to import.')
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.create({ data: { clerkUserId: IMPORT_OWNER_ID } })
      await tx.profile.create({ data: profileData(imported.profile) })

      for (const project of imported.projects.sort((left, right) => left.id - right.id)) {
        await tx.project.create({ data: projectData(project) })
      }
      for (const skill of imported.skills.sort((left, right) => left.id - right.id)) {
        await tx.skill.create({ data: skillData(skill, imported.relationships) })
      }
      await tx.skillProject.createMany({ data: imported.relationships })

      await tx.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Project"', 'id'), 5, true)`)
      await tx.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"Skill"', 'id'), 17, true)`)
    })

    console.log('Migration committed successfully.')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
