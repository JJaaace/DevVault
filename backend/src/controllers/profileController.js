let prisma = null

try {
  const { PrismaClient } = require('@prisma/client')
  const { PrismaPg } = require('@prisma/adapter-pg')
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  prisma = new PrismaClient({ adapter })
} catch (error) {
  prisma = null
}

const { getLocalStore, updateLocalStore } = require('../services/localStore')

function validateProfilePayload(payload) {
  const errors = {}

  const isHttpUrl = (value) => !value || /^https?:\/\//i.test(value)
  const isImageDataUrl = (value) => !value || /^data:image\/(png|jpe?g|webp|gif|avif);base64,/i.test(value)
  const isInteger = (value) => value === undefined || value === null || value === '' || Number.isInteger(Number(value))

  if (!payload.firstName || payload.firstName.trim().length < 2) {
    errors.firstName = 'First name is required.'
  }

  if (!payload.lastName || payload.lastName.trim().length < 2) {
    errors.lastName = 'Last name is required.'
  }

  if (!payload.username || payload.username.trim().length < 2) {
    errors.username = 'Username is required.'
  }

  if (!payload.bio || payload.bio.trim().length < 10) {
    errors.bio = 'Bio must be at least 10 characters long.'
  }

  if (!isHttpUrl(payload.profileImageUrl) && !isImageDataUrl(payload.profileImageUrl)) {
    errors.profileImageUrl = 'Profile image must be a valid upload or image URL.'
  }

  if (!isHttpUrl(payload.githubUrl)) {
    errors.githubUrl = 'GitHub URL must start with http:// or https://.'
  }

  if (!isHttpUrl(payload.linkedinUrl)) {
    errors.linkedinUrl = 'LinkedIn URL must start with http:// or https://.'
  }

  if (!isHttpUrl(payload.websiteUrl)) {
    errors.websiteUrl = 'Website URL must start with http:// or https://.'
  }

  if (!isInteger(payload.graduationYear)) {
    errors.graduationYear = 'Graduation year must be a number.'
  }

  if (!isInteger(payload.yearsCoding)) {
    errors.yearsCoding = 'Years coding must be a number.'
  }

  return errors
}

function normalizeText(value) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeText(item)).filter(Boolean)
  }

  if (typeof value !== 'string') {
    return []
  }

  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeInteger(value) {
  if (value === '' || value === null || value === undefined) {
    return null
  }

  const parsed = Number(value)
  return Number.isInteger(parsed) ? parsed : null
}

function buildProfilePayload(payload, clerkUserId) {
  return {
    clerkUserId,
    username: payload.username.trim(),
    firstName: payload.firstName.trim(),
    lastName: payload.lastName.trim(),
    bio: payload.bio.trim(),
    profileImageUrl: normalizeText(payload.profileImageUrl || payload.profileImage),
    school: normalizeText(payload.school || payload.university),
    graduationYear: normalizeInteger(payload.graduationYear),
    major: normalizeText(payload.major),
    location: normalizeText(payload.location || [payload.city, payload.state, payload.country].filter(Boolean).join(', ')),
    dreamCompanies: normalizeList(payload.dreamCompanies),
    currentRole: normalizeText(payload.currentRole),
    favoriteLanguage: normalizeText(payload.favoriteLanguage),
    favoriteFramework: normalizeText(payload.favoriteFramework),
    yearsCoding: normalizeInteger(payload.yearsCoding),
    interests: normalizeList(payload.interests),
    githubUrl: normalizeText(payload.githubUrl),
    linkedinUrl: normalizeText(payload.linkedinUrl),
    websiteUrl: normalizeText(payload.websiteUrl),
  }
}

function findMemoryProfile(clerkUserId) {
  return getLocalStore().profiles.find((profile) => profile.clerkUserId === clerkUserId) || null
}

function findMemoryProfileByUsername(username) {
  return getLocalStore().profiles.find((profile) => profile.username === username) || null
}

function serializePublicProfile(profile) {
  if (!profile) {
    return null
  }

  const { clerkUserId, ...publicProfile } = profile
  return publicProfile
}

function serializePublicProject(project) {
  const { ownerClerkUserId, ...publicProject } = project
  return publicProject
}

function serializePublicSkill(skill) {
  const { ownerClerkUserId, relatedProjects = [], ...publicSkill } = skill

  return {
    ...publicSkill,
    relatedProjects: relatedProjects.map(serializePublicProject),
  }
}

