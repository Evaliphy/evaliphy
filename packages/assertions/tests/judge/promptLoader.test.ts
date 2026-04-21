import { EvaliphyErrorCode } from '@evaliphy/core';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PromptLoader } from '../../src/promptManager/promptLoader.js';

// Mock fs to control file existence and content
vi.mock('node:fs');

describe('PromptLoader', () => {
  const mockAssertion: any = {
    name: 'testMatcher',
    inputVariables: ['query', 'response'],
    outputSchema: { zodSchema: {} }
  };

  const mockPromptContent = `---
name: testMatcher
input_variables:
  - query
  - response
---
Query: {{query}}
Response: {{response}}`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('resolveAndLoad', () => {
    it('should load from Priority 1: User Config (promptsDir)', () => {
      const config = {
        configFile: '/user/project/evaliphy.config.ts',
        llmAsJudgeConfig: {
          promptsDir: './custom-prompts'
        }
      };

      // Target path: /user/project/custom-prompts/testMatcher.md
      vi.spyOn(fs, 'existsSync').mockImplementation((p: any) => p.includes('custom-prompts'));
      vi.spyOn(fs, 'readFileSync').mockReturnValue(mockPromptContent);

      const result = PromptLoader.resolveAndLoad('testMatcher', mockAssertion, config);

      expect(fs.existsSync).toHaveBeenCalled();
      expect(result.template).toContain('Query: {{query}}');
      expect(result.frontmatter.name).toBe('testMatcher');
    });

    it('should fallback to Fallback 1: SDK Dist if Priority 1 fails', () => {
      const config = {
        llmAsJudgeConfig: { promptsDir: './non-existent' }
      };

      // Mock existsSync to return false for custom but true for dist
      vi.spyOn(fs, 'existsSync').mockImplementation((p: any) => {
        if (p.includes('non-existent')) return false;
        if (p.includes('dist') || p.includes('src/promptManager/prompts')) return true;
        return false;
      });
      vi.spyOn(fs, 'readFileSync').mockReturnValue(mockPromptContent);

      const result = PromptLoader.resolveAndLoad('testMatcher', mockAssertion, config);

      expect(result.template).toBeDefined();
      expect(fs.readFileSync).toHaveBeenCalled();
    });

    it('should fallback to Fallback 2: SDK Source if Dist fails', () => {
      const config = { llmAsJudgeConfig: {} };

      // Mock existsSync to return true only for the source path
      vi.spyOn(fs, 'existsSync').mockImplementation((p: any) => {
        // Dist path is usually relative to __dirname which is src/promptManager/
        if (p.includes('src/promptManager/prompts')) return false;
        if (p.includes('../../prompts')) return true;
        return false;
      });
      vi.spyOn(fs, 'readFileSync').mockReturnValue(mockPromptContent);

      const result = PromptLoader.resolveAndLoad('testMatcher', mockAssertion, config);

      expect(result.template).toBeDefined();
      expect(fs.readFileSync).toHaveBeenCalled();
    });

    it('should throw EvaliphyError if prompt is not found anywhere', () => {
      const config = {};
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);

      try {
        PromptLoader.resolveAndLoad('testMatcher', mockAssertion, config);
      } catch (error: any) {
        expect(error.code).toBe(EvaliphyErrorCode.FILE_NOT_FOUND);
      }
    });
  });

  describe('load', () => {
    it('should throw error if file does not exist', () => {
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      expect(() => PromptLoader.load('missing.md', mockAssertion)).toThrow(/Prompt file not found/);
    });

    it('should validate missing input variables in frontmatter', () => {
      const invalidContent = `---\nname: test\ninput_variables: [query]\n---\n{{query}}`;
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue(invalidContent);

      expect(() => PromptLoader.load('test.md', mockAssertion)).toThrow(/missing required input_variables: response/);
    });

    it('should validate unused variables in template', () => {
      const invalidContent = `---\nname: test\ninput_variables: [query, response]\n---\n{{query}}`;
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readFileSync').mockReturnValue(invalidContent);

      expect(() => PromptLoader.load('test.md', mockAssertion)).toThrow(/declares input_variables \[response\] but never uses them/);
    });
  });
});
