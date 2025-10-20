import { useState, useEffect, useMemo } from "react";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../services/taskService";

interface Task {
  id: string;
  description: string;
  status: "pending" | "done";
  priority: "high" | "medium" | "low";
  createdAt: string;
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">("medium");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingDescription, setEditingDescription] = useState("");
  const [editingPriority, setEditingPriority] = useState<"high" | "medium" | "low">("medium");
  const [token, setToken] = useState<string | null | undefined>("");

  useEffect(() => {
    setToken(localStorage.getItem("financeai_token") || "");
  }, [])

  useEffect(() => {
    async function fetchTasks() {
      try {
        const data = await getTasks(token);
        setTasks(data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchTasks();
  }, [token]);

  const handleAddTask = async () => {
    if (!newDescription) return;
    try {
      const task = await createTask(token, newDescription, newPriority);
      setTasks([...tasks, task]);
      setNewDescription("");
      setNewPriority("medium");
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (task: Task) => {
    try {
      const newStatus = task.status === "pending" ? "done" : "pending";
      await updateTask(token, task.id, { status: newStatus });
      setTasks(tasks.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (task: Task) => {
    try {
      await deleteTask(token, task.id);
      setTasks(tasks.filter((t) => t.id !== task.id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditStart = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingDescription(task.description);
    setEditingPriority(task.priority);
  };

  const handleEditSave = async (task: Task) => {
    try {
      await updateTask(token, task.id, { description: editingDescription, priority: editingPriority });
      setTasks(
        tasks.map((t) =>
          t.id === task.id
            ? { ...t, description: editingDescription, priority: editingPriority }
            : t
        )
      );
      setEditingTaskId(null);
      setEditingDescription("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditCancel = () => {
    setEditingTaskId(null);
    setEditingDescription("");
  };

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-400";
      case "low":
        return "bg-green-400";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6">My Tasks</h1>

      {/* Add Task */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="New task description..."
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          className="flex-1 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value as Task["priority"])}
          className="p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <button
          onClick={handleAddTask}
          className="bg-blue-500 text-white px-4 rounded-lg hover:bg-blue-600 transition"
        >
          Add
        </button>
      </div>

      {/* Task List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="bg-white p-4 rounded-xl shadow hover:shadow-lg transition relative"
          >
            <div className="flex justify-between items-start">
              <span
                className={`px-2 py-1 rounded-full text-white text-xs font-semibold ${getPriorityColor(
                  task.priority
                )}`}
              >
                {task?.priority?.toUpperCase()}
              </span>
              <span
                className={`px-2 py-1 rounded-full text-white text-xs font-semibold ${
                  task.status === "done" ? "bg-gray-500" : "bg-green-500"
                }`}
              >
                {task.status.toUpperCase()}
              </span>
            </div>

            {editingTaskId === task.id ? (
              <div className="mt-2">
                <input
                  type="text"
                  value={editingDescription}
                  onChange={(e) => setEditingDescription(e.target.value)}
                  className="w-full p-2 border rounded-lg mb-2"
                />
                <select
                  value={editingPriority}
                  onChange={(e) => setEditingPriority(e.target.value as Task["priority"])}
                  className="w-full p-2 border rounded-lg mb-2"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => handleEditSave(task)}
                    className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleEditCancel}
                    className="px-2 py-1 bg-gray-400 text-white rounded hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-2">
                <p
                  className={`text-lg font-medium ${
                    task.status === "done" ? "line-through text-gray-400" : ""
                  }`}
                >
                  {task.description}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Created at: {new Date(task.createdAt).toLocaleString()}
                </p>
                <div className="flex justify-between items-center mt-4">
                  <button
                    onClick={() => handleToggleStatus(task)}
                    className={`px-2 py-1 rounded-lg text-white text-sm ${
                      task.status === "pending"
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-gray-500 hover:bg-gray-600"
                    }`}
                  >
                    {task.status === "pending" ? "Done" : "Pending"}
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditStart(task)}
                      className="px-2 py-1 rounded-lg bg-yellow-500 text-white text-sm hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(task)}
                      className="px-2 py-1 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