async function getPublicPortfolio(req, res) {
  try {
    const username = typeof req.params.username === 'string' ? req.params.username.trim() : ''

    if (username.length < 2) {
      return res.status(400).json({ message: 'Username is required.' })
    }

    let profile = null

    if (prisma) {
      try {
        profile = await prisma.profile.findUnique({
          where: { username },
        })
      } catch (error) {
        // fall through to memory storage
      }
    }

    if (!profile) {
      profile = findMemoryProfileByUsername(username)
    }

    if (!profile) {
      return res.status(404).json({ message: 'Portfolio not found.' })
    }

    const { listProjects } = require('../services/projectService')
    const { listSkills } = require('../services/skillService')

    const [projects, skills] = await Promise.all([
      listProjects(profile.clerkUserId),
      listSkills(profile.clerkUserId),
    ])

    return res.json({
      profile: serializePublicProfile(profile),
      projects: projects.filter((project) => project.status !== 'ARCHIVED').map(serializePublicProject),
      skills: skills.map(serializePublicSkill),
    })
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load portfolio.', error: error.message })
  }
}

async function getProfile(req, res) {
  try {
    if (prisma) {
      try {
        const profile = await prisma.profile.findUnique({
          where: { clerkUserId: req.auth.userId },
        })

        if (!profile) {
          return res.status(404).json({ message: 'Profile not found.' })
        }

        return res.json(profile)
      } catch (error) {
        // fall through to in-memory storage when Prisma is unavailable or unreachable
      }
    }

    const profile = findMemoryProfile(req.auth.userId)
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found.' })
    }

    return res.json(profile)
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load profile.', error: error.message })
  }
}

async function createProfile(req, res) {
  try {
    const errors = validateProfilePayload(req.body)
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Invalid profile data.', errors })
    }

    if (prisma) {
      try {
        const existing = await prisma.profile.findUnique({
          where: { clerkUserId: req.auth.userId },
        })

        if (existing) {
          return res.status(409).json({ message: 'Profile already exists.' })
        }

        const profile = await prisma.profile.create({
          data: buildProfilePayload(req.body, req.auth.userId),
        })

        return res.status(201).json(profile)
      } catch (error) {
        // fall through to in-memory storage
      }
    }

    if (findMemoryProfile(req.auth.userId)) {
      return res.status(409).json({ message: 'Profile already exists.' })
    }

    const profile = buildProfilePayload(req.body, req.auth.userId)
    updateLocalStore((store) => ({
      ...store,
      profiles: [...store.profiles, profile],
    }))
    return res.status(201).json(profile)
  } catch (error) {
    return res.status(500).json({ message: 'Unable to create profile.', error: error.message })
  }
}

async function updateProfile(req, res) {
  try {
    const errors = validateProfilePayload(req.body)
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Invalid profile data.', errors })
    }

    if (prisma) {
      try {
        const existing = await prisma.profile.findUnique({
          where: { clerkUserId: req.auth.userId },
        })

        if (!existing) {
          return res.status(404).json({ message: 'Profile not found.' })
        }

        const profile = await prisma.profile.update({
          where: { clerkUserId: req.auth.userId },
          data: buildProfilePayload(req.body, req.auth.userId),
        })

        return res.json(profile)
      } catch (error) {
        // fall through to in-memory storage
      }
    }

    const existing = findMemoryProfile(req.auth.userId)
    if (!existing) {
      return res.status(404).json({ message: 'Profile not found.' })
    }

    const updatedProfile = {
      ...existing,
      ...buildProfilePayload(req.body, req.auth.userId),
    }

    updateLocalStore((store) => ({
      ...store,
      profiles: store.profiles.map((profile) =>
        profile.clerkUserId === req.auth.userId ? updatedProfile : profile,
      ),
    }))

    return res.json(updatedProfile)
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update profile.', error: error.message })
  }
}

async function deleteProfile(req, res) {
  try {
    if (prisma) {
      try {
        const existing = await prisma.profile.findUnique({
          where: { clerkUserId: req.auth.userId },
        })

        if (!existing) {
          return res.status(404).json({ message: 'Profile not found.' })
        }

        await prisma.profile.delete({
          where: { clerkUserId: req.auth.userId },
        })

        return res.status(204).send()
      } catch (error) {
        // fall through to in-memory storage
      }
    }

    const existing = findMemoryProfile(req.auth.userId)
    if (!existing) {
      return res.status(404).json({ message: 'Profile not found.' })
    }

    updateLocalStore((store) => ({
      ...store,
      profiles: store.profiles.filter((profile) => profile.clerkUserId !== req.auth.userId),
    }))
    return res.status(204).send()
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete profile.', error: error.message })
  }
}

module.exports = {
  getProfile,
  getPublicPortfolio,
  createProfile,
  updateProfile,
  deleteProfile,
}
