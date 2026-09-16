import JSZip from 'jszip'
import { parseVpcJson } from './vpcParser'
import { convertVpcToUniform } from './bibleConverter'
import type { BibleData } from '../types/bible'

export async function loadBibleFromZipFile(file: File): Promise<{ bible: BibleData; name: string }[]> {
  const zip = await JSZip.loadAsync(file)
  const results: { bible: BibleData; name: string }[] = []
  const vpcFiles = Object.keys(zip.files).filter(name => name.endsWith('.vpc.json') || name.endsWith('.json'))
  for (const vpcFile of vpcFiles) {
    const content = await zip.file(vpcFile)?.async('string')
    if (!content) continue
    try {
      const raw = parseVpcJson(content)
      const bible = convertVpcToUniform(raw, vpcFile.replace('.vpc.json', ''))
      results.push({ bible, name: vpcFile })
    } catch {
      // skip invalid files inside the zip
    }
  }
  return results
}

export async function loadSingleBibleFromZipFile(file: File, fileName: string): Promise<{ bible: BibleData } | null> {
  const zip = await JSZip.loadAsync(file)
  const vpcFile = Object.keys(zip.files).find(name => name === fileName)
  if (!vpcFile) return null
  const content = await zip.file(vpcFile)?.async('string')
  if (!content) return null
  try {
    const raw = parseVpcJson(content)
    const bible = convertVpcToUniform(raw, fileName.replace('.vpc.json', ''))
    return { bible }
  } catch {
    return null
  }
}
