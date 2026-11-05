// Mutation testing for the pure modules: npm run mutate
// (server.mjs is exercised through a spawned process, so it is left out: one run of its suite takes ~25 s per mutant)
export default {
  testRunner: 'command',
  commandRunner: { command: 'node --test tests/claude.test.mjs tests/title.test.mjs tests/mood.test.mjs tests/update.test.mjs tests/health.test.mjs' }, // pass / fail by exit code
  mutate: ['claude.mjs', 'title.mjs', 'public/mood.js', 'update.mjs', 'health.mjs'],
  reporters: ['clear-text', 'html'],
  htmlReporter: { fileName: 'reports/mutation.html' },
  coverageAnalysis: 'off',
  concurrency: 4,
};
