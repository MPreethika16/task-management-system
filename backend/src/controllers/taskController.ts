import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Task } from '../models/Task';

const isValidObjectId = (id: string): boolean => mongoose.Types.ObjectId.isValid(id);

const VALID_STATUSES = ['Todo', 'In Progress', 'Done'];
const VALID_PRIORITIES = ['Low', 'Medium', 'High'];

export const createTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, status, priority, dueDate } = req.body;
    const userId = req.userId;

    if (!title || !description || !dueDate) {
      res.status(400).json({ success: false, message: 'Title, description, and dueDate are required' });
      return;
    }

    if (status && !VALID_STATUSES.includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status' });
      return;
    }

    if (priority && !VALID_PRIORITIES.includes(priority)) {
      res.status(400).json({ success: false, message: 'Invalid priority' });
      return;
    }

    const task = await Task.create({
      user: userId,
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      dueDate: new Date(dueDate),
    });

    res.status(201).json({ success: true, data: task });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const getTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { search, status, priority, page, limit, sort, order } = req.query;

    const pageNum = page ? parseInt(page as string, 10) : 1;
    const limitNum = limit ? parseInt(limit as string, 10) : 10;
    if (isNaN(pageNum) || pageNum < 1) {
      res.status(400).json({ success: false, message: 'Invalid page' });
      return;
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      res.status(400).json({ success: false, message: 'Invalid limit' });
      return;
    }

    if (status && !VALID_STATUSES.includes(status as string)) {
      res.status(400).json({ success: false, message: 'Invalid status' });
      return;
    }
    if (priority && !VALID_PRIORITIES.includes(priority as string)) {
      res.status(400).json({ success: false, message: 'Invalid priority' });
      return;
    }
    if (sort && !['dueDate', 'priority', 'createdAt'].includes(sort as string)) {
      res.status(400).json({ success: false, message: 'Invalid sort field' });
      return;
    }
    if (order && !['asc', 'desc'].includes(order as string)) {
      res.status(400).json({ success: false, message: 'Invalid order' });
      return;
    }

    const filter: any = { user: new mongoose.Types.ObjectId(userId) };

    if (search) {
      const escapedSearch = (search as string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.title = { $regex: escapedSearch, $options: 'i' };
    }
    if (status) {
      filter.status = status;
    }
    if (priority) {
      filter.priority = priority;
    }

    const total = await Task.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);
    const skip = (pageNum - 1) * limitNum;

    const sortField = (sort as string) || 'createdAt';
    const sortDir = order === 'asc' ? 1 : -1;

    let tasks;

    if (sortField === 'priority') {
      const pipelineDocs = await Task.aggregate([
        { $match: filter },
        {
          $addFields: {
            priorityWeight: {
              $switch: {
                branches: [
                  { case: { $eq: ['$priority', 'Low'] }, then: 1 },
                  { case: { $eq: ['$priority', 'Medium'] }, then: 2 },
                  { case: { $eq: ['$priority', 'High'] }, then: 3 },
                ],
                default: 0,
              },
            },
          },
        },
        { $sort: { priorityWeight: sortDir, createdAt: -1 } },
        { $skip: skip },
        { $limit: limitNum },
        { $project: { priorityWeight: 0 } },
      ]);
      tasks = pipelineDocs.map((doc) => Task.hydrate(doc));
    } else {
      tasks = await Task.find(filter)
        .sort({ [sortField]: sortDir, createdAt: -1 })
        .skip(skip)
        .limit(limitNum);
    }

    res.status(200).json({
      success: true,
      data: {
        tasks,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const getTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!isValidObjectId(id as string)) {
      res.status(400).json({ success: false, message: 'Invalid task ID' });
      return;
    }

    const task = await Task.findOne({ _id: id, user: userId });

    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    res.status(200).json({ success: true, data: task });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const updateTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { title, description, status, priority, dueDate } = req.body;

    if (!isValidObjectId(id as string)) {
      res.status(400).json({ success: false, message: 'Invalid task ID' });
      return;
    }

    if (status && !VALID_STATUSES.includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status' });
      return;
    }

    if (priority && !VALID_PRIORITIES.includes(priority)) {
      res.status(400).json({ success: false, message: 'Invalid priority' });
      return;
    }

    // Whitelist specific fields for update
    const updateFields: any = {};
    if (title !== undefined) updateFields.title = title.trim();
    if (description !== undefined) updateFields.description = description.trim();
    if (status !== undefined) updateFields.status = status;
    if (priority !== undefined) updateFields.priority = priority;
    if (dueDate !== undefined) updateFields.dueDate = new Date(dueDate);

    const task = await Task.findOneAndUpdate(
      { _id: id, user: userId },
      updateFields,
      { returnDocument: 'after', runValidators: true }
    );

    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    res.status(200).json({ success: true, data: task });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const deleteTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!isValidObjectId(id as string)) {
      res.status(400).json({ success: false, message: 'Invalid task ID' });
      return;
    }

    const task = await Task.findOneAndDelete({ _id: id, user: userId });

    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    res.status(200).json({ success: true, data: {} });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};

export const updateTaskStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { status } = req.body;

    if (!isValidObjectId(id as string)) {
      res.status(400).json({ success: false, message: 'Invalid task ID' });
      return;
    }

    if (!status) {
      res.status(400).json({ success: false, message: 'Status is required' });
      return;
    }

    if (!VALID_STATUSES.includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid status' });
      return;
    }

    const task = await Task.findOneAndUpdate(
      { _id: id, user: userId },
      { status },
      { returnDocument: 'after', runValidators: true }
    );

    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found' });
      return;
    }

    res.status(200).json({ success: true, data: task });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};
