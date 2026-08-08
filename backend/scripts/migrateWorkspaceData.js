const fs = require('fs')
const path = require('path')
const vm = require('vm')
const dotenv = require('dotenv')

dotenv.config({ path: path.join(__dirname, '..', '.env') })

const { prisma } = require('../src/db/prisma')

const OWNER_ID = process.env.MIGRATION_CLERK_USER_ID || 'dev-local-user'
const EXPECTED_USERNAME = process.env.MIGRATION_USERNAME || 'JJaaace'
const FRONTEND_ROOT = path.join(__dirname, '..', '..', 'frontend', 'src', 'pages')

function extractArrayConstant(fileName, constantName) {
  const source = fs.readFileSync(path.join(FRONTEND_ROOT, fileName), 'utf8')
  const marker = `const ${constantName} = [`
  const markerIndex = source.indexOf(marker)
  if (markerIndex < 0) {
    throw new Error(`Unable to find ${constantName} in ${fileName}.`)
  }

  const arrayStart = source.indexOf('[', markerIndex)
  let depth = 0
  let quote = null
  let escaped = false

  for (let index = arrayStart; index < source.length; index += 1) {
    const character = source[index]

    if (quote) {
      if (escaped) {
        escaped = false
      } else if (character === '\\') {
        escaped = true
      } else if (character === quote) {
        quote = null
      }
      continue
    }

    if (character === "'" || character === '"' || character === '`') {
      quote = character
      continue
    }

    if (character === '[') depth += 1
    if (character === ']') depth -= 1

    if (depth === 0) {
      return vm.runInNewContext(`(${source.slice(arrayStart, index + 1)})`, Object.create(null), {
        timeout: 1_000,
      })
    }
  }

  throw new Error(`Unable to parse ${constantName} in ${fileName}.`)
}

function optionalText(value) {
  const normalized = typeof value === 'string' ? value.trim() : ''
  return normalized || null
}

function optionalDate(value) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null
}

function parseDataUrl(value) {
  if (!value) return { assetData: null, assetMimeType: null }
  const match = String(value).match(/^data:([^;]+);base64,(.+)$/s)
  if (!match) return { assetData: null, assetMimeType: null }
  return {
    assetData: Buffer.from(match[2], 'base64'),
    assetMimeType: match[1],
  }
}

