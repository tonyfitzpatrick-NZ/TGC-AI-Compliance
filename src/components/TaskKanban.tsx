import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'; // Note: You may need to install react-beautiful-dnd or use a simpler version

const TaskKanban: React.FC<{ projectId: string }> = ({ projectId }) => {
  const columns = ['Open', 'In Progress', 'Pending', 'Approved', 'Closed', 'Rejected'];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-6">Compliance Tasks</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((status) => (
          <div key={status} className="bg-gray-50 rounded-lg p-4 min-h-[400px]">
            <div className="font-medium text-gray-700 mb-4 flex items-center gap-2">
              {status}
            </div>
            {/* Tasks will be populated here from Firestore */}
            <div className="text-sm text-gray-500 italic">No tasks yet</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskKanban;
