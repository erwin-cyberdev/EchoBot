// utils/qualityMonitor.js
const reports = new Map() // userId -> {blocks: n, reports: n}
export function recordBlock(userId){
  const v = reports.get(userId) || { blocks:0, reports:0 }
  v.blocks++
  reports.set(userId, v)
}
export function recordReport(userId){
  const v = reports.get(userId) || { blocks:0, reports:0 }
  v.reports++
  reports.set(userId, v)
}
export function getQuality(userId){
  return reports.get(userId) || { blocks:0, reports:0 }
}
