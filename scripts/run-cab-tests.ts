import { runCabFareEngineTests } from '../src/services/__tests__/cabFareEngine.test';

const result = runCabFareEngineTests();
if (result.failed > 0) {
  console.error(`Tests failed with ${result.failed} errors.`);
  process.exit(1);
} else {
  console.log(`All ${result.passed} cab fare engine tests passed successfully!`);
  process.exit(0);
}
