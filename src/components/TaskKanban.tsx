import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  projectId: string;
}

const TaskKanban: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const columns = ['Open', 'In Progress', 'Pending', 'Approved', 'Closed'];

  // Fetch tasks from Firestore in real-time
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

  // Change task status
  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, { status: newStatus });
    } catch (error) {
      console.error('Error updating task status:', error);
    }
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
            <div key={status} className="bg-gray-50 rounded-lg p-4 min-h-[400px]">
              <div className="font-semibold text-gray-700 mb-4 flex items-center justify-between">
                <span>{status}</span>
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                  {columnTasks.length}
                </span>
              </div>

              <div className="space-y-3">
                {columnTasks.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No tasks</p>
                ) : (
                  columnTasks.map((task) => (
                    <div 
                      key={task.id} 
                      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
                    >
                      <div className="font-medium text-gray-900 mb-1">{task.title}</div>
                      
                      {task.description && (
                        <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                      )}

                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          task.priority === 'high' 
                            ? 'bg-red-100 text-red-700' 
                            : task.priority === 'medium' 
                            ? 'bg-yellow-100 text-yellow-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {task.priority}
                        </span>

                        <select
                          value={task.status}
                          onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                          className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                        >
                          {columns.map(col => (
                            <option key={col} value={col}>{col}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskKanban;
