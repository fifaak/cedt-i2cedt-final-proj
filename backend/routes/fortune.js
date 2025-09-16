import { Router } from 'express';
import { createFortune, listFortunes, updateFortune, deleteFortune } from '../controllers/fortuneController.js';

const router = Router();

// Create Fortune
router.post('/', createFortune);

// List Fortunes
router.get('/', listFortunes);

// Update Fortune by id
router.put('/:id', updateFortune);

// Delete Fortune by id
router.delete('/:id', deleteFortune);

export default router;


