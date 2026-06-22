import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import PDFViewer from '../components/PDFViewer';
import TaskKanban from '../components/TaskKanban';
import UploadForm from '../components/UploadForm';

const ProjectDetail: React.FC = () => {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;
      const docRef = doc(db, 'projects', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setProject({ id: docSnap.id, ...docSnap.data() });
      }
      setLoading(false);
    };
    
    fetchProject();
  }, [id]);

  const handleUploadComplete = () => {
    console.log('Upload complete for project:', id);
    // You can add logic here later to refresh the document list
  };

  if (loading) {
    return <div className="p-8">Loading project...</div>;
  }

  if (!project) {
    return <div className="p-8">Project not found.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            {project.address && (
              <p className="text-gray-500 mt-1">{project.address}</p>
            )}
          </div>
          
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
