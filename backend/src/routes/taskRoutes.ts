import { Router } from 'express';
import {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  getTaskStats,
} from '../controllers/taskController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

// All task routes require authentication
router.use(protect);

router.post('/', createTask);
router.get('/', getTasks);
router.get('/stats', getTaskStats);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.patch('/:id/status', updateTaskStatus);

export default router;
