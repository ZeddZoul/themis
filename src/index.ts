// Load environment variables from .env as early as possible so modules that read
// process.env at import-time (like src/utils/crypto.ts) see the values.


import 'dotenv/config';
import express from 'express';


const app = express();
const port = process.env.PORT || 3000;


app.use(express.json());


import { authMiddleware } from './middleware/auth';
import { loggingMiddleware } from './middleware/logging';
import { rateLimiterMiddleware } from './middleware/rateLimiter';

// Apply middleware
app.use(loggingMiddleware);
app.use('/v1', authMiddleware);
app.use('/v1', rateLimiterMiddleware);


import repoRoutes from './routes/repo';
import checksRoutes from './routes/checks';
import webhooksRoutes from './routes/webhooks';


// TODO: Add routes
app.use('/v1/repo', repoRoutes);
app.use('/v1/checks', checksRoutes);
app.use('/v1/webhooks', webhooksRoutes);


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
