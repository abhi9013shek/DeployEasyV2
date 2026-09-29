import fs from 'fs';
import path from 'path';
import { DetectedProjectInfo } from '../types';

export class ProjectDetector {
  async detect(dirPath: string): Promise<DetectedProjectInfo> {
    const dockerfilePath = path.join(dirPath, 'Dockerfile');
    if (fs.existsSync(dockerfilePath)) {
      return {
        type: 'dockerfile',
        hasDockerfile: true,
        details: 'Found existing Dockerfile in root repository.',
      };
    }

    const packageJsonPath = path.join(dirPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const pkgStr = fs.readFileSync(packageJsonPath, 'utf8');
        const pkg = JSON.parse(pkgStr);
        const scripts = pkg.scripts || {};

        let packageManager: 'npm' | 'yarn' | 'pnpm' = 'npm';
        if (fs.existsSync(path.join(dirPath, 'yarn.lock'))) {
          packageManager = 'yarn';
        } else if (fs.existsSync(path.join(dirPath, 'pnpm-lock.yaml'))) {
          packageManager = 'pnpm';
        }

        const buildScript = scripts.build ? `${packageManager} run build` : undefined;
        const startScript = scripts.start
          ? `${packageManager} start`
          : scripts.dev
          ? `${packageManager} run dev`
          : 'node index.js';

        let framework = 'Node.js';
        const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
        if (deps.react || deps.vite) framework = 'React / Vite';
        else if (deps.next) framework = 'Next.js';
        else if (deps.express) framework = 'Express.js';
        else if (deps.vue) framework = 'Vue.js';

        return {
          type: 'nodejs',
          framework,
          packageManager,
          buildScript,
          startScript,
          hasDockerfile: false,
          details: `Detected ${framework} project with ${packageManager}`,
        };
      } catch (err: any) {
        throw new Error(`Failed to parse package.json: ${err.message}`);
      }
    }

    // Check for unsupported project types explicitly
    const indicators = [
      { file: 'requirements.txt', type: 'Python' },
      { file: 'go.mod', type: 'Go' },
      { file: 'pom.xml', type: 'Java (Maven)' },
      { file: 'build.gradle', type: 'Java (Gradle)' },
    ];

    for (const ind of indicators) {
      if (fs.existsSync(path.join(dirPath, ind.file))) {
        return {
          type: 'unsupported',
          hasDockerfile: false,
          details: `Detected ${ind.type} project (${ind.file}). Automated Dockerfile generation is currently supported for Node.js projects only. Please provide a Dockerfile in your repository.`,
        };
      }
    }

    return {
      type: 'unsupported',
      hasDockerfile: false,
      details: 'Unknown project structure. No Dockerfile, package.json, or recognized build files found.',
    };
  }

  generateDockerfile(info: DetectedProjectInfo, dirPath: string): string {
    if (info.type !== 'nodejs') {
      throw new Error(`Cannot auto-generate Dockerfile for non-Node.js project type: ${info.type}`);
    }

    const { packageManager, buildScript, startScript } = info;
    const dockerfilePath = path.join(dirPath, 'Dockerfile');

    let dockerfileContent = '';

    if (packageManager === 'yarn') {
      dockerfileContent = `FROM node:18-alpine AS base
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
${buildScript ? `RUN ${buildScript}` : ''}
EXPOSE 3000 8080 5173
CMD [${startScript ? startScript.split(' ').map((s) => `"${s}"`).join(', ') : '"npm", "start"'}]
`;
    } else if (packageManager === 'pnpm') {
      dockerfileContent = `FROM node:18-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
${buildScript ? `RUN ${buildScript}` : ''}
EXPOSE 3000 8080 5173
CMD [${startScript ? startScript.split(' ').map((s) => `"${s}"`).join(', ') : '"npm", "start"'}]
`;
    } else {
      dockerfileContent = `FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci || npm install
COPY . .
${buildScript ? `RUN ${buildScript}` : ''}
EXPOSE 3000 8080 5173
CMD [${startScript ? startScript.split(' ').map((s) => `"${s}"`).join(', ') : '"npm", "start"'}]
`;
    }

    fs.writeFileSync(dockerfilePath, dockerfileContent, 'utf8');
    return dockerfilePath;
  }
}

export const projectDetector = new ProjectDetector();
