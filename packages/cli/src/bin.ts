#!/usr/bin/env node
import { program } from 'commander'
import { resolve } from 'path'
import { pathToFileURL } from 'url'
import {handleFatalError, parseCLI} from './config/cliConfigUtil.js'
import { runRegistry } from './runner/runEval.js'

program
    .name('evaliphy')
    .version('1.0.0')
    .description('Evaliphy — eval runner for LLM pipelines')

program
    .command('eval <file> [extraArgs...]')
    .description('Run eval function from a file')
    .option('--model <model>', 'model to use')
    .option('--timeout <ms>', 'timeout per eval in ms', '30000')
    .option('--concurrency <n>', 'number of parallel evals', '1')
    .allowUnknownOption(true)
    .action(async (file, _extraArgs, opts) => {
        try {
            // 1. Resolve and load the user's eval file
            const absolutePath = resolve(process.cwd(), file)
            await import(pathToFileURL(absolutePath).href)

            // 2. Parse CLI options into config
            const cliConfig = parseCLI(opts)

            // 3. Run the registry with config
            await runRegistry(cliConfig)

            process.exit(0)
        } catch (err) {
            handleFatalError(err)
            process.exit(1)
        }
    })

program.parse(process.argv)



