import { describe, it, expect, vi, beforeEach } from 'vitest';
import { awsEcrService } from '../services/awsEcrService';

describe('awsEcrService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate correct ECR image URI format when repository exists', async () => {
    vi.spyOn(awsEcrService, 'verifyRepositoryExists').mockResolvedValue(true);
    vi.spyOn(awsEcrService as any, 'runCommand').mockImplementation(async (cmd: any, args: any) => {
      if (cmd === 'aws' && Array.isArray(args) && args.includes('get-caller-identity')) {
        return { code: 0, logs: '123456789012\n' };
      }
      if (cmd === 'aws' && Array.isArray(args) && args.includes('get-login-password')) {
        return { code: 0, logs: 'mock-ecr-password\n' };
      }
      return { code: 0, logs: 'Success\n' };
    });

    const res = await awsEcrService.pushImageToEcr({
      localImageTag: 'deployeasy/test1:a1b2c3d4',
      ecrRepoName: 'deployeasy-apps',
      awsRegion: 'us-east-1',
      awsAccountId: '123456789012',
    });

    expect(res.ecrImageUri).toBe('123456789012.dkr.ecr.us-east-1.amazonaws.com/deployeasy-apps:a1b2c3d4');
  });

  it('should throw explicit error when ECR repository is missing', async () => {
    vi.spyOn(awsEcrService, 'verifyRepositoryExists').mockResolvedValue(false);

    await expect(
      awsEcrService.pushImageToEcr({
        localImageTag: 'deployeasy/test1:a1b2c3d4',
        ecrRepoName: 'nonexistent-repo',
        awsRegion: 'us-east-1',
      })
    ).rejects.toThrow("AWS ECR repository 'nonexistent-repo' does not exist");
  });
});
