import { Router } from 'express';

const router = Router();

import { connectRepo } from '../controllers/repo.controller';

router.post('/connect', connectRepo);

export default router;
