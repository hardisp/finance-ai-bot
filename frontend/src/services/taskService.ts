// frontend/src/services/taskService.ts
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

console.log(API_URL)

export const getTasks = async (token: string) => {
  const res = await axios.get(`${API_URL}/tasks`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.tasks;
};

export const createTask = async (
  token: string,
  description: string,
  priority?: string,
  dueDate?: string
) => {
  const res = await axios.post(
    `${API_URL}/tasks`,
    { description, priority, dueDate },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data.task;
};

export const updateTask = async (
  token: string,
  id: string,
  updates: { description?: string; status?: string; priority?: string; dueDate?: string }
) => {
  const res = await axios.patch(`${API_URL}/tasks/${id}`, updates, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const deleteTask = async (token: string, id: string) => {
  const res = await axios.delete(`${API_URL}/tasks/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
