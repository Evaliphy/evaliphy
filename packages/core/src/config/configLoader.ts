import { EvaliphyError, EvaliphyErrorCode } from "@evaliphy/core";
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { logger } from "../logger.js";
import { loadRuntimeModule } from '../runtime/moduleLoader.js';
import { mergeConfigs } from "./mergeConfig.js";
import { EvaliphyConfigSchema } from "./schema.js";
import { EvaliphyConfig } from "./types.js";

const G = globalThis as any;

export class ConfigLoader {
  private static get instance(): ConfigLoader {
    return G.__EVALIPHY_CONFIG_LOADER_INSTANCE__;
  }

  private static set instance(value: ConfigLoader) {
    G.__EVALIPHY_CONFIG_LOADER_INSTANCE__ = value;
  }

  private configLogger = logger.child({module: 'ConfigLoader'})
  private cachedConfig: EvaliphyConfig | null = null;
  private cliOverrides: EvaliphyConfig = {};

  private readonly configFiles = [
    'evaliphy.config.ts',
    'evaliphy.config.js',
    'evaliphy.config.mjs',
    'evaliphy.config.cjs',
  ];

  private constructor() {
  }

  /**
   * Initializes the ConfigLoader with CLI overrides.
   * This should be called once at the start of the process.
   */
  public static initialize(cliOverrides: EvaliphyConfig = {}): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    ConfigLoader.instance.configLogger.debug({cliOverrides}, 'Initializing with CLI overrides');
    ConfigLoader.instance.cliOverrides = cliOverrides;
    ConfigLoader.instance.clearCache();
    return ConfigLoader.instance;
  }

  /**
   * Returns the singleton instance.
   */
  public static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  /**
   * Resets the singleton instance (used in tests).
   */
  public static resetInstance() {
    ConfigLoader.instance = undefined as any;
  }

  // Find config file in root directory of evals
  private findConfigFile(cwd: string): string | null {
    if (this.cliOverrides.configFile) {
      const fullPath = join(cwd, this.cliOverrides.configFile);
      this.configLogger.debug({ configFile: this.cliOverrides.configFile, fullPath }, 'Checking custom config file path from CLI');
      if (existsSync(fullPath)) return fullPath;
    }

    this.configLogger.debug({cwd}, 'Searching for default config files');
    for (const file of this.configFiles) {
      const fullPath = join(cwd, file);
      if (existsSync(fullPath)) {
        this.configLogger.debug({file, fullPath}, 'Found config file');
        return fullPath;
      }
    }
    return null;
  }

  /**
   * Loads the configuration, merging file config with CLI overrides and optional transient overrides.
   */
  public async load(cwd: string = process.cwd(), transientOverrides: EvaliphyConfig = {}): Promise<EvaliphyConfig> {
    const configPath = this.findConfigFile(cwd);

    if (!configPath) {
      this.configLogger.debug('No config file found, using defaults if applicable');
      throw new EvaliphyError(
        EvaliphyErrorCode.INVALID_CONFIG,
        `Could not load configuration. Please check the following:

  - Does "evaliphy.config.ts" exist in your project root?
  - Is the path correct if you specified a custom config location?
  - Does the config file export a default defineConfig({}) call?

  Expected location: ${process.cwd()}/evaliphy.config.ts
  Visit https://evaliphy.com/docs/configuration for more details.`
      );
    }
    // If we don't have a cached base config, load and parse it
    if (!this.cachedConfig) {
      this.configLogger.debug({configPath}, 'Loading base configuration from file');
      try {
        const rawConfig = await loadRuntimeModule(configPath);

        const parsed = EvaliphyConfigSchema.safeParse(rawConfig);

        if (!parsed.success) {
          this.configLogger.error({ error: parsed.error, configPath }, 'Configuration validation failed');
          throw new EvaliphyError(
            EvaliphyErrorCode.INVALID_CONFIG,
            `Invalid configuration in ${configPath}

            Please check your evaliphy.config.ts and fix the above fields.
            Docs: https://evaliphy.com/docs/configuration`
          );
        }

        // Cache the base merged with CLI overrides
        this.cachedConfig = mergeConfigs(
          parsed.data,
          {},
          this.cliOverrides,
        );
        this.cachedConfig.configFile = configPath;
      } catch (error: any) {
        this.configLogger.error({error, configPath}, 'Error loading configuration');
        if (error instanceof EvaliphyError) throw error;
          throw new EvaliphyError(
            EvaliphyErrorCode.INVALID_CONFIG,
            `Failed to load config from ${configPath}: ${error.message}

            Please check your evaliphy.config.ts and fix the above fields.
              Docs: https://evaliphy.com/docs/configuration
              `
          );
      }
    }

    // Always merge transient overrides on top of the cached base
    const finalConfig = mergeConfigs(
      this.cachedConfig,
      transientOverrides,
      {},
    );

    this.configLogger.debug({
      config: finalConfig,
      hasTransient: Object.keys(transientOverrides).length > 0
    }, 'Final merged configuration');
    return finalConfig;
  }

  public clearCache() {
    this.cachedConfig = null;
  }
}
