import { Router } from "express";

const router = Router();

// Mock in-memory storage for testing
let mockTasks: any[] = [
  {
    id: 'task-1',
    title: 'Sample Task 1',
    description: 'This is a sample task for testing',
    status: 'TODO',
    priority: 'HIGH',
    dueDate: new Date('2024-12-31'),
    assigneeId: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'task-2',
    title: 'Sample Task 2',
    description: 'Another sample task',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    dueDate: null,
    assigneeId: 'user-456',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

router.get("/", async (req, res) => {
  const { userId, status } = req.query;

  let filteredTasks = mockTasks;

  if (userId) {
    filteredTasks = filteredTasks.filter(task => task.assigneeId === userId);
  }

  if (status) {
    filteredTasks = filteredTasks.filter(task => task.status === status);
  }

  // Sort by updatedAt desc like the real implementation
  filteredTasks.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  res.json(filteredTasks);
});

router.post("/", async (req, res) => {
  const { title, description, status = 'TODO', priority = 'MEDIUM', assigneeId, dueDate } = req.body;

  const newTask = {
    id: `task-${Date.now()}`,
    title,
    description,
    status,
    priority,
    assigneeId,
    dueDate: dueDate ? new Date(dueDate) : null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  mockTasks.push(newTask);
  res.status(201).json(newTask);
});

router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const taskIndex = mockTasks.findIndex(task => task.id === id);
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  // Update the task
  mockTasks[taskIndex] = {
    ...mockTasks[taskIndex],
    ...updates,
    updatedAt: new Date(),
  };

  res.json(mockTasks[taskIndex]);
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const taskIndex = mockTasks.findIndex(task => task.id === id);
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  mockTasks.splice(taskIndex, 1);
  res.status(204).send();
});

export default router;
