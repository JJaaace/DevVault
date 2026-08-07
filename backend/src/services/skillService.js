const { listProjects } = require('./projectService')

let prisma = null

try {
  const { PrismaClient } = require('@prisma/client')
  const { PrismaPg } = require('@prisma/adapter-pg')
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  prisma = new PrismaClient({ adapter })
} catch (error) {
  prisma = null
}

const { getLocalStore, updateLocalStore } = require('./localStore')

const SKILL_LEVELS = ['BEGINNER', 'ADVANCED_BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']

const SEEDED_SKILLS = [
  {
    name: 'Java', technologyKey: 'java', category: 'Programming Languages', color: '#F89820',
    experienceLevel: 'EXPERT', firstUsedYear: 2024, yearsExperience: 2, lastUsed: '2026-08-01',
    notes: 'The language that introduced me to software engineering. Java taught me object-oriented programming, problem-solving, and how to think like a developer.',
    aliases: ['java'], relatedProjectTitles: ['Bank Management System', 'Password Manager', 'AP Computer Science A Projects'],
  },
  {
    name: 'JavaScript', technologyKey: 'javascript', category: 'Programming Languages', color: '#F7DF1E',
    experienceLevel: 'ADVANCED', firstUsedYear: 2026, yearsExperience: 1, lastUsed: '2026-08-01',
    notes: 'My primary language for building modern web applications and interactive user experiences.',
    aliases: ['javascript', 'js'], relatedProjectTitles: ['DevVault'],
  },
  {
    name: 'Python', technologyKey: 'python', category: 'Programming Languages', color: '#3776AB',
    experienceLevel: 'ADVANCED', firstUsedYear: 2024, yearsExperience: 2, lastUsed: '2026-08-01',
    notes: 'Great for quickly turning ideas into working applications, scripting, and automation.',
    aliases: ['python', 'py'], relatedProjectTitles: ['Password Strength Analyzer', 'Cloud Cost Budget Tracker'],
  },
  {
    name: 'SQL', technologyKey: 'sql', category: 'Programming Languages', color: '#336791',
    experienceLevel: 'INTERMEDIATE', firstUsedYear: 2026, yearsExperience: 1, lastUsed: '2026-08-01',
    notes: 'Used for querying relational databases and building data-driven applications.',
    aliases: ['sql'], relatedProjectTitles: ['DevVault'],
  },
  {
    name: 'React', technologyKey: 'react', category: 'Frontend', color: '#61DAFB',
    experienceLevel: 'ADVANCED', firstUsedYear: 2026, yearsExperience: 1, lastUsed: '2026-08-01',
    notes: 'My favorite frontend framework because it lets me create polished, interactive user experiences.',
    aliases: ['react', 'reactjs'], relatedProjectTitles: ['DevVault'],
  },
  {
    name: 'HTML5', technologyKey: 'html5', category: 'Frontend', color: '#E34F26',
    experienceLevel: 'ADVANCED', firstUsedYear: 2025, yearsExperience: 2, lastUsed: '2026-08-01',
    notes: 'The foundation of every website I build.',
    aliases: ['html', 'html5'], relatedProjectTitles: ['DevVault', 'Personal Portfolio'],
  },
  {
    name: 'CSS3', technologyKey: 'css3', category: 'Frontend', color: '#1572B6',
    experienceLevel: 'ADVANCED', firstUsedYear: 2025, yearsExperience: 2, lastUsed: '2026-08-01',
    notes: 'Used to create responsive layouts, animations, and polished interfaces.',
    aliases: ['css', 'css3'], relatedProjectTitles: ['DevVault', 'Personal Portfolio'],
  },
  {
    name: 'Node.js', technologyKey: 'nodejs', category: 'Backend', color: '#5FA04E',
    experienceLevel: 'ADVANCED', firstUsedYear: 2026, yearsExperience: 1, lastUsed: '2026-08-01',
    notes: 'Used to build scalable backend services and APIs.',
    aliases: ['node', 'nodejs', 'node.js'], relatedProjectTitles: ['DevVault'],
  },
  {
    name: 'Express.js', technologyKey: 'expressjs', category: 'Backend', color: '#444444',
    experienceLevel: 'ADVANCED', firstUsedYear: 2026, yearsExperience: 1, lastUsed: '2026-08-01',
    notes: 'Powers the backend API layer for DevVault.',
    aliases: ['express', 'expressjs', 'express.js'], relatedProjectTitles: ['DevVault'],
  },
  {
    name: 'PostgreSQL', technologyKey: 'postgres', category: 'Databases', color: '#336791',
    experienceLevel: 'INTERMEDIATE', firstUsedYear: 2026, yearsExperience: 1, lastUsed: '2026-08-01',
    notes: 'My primary relational database for full-stack applications.',
    aliases: ['postgres', 'postgresql'], relatedProjectTitles: ['DevVault'],
  },
  {
    name: 'Prisma ORM', technologyKey: 'prisma', category: 'Databases', color: '#2D3748',
    experienceLevel: 'INTERMEDIATE', firstUsedYear: 2026, yearsExperience: 1, lastUsed: '2026-08-01',
    notes: 'Makes working with databases much cleaner and more enjoyable.',
    aliases: ['prisma', 'prismaorm'], relatedProjectTitles: ['DevVault'],
  },
  {
    name: 'Git', technologyKey: 'git', category: 'Developer Tools', color: '#F05032',
    experienceLevel: 'ADVANCED', firstUsedYear: 2025, yearsExperience: 2, lastUsed: '2026-08-01',
    notes: 'Essential to every project I build. I use Git daily for version control and collaboration.',
    aliases: ['git'], relatedProjectTitles: ['DevVault', 'Password Strength Analyzer', 'Bank Management System', 'Cloud Cost Budget Tracker', 'Password Manager'],
  },
  {
    name: 'GitHub', technologyKey: 'github', category: 'Developer Tools', color: '#181717',
    experienceLevel: 'ADVANCED', firstUsedYear: 2025, yearsExperience: 2, lastUsed: '2026-08-01',
    notes: 'Where I manage my repositories, track progress, and showcase my projects.',
    aliases: ['github'], relatedProjectTitles: ['DevVault', 'Password Strength Analyzer', 'Bank Management System', 'Cloud Cost Budget Tracker', 'Password Manager'],
  },
  {
    name: 'Clerk', technologyKey: 'clerk', category: 'Authentication & APIs', color: '#6C47FF',
    experienceLevel: 'INTERMEDIATE', firstUsedYear: 2026, yearsExperience: 1, lastUsed: '2026-08-01',
    notes: 'Used to build secure authentication and user management into DevVault.',
    aliases: ['clerk'], relatedProjectTitles: ['DevVault'],
  },
  {
    name: 'GitHub API', technologyKey: 'github-api', category: 'Authentication & APIs', color: '#181717',
    experienceLevel: 'INTERMEDIATE', firstUsedYear: 2026, yearsExperience: 1, lastUsed: '2026-08-01',
    notes: 'Used to synchronize repositories and automate my portfolio data.',
    aliases: ['githubapi', 'github-api', 'github api'], relatedProjectTitles: ['DevVault'],
  },
  {
    name: 'REST APIs', technologyKey: 'rest-apis', category: 'Authentication & APIs', color: '#0EA5E9',
    experienceLevel: 'ADVANCED', firstUsedYear: 2026, yearsExperience: 1, lastUsed: '2026-08-01',
    notes: 'Used throughout DevVault to connect the frontend, backend, and database.',
    aliases: ['rest', 'restapi', 'rest-api', 'api', 'apis'], relatedProjectTitles: ['DevVault'],
  },
  {
    name: 'AWS', technologyKey: 'aws', category: 'Cloud', color: '#FF9900',
    experienceLevel: 'BEGINNER', firstUsedYear: 2025, yearsExperience: 0, lastUsed: '2026-08-01',
    notes: 'Currently studying AWS and preparing for the AWS Certified Cloud Practitioner certification.',
    aliases: ['aws', 'amazonwebservices'], relatedProjectTitles: [],
  },
]

