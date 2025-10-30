import { Router } from 'express';

const router = Router();

import { handleGithubWebhook } from '../controllers/webhooks.controller';

router.post('/github', handleGithubWebhook);

export default router;
