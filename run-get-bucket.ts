import { getCurrentTimeBucket } from './src/lib/moodCompositeCalculator';

(async () => {
  const bucket = getCurrentTimeBucket();
  console.log(bucket);
})();
