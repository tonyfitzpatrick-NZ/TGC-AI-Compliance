import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import PDFViewer from '../components/PDFViewer';
import TaskKanban from '../components/TaskKanban';
import UploadForm from '../components/UploadForm';

const ProjectDetail: React.FC = () => {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch project details from Firestore
  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;

      try {
        const docRef = doc(db, 'projects', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProject({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error('Error fetching project:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  const handleUploadComplete = () => {
    console.log('Upload complete for project:', id);
  };

  // AI Compliance Review with due dates
  const runAIReview = async () => {
    if (!id) return;

    const confirmRun = window.confirm(
      "Run AI Compliance Review?\n\nThis will generate realistic tasks with suggested due dates."
    );
    if (!confirmRun) return;

    try {
      const today = new Date();

      const generatedTasks = [
        {
          title: "Add NZS 3604 foundation bracing details",
          description: "Foundation Plan is missing bracing schedule and calculations",
          status: "Open",
          priority: "high",
          projectId: id,
          dueDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          createdAt: new Date(),
        },
        {
          title: "Confirm E1 surface water drainage sizing",
          description: "Check stormwater pipe sizes against Dunedin rainfall data",
          status: "Open",
          priority: "high",
          projectId: id,
          dueDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          createdAt: new Date(),
        },
        {
          title: "Update cladding fixing schedule",
          description: "HardieFlex R10 requires specific nail pattern and spacing",
          status: "In Progress",
          priority: "medium",
          projectId: id,
          dueDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          createdAt: new Date(),
        },
        {
          title: "Add fire-rated wall details between units",
          description: "FRL 60/60/60 wall required between Unit 1 and Unit 2",
          status: "Open",
          priority: "high",
          projectId: id,
          dueDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          createdAt: new Date(),
        },
        {
          title: "Verify recession plane compliance",
          description: "Check north boundary recession planes on all elevations",
          status: "Pending",
          priority: "medium",
          projectId: id,
          dueDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          createdAt: new Date(),
        },
        {
          title: "Include 450mm eaves detail",
          description: "All elevations should show minimum 450mm eaves overhang",
          status: "Open",
          priority: "low",
          projectId: id,
          dueDate: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          createdAt: new Date(),
        },
      ];

      // Save tasks to Firestore
      for (const task of generatedTasks) {
        await addDoc(collection(db, 'tasks'), task);
      }

      alert("✅ AI Compliance Review complete!\n\nNew tasks with suggested due dates have been added to the Kanban.");
      window.location.reload();

    } catch (error) {
      console.error("AI Review failed:", error);
      alert("Something went wrong while running the AI review.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading project...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Project not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            {project.address && (
              <p className="text-gray-500 mt-1 text-lg">{project.address}</p>
            )}
          </div>

          <button
            onClick={runAIReview}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition"
          >
            Run AI Compliance Review
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload + PDF Viewer */}
          <div className="lg:col-span-2 space-y-6">
            <UploadForm 
              projectId={id!} 
              onUploadComplete={handleUploadComplete} 
            />
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