async function main() {
  const [profile, user] = await Promise.all([
    prisma.profile.findUnique({ where: { clerkUserId: OWNER_ID } }),
    prisma.user.findUnique({ where: { clerkUserId: OWNER_ID } }),
  ])

  if (!profile || !user || profile.username !== EXPECTED_USERNAME) {
    throw new Error(`Ownership check failed for ${OWNER_ID}/${EXPECTED_USERNAME}; no writes were made.`)
  }

  const [existingGoals, existingCertifications, existingRoadmap, existingResume] = await Promise.all([
    prisma.goal.count({ where: { ownerClerkUserId: OWNER_ID } }),
    prisma.certification.count({ where: { ownerClerkUserId: OWNER_ID } }),
    prisma.certificationRoadmapItem.count({ where: { ownerClerkUserId: OWNER_ID } }),
    prisma.resumeAsset.count({ where: { ownerClerkUserId: OWNER_ID } }),
  ])

  if (existingGoals || existingCertifications || existingRoadmap || existingResume) {
    throw new Error(`Workspace destination is not empty (${existingGoals} goals, ${existingCertifications} certifications, ${existingRoadmap} roadmap items, ${existingResume} resumes); no writes were made.`)
  }

  const goals = extractArrayConstant('GoalsPage.jsx', 'LEGACY_GOALS_MIGRATION_SNAPSHOT')
  const certifications = extractArrayConstant('CertificationsPage.jsx', 'LEGACY_CERTIFICATIONS_MIGRATION_SNAPSHOT')
  const roadmap = extractArrayConstant('CertificationsPage.jsx', 'LEGACY_CERTIFICATION_ROADMAP_MIGRATION_SNAPSHOT')

  if (goals.length !== 8 || certifications.length !== 12 || roadmap.length !== 11) {
    throw new Error(`Unexpected seed counts (${goals.length}/${certifications.length}/${roadmap.length}); no writes were made.`)
  }

  const metadataPath = path.join(__dirname, '..', '.data', 'resume-metadata.json')
  const resumePath = path.join(__dirname, '..', '.data', 'resumes', OWNER_ID, 'resume.pdf')
  const resumeMetadataStore = JSON.parse(fs.readFileSync(metadataPath, 'utf8'))
  const resumeMetadata = resumeMetadataStore[OWNER_ID]
  const resumeContent = fs.readFileSync(resumePath)

  if (!resumeMetadata || resumeContent.subarray(0, 4).toString('utf8') !== '%PDF') {
    throw new Error('Existing resume metadata/PDF validation failed; no writes were made.')
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.goal.createMany({
      data: goals.map((goal, index) => ({
        ownerClerkUserId: OWNER_ID,
        legacyKey: goal.id,
        title: goal.title,
        category: goal.category,
        status: goal.status,
        displayOrder: Number(goal.displayOrder ?? index + 1),
        pinned: Boolean(goal.pinned),
        targetCompletion: optionalDate(goal.targetCompletion),
        description: goal.description,
        why: optionalText(goal.why),
        notes: optionalText(goal.notes),
        resources: goal.resources || [],
        relatedProjectNames: goal.relatedProjects || [],
        relatedCertificationNames: goal.relatedCertifications || [],
        relatedTechnologies: goal.relatedTechnologies || [],
        milestones: goal.milestones || [],
        accent: optionalText(goal.accent),
        publicVisible: false,
      })),
    })

    await transaction.certification.createMany({
      data: certifications.map((certification, index) => {
        const asset = parseDataUrl(certification.assetUrl)
        return {
          ownerClerkUserId: OWNER_ID,
          legacyKey: certification.id,
          name: certification.name,
          organization: certification.organization,
          provider: certification.provider,
          status: certification.status,
          issueDate: optionalDate(certification.issueDate),
          year: Number(certification.year),
          credentialId: optionalText(certification.credentialId),
          credentialUrl: optionalText(certification.credentialUrl),
          verifyUrl: optionalText(certification.verifyUrl),
          logo: optionalText(certification.logo),
          accentColor: optionalText(certification.accentColor),
          skillsGained: certification.skillsGained || [],
          technologies: certification.technologies || [],
          associatedProjects: certification.associatedProjects || [],
          notes: optionalText(certification.notes),
          featured: Boolean(certification.featured),
          displayOrder: Number(certification.displayOrder ?? index),
          publicVisible: true,
          assetData: asset.assetData,
          assetMimeType: asset.assetMimeType,
          assetName: optionalText(certification.assetName),
        }
      }),
    })

    await transaction.certificationRoadmapItem.createMany({
      data: roadmap.map((item, index) => ({
        ownerClerkUserId: OWNER_ID,
        year: Number(item.year),
        status: item.status,
        title: item.title,
        displayOrder: index,
      })),
    })

    await transaction.resumeAsset.create({
      data: {
        ownerClerkUserId: OWNER_ID,
        fileName: resumeMetadata.fileName,
        mimeType: 'application/pdf',
        byteSize: resumeContent.length,
        content: resumeContent,
        updatedAt: new Date(resumeMetadata.updatedAt),
      },
    })
  })

  const [goalCount, certificationCount, roadmapCount, resume] = await Promise.all([
    prisma.goal.count({ where: { ownerClerkUserId: OWNER_ID } }),
    prisma.certification.count({ where: { ownerClerkUserId: OWNER_ID } }),
    prisma.certificationRoadmapItem.count({ where: { ownerClerkUserId: OWNER_ID } }),
    prisma.resumeAsset.findUnique({
      where: { ownerClerkUserId: OWNER_ID },
      select: { fileName: true, byteSize: true, content: true },
    }),
  ])

  const sourceDigest = require('crypto').createHash('sha256').update(resumeContent).digest('hex')
  const storedDigest = require('crypto').createHash('sha256').update(resume.content).digest('hex')

  if (goalCount !== 8 || certificationCount !== 12 || roadmapCount !== 11 || resume.byteSize !== resumeContent.length || sourceDigest !== storedDigest) {
    throw new Error('Post-migration verification failed.')
  }

  console.log(JSON.stringify({
    ownerClerkUserId: OWNER_ID,
    username: profile.username,
    goals: goalCount,
    certifications: certificationCount,
    roadmapItems: roadmapCount,
    resume: { fileName: resume.fileName, byteSize: resume.byteSize, sha256: storedDigest },
  }, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
