import { publicRequest } from './api'

export function fetchPublicPortfolio(username) {
  return publicRequest(`/api/public/portfolio/${encodeURIComponent(username)}`)
}