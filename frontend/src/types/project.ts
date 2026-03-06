/**
 * Project type definitions
 */

export interface Project {
  id: string;
  name: string;
  description: string;
  domain: string | null;
  tree_data: TreeData;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface TreeData {
  nodes: TreeNodeData[];
  edges: TreeEdgeData[];
}

export interface TreeNodeData {
  id: string;
  label: string;
  description: string | null;
  status: NodeStatus;
  position_x: number;
  position_y: number;
  parent_id: string | null;
  metadata: Record<string, any>;
}

export interface TreeEdgeData {
  id: string;
  source_id: string;
  target_id: string;
  label: string | null;
}

export type NodeStatus = 'todo' | 'doing' | 'done' | 'blocked';

export interface ProjectCreateInput {
  name: string;
  description?: string;
  domain?: string;
  tree_data?: TreeData;
}

export interface ProjectUpdateInput {
  name?: string;
  description?: string;
  domain?: string;
  tree_data?: TreeData;
}

export interface ProjectView {
  id: string;
  title: string;
  description: string;
  domain: string | null;
  createdAt: string;
  updatedAt: string;
  nodeCount: number;
  version: number;
}
