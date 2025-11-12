// src/components/dashboard/Dashboard.jsx
import React from 'react';
import { useProjects } from '../../hooks/useProjects';
import { useTasks } from '../../hooks/useTasks';
import { useAuthStore } from '../../hooks/useAuth';
import { 
  CheckSquare, Clock, TrendingUp, AlertCircle,
  BarChart3, Calendar, Users 
} from 'lucide-react';
import Card from '../common/Card';
import Loading from '../common/Loading';
import StatsCard from './StatsCard';
import RecentActivity from './RecentActivity';

const Dashboard = () => {
  const { user } = useAuthStore();
  const { data: projectsData, isLoading: projectsLoading } = useProjects();
  const { data: tasksData, isLoading: tasksLoading } = useTasks();

  if (projectsLoading || tasksLoading) {
    return <Loading fullScreen text="Loading dashboard..." />;
  }

  const projects = projectsData?.data?.projects || [];
  const tasks = tasksData?.data?.tasks || [];

  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'active').length,
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'done').length,
    inProgressTasks: tasks.filter(t => t.status === 'in-progress').length,
    overdueTasks: tasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
    ).length
  };

  const completionRate = stats.totalTasks > 0 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Here's what's happening with your projects today
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Projects"
            value={stats.totalProjects}
            icon={CheckSquare}
            trend="+12%"
            trendUp={true}
            color="primary"
          />
          <StatsCard
            title="Active Projects"
            value={stats.activeProjects}
            icon={TrendingUp}
            trend="+8%"
            trendUp={true}
            color="green"
          />
          <StatsCard
            title="Tasks Completed"
            value={stats.completedTasks}
            icon={CheckSquare}
            subtitle={`${completionRate}% completion rate`}
            color="blue"
          />
          <StatsCard
            title="Overdue Tasks"
            value={stats.overdueTasks}
            icon={AlertCircle}
            trend="-5%"
            trendUp={false}
            color="red"
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Progress */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Task Progress
                </h3>
                <BarChart3 className="text-primary-600" />
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      Completed
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {stats.completedTasks} / {stats.totalTasks}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-green-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      In Progress
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {stats.inProgressTasks}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(stats.inProgressTasks / stats.totalTasks) * 100}%` 
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      Overdue
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {stats.overdueTasks}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-red-500 h-3 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${(stats.overdueTasks / stats.totalTasks) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Upcoming Deadlines */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Upcoming Deadlines
                </h3>
                <Calendar className="text-primary-600" />
              </div>

              <div className="space-y-3">
                {tasks
                  .filter(t => t.dueDate && t.status !== 'done')
                  .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                  .slice(0, 5)
                  .map(task => (
                    <div 
                      key={task._id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          task.priority === 'urgent' ? 'bg-red-500' :
                          task.priority === 'high' ? 'bg-orange-500' :
                          task.priority === 'medium' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`} />
                        <div>
                          <p className="font-medium text-gray-900">{task.title}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(task.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Clock size={18} className="text-gray-400" />
                    </div>
                  ))}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <RecentActivity activities={[
              { 
                type: 'task_completed', 
                message: 'Task "Update documentation" completed',
                time: '2 hours ago'
              },
              { 
                type: 'project_created', 
                message: 'New project "Mobile App" created',
                time: '5 hours ago'
              },
              { 
                type: 'comment', 
                message: 'New comment on "API Integration"',
                time: '1 day ago'
              }
            ]} />

            {/* Team Members */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Team Activity
                </h3>
                <Users className="text-primary-600" />
              </div>

              <div className="space-y-3">
                {[1, 2, 3].map((_, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-semibold">
                      U{idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">User {idx + 1}</p>
                      <p className="text-sm text-gray-500">Active now</p>
                    </div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;