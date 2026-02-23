import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const CLI_BIN = join(import.meta.dirname, '..', '..', 'bin', 'chub');
const SAMPLE_CONTENT = join(import.meta.dirname, '..', '..', '..', 'sample-content');

describe('chub build', () => {
  it('validates sample-content and finds docs and skills', () => {
    const result = execFileSync(
      process.execPath,
      [CLI_BIN, 'build', SAMPLE_CONTENT, '--validate-only', '--json'],
      { encoding: 'utf8' },
    );

    const parsed = JSON.parse(result.trim());
    expect(parsed).toHaveProperty('docs');
    expect(parsed).toHaveProperty('skills');
    expect(parsed).toHaveProperty('warnings');
    expect(parsed.docs).toBeGreaterThanOrEqual(1);
    expect(parsed.skills).toBeGreaterThanOrEqual(1);
  });

  it('finds the openai/chat doc in sample-content', () => {
    // Run the build and capture full registry output by writing to a temp dir
    // For now, validate-only mode gives us counts; we verify the discovery works
    const result = execFileSync(
      process.execPath,
      [CLI_BIN, 'build', SAMPLE_CONTENT, '--validate-only', '--json'],
      { encoding: 'utf8' },
    );

    const parsed = JSON.parse(result.trim());
    // sample-content has 1 doc (openai/chat) and 1 skill (playwright-community/login-flows)
    expect(parsed.docs).toBe(1);
    expect(parsed.skills).toBe(1);
  });

  it('exits with error for nonexistent directory', () => {
    let threw = false;
    try {
      execFileSync(
        process.execPath,
        [CLI_BIN, 'build', '/tmp/nonexistent-dir-xyz-12345', '--validate-only', '--json'],
        { encoding: 'utf8', stdio: 'pipe' },
      );
    } catch (err) {
      threw = true;
      expect(err.status).not.toBe(0);
      expect(err.stderr.toString()).toContain('not found');
    }
    expect(threw).toBe(true);
  });
});
