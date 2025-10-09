const API_BASE = '/api/admin';

interface AdminApiOptions {
  adminKey: string;
}

class AdminApi {
  private adminKey: string;

  constructor(options: AdminApiOptions) {
    this.adminKey = options.adminKey;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'x-admin-key': this.adminKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `Admin API request failed: ${response.statusText}`);
    }

    if (!data.success) {
      throw new Error(data.message || 'Admin API request failed');
    }

    return data.data;
  }

  async test() {
    return this.request('/test');
  }

  async getDashboard() {
    return this.request('/dashboard');
  }

  async getJobs(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.status) searchParams.append('status', params.status);
    if (params.search) searchParams.append('search', params.search);

    const queryString = searchParams.toString();
    return this.request(`/jobs${queryString ? `?${queryString}` : ''}`);
  }

  async getJob(jobId: string) {
    return this.request(`/job/${jobId}`);
  }

  async deleteJob(jobId: string) {
    return this.request(`/job/${jobId}`, {
      method: 'DELETE',
    });
  }

  async cleanupFiles(maxAgeHours: number = 1) {
    return this.request('/cleanup', {
      method: 'POST',
      body: JSON.stringify({ maxAgeHours }),
    });
  }

  async getLogs() {
    return this.request('/logs');
  }

  async getBlacklist(params: {
    page?: number;
    limit?: number;
    type?: string;
    search?: string;
  } = {}) {
    const searchParams = new URLSearchParams();
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.type) searchParams.append('type', params.type);
    if (params.search) searchParams.append('search', params.search);

    const queryString = searchParams.toString();
    return this.request(`/blacklist${queryString ? `?${queryString}` : ''}`);
  }

  async addBlacklistEntry(entry: {
    type: 'channel' | 'url' | 'video_id';
    value: string;
    reason?: string;
  }) {
    return this.request('/blacklist', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  }

  async removeBlacklistEntry(id: number) {
    return this.request(`/blacklist/${id}`, {
      method: 'DELETE',
    });
  }
}

export default AdminApi;
