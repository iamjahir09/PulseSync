'use client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  private getHeaders(): HeadersInit {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  private handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      return response.json().then(data => {
        throw new Error(data.message || data.error || 'API request failed');
      }).catch(() => {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      });
    }
    return response.json();
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${API_BASE}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    return this.handleResponse<T>(response);
  }

  // Auth methods
  async login(email: string, password: string): Promise<{ access_token: string; user: any }> {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    return this.handleResponse<{ access_token: string; user: any }>(response);
  }

  // Patient methods
  async getPatients(search?: string): Promise<any[]> {
    return this.get('/patients', search ? { search } : undefined);
  }

  async createPatient(data: any): Promise<any> {
    return this.post('/patients', data);
  }

  async updatePatient(id: string, data: any): Promise<any> {
    return this.patch(`/patients/${id}`, data);
  }

  async deletePatient(id: string): Promise<any> {
    return this.delete(`/patients/${id}`);
  }

  async deactivatePatient(id: string): Promise<any> {
    return this.patch(`/patients/${id}/deactivate`);
  }

  // Session methods
  async createSession(data: any): Promise<any> {
    return this.post('/sessions', data);
  }

  async getSession(id: string): Promise<any> {
    return this.get(`/sessions/${id}`);
  }

  async getPatientSessions(patientId: string): Promise<any[]> {
    return this.get(`/sessions/patient/${patientId}`);
  }

  async endSession(id: string): Promise<any> {
    return this.patch(`/sessions/${id}/end`);
  }

  async addReading(id: string, reading: any): Promise<any> {
    return this.patch(`/sessions/${id}/reading`, { reading });
  }
}

export const apiClient = new ApiClient();