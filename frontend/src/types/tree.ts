/**
 * Tree view type definitions
 */

import { Node, Edge } from '@xyflow/react';

export interface TreeViewMode {
  type: 'tree' | 'mindmap' | 'outline';
}

export interface TreeHistory {
  past: TreeState[];
  present: TreeState;
  future: TreeState[];
}

export interface TreeState {
  nodes: Node[];
  edges: Edge[];
  timestamp: number;
}

export interface TreeExportOptions {
  format: 'pdf' | 'markdown' | 'json' | 'png' | 'svg';
  scope: 'all' | 'branch' | 'selected';
  selectedNodeId?: string;
  includeMetadata?: boolean;
}

export interface TreeSuggestion {
  type: 'add' | 'modify' | 'delete' | 'restructure';
  message: string;
  target_node_id?: string;
  suggested_content?: any;
  priority: 'high' | 'medium' | 'low';
}

export interface TreeValidation {
  is_valid: boolean;
  completeness_score: number;
  issues: TreeIssue[];
  suggestions: TreeSuggestion[];
}

export interface TreeIssue {
  type: 'missing_children' | 'empty_content' | 'orphan_node' | 'too_deep';
  message: string;
  node_id?: string;
  severity: 'error' | 'warning' | 'info';
}
