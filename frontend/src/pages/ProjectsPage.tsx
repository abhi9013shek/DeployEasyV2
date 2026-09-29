import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter } from 'lucide-react';
import { ProjectCard } from '../components/ProjectCard';
import { LoadingState, EmptyState, ErrorState } from '../components/States';
import { Modal } from '../components/Modal';
import { useFetch } from '../hooks/useFetch';
import { projectsApi } from '../services/projectsApi';
import { CreateProjectInput } from '../types';

export function ProjectsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const { data: projects, loading, error, refetch } = useFetch(
    () => projectsApi.getAll(statusFilter !== 'all' ? statusFilter : undefined, search || undefined),
    [statusFilter, search]
  );
  const navigate = useNavigate();

  const [form, setForm] = useState<CreateProjectInput>({
    name: '',
    repository: '',
    branch: 'main',
    framework: 'REACT',
    buildCommand: 'npm run build',
    startCommand: 'npm run preview',
  });
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.repository) return;
    setCreating(true);
    try {
      const project = await projectsApi.create(form);
      setShowCreate(false);
      setForm({ name: '', repository: '', branch: 'main', framework: 'REACT', buildCommand: 'npm run build', startCommand: 'npm run preview' });
      navigate(`/projects/${project.id}`);
    } catch {
      alert('Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-surface-400 text-sm mt-1">Manage your deployed applications</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select-field pl-10 pr-8 min-w-[160px]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="building">Building</option>
            <option value="failed">Failed</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Projects grid */}
      {loading ? (
        <LoadingState message="Loading projects..." />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !projects || projects.length === 0 ? (
        <EmptyState title="No projects" message="Create your first project to get started." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Project" maxWidth="max-w-xl">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Project Name</label>
            <input
              className="input-field"
              placeholder="my-awesome-app"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Repository</label>
            <input
              className="input-field"
              placeholder="username/repository"
              value={form.repository}
              onChange={(e) => setForm({ ...form, repository: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Branch</label>
              <input
                className="input-field"
                value={form.branch}
                onChange={(e) => setForm({ ...form, branch: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Framework</label>
              <select
                className="select-field"
                value={form.framework}
                onChange={(e) => setForm({ ...form, framework: e.target.value })}
              >
                <option value="REACT">React</option>
                <option value="NEXTJS">Next.js</option>
                <option value="VUE">Vue</option>
                <option value="ANGULAR">Angular</option>
                <option value="SVELTE">Svelte</option>
                <option value="EXPRESS">Express</option>
                <option value="STATIC">Static</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Build Command</label>
            <input
              className="input-field font-mono text-sm"
              value={form.buildCommand}
              onChange={(e) => setForm({ ...form, buildCommand: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Start Command</label>
            <input
              className="input-field font-mono text-sm"
              value={form.startCommand}
              onChange={(e) => setForm({ ...form, startCommand: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Environment Variables <span className="text-surface-500">(optional)</span></label>
            <textarea
              className="input-field font-mono text-sm h-20 resize-none"
              placeholder="KEY=value"
              value={form.envVars || ''}
              onChange={(e) => setForm({ ...form, envVars: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={creating} className="btn-primary flex-1">
              {creating ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
