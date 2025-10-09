import React, { useState, useEffect } from 'react';
import { Page } from '../App';

interface AdminProps {
  navigateTo: (page: Page) => void;
}

interface DashboardData {
  totalConversions: number;
  last24Hours: number;
  last7Days: number;
  statusStats: Record<string, number>;
  popularVideos: Array<{ video_title: string; count: number }>;
  qualityStats: Array<{ quality_message: string; count: number }>;
  hourlyStats: Record<string, number>;
  systemInfo: {
    diskUsage: number;
    fileCount: number;
    uptime: number;
    nodeVersion: string;
    platform: string;
  };
}

interface Job {
  id: string;
  youtube_url: string;
  video_title: string;
  status: string;
  progress: number;
  mp3_filename: string;
  error_message: string;
  quality_message: string;
  created_at: string;
  updated_at: string;
}

const Admin: React.FC<AdminProps> = ({ navigateTo }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'jobs' | 'blacklist' | 'logs'>('dashboard');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Blacklist state
  const [blacklistEntries, setBlacklistEntries] = useState<any[]>([]);
  const [blacklistPage, setBlacklistPage] = useState(1);
  const [blacklistTotalPages, setBlacklistTotalPages] = useState(1);
  const [blacklistSearch, setBlacklistSearch] = useState('');
  const [blacklistTypeFilter, setBlacklistTypeFilter] = useState('');
  const [showAddBlacklist, setShowAddBlacklist] = useState(false);
  const [newBlacklistEntry, setNewBlacklistEntry] = useState({
    type: 'url' as 'channel' | 'url' | 'video_id',
    value: '',
    reason: ''
  });

  const testConnection = async () => {
    if (!adminKey.trim()) {
      setError('Please enter admin key');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/test', {
        headers: {
          'x-admin-key': adminKey
        }
      });

      const data = await response.json();
      if (response.ok && data.success) {
        alert(`Test successful! Expected key: ${data.expectedKey ? 'Set' : 'Using default (admin123)'}`);
      } else {
        setError(data.message || 'Test failed');
      }
    } catch (err) {
      setError('Failed to test connection');
    } finally {
      setLoading(false);
    }
  };

  const authenticate = async () => {
    if (!adminKey.trim()) {
      setError('Please enter admin key');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'x-admin-key': adminKey
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data.data);
        setIsAuthenticated(true);
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Invalid admin key');
      }
    } catch (err) {
      setError('Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async (page = 1) => {
    if (!isAuthenticated) return;

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });

      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/admin/jobs?${params}`, {
        headers: {
          'x-admin-key': adminKey
        }
      });

      if (response.ok) {
        const data = await response.json();
        setJobs(data.data.jobs);
        setTotalPages(data.data.pagination.pages);
        setCurrentPage(page);
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    }
  };

  const fetchBlacklist = async (page = 1) => {
    if (!isAuthenticated) return;

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });

      if (blacklistSearch) params.append('search', blacklistSearch);
      if (blacklistTypeFilter) params.append('type', blacklistTypeFilter);

      const response = await fetch(`/api/admin/blacklist?${params}`, {
        headers: {
          'x-admin-key': adminKey
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBlacklistEntries(data.data.entries);
        setBlacklistTotalPages(data.data.pagination.pages);
        setBlacklistPage(page);
      }
    } catch (err) {
      console.error('Failed to fetch blacklist:', err);
    }
  };

  const addBlacklistEntry = async () => {
    if (!newBlacklistEntry.value.trim()) {
      setError('Please enter a value for the blacklist entry');
      return;
    }

    try {
      const response = await fetch('/api/admin/blacklist', {
        method: 'POST',
        headers: { 
          'x-admin-key': adminKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newBlacklistEntry)
      });

      if (response.ok) {
        setShowAddBlacklist(false);
        setNewBlacklistEntry({ type: 'url', value: '', reason: '' });
        fetchBlacklist(blacklistPage);
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to add blacklist entry');
      }
    } catch (err) {
      setError('Failed to add blacklist entry');
    }
  };

  const removeBlacklistEntry = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this blacklist entry?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/blacklist/${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': adminKey }
      });

      if (response.ok) {
        fetchBlacklist(blacklistPage);
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to remove blacklist entry');
      }
    } catch (err) {
      setError('Failed to remove blacklist entry');
    }
  };

  const cleanupFiles = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await fetch('/api/admin/cleanup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({ maxAgeHours: 1 })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Cleanup completed: ${data.message}`);
        fetchJobs(currentPage);
      }
    } catch (err) {
      alert('Cleanup failed');
    }
  };

  const deleteJob = async (jobId: string) => {
    if (!isAuthenticated || !confirm('Are you sure you want to delete this job?')) return;

    try {
      const response = await fetch(`/api/admin/job/${jobId}`, {
        method: 'DELETE',
        headers: {
          'x-admin-key': adminKey
        }
      });

      if (response.ok) {
        alert('Job deleted successfully');
        fetchJobs(currentPage);
      }
    } catch (err) {
      alert('Failed to delete job');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'jobs') {
        fetchJobs(1);
      } else if (activeTab === 'blacklist') {
        fetchBlacklist(1);
      }
    }
  }, [isAuthenticated, activeTab, searchTerm, statusFilter, blacklistSearch, blacklistTypeFilter]);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Admin Login</h1>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Admin Key
              </label>
              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="Enter admin key"
                onKeyPress={(e) => e.key === 'Enter' && authenticate()}
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            <div className="flex space-x-2">
              <button
                onClick={testConnection}
                disabled={loading}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test'}
              </button>
              <button
                onClick={authenticate}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Login'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Monitor and manage your YouTube to MP3 converter</p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          {(['dashboard', 'jobs', 'blacklist', 'logs'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && dashboardData && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Total Conversions</h3>
              <p className="text-3xl font-bold text-blue-600">{dashboardData.totalConversions.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Last 24 Hours</h3>
              <p className="text-3xl font-bold text-green-600">{dashboardData.last24Hours.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Last 7 Days</h3>
              <p className="text-3xl font-bold text-purple-600">{dashboardData.last7Days.toLocaleString()}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Disk Usage</h3>
              <p className="text-3xl font-bold text-orange-600">{dashboardData.systemInfo.diskUsage} MB</p>
            </div>
          </div>

          {/* Status Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Status Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(dashboardData.statusStats).map(([status, count]) => (
                <div key={status} className="text-center">
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
                    {status}
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{count}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Videos */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Most Popular Videos</h3>
            <div className="space-y-2">
              {dashboardData.popularVideos.slice(0, 5).map((video, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-900 dark:text-white truncate flex-1 mr-4">
                    {video.video_title}
                  </span>
                  <span className="text-sm font-medium text-blue-600">{video.count} conversions</span>
                </div>
              ))}
            </div>
          </div>

          {/* System Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">System Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Uptime</p>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {formatUptime(dashboardData.systemInfo.uptime)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Files in Downloads</p>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {dashboardData.systemInfo.fileCount}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Node Version</p>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {dashboardData.systemInfo.nodeVersion}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Platform</p>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {dashboardData.systemInfo.platform}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Admin Actions</h3>
            <div className="flex space-x-4">
              <button
                onClick={cleanupFiles}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Cleanup Old Files
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Jobs Tab */}
      {activeTab === 'jobs' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="cleaned">Cleaned</option>
                </select>
              </div>
            </div>
          </div>

          {/* Jobs Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Job ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Video Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {jobs.map((job) => (
                    <tr key={job.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-white">
                        {job.id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs truncate">
                        {job.video_title || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(job.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => deleteJob(job.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => fetchJobs(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchJobs(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Page <span className="font-medium">{currentPage}</span> of{' '}
                      <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => fetchJobs(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => fetchJobs(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Blacklist Tab */}
      {activeTab === 'blacklist' && (
        <div className="space-y-6">
          {/* Add Blacklist Entry */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Blacklist Management</h3>
              <button
                onClick={() => setShowAddBlacklist(!showAddBlacklist)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                {showAddBlacklist ? 'Cancel' : 'Add Entry'}
              </button>
            </div>

            {showAddBlacklist && (
              <div className="border-t pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Type
                    </label>
                    <select
                      value={newBlacklistEntry.type}
                      onChange={(e) => setNewBlacklistEntry({...newBlacklistEntry, type: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="url">URL</option>
                      <option value="video_id">Video ID</option>
                      <option value="channel">Channel</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Value
                    </label>
                    <input
                      type="text"
                      value={newBlacklistEntry.value}
                      onChange={(e) => setNewBlacklistEntry({...newBlacklistEntry, value: e.target.value})}
                      placeholder="Enter URL, video ID, or channel ID"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Reason (Optional)
                    </label>
                    <input
                      type="text"
                      value={newBlacklistEntry.reason}
                      onChange={(e) => setNewBlacklistEntry({...newBlacklistEntry, reason: e.target.value})}
                      placeholder="Reason for blacklisting"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <button
                  onClick={addBlacklistEntry}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Add to Blacklist
                </button>
              </div>
            )}
          </div>

          {/* Blacklist Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search blacklist entries..."
                  value={blacklistSearch}
                  onChange={(e) => setBlacklistSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <select
                  value={blacklistTypeFilter}
                  onChange={(e) => setBlacklistTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Types</option>
                  <option value="url">URL</option>
                  <option value="video_id">Video ID</option>
                  <option value="channel">Channel</option>
                </select>
              </div>
            </div>
          </div>

          {/* Blacklist Entries */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Blacklisted Entries</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {blacklistEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          entry.type === 'url' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          entry.type === 'video_id' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                        }`}>
                          {entry.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div className="max-w-xs truncate" title={entry.value}>
                          {entry.value}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {entry.reason || 'No reason provided'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => removeBlacklistEntry(entry.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {blacklistTotalPages > 1 && (
              <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => fetchBlacklist(blacklistPage - 1)}
                    disabled={blacklistPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchBlacklist(blacklistPage + 1)}
                    disabled={blacklistPage === blacklistTotalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Page <span className="font-medium">{blacklistPage}</span> of{' '}
                      <span className="font-medium">{blacklistTotalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => fetchBlacklist(blacklistPage - 1)}
                        disabled={blacklistPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => fetchBlacklist(blacklistPage + 1)}
                        disabled={blacklistPage === blacklistTotalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Logs</h3>
          <div className="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-sm max-h-96 overflow-y-auto">
            <p>Logs feature coming soon...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
