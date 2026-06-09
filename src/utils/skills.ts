import { existsSync, mkdirSync } from 'fs'
import { join, resolve } from 'path'
import { pathToFileURL } from 'url'
import { getGlobalConfig, saveGlobalConfig } from './config.js'
import { execFileNoThrow } from './execFileNoThrow.js'
import { CLAUDE_BASE_DIR } from './env.js'
import { logError } from './log.js'
import type { Command } from '../commands.js'

export const SKILLS_DIR = join(CLAUDE_BASE_DIR, 'skills')

export function listSkills(): string[] {
  return getGlobalConfig().skills ?? []
}

export function resolvePackageName(packageName: string): string {
  // Convert GitHub org/repo shorthand to npm install format
  if (
    /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/.test(packageName) &&
    !packageName.startsWith('@')
  ) {
    return `github:${packageName}`
  }
  return packageName
}

function resolveModuleDir(packageName: string): string {
  // Derive the node_modules directory name from the package identifier
  if (
    /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/.test(packageName) &&
    !packageName.startsWith('@')
  ) {
    // github:NVIDIA/skills → module dir is the repo name part
    return packageName.split('/')[1]!
  }
  // @scope/name or plain name
  return packageName
}

export async function addSkill(
  packageName: string,
  scope: 'global' | 'project' = 'global',
): Promise<void> {
  const config = getGlobalConfig()
  const skills = config.skills ?? []

  if (skills.includes(packageName)) {
    throw new Error(`Skill '${packageName}' is already installed`)
  }

  if (!existsSync(SKILLS_DIR)) {
    mkdirSync(SKILLS_DIR, { recursive: true })
  }

  const npmPackage = resolvePackageName(packageName)
  const { code, stderr } = await execFileNoThrow(
    'npm',
    ['install', '--prefix', SKILLS_DIR, '--no-save', npmPackage],
    undefined,
    undefined,
    false,
  )

  if (code !== 0) {
    throw new Error(
      `Failed to install skill package '${packageName}': ${stderr.trim()}`,
    )
  }

  saveGlobalConfig({ ...config, skills: [...skills, packageName] })
}

export function removeSkill(packageName: string): void {
  const config = getGlobalConfig()
  const skills = config.skills ?? []

  if (!skills.includes(packageName)) {
    throw new Error(`Skill '${packageName}' is not installed`)
  }

  saveGlobalConfig({
    ...config,
    skills: skills.filter(s => s !== packageName),
  })
}

export async function loadSkillsCommands(): Promise<Command[]> {
  const skills = listSkills()
  if (skills.length === 0) return []

  const commands: Command[] = []

  for (const skillPackage of skills) {
    try {
      const moduleDir = resolveModuleDir(skillPackage)
      const modulePath = resolve(SKILLS_DIR, 'node_modules', moduleDir)

      if (!existsSync(modulePath)) {
        logError(`Skills package '${skillPackage}' not found at ${modulePath}`)
        continue
      }

      const moduleUrl = pathToFileURL(modulePath).href
      const skillModule = await import(moduleUrl)
      const skillCommands: Command[] =
        skillModule.default ?? skillModule.commands ?? []

      if (Array.isArray(skillCommands)) {
        commands.push(...skillCommands)
      }
    } catch (error) {
      logError(
        `Failed to load skills from '${skillPackage}': ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  return commands
}
