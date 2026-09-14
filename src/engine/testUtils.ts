import { readFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { parseVpcJson } from './vpcParser'
import { convertVpcToUniform } from './bibleConverter'

const bibleRoot = resolve(__dirname, '../../Bibles')

export async function loadTestBible(filePath: string): Promise<any> {
  const content = readFileSync(join(bibleRoot, filePath), 'utf-8')
  const raw = parseVpcJson(content)
  const bible = convertVpcToUniform(raw, filePath.replace('.vpc.json', ''))
  return bible
}
