import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Link } from 'react-router-dom';
import { Upload, Plus, Building2 } from 'lucide-react';

const Dashboard = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      const querySnapshot = await getDocs(collection(db, 'projects'));
      setProjects(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };
    fetchProjects();
  }, []);

  const createNewProject = async () => {
    const name = prompt('Enter project name:');
    if (!name) return;

    await addDoc(collection(db, 'projects'), {
      name,
      address: '',
      createdAt: new Date(),
      status: 'active'
    });
    window.location.reload(); // simple refresh for MVP
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">TGC Compliance</h1>
              <p className="text-sm text-gray-500">AI Drawing Review System</p>
            </div>
          </div>
          <button
            onClick={createNewProject}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium"
          >
            <Plus className="w-5 h-5" />
            New Project
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-10">
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-3xl font-semibold text-gray-900">Active Projects</h2>
        </div>

        {loading ? (
          <div>Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-500">No projects yet. Create your first one above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/project/${project.id}`}
                className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-all hover:-translate-y-1 group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600">{project.name}</h3>
                    <p className="text-gray-500 mt-1">{project.address || 'No address set'}</p>
                  </div>
                  <div className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">Active</div>
                </div>
                <div className="mt-8 text-sm text-gray-500">
                  Last updated: Recently
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
