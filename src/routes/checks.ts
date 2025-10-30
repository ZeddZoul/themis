import { Router } from 'express';

const router = Router();

import { triggerScan, getScanStatus } from '../controllers/checks.controller';

router.post('/', triggerScan);

router.get('/:jobId', getScanStatus);

export default router;
