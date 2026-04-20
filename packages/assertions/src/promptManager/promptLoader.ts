import { EvaliphyError, EvaliphyErrorCode, logger } from '@evaliphy/core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AssertionDefinition } from "../registry.js";

export interface LoadedPrompt {
  template: string;
  frontmatter: {
    name: string;
    input_variables?: string[];
    [key: string]: any;
  };
}

/**
 * Service to handle centralized prompt searching and loading.
 */
export class PromptLoader {
  /**
   * Resolves the correct prompt file path based on priority and loads it.
   * Priority: 
   * 1. User config (promptsDir)
   * 2. SDK Dist (./prompts)
   * 3. SDK Source (../../prompts)
   */
  static resolveAndLoad(matcherName: string, assertion: AssertionDefinition, config: any): LoadedPrompt {
    const configDir = config.configFile ? path.dirname(config.configFile) : process.cwd();
    
    // 1. Check for custom prompts directory from user config
    const customPromptsDir = config.llmAsJudgeConfig?.promptsDir
      ? path.resolve(configDir, config.llmAsJudgeConfig.promptsDir)
      : null;

    // SDK internal prompt directories
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const sdkPromptsDirDist = path.resolve(__dirname, './prompts');
    const sdkPromptsDirSource = path.resolve(__dirname, '../../prompts');

    try {
      // Priority 1: User Config
      if (customPromptsDir) {
        const customPath = path.join(customPromptsDir, `${matcherName}.md`);
        if (this.exists(customPath)) {
          return this.load(customPath, assertion);
        }
        logger.warn(`Custom prompt file not found at: ${customPath}. Falling back to defaults.`);
      }

      // Fallback 1: SDK Dist
      const distPath = path.join(sdkPromptsDirDist, `${matcherName}.md`);
      if (this.exists(distPath)) {
        return this.load(distPath, assertion);
      }

      // Fallback 2: SDK Source
      const sourcePath = path.join(sdkPromptsDirSource, `${matcherName}.md`);
      if (this.exists(sourcePath)) {
        return this.load(sourcePath, assertion);
      }

      // If absolutely none found, try to load from Dist to trigger the standard FILE_NOT_FOUND error
      return this.load(distPath, assertion);
    } catch (error: any) {
      if (error instanceof EvaliphyError) throw error;
      throw new EvaliphyError(
        EvaliphyErrorCode.PROMPT_LOAD_ERROR,
        `Failed to load prompt for "${matcherName}": ${error.message}`,
        'Check your prompt file formatting and variables.',
        error
      );
    }
  }

  static exists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  static load(filePath: string, assertion: AssertionDefinition): LoadedPrompt {
    if (!this.exists(filePath)) {
      throw new EvaliphyError(
        EvaliphyErrorCode.FILE_NOT_FOUND,
        `Prompt file not found at: ${filePath}`
      );
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const { frontmatter, template } = this.parseMarkdown(content, filePath);

    this.validate(template, frontmatter, assertion, filePath);

    return { template, frontmatter };
  }

  private static parseMarkdown(content: string, filePath: string): { frontmatter: any; template: string } {
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (!match) {
      throw new EvaliphyError(
        EvaliphyErrorCode.PROMPT_LOAD_ERROR,
        `Invalid prompt format at "${filePath}". Missing frontmatter block (--- ... ---).`
      );
    }

    const yamlStr = match[1];
    const template = match[2].trim();

    if (!template) {
      throw new EvaliphyError(
        EvaliphyErrorCode.PROMPT_LOAD_ERROR,
        `Prompt template at "${filePath}" is empty.`
      );
    }
    const frontmatter: any = {};

    // Simple YAML-like parser for basic frontmatter
    yamlStr.split('\n').forEach(line => {
      const [key, ...rest] = line.split(':');
      if (key && rest.length > 0) {
        const value = rest.join(':').trim();
        if (value === '') {
          frontmatter[key.trim()] = [];
        } else if (value.startsWith('-')) {
          // Handle simple lists
          const listKey = key.trim();
          if (!frontmatter[listKey]) frontmatter[listKey] = [];
        } else {
          frontmatter[key.trim()] = value;
        }
      } else if (line.trim().startsWith('-')) {
        // Continue list
        const lastKey = Object.keys(frontmatter).pop();
        if (lastKey && Array.isArray(frontmatter[lastKey])) {
          frontmatter[lastKey].push(line.trim().substring(1).trim());
        }
      }
    });

    return { frontmatter, template };
  }

  private static validate(
    template: string,
    frontmatter: any,
    assertion: AssertionDefinition,
    filePath: string
  ): void {
    const required = assertion.inputVariables;
    const declared = frontmatter.input_variables ?? [];
    const usedInTemplate = this.extractTemplateVariables(template);

    // check declared variables match what the assertion requires
    const missingDeclared = required.filter(v => !declared.includes(v));
    if (missingDeclared.length > 0) {
      throw new EvaliphyError(
        EvaliphyErrorCode.PROMPT_VALIDATION_ERROR,
        `Prompt at "${filePath}" is missing required input_variables: ${missingDeclared.join(', ')}.\n` +
        `The "${assertion.name}" assertion requires: ${required.join(', ')}.`
      );
    }

    // check the template actually uses the variables it declares
    const missingInTemplate = declared.filter((v: string) => !usedInTemplate.includes(v));
    if (missingInTemplate.length > 0) {
      throw new EvaliphyError(
        EvaliphyErrorCode.PROMPT_VALIDATION_ERROR,
        `Prompt at "${filePath}" declares input_variables [${missingInTemplate.join(', ')}] ` +
        `but never uses them in the template.\n` +
        `Add {{${missingInTemplate[0]}}} somewhere in your prompt.`
      );
    }
  }

  private static extractTemplateVariables(template: string): string[] {
    const matches = template.matchAll(/\{\{(\w+)\}\}/g);
    return [...matches].map(m => m[1]);
  }
}
