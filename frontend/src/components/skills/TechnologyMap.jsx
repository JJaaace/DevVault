import { memo, useMemo, useState } from 'react'
import { TechnologyLogo } from '../TechnologyLogo'
import { formatYearsExperience, getSkillLevelMeta } from '../../lib/skillUtils'

function toNodeKey(skill) {
  return skill.technologyKey || String(skill.name || '').toLowerCase().replace(/\s+/g, '-')
}

function getTechToneClass(key) {
  if (key.includes('java')) return 'tech-map-node--java'
  if (key.includes('python')) return 'tech-map-node--python'
  if (key.includes('aws') || key.includes('amazon')) return 'tech-map-node--aws'
  if (key.includes('git')) return 'tech-map-node--git'
  if (key.includes('docker')) return 'tech-map-node--docker'
  if (key.includes('react')) return 'tech-map-node--react'
  if (key.includes('node')) return 'tech-map-node--node'
  return ''
}

function buildEdges(skills) {
  const edges = []
  for (let i = 0; i < skills.length; i += 1) {
    for (let j = i + 1; j < skills.length; j += 1) {
      const left = skills[i]
      const right = skills[j]
      const leftProjects = new Set((left.relatedProjects || []).map((project) => project.id))
      const rightProjects = (right.relatedProjects || []).map((project) => project.id)
      const sharesProject = rightProjects.some((id) => leftProjects.has(id))
      const sameCategory = left.category && right.category && left.category === right.category
      const yearsClose = Math.abs(Number(left.yearsExperience || 0) - Number(right.yearsExperience || 0)) <= 1

      if (sharesProject || sameCategory || yearsClose) {
        edges.push({ source: left.id, target: right.id, strength: sharesProject ? 1 : 0.65 })
      }
    }
  }

  return edges.slice(0, Math.max(8, skills.length * 2))
}

function buildLayout(skills) {
  if (!skills.length) {
    return []
  }

  const count = skills.length
  const radius = count > 10 ? 38 : 32

  return skills.map((skill, index) => {
    const angle = (index / count) * Math.PI * 2 - Math.PI / 2
    const ringOffset = index % 2 === 0 ? 0 : 8
    const x = 50 + Math.cos(angle) * (radius + ringOffset)
    const y = 50 + Math.sin(angle) * (radius - ringOffset * 0.35)

    return {
      ...skill,
      nodeKey: toNodeKey(skill),
      x: Math.max(10, Math.min(90, x)),
      y: Math.max(12, Math.min(88, y)),
    }
  })
}

function buildRelatedNames(skill, allSkills, edgeMap) {
  const ids = edgeMap.get(skill.id) || []
  const lookup = new Map(allSkills.map((item) => [item.id, item.name]))
  return ids.map((id) => lookup.get(id)).filter(Boolean).slice(0, 6)
}

function TechnologyMapComponent({ skills = [] }) {
  const [hoveredId, setHoveredId] = useState(null)

  const nodes = useMemo(() => buildLayout(skills), [skills])
  const edges = useMemo(() => buildEdges(nodes), [nodes])

  const edgeMap = useMemo(() => {
    const map = new Map()
    edges.forEach((edge) => {
      map.set(edge.source, [...(map.get(edge.source) || []), edge.target])
      map.set(edge.target, [...(map.get(edge.target) || []), edge.source])
    })
    return map
  }, [edges])

  const activeNode = nodes.find((node) => node.id === hoveredId) || nodes[0] || null

  const detail = useMemo(() => {
    if (!activeNode) {
      return null
    }

    const levelMeta = getSkillLevelMeta(activeNode.experienceLevel)
    const relatedTech = buildRelatedNames(activeNode, nodes, edgeMap)

    return {
      ...activeNode,
      levelLabel: levelMeta.label,
      yearsLabel: formatYearsExperience(activeNode.yearsExperience),
      relatedTech,
      projects: (activeNode.relatedProjects || []).slice(0, 6),
    }
  }, [activeNode, nodes, edgeMap])

  return (
    <section className="surface-card surface-card--strong tech-map-shell p-5 md:p-6">
      <div className="tech-map-grid">
        <div className="tech-map-canvas-wrap">
          <div className="tech-map-canvas" role="img" aria-label="Interactive technology map">
            <svg className="tech-map-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              {edges.map((edge, index) => {
                const source = nodes.find((node) => node.id === edge.source)
                const target = nodes.find((node) => node.id === edge.target)
                if (!source || !target) {
                  return null
                }

                const active = hoveredId && (edge.source === hoveredId || edge.target === hoveredId)

                return (
                  <line
                    key={`${edge.source}-${edge.target}`}
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    className={`tech-map-line ${active ? 'tech-map-line--active' : ''}`.trim()}
                    style={{ '--line-delay': `${(index % 12) * 120}ms`, '--line-strength': edge.strength }}
                  />
                )
              })}
            </svg>

            {nodes.map((node, index) => {
              const active = hoveredId === node.id
              return (
                <button
                  key={node.id}
                  type="button"
                  className={`tech-map-node ${active ? 'tech-map-node--active' : ''} ${getTechToneClass(node.nodeKey)}`.trim()}
                  style={{ '--x': `${node.x}%`, '--y': `${node.y}%`, '--node-delay': `${Math.min(index, 10) * 80}ms`, '--node-accent': node.color || '#ea8b21' }}
                  onMouseEnter={() => setHoveredId(node.id)}
                  onFocus={() => setHoveredId(node.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onBlur={() => setHoveredId(null)}
                >
                  <TechnologyLogo technologyKey={node.technologyKey} name={node.name} size="sm" />
                  <span className="tech-map-node-label">{node.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        <aside className="tech-map-detail" aria-live="polite">
          {detail ? (
            <>
              <p className="section-eyebrow">Technology Insight</p>
              <h3 className="tech-map-detail-title">{detail.name}</h3>
              <p className="tech-map-detail-years">{detail.yearsLabel}</p>

              <div className="tech-map-detail-block">
                <p className="tech-map-detail-label">Experience level</p>
                <p className="tech-map-detail-value">{detail.levelLabel}</p>
              </div>

              <div className="tech-map-detail-block">
                <p className="tech-map-detail-label">First used</p>
                <p className="tech-map-detail-value">{detail.firstUsedYear || 'N/A'}</p>
              </div>

              <div className="tech-map-detail-block">
                <p className="tech-map-detail-label">Projects that use it</p>
                {detail.projects.length ? (
                  <ul className="tech-map-detail-list">
                    {detail.projects.map((project) => <li key={project.id}>{project.title}</li>)}
                  </ul>
                ) : (
                  <p className="tech-map-detail-value">No linked projects yet</p>
                )}
              </div>

              <div className="tech-map-detail-block">
                <p className="tech-map-detail-label">Related technologies</p>
                {detail.relatedTech.length ? (
                  <div className="tech-map-detail-chips">
                    {detail.relatedTech.map((item) => <span key={item} className="chip">{item}</span>)}
                  </div>
                ) : (
                  <p className="tech-map-detail-value">No direct links yet</p>
                )}
              </div>
            </>
          ) : null}
        </aside>
      </div>
    </section>
  )
}

export const TechnologyMap = memo(TechnologyMapComponent)