const SEEDED_BY_KEY = new Map(SEEDED_SKILLS.map((skill) => [normalizeKey(skill.technologyKey), skill]))

function createServiceError(statusCode, message, details) {
  const error = new Error(message)
  error.statusCode = statusCode
  if (details) {
    error.details = details
  }
  return error
}

function normalizeText(value) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function normalizeInteger(value) {
  if (value === '' || value === null || value === undefined) {
    return null
  }

  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : null
}

function normalizeIdList(value) {
  if (Array.isArray(value)) {
    return [...new Set(value.map((item) => normalizeInteger(item)).filter((item) => item !== null))]
  }

  if (typeof value === 'string') {
    return [...new Set(
      value
        .split(/[,\n]/)
        .map((item) => normalizeInteger(item.trim()))
        .filter((item) => item !== null),
    )]
  }

  return []
}

function normalizeDate(value) {
  if (!value) {
    return null
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function isHexColor(value) {
  return typeof value === 'string' && /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(value.trim())
}

function normalizeTechnologyKey(value) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim().toLowerCase()
  return trimmed ? trimmed.replace(/\s+/g, '-') : null
}

function normalizeKey(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

function dedupeNumberList(values = []) {
  return [...new Set(values.filter((value) => Number.isInteger(value) && value > 0))].sort((left, right) => left - right)
}

function sameIds(left = [], right = []) {
  return JSON.stringify(dedupeNumberList(left)) === JSON.stringify(dedupeNumberList(right))
}

function hasPrismaSkillAccess() {
  const userModel = prisma?.user
  const skillModel = prisma?.skill

  return Boolean(
    userModel
    && skillModel
    && typeof userModel.upsert === 'function'
    && typeof skillModel.findMany === 'function'
    && typeof skillModel.findFirst === 'function'
    && typeof skillModel.create === 'function'
    && typeof skillModel.update === 'function'
    && typeof skillModel.delete === 'function',
  )
}

function validateSkillPayload(payload) {
  const errors = {}

  if (!payload.name || payload.name.trim().length < 2) {
    errors.name = 'Name is required.'
  }

  if (!payload.category || payload.category.trim().length < 2) {
    errors.category = 'Category is required.'
  }

  if (!payload.experienceLevel || !SKILL_LEVELS.includes(payload.experienceLevel)) {
    errors.experienceLevel = 'Experience level must be beginner, advanced beginner, intermediate, advanced, or expert.'
  }

  const yearsExperience = normalizeInteger(payload.yearsExperience)
  if (yearsExperience === null || yearsExperience < 0 || yearsExperience > 60) {
    errors.yearsExperience = 'Years of experience must be between 0 and 60.'
  }

  const firstUsedYear = normalizeInteger(payload.firstUsedYear)
  const currentYear = new Date().getFullYear()
  if (firstUsedYear === null || firstUsedYear < 1980 || firstUsedYear > currentYear + 1) {
    errors.firstUsedYear = `First used year must be between 1980 and ${currentYear + 1}.`
  }

  if (yearsExperience !== null && firstUsedYear !== null) {
    const inferredMinYears = Math.max(0, currentYear - firstUsedYear)
    if (yearsExperience > inferredMinYears + 1) {
      errors.yearsExperience = 'Years of experience looks inconsistent with first used year.'
    }
  }

  if (!isHexColor(payload.color)) {
    errors.color = 'Color must be a valid hex value like #ea8b21.'
  }

  if (payload.lastUsed && !normalizeDate(payload.lastUsed)) {
    errors.lastUsed = 'Last used must be a valid date.'
  }

  return errors
}

function buildSkillPayload(payload, clerkUserId) {
  return {
    ownerClerkUserId: clerkUserId,
    name: payload.name.trim(),
    technologyKey: normalizeTechnologyKey(payload.technologyKey || payload.name),
    category: payload.category.trim(),
    experienceLevel: payload.experienceLevel,
    percentage: normalizeInteger(payload.percentage) ?? 0,
    yearsExperience: normalizeInteger(payload.yearsExperience) ?? 0,
    firstUsedYear: normalizeInteger(payload.firstUsedYear),
    projectsBuilt: normalizeInteger(payload.projectsBuilt) ?? 0,
    color: payload.color.trim(),
    lastUsed: normalizeDate(payload.lastUsed),
    notes: normalizeText(payload.notes),
  }
}

function attachRelatedProjectIds(skill, relatedProjects) {
  const relatedProjectIds = relatedProjects.map((item) => item.projectId)
  return {
    ...skill,
    relatedProjectIds,
    relatedProjects: relatedProjects.map((item) => item.project),
  }
}

function enrichMemorySkills(skills, projects) {
  const projectById = new Map(projects.map((project) => [project.id, project]))

  return skills.map((skill) => {
    const relatedProjects = (skill.relatedProjectIds || [])
      .map((projectId) => projectById.get(projectId))
      .filter(Boolean)

    return {
      ...skill,
      relatedProjects,
      projectsBuilt: relatedProjects.length,
    }
  })
}

function buildSkillAliases(skill) {
  const normalizedKey = normalizeKey(skill.technologyKey || skill.name)
  const seeded = SEEDED_BY_KEY.get(normalizedKey)

  const baseAliases = [skill.name, skill.technologyKey]
  const seedAliases = seeded ? seeded.aliases : []

  return [...new Set([...baseAliases, ...seedAliases].map((alias) => normalizeKey(alias)).filter(Boolean))]
}

function projectMatchesAlias(project, aliases) {
  const stack = Array.isArray(project.techStack) ? project.techStack : []
  const normalizedStack = stack.map((item) => normalizeKey(item)).filter(Boolean)

  if (aliases.some((alias) => normalizedStack.includes(alias))) {
    return true
  }

  // Match partials for cases like "node" and "nodejs".
  return aliases.some((alias) => normalizedStack.some((item) => item.includes(alias) || alias.includes(item)))
}

function deriveRelatedProjectIds(skill, projects) {
  const aliases = buildSkillAliases(skill)
  const seeded = SEEDED_BY_KEY.get(normalizeKey(skill.technologyKey || skill.name))
  const titleSet = new Set((seeded?.relatedProjectTitles || []).map((title) => String(title).trim().toLowerCase()))

  const matched = projects
    .filter((project) => projectMatchesAlias(project, aliases) || titleSet.has(String(project.title || '').trim().toLowerCase()))
    .map((project) => project.id)

  return dedupeNumberList(matched)
}

async function ensureOwnerUser(clerkUserId) {
  if (!hasPrismaSkillAccess()) {
    return
  }

  const userModel = prisma?.user
  if (!userModel || typeof userModel.upsert !== 'function') {
    return
  }

  try {
    await userModel.upsert({
      where: { clerkUserId },
      create: { clerkUserId },
      update: {},
    })
  } catch (error) {
    throw createServiceError(503, 'Unable to initialize skill owner user.')
  }
}

async function resolveRelatedProjects(clerkUserId, relatedProjectIds) {
  if (!relatedProjectIds.length) {
    return []
  }

  const projects = await listProjects(clerkUserId)
  const projectById = new Map(projects.map((project) => [project.id, project]))
  const relatedProjects = relatedProjectIds.map((projectId) => projectById.get(projectId)).filter(Boolean)

  if (relatedProjects.length !== relatedProjectIds.length) {
    throw createServiceError(400, 'One or more related projects were not found.')
  }

  return relatedProjects
}

function seededSkillData(seed, clerkUserId) {
  return {
    ownerClerkUserId: clerkUserId,
    name: seed.name,
    technologyKey: seed.technologyKey,
    category: seed.category,
    experienceLevel: seed.experienceLevel,
    percentage: 0,
    yearsExperience: seed.yearsExperience,
    firstUsedYear: seed.firstUsedYear,
    projectsBuilt: 0,
    color: seed.color,
    lastUsed: normalizeDate(seed.lastUsed),
    notes: seed.notes,
  }
}

async function ensureSeededSkillsPrisma(clerkUserId) {
  const existing = await prisma.skill.findMany({
    where: { ownerClerkUserId: clerkUserId },
    select: { id: true, name: true, technologyKey: true },
  })

  for (const seed of SEEDED_SKILLS) {
    const seedKey = normalizeKey(seed.technologyKey)
    const found = existing.find((skill) => {
      const keyMatch = normalizeKey(skill.technologyKey) === seedKey
      const nameMatch = normalizeKey(skill.name) === normalizeKey(seed.name)
      return keyMatch || nameMatch
    })

    if (!found) {
      await prisma.skill.create({
        data: seededSkillData(seed, clerkUserId),
      })
    }
  }
}

function ensureSeededSkillsLocal(clerkUserId) {
  updateLocalStore((current) => {
    const skills = [...current.skills]
    let nextSkillId = current.nextSkillId

    for (const seed of SEEDED_SKILLS) {
      const seedKey = normalizeKey(seed.technologyKey)
      const found = skills.find(
        (skill) => skill.ownerClerkUserId === clerkUserId
          && (normalizeKey(skill.technologyKey) === seedKey || normalizeKey(skill.name) === normalizeKey(seed.name)),
      )

      if (!found) {
        skills.unshift({
          id: nextSkillId,
          ...seededSkillData(seed, clerkUserId),
          relatedProjectIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        nextSkillId += 1
      }
    }

    return {
      ...current,
      nextSkillId,
      skills,
    }
  })
}

async function synchronizePrismaSkills(clerkUserId, projects) {
  const skills = await prisma.skill.findMany({
    where: { ownerClerkUserId: clerkUserId },
    include: { relatedProjects: { include: { project: true } } },
    orderBy: [{ firstUsedYear: 'asc' }, { name: 'asc' }],
  })

  const updates = []

  for (const skill of skills) {
    const seed = SEEDED_BY_KEY.get(normalizeKey(skill.technologyKey || skill.name))
    const targetProjectIds = deriveRelatedProjectIds(skill, projects)
    const currentProjectIds = (skill.relatedProjects || []).map((item) => item.projectId)
    const nextProjectsBuilt = targetProjectIds.length
    const seedFieldsChanged = Boolean(
      seed
      && (
        Number(skill.firstUsedYear || 0) !== Number(seed.firstUsedYear || 0)
        || normalizeKey(skill.category) !== normalizeKey(seed.category)
        || normalizeKey(skill.experienceLevel) !== normalizeKey(seed.experienceLevel)
      )
    )

    if (!sameIds(currentProjectIds, targetProjectIds) || Number(skill.projectsBuilt || 0) !== nextProjectsBuilt || seedFieldsChanged) {
      updates.push(
        prisma.skill.update({
          where: { id: skill.id },
          data: {
            ...(seed ? {
              category: seed.category,
              experienceLevel: seed.experienceLevel,
              firstUsedYear: seed.firstUsedYear,
            } : {}),
            projectsBuilt: nextProjectsBuilt,
            relatedProjects: {
              deleteMany: {},
              create: targetProjectIds.map((projectId) => ({ project: { connect: { id: projectId } } })),
            },
          },
        }),
      )
    }
  }

  if (updates.length) {
    await prisma.$transaction(updates)
  }

  const refreshed = await prisma.skill.findMany({
    where: { ownerClerkUserId: clerkUserId },
    include: { relatedProjects: { include: { project: true } } },
    orderBy: [{ firstUsedYear: 'asc' }, { name: 'asc' }],
  })

  return refreshed.map((skill) => attachRelatedProjectIds(skill, skill.relatedProjects))
}

function synchronizeLocalSkills(clerkUserId, projects) {
  let responseSkills = []

  updateLocalStore((current) => {
    const nextSkills = current.skills.map((skill) => {
      if (skill.ownerClerkUserId !== clerkUserId) {
        return skill
      }

      const targetProjectIds = deriveRelatedProjectIds(skill, projects)
      const seed = SEEDED_BY_KEY.get(normalizeKey(skill.technologyKey || skill.name))
      return {
        ...skill,
        category: seed?.category || skill.category,
        experienceLevel: seed?.experienceLevel || skill.experienceLevel,
        firstUsedYear: seed?.firstUsedYear || skill.firstUsedYear,
        relatedProjectIds: targetProjectIds,
        projectsBuilt: targetProjectIds.length,
        updatedAt: new Date(),
      }
    })

    responseSkills = enrichMemorySkills(
      nextSkills
        .filter((skill) => skill.ownerClerkUserId === clerkUserId)
        .sort((left, right) => {
          const leftYear = Number(left.firstUsedYear || 0)
          const rightYear = Number(right.firstUsedYear || 0)
          if (leftYear !== rightYear) {
            return leftYear - rightYear
          }

          return String(left.name || '').localeCompare(String(right.name || ''))
        }),
      projects,
    )

    return {
      ...current,
      skills: nextSkills,
    }
  })

  return responseSkills
}

async function listSkills(clerkUserId) {
  const projects = await listProjects(clerkUserId)

  if (hasPrismaSkillAccess()) {
    try {
      await ensureOwnerUser(clerkUserId)
      await ensureSeededSkillsPrisma(clerkUserId)
      return await synchronizePrismaSkills(clerkUserId, projects)
    } catch {
      // fall through to local storage when Prisma is unavailable
    }
  }

  ensureSeededSkillsLocal(clerkUserId)
  return synchronizeLocalSkills(clerkUserId, projects)
}

async function getSkillById(clerkUserId, skillId) {
  const id = Number(skillId)
  if (!Number.isInteger(id) || id <= 0) {
    throw createServiceError(400, 'Skill ID must be a valid number.')
  }

  const skills = await listSkills(clerkUserId)
  const skill = skills.find((item) => item.id === id)
  if (!skill) {
    throw createServiceError(404, 'Skill not found.')
  }

  return skill
}

async function createSkill(clerkUserId, payload) {
  const errors = validateSkillPayload(payload)
  if (Object.keys(errors).length > 0) {
    throw createServiceError(400, 'Invalid skill data.', errors)
  }

  const relatedProjectIds = normalizeIdList(payload.relatedProjectIds)
  await resolveRelatedProjects(clerkUserId, relatedProjectIds)

  const data = buildSkillPayload(payload, clerkUserId)

  if (hasPrismaSkillAccess()) {
    try {
      await ensureOwnerUser(clerkUserId)
      const skill = await prisma.skill.create({
        data: {
          ...data,
          relatedProjects: {
            create: relatedProjectIds.map((projectId) => ({ project: { connect: { id: projectId } } })),
          },
        },
        include: { relatedProjects: { include: { project: true } } },
      })

      const projects = await listProjects(clerkUserId)
      const targetProjectIds = deriveRelatedProjectIds(skill, projects)

      if (!sameIds(relatedProjectIds, targetProjectIds) || Number(skill.projectsBuilt || 0) !== targetProjectIds.length) {
        const synced = await prisma.skill.update({
          where: { id: skill.id },
          data: {
            projectsBuilt: targetProjectIds.length,
            relatedProjects: {
              deleteMany: {},
              create: targetProjectIds.map((projectId) => ({ project: { connect: { id: projectId } } })),
            },
          },
          include: { relatedProjects: { include: { project: true } } },
        })

        return attachRelatedProjectIds(synced, synced.relatedProjects)
      }

      return attachRelatedProjectIds(skill, skill.relatedProjects)
    } catch {
      // fall through to local storage when Prisma is unavailable
    }
  }

  const projectList = await listProjects(clerkUserId)
  const store = getLocalStore()
  const skill = {
    id: store.nextSkillId,
    ...data,
    relatedProjectIds,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const syncedProjectIds = deriveRelatedProjectIds(skill, projectList)
  const syncedSkill = {
    ...skill,
    relatedProjectIds: syncedProjectIds,
    projectsBuilt: syncedProjectIds.length,
  }

  updateLocalStore((current) => ({
    ...current,
    nextSkillId: current.nextSkillId + 1,
    skills: [syncedSkill, ...current.skills],
  }))

  return enrichMemorySkills([syncedSkill], projectList)[0]
}

async function updateSkill(clerkUserId, skillId, payload) {
  const id = Number(skillId)
  if (!Number.isInteger(id) || id <= 0) {
    throw createServiceError(400, 'Skill ID must be a valid number.')
  }

  const errors = validateSkillPayload(payload)
  if (Object.keys(errors).length > 0) {
    throw createServiceError(400, 'Invalid skill data.', errors)
  }

  const relatedProjectIds = normalizeIdList(payload.relatedProjectIds)
  await resolveRelatedProjects(clerkUserId, relatedProjectIds)

  const data = buildSkillPayload(payload, clerkUserId)

  if (hasPrismaSkillAccess()) {
    try {
      await ensureOwnerUser(clerkUserId)
      const existing = await prisma.skill.findFirst({
        where: { id, ownerClerkUserId: clerkUserId },
      })

      if (!existing) {
        throw createServiceError(404, 'Skill not found.')
      }

      const skill = await prisma.skill.update({
        where: { id: existing.id },
        data: {
          ...data,
          relatedProjects: {
            deleteMany: {},
            create: relatedProjectIds.map((projectId) => ({ project: { connect: { id: projectId } } })),
          },
        },
        include: { relatedProjects: { include: { project: true } } },
      })

      const projects = await listProjects(clerkUserId)
      const targetProjectIds = deriveRelatedProjectIds(skill, projects)

      const synced = await prisma.skill.update({
        where: { id: skill.id },
        data: {
          projectsBuilt: targetProjectIds.length,
          relatedProjects: {
            deleteMany: {},
            create: targetProjectIds.map((projectId) => ({ project: { connect: { id: projectId } } })),
          },
        },
        include: { relatedProjects: { include: { project: true } } },
      })

      return attachRelatedProjectIds(synced, synced.relatedProjects)
    } catch (error) {
      if (error?.statusCode === 404) {
        throw error
      }

      // fall through to local storage when Prisma is unavailable
    }
  }

  const projects = await listProjects(clerkUserId)
  const existing = getLocalStore().skills.find((skill) => skill.id === id && skill.ownerClerkUserId === clerkUserId)
  if (!existing) {
    throw createServiceError(404, 'Skill not found.')
  }

  const nextSkill = {
    ...existing,
    ...data,
    relatedProjectIds,
    updatedAt: new Date(),
  }

  const targetProjectIds = deriveRelatedProjectIds(nextSkill, projects)
  const updatedSkill = {
    ...nextSkill,
    relatedProjectIds: targetProjectIds,
    projectsBuilt: targetProjectIds.length,
  }

  updateLocalStore((current) => ({
    ...current,
    skills: current.skills.map((skill) => (skill.id === id && skill.ownerClerkUserId === clerkUserId ? updatedSkill : skill)),
  }))

  return enrichMemorySkills([updatedSkill], projects)[0]
}

async function deleteSkill(clerkUserId, skillId) {
  const id = Number(skillId)
  if (!Number.isInteger(id) || id <= 0) {
    throw createServiceError(400, 'Skill ID must be a valid number.')
  }

  if (hasPrismaSkillAccess()) {
    try {
      await ensureOwnerUser(clerkUserId)
      const existing = await prisma.skill.findFirst({
        where: { id, ownerClerkUserId: clerkUserId },
      })

      if (!existing) {
        throw createServiceError(404, 'Skill not found.')
      }

      await prisma.skill.delete({
        where: { id: existing.id },
      })

      return null
    } catch (error) {
      if (error?.statusCode === 404) {
        throw error
      }

      // fall through to local storage when Prisma is unavailable
    }
  }

  const existing = getLocalStore().skills.find((skill) => skill.id === id && skill.ownerClerkUserId === clerkUserId)
  if (!existing) {
    throw createServiceError(404, 'Skill not found.')
  }

  updateLocalStore((current) => ({
    ...current,
    skills: current.skills.filter((skill) => !(skill.id === id && skill.ownerClerkUserId === clerkUserId)),
  }))
  return null
}

module.exports = {
  SKILL_LEVELS,
  createServiceError,
  listSkills,
  getSkillById,
  createSkill,
  updateSkill,
  deleteSkill,
}
