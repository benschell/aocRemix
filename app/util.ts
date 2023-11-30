import { fileURLToPath } from 'url';
import { dirname } from 'path';

export const getDirname = () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  console.log(`Computed ${__dirname} from ${import.meta.url}`);
  return __dirname;
}