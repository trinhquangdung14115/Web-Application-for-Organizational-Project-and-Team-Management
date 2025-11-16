import React from 'react'; 
import { 
    ClockIcon as ClockSolid,
    ArrowPathIcon as ProgressSolid, 
    CheckCircleIcon as DoneSolid,
    ClipboardDocumentListIcon as TotalSolid, 
    ExclamationTriangleIcon as WarningSolid, 
} from '@heroicons/react/24/solid';
// Mock cho các thẻ Kanban (trang MyTasks)
export const mockKanbanTasks = [
    { id: 't1', title: 'Design new landing page wireframes for mobile responsive layout', status: 'Backlog', priority: 'High', due: 'Dec 15', project: 'Website Redesign', assignee: 'SC' },
    { id: 't2', title: 'Research competitor pricing models', status: 'Backlog', priority: 'Medium', due: 'Dec 18', project: 'Marketing Campaign', assignee: 'MJ' },
    { id: 't3', title: 'Set up analytics tracking', status: 'Backlog', priority: 'Low', due: 'Dec 20', project: 'Website Redesign', assignee: 'AR' },
    { id: 't4', title: 'Implement user authentication flow', status: 'Todo', priority: 'High', due: 'Dec 14', project: 'Mobile App', assignee: 'DK' },
    { id: 't5', title: 'Write comprehensive API documentation', status: 'Todo', priority: 'Medium', due: 'Dec 16', project: 'API Integration', assignee: 'LW', dueSoon: true },
    { id: 't6', title: 'Design mobile app icons', status: 'Todo', priority: 'Low', due: 'Dec 19', project: 'Mobile App', assignee: 'SC' },
    { id: 't7', title: 'Build responsive navigation component', status: 'In Progress', priority: 'High', due: 'Dec 13', project: 'Website Redesign', assignee: 'AR' },
    { id: 't8', title: 'Conduct user interviews', status: 'In Progress', priority: 'Medium', due: 'Dec 17', project: 'User Research', assignee: 'ED' },
    { id: 't9',  title: 'Set up project repository', status: 'Done', priority: 'Medium', due: 'Dec 8',  project: 'API Integration', assignee: 'AR' },
    { id: 't10', title: 'Create brand guidelines', status: 'Done', priority: 'Low',    due: 'Dec 10', project: 'Marketing Campaign', assignee: 'MJ' },
    { id: 't11', title: 'Design system color tokens', status: 'Done', priority: 'Medium', due: 'Dec 11', project: 'Website Redesign', assignee: 'SC' },
];