import React from 'react';
import { useParams } from 'react-router-dom';
import PDFViewer from '../components/PDFViewer';
import TaskKanban from '../components/TaskKanban';
import UploadForm from '../components/UploadForm';

const ProjectDetail: React.FC = () => {
  const { id } = useParams();

  const handleUploadComplete = () => {
    // Refresh documents or trigger AI review here
    console.log('Upload complete for project:', id);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Project: {id}</h1>
          <button 
            onClick={() => {/* Trigger AI Review */}}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
          >
            Run AI Compliance Review
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* PDF Viewer & Upload */}
          <div className="lg:col-span-2 space-y-6">
            <UploadForm projectId={id!} onUploadComplete={handleUploadComplete} />
            <PDFViewer projectId={id!} />
          </div>

          {/* Task Kanban */}
          <div>
            <TaskKanban projectId={id!} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
