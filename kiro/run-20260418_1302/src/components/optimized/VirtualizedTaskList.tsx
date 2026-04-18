// src/components/optimized/VirtualizedTaskList.tsx
import React, { useMemo, useCallback, memo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Task } from '../../types/Task';
import { usePerformanceMonitor } from '../../utils/performance';

interface VirtualizedTaskListProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskUpdate: (task: Task) => void;
  height: number;
  itemHeight: number;
}

const TaskItem = memo(({ index, style, data }: any) => {
  const { tasks, onTaskClick, onTaskUpdate } = data;
  const task = tasks[index];

  const handleClick = useCallback(() => {
    onTaskClick(task);
  }, [task, onTaskClick]);

  const handleStatusChange = useCallback((status: string) => {
    onTaskUpdate({ ...task, status });
  }, [task, onTaskUpdate]);

  return (
    <div style={style} className="task-item-wrapper">
      <div 
        className={`task-item ${task.priority}`}
        onClick={handleClick}
      >
        <div className="task-header">
          <h3>{task.title}</h3>
          <span className={`status ${task.status}`}>{task.status}</span>
        </div>
        <p className="task-description">{task.description}</p>
        <div className="task-actions">
          <select 
            value={task.status} 
            onChange={(e) => handleStatusChange(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          >
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
    </div>
  );
});

export const VirtualizedTaskList: React.FC<VirtualizedTaskListProps> = ({
  tasks,
  onTaskClick,
  onTaskUpdate,
  height,
  itemHeight
}) => {
  const { startTiming, endTiming } = usePerformanceMonitor();

  const itemData = useMemo(() => ({
    tasks,
    onTaskClick,
    onTaskUpdate
  }), [tasks, onTaskClick, onTaskUpdate]);

  const handleItemsRendered = useCallback(({ visibleStartIndex, visibleStopIndex }: any) => {
    const timingId = startTiming('task_list_render');
    // Simulate render completion
    setTimeout(() => endTiming(timingId), 0);
  }, [startTiming, endTiming]);

  return (
    <List
      height={height}
      itemCount={tasks.length}
      itemSize={itemHeight}
      itemData={itemData}
      onItemsRendered={handleItemsRendered}
    >
      {TaskItem}
    </List>
  );
};