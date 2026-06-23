import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Link } from 'react-router-dom';
import { Plus, Building2, Search, Calendar, CheckCircle, AlertTriangle } from 'lucide-react';

const Dashboard = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<any[]>([]);
  const [taskCounts, setTaskCounts] = useState<{ 
    [key: string]: { 
      total: number; 
      open: number; 
      overdue: number 
    } 
  }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch projects + calculate task stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        const projectsSnapshot = await getDocs(collection(db, 'projects'));
        const projectsData = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const tasksSnapshot = await getDocs(collection(db, 'tasks'));
        const tasks = tasksSnapshot.docs.map(doc => doc.data());

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const counts: { [key: string]: { total: number; open: number; overdue: number } } = {};

        projectsData.forEach(project => {
          const projectTasks = tasks.filter((task: any) => task.projectId === project.id);
          
          const openTasks = projectTasks.filter((task: any) => 
            ['Open', 'In Progress', 'Pending'].includes(task.status)
          );

          const overdueTasks = openTasks.filter((task: any) => {
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            return dueDate < today;
          });

          counts[project.id] = {
            total: projectTasks.length,
            open: openTasks.length,
            overdue: overdueTasks.length
          };
        });

        setProjects(projectsData);
        setFilteredProjects(projectsData);
        setTaskCounts(counts);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Search filter
  useEffect(() => {
    const filtered = projects.filter(project =>
      project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProjects(filtered);
  }, [searchTerm, projects]);

  const createNewProject = async () => {
    const name = prompt('Enter project name:');
    if (!name) return;
    const address = prompt('Enter project address (optional):') || '';

    try {
      await addDoc(collection(db, 'projects'), {
        name,
        address,
        createdAt: new Date(),
        status: 'active'
      });
      window.location.reload();
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project.');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><p>Loading projects...</p></div>;
  }

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
          <button onClick={createNewProject} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium">
            <Plus className="w-5 h-5" /> New Project
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-10">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-semibold text-gray-900">Active Projects</h2>
            <p className="text-gray-500 mt-1">{filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}</p>
          </div>

          <div className="relative w-80">
            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
            <Building2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {searchTerm ? 'No projects found' : 'No projects yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? 'Try a different search term' : 'Get started by creating your first project'}
            </p>
            {!searchTerm && (
              <button onClick={createNewProject} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium">
                <Plus className="w-5 h-5" /> Create New Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const counts = taskCounts[project.id] || { total: 0, open: 0, overdue: 0 };
              
              return (
                <Link
                  key={project.id}
                  to={`/project/${project.id}`}
                  className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all hover:-translate-y-0.5 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {project.name}
                      </h3>
                      {project.address && (
                        <p className="text-gray-500 mt-1 text-sm line-clamp-2">{project.address}</p>
                      )}
                    </div>
                    <span className="ml-3 px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full whitespace-nowrap">
                      {project.status || 'Active'}
                    </span>
                  </div>

                  {/* Task Summary */}
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 mr-1.5 text-blue-500" />
                      <span>{counts.open} open / {counts.total} total tasks</span>
                    </div>

                    {/* Overdue Warning */}
                    {counts.overdue > 0 && (
                      <div className="flex items-center text-sm text-red-600 font-medium">
                        <AlertTriangle className="w-4 h-4 mr-1.5" />
                        <span>{counts.overdue} overdue task{counts.overdue !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center text-sm text-gray-500 mt-4">
                    <Calendar className="w-4 h-4 mr-2" />
                    Created {project.createdAt?.toDate 
                      ? project.createdAt.toDate().toLocaleDateString('en-NZ') 
                      : 'Recently'}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
