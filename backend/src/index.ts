import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import { createApp } from './app';
import { env } from './config/env';

const app = createApp();
const port = parseInt(env.PORT || '4000', 10);

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
});
