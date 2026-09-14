import fs from 'node:fs'
import path from 'node:path'
import { BibleData, BibleMetadata } from '../types/bible'
import { parseVpcJson } from './vpcParser'
import { buildBibleDataFromRaw, createMetadata } from './bibleConverter'

const bibleRoot = path.resolve(__dirname, '../../Bibles')

export async function loadBibleFromFile(filePath: string): Promise<BibleData> {
  const content = fs.readFileSync(filePath, 'utf-8')
  const json = parseVpcJson(content)
  const id = path.basename(filePath, '.vpc.json')
  return buildBibleDataFromRaw(json, id)
}

export async function getBibleFileList(): Promise<string[]> {
  const entries = await fs.promises.readdir(bibleRoot)
  const files: string[] = []
  for (const entry of entries) {
    if (entry.endsWith('.vpc.json') || entry.endsWith('.json')) {
      files.push(path.join(bibleRoot, entry))
    }
  }
  return files.sort()
}

export async function scanBibleInfo(filePath: string): Promise<BibleMetadata> {
  const content = fs.readFileSync(filePath, 'utf-8')
  const json = parseVpcJson(content)
  return createMetadata(
    json.Abbreviation as string | undefined,
    path.basename(filePath, '.vpc.json'),
    json,
  )
}

export async function scanAllBibles(): Promise<BibleMetadata[]> {
  const files = await getBibleFileList()
  const infos: BibleMetadata[] = []
  for (const file of files) {
    try {
      const info = await scanBibleInfo(file)
      infos.push(info)
    } catch {
      // skip unreadable files
    }
  }
  return infos
}
