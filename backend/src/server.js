import { build } from './bootstrap.js';

const { env, app, connect } = build();
await connect();
app.listen(env.PORT, () => console.log(`JobConnect API on http://localhost:${env.PORT} (${env.NODE_ENV})`));
