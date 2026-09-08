import { Router } from 'express';
import {
  addCandidate,
  getCandidateById,
  updateCandidateStageController,
} from '../presentation/controllers/candidateController';

const router = Router();

router.post('/', async (req, res) => {
  try {
    // console.log(req.body); //Just in case you want to inspect the request body
    const result = await addCandidate(req.body);
    res.status(201).send(result);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).send({ message: error.message });
    } else {
      res.status(500).send({ message: 'An unexpected error occurred' });
    }
  }
});

router.get('/:id', getCandidateById);

router.put('/:id', updateCandidateStageController);

// Additive, non-breaking alias with a clearer verb for the kanban stage move
// (HU-4). Reuses the same controller/service as PUT /:id; the latter stays.
router.put('/:id/stage', updateCandidateStageController);

export default router;
