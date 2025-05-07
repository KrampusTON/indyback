import { Router } from 'express';
import { SaleController } from '../controllers/saleController';

const router = Router();
const controller = new SaleController();

router.post('/purchase', controller.processPurchase);
router.get('/sale-data', controller.getSaleData);

export default router;
