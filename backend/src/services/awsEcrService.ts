import { spawn } from 'child_process';
import { ECRClient, DescribeRepositoriesCommand } from '@aws-sdk/client-ecr';

export interface IEcrPushOptions {
  localImageTag: string;
  ecrRepoName: string;
  awsRegion?: string;
  awsAccountId?: string;
  onLog?: (line: string) => void;
}

export class AwsEcrService {
  private runCommand(
    command: string,
    args: string[],
    options?: { cwd?: string; onLog?: (line: string) => void; stdinInput?: string }
  ): Promise<{ code: number; logs: string }> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, { cwd: options?.cwd, shell: false });
      let output = '';

      if (options?.stdinInput && child.stdin) {
        child.stdin.write(options.stdinInput);
        child.stdin.end();
      }

      child.stdout?.on('data', (data) => {
        const text = data.toString();
        output += text;
        if (options?.onLog) options.onLog(text);
      });

      child.stderr?.on('data', (data) => {
        const text = data.toString();
        output += text;
        if (options?.onLog) options.onLog(text);
      });

      child.on('error', (err) => reject(err));

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ code: 0, logs: output });
        } else {
          reject(new Error(`Command '${command} ${args.join(' ')}' exited with code ${code}.\n${output}`));
        }
      });
    });
  }

  async verifyRepositoryExists(repoName: string, region: string = 'us-east-1'): Promise<boolean> {
    try {
      const client = new ECRClient({ region });
      const command = new DescribeRepositoriesCommand({ repositoryNames: [repoName] });
      const res = await client.send(command);
      return (res.repositories && res.repositories.length > 0) || false;
    } catch {
      // Fallback via AWS CLI describe-repositories
      try {
        const cliRes = await this.runCommand('aws', ['ecr', 'describe-repositories', '--repository-names', repoName, '--region', region]);
        return cliRes.code === 0;
      } catch {
        return false;
      }
    }
  }

  async pushImageToEcr(options: IEcrPushOptions): Promise<{ ecrImageUri: string; logs: string }> {
    const { localImageTag, ecrRepoName, awsRegion = process.env.AWS_REGION || 'us-east-1', onLog } = options;
    let logs = `[AWS ECR] Starting ECR push process for image: ${localImageTag}...\n`;
    if (onLog) onLog(logs);

    // 1. Verify ECR repository exists
    const exists = await this.verifyRepositoryExists(ecrRepoName, awsRegion);
    if (!exists) {
      throw new Error(`AWS ECR repository '${ecrRepoName}' does not exist in region '${awsRegion}'. Please apply Terraform infrastructure first.`);
    }

    // 2. Fetch AWS Account ID if not provided
    let accountId = options.awsAccountId || process.env.AWS_ACCOUNT_ID;
    if (!accountId) {
      const callerIdRes = await this.runCommand('aws', ['sts', 'get-caller-identity', '--query', 'Account', '--output', 'text']);
      accountId = callerIdRes.logs.trim();
    }

    const ecrRegistry = `${accountId}.dkr.ecr.${awsRegion}.amazonaws.com`;
    const tagSuffix = localImageTag.split(':')[1] || 'latest';
    const ecrImageUri = `${ecrRegistry}/${ecrRepoName}:${tagSuffix}`;

    // 3. Authenticate Docker CLI to ECR registry
    const loginPassRes = await this.runCommand('aws', [
      'ecr',
      'get-login-password',
      '--region',
      awsRegion,
    ]);
    const password = loginPassRes.logs.trim();

    await this.runCommand(
      'docker',
      ['login', '--username', 'AWS', '--password-stdin', ecrRegistry],
      { stdinInput: password, onLog }
    );

    // 4. Tag local image for ECR
    const tagLog = `[AWS ECR] Tagging ${localImageTag} as ${ecrImageUri}...\n`;
    logs += tagLog;
    if (onLog) onLog(tagLog);
    await this.runCommand('docker', ['tag', localImageTag, ecrImageUri], { onLog });

    // 5. Push image to ECR
    const pushLog = `[AWS ECR] Pushing image ${ecrImageUri} to ECR...\n`;
    logs += pushLog;
    if (onLog) onLog(pushLog);
    const pushRes = await this.runCommand('docker', ['push', ecrImageUri], { onLog });
    logs += pushRes.logs;

    return { ecrImageUri, logs };
  }
}

export const awsEcrService = new AwsEcrService();
