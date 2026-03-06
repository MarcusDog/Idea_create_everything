/**
 * Projects API module
 * Handles all project-related API calls
 */

import apiClient from './client';

// Types matching backend schemas
export interface Project {
  id: string;
  name: string;
  description: string | null;
  domain: string | null;
  tree_data: Record<string, any>;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectCreate {
  name: string;
  description?: string;
  domain?: string;
  tree_data?: Record<string, any>;
}

export interface ProjectUpdate {
  name?: string;
  description?: string | null;
  domain?: string | null;
  tree_data?: Record<string, any>;
}

// Project API endpoints
export const projectsApi = {
  /**
   * Get all projects
   */
  getProjects: async (skip: number = 0, limit: number = 100): Promise<Project[]> => {
    return apiClient.get<Project[]>(`/projects/?skip=${skip}&limit=${limit}`);
  },

  /**
   * Get a single project by ID
   */
  getProject: async (id: string): Promise<Project> => {
    return apiClient.get<Project>(`/projects/${id}`);
  },

  /**
   * Create a new project
   */
  createProject: async (data: ProjectCreate): Promise<Project> => {
    return apiClient.post<Project>('/projects/', data);
  },

  /**
   * Update a project
   */
  updateProject: async (id: string, data: ProjectUpdate): Promise<Project> => {
    return apiClient.put<Project>(`/projects/${id}`, data);
  },

  /**
   * Delete a project
   */
  deleteProject: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/projects/${id}`);
  },
};

export default projectsApi;
