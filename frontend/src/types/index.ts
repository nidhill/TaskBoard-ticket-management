export type UserRole = 'admin' | 'user';

export type TaskStatus = 'to_do' | 'in_progress' | 'in_review' | 'done';

export type TicketIssueType = 'change_request' | 'dev_bug';

export type TicketCategory = 'content' | 'design' | 'layout';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'rejected';

export type ProjectStatus = 'draft' | 'pending' | 'approved' | 'active' | 'on_hold' | 'completed' | 'cancelled';

export interface User {
  _id: string; // Backend uses _id
  id?: string; // Optional alias
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatar_url?: string; // Backend uses avatar_url
  avatar?: string; // Legacy support
}

export interface Project {
  _id: string;
  id?: string;
  name: string;
  description?: string;
  members?: {
    user: User;
    role: 'developer' | 'designer' | 'manager' | 'qa' | 'other';
  }[];
  clientName: string;
  startDate: string;
  deliveryDate: string;
  status: ProjectStatus;
  createdBy: any; // Populated user or string ID
  assignedTo?: any; // Populated user or string ID
  department?: string;
  tasksCount: number;
  completedTasks: number;
  totalTickets: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  _id: string;
  id?: string;
  projectId: any; // Populated or ID
  taskName: string;
  assignedDeveloper?: User;
  status: TaskStatus;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  startDate?: string;
  dueDate?: string;
  ticketUsed: number;
  maxTickets: number;
  approvalReference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  name: string;
  url: string;
  type: string;
}

export interface Comment {
  _id: string;
  ticketId: string;
  userId: User;
  text: string;
  attachments?: Attachment[];
  createdAt: string;
}

export interface Ticket {
  _id: string;
  id?: string;
  taskId: any;
  requestedBy: User;
  issueType: string; // Using string to be flexible or TicketIssueType
  category: string; // TicketCategory
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: TicketStatus;
  approvalReference?: string;
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: string;
}

export interface AuditLogEntry {
  _id: string;
  userId: User;
  action: string;
  details: string;
  resourceId?: string;
  resourceType?: string;
  ipAddress?: string;
  createdAt: string;
}
