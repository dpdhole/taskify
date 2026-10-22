import { it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
async function run(env: NodeJS.ProcessEnv, cwd = process.cwd()) {
  return await new Promise<{ code: number | null; output: string }>(
    (resolve, reject) => {
      const child = spawn(
        process.execPath,
        [path.resolve('tools/run-emulators.mjs')],
        { env, cwd },
      );
      let output = '';
      child.stdout.on('data', (data) => (output += String(data)));
      child.stderr.on('data', (data) => (output += String(data)));
      child.once('error', reject);
      child.once('exit', (code) => resolve({ code, output }));
    },
  );
}
it('rejects an occupied port without killing its owner', async () => {
  const server = net.createServer();
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(4173, '127.0.0.1', resolve);
  });
  try {
    const result = await run(process.env);
    expect(result.code).not.toBe(0);
    expect(result.output).toContain('Port 4173 is in use');
    expect(server.listening).toBe(true);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
it('rejects an explicit missing Java home when invoked from another cwd', async () => {
  const result = await run(
    { ...process.env, TASKIFY_JAVA_HOME: path.resolve('.local/missing-java') },
    path.dirname(process.cwd()),
  );
  expect(result.code).not.toBe(0);
  expect(result.output).toContain('TASKIFY_JAVA_HOME does not contain Java');
});
