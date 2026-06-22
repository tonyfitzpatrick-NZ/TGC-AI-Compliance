import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Edit2, Trash2, Calendar } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  projectId: string;
  dueDate?: string; // ISO date string (YYYY-MM-DD)
}

const TaskKanban: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDueDate, setEditDueDate] = useState('');

  const columns = ['Open', 'In Progress', 'Pending', 'Approved', 'Closed'];

  // Real-time listener
  useEffect(() => {
    if (!projectId) return;

    const q = query(
      collection(db, 'tasks'),
      where('projectId', '==', projectId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTasks: Task[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      setTasks(fetchedTasks);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [projectId]);

  // Update task (title + due date)
  const saveTask = async (taskId: string) => {
    if (!editTitle.trim()) return;

    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, {
        title: editTitle.trim(),
        dueDate: editDueDate || null,
      });
      setEditingTaskId(null);
      setEditTitle('');
      setEditDueDate('');
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // Delete task
  const deleteTask = async (taskId: string) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Update status (used by drag & drop)
  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, { status: newStatus });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Drag & Drop
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) updateTaskStatus(taskId, newStatus);
  };

  // Format date for display
  const formatDueDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-NZ', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return <div className="p-4">Loading tasks...</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-6">Compliance Tasks</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {columns.map((status) => {
          const columnTasks = tasks.filter(task => task.status === status);

          return (
            <div
              key={status}
              className="bg-gray-50 rounded-lg p-4 min-h-[500px]"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status)}
            >
              <div className="font-semibold text-gray-700 mb-4 flex items-center justify-between sticky top-0 bg-gray-50 py-1">
                <span>{status}</span>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                  {columnTasks.length}
                </span>
              </div>

              <div className="space-y-3">
                {columnTasks.length === 0 ? (
                  <div className="text-sm text-gray-400 italic py-6 text-center border border-dashed border-gray-300 rounded-lg">
                    Drop tasks here
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 group"
                    >
                      {/* Title Editing */}
                      {editingTaskId === task.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full border border-blue-400 rounded px-2 py-1 text-sm"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <input
                              type="date"
                              value={editDueDate}
                              onChange={(e) => setEditDueDate(e.target.value)}
                              className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                            />
                            <button
                              onClick={() => saveTask(task.id)}
                              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setEditingTaskId(null);
                                setEditTitle('');
                                setEditDueDate('');
                              }}
                              className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-medium text-gray-900 pr-2">{task.title}</div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                              <button
                                onClick={() => {
                                  setEditingTaskId(task.id);
                                  setEditTitle(task.title);
                                  setEditDueDate(task.dueDate || '');
                                }}
                                className="p-1 text-gray-400 hover:text-blue-600"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => deleteTask(task.id)}
                                className="p-1 text-gray-400 hover:text-red-600"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          {task.description && (
                            <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                          )}

                          <div className="flex items-center justify-between text-xs">
                            <span className={`px-2.5 py-1 rounded-full font-medium ${
                              task.priority === 'high' 
                                ? 'bg-red-100 text-red-700' 
                                : task.priority === 'medium' 
                                ? 'bg-yellow-100 text-yellow-700' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {task.priority}
                            </span>

                            {task.dueDate && (
                              <span className="flex items-center gap-1 text-orange-600">
                                <Calendar size={12} />
                                {formatDueDate(task.dueDate)}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 mt-4 text-center">
        Drag tasks between columns • Click ✏️ to edit title & due date • Click 🗑️ to delete
      </p>
    </div>
  );
};

export default TaskKanban;
