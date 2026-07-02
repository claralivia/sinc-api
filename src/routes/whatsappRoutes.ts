import { Router } from 'express';
import { WhatsAppController } from '../controllers/WhatsAppController';

const whatsappRoutes = Router();
const whatsAppController = new WhatsAppController();

whatsappRoutes.get('/webhook/whatsapp', whatsAppController.verify);
whatsappRoutes.post('/webhook/whatsapp', whatsAppController.receive);

export { whatsappRoutes };
