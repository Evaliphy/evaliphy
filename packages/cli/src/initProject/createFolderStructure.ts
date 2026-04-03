import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export function createProject(projectName: string) {
    const rootPath = path.join(process.cwd(), projectName);

    if (fs.existsSync(rootPath)) {
        console.error('Folder already exists.');
        process.exit(1);
    }

    // 1. Create base folder
    fs.mkdirSync(rootPath, { recursive: true });

    // 2. Create folder structure
    const structure: Record<string, any> = {
        evals: {
            'example.eval.ts': `
import { evaluate } from 'evaliphy';

evaluate('basic test', async ({ httpClient }) => {
  // add your evaluate code
});
`
        },
        utils: {},
        'evaliphy.config.ts': `
import { defineConfig } from 'evaliphy';

export default defineConfig({
  baseUrl: 'http://localhost:8080',
  testDir: './evals',
  llmAsJudgeConfig: {
    model: 'gpt-4o-mini',
    provider: {
      type: 'gateway',
      url: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
    },
    promptsDir: './prompts',
    temperature: 0
  },
});
`,
        'tsconfig.json': JSON.stringify({
            compilerOptions: {
                target: "ES2020",
                module: "CommonJS",
                strict: true,
                esModuleInterop: true,
                skipLibCheck: true
            }
        }, null, 2)
    };

    createStructure(rootPath, structure);

    // 3. Create FULL package.json
    const pkg = {
        name: projectName,
        version: "1.0.0",
        private: true,
        type: "module",
        scripts: {
            test: "evaliphy eval",
            build: "tsc"
        },
        devDependencies: {
            "evaliphy": "^1.0.0",
            "typescript": "^5.0.0"
        }
    };

    fs.writeFileSync(
        path.join(rootPath, 'package.json'),
        JSON.stringify(pkg, null, 2)
    );

    // 4. Install dependencies
    try {
        console.log('📦 Installing dependencies...');
        execSync('npm install', {
            cwd: rootPath,
            stdio: 'inherit'
        });


    } catch (err) {
        console.error('Failed to install dependencies');
    }

    console.log(`\n✅ Project "${projectName}" is ready!`);
}

function createStructure(basePath: string, structure: Record<string, any>) {
    for (const name in structure) {
        const fullPath = path.join(basePath, name);

        if (typeof structure[name] === 'string') {
            fs.writeFileSync(fullPath, structure[name]);
        } else {
            fs.mkdirSync(fullPath, { recursive: true });
            createStructure(fullPath, structure[name]);
        }
    }
}