let memoryProfiles = []

let prisma = null

try {
  const { PrismaClient } = require('@prisma/client')
  const { PrismaPg } = require('@prisma/adapter-pg')
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  prisma = new PrismaClient({ adapter })
} catch (error) {
  prisma = null
}

function validateProfilePayload(payload) {
  const errors = {}

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

  if (payload.githubUrl && !/^https?:\/\//i.test(payload.githubUrl)) {
    errors.githubUrl = 'GitHub URL must start with http:// or https://.'
  }

  if (payload.linkedinUrl && !/^https?:\/\//i.test(payload.linkedinUrl)) {
    errors.linkedinUrl = 'LinkedIn URL must start with http:// or https://.'
  }

  if (payload.websiteUrl && !/^https?:\/\//i.test(payload.websiteUrl)) {
    errors.websiteUrl = 'Website URL must start with http:// or https://.'
  }

  return errors
}

function buildProfilePayload(payload, clerkUserId) {
  return {
    clerkUserId,
    username: payload.username.trim(),
    firstName: payload.firstName.trim(),
    lastName: payload.lastName.trim(),
    bio: payload.bio.trim(),
    university: payload.university?.trim() || null,
    graduationYear: payload.graduationYear ? Number(payload.graduationYear) : null,
    country: payload.country?.trim() || null,
    state: payload.state?.trim() || null,
    githubUrl: payload.githubUrl?.trim() || null,
    linkedinUrl: payload.linkedinUrl?.trim() || null,
    websiteUrl: payload.websiteUrl?.trim() || null,
  }
}

function findMemoryProfile(clerkUserId) {
  return memoryProfiles.find((profile) => profile.clerkUserId === clerkUserId) || null
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
    memoryProfiles.push(profile)
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

    memoryProfiles = memoryProfiles.map((profile) =>
      profile.clerkUserId === req.auth.userId ? updatedProfile : profile,
    )

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

    memoryProfiles = memoryProfiles.filter((profile) => profile.clerkUserId !== req.auth.userId)
    return res.status(204).send()
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete profile.', error: error.message })
  }
}

module.exports = {
  getProfile,
  createProfile,
  updateProfile,
  deleteProfile,
}
