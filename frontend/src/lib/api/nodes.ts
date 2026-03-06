/**
 * Nodes API module
 * Handles all node and tree structure related API calls
 */

import apiClient from './client';

export interface TreeNode {
  id: string;
  project_id: string;
  label: string;
  description?: string | null;
  status: 'todo' | 'doing' | 'done' | 'blocked';
  position_x: number;
  position_y: number;
  parent_id?: string | null;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface TreeEdge {
  id: string;
  source_id: string;
  target_id: string;
  label?: string | null;
  created_at: string;
}

export interface NodeCreate {
  label: string;
  description?: string;
  status?: 'todo' | 'doing' | 'done' | 'blocked';
  position_x: number;
  position_y: number;
  parent_id?: string | null;
  metadata?: Record<string, any>;
}

export interface NodeUpdate {
  label?: string;
  description?: string | null;
  status?: 'todo' | 'doing' | 'done' | 'blocked';
  position_x?: number;
  position_y?: number;
  metadata?: Record<string, any>;
}

export interface TreeData {
  nodes: TreeNode[];
  edges: TreeEdge[];
}

// Nodes API endpoints
export const nodesApi = {
  /**
   * Get all nodes for a project
   */
  getProjectNodes: async (projectId: string): Promise<TreeNode[]> => {
    return apiClient.get<TreeNode[]>(`/nodes?project_id=${projectId}`);
  },

  /**
   * Get a single node by ID
   */
  getNode: async (id: string): Promise<TreeNode> => {
    return apiClient.get<TreeNode>(`/nodes/${id}`);
  },

  /**
   * Create a new node
   */
  createNode: async (data: NodeCreate): Promise<TreeNode> => {
    return apiClient.post<TreeNode>('/nodes', data);
  },

  /**
   * Update a node
   */
  updateNode: async (id: string, data: NodeUpdate): Promise<TreeNode> => {
    return apiClient.put<TreeNode>(`/nodes/${id}`, data);
  },

  /**
   * Delete a node
   */
  deleteNode: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/nodes/${id}`);
  },

  /**
   * Get complete tree structure for a project
   */
  getTree: async (projectId: string): Promise<TreeData> => {
    return apiClient.get<TreeData>(`/tree/${projectId}`);
  },

  /**
   * Save complete tree structure
   */
  saveTree: async (projectId: string, data: TreeData): Promise<void> => {
    return apiClient.post<void>(`/tree/${projectId}`, data);
  },
};

export default nodesApi;
