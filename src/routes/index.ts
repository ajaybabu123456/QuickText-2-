import express, { Router } from 'express';
import shareRoutes from './share';

const router: Router = express.Router();

router.use('/', shareRoutes);

export default router;
