// src/components/TaskList/TaskList.tsx
import React, { useMemo, useCallback, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  TextField,
  InputAdornment
} from '@mui/material';
import { Edit, Delete, Search } from '@mui/icons-material';
import { VirtualList, MemoizedListItem } from '../VirtualList/VirtualList';
import { useTaskService } from '../../hooks/useTaskService';
import { usePerformance, useDebounce } from '../../hooks/usePerformance';
import { Task } from '../../types/task';

const TaskList: React.FC = () => {
  const { tasks, loading, deleteTask, hasNextPage, loadNextPage } = useTaskService();
  const { measureAsync, measureSync } = usePerformance('TaskList');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Memoized filtered tasks
  const filteredTasks = useMemo(() => {
    if (!debouncedSearchTerm) return tasks;
    
    return measureSync(() => {
      return tasks.filter(task =>
        task.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }, 'filter-tasks');
  }, [tasks, debouncedSearchTerm, measureSync]);

  const handleDelete = useCallback(async (taskId: string) => {
    await measureAsync(
      () => deleteTask(taskId),
      'delete-task'
    );
  }, [deleteTask, measureAsync]);

  const handleEdit = useCallback((taskId: string) => {
    // Navigate to edit form
    console.log('Edit task:', taskId);
  }, []);

  const renderTaskItem = useCallback((task: Task, index: number, style: React.CSSProperties) => {
    return (
      <MemoizedListItem key={task.id} itemId={task.id}>
        <div style={{ ...style, padding: '8px' }}>
          <Card elevation={1}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box flex={1}>
                  <Typography variant="h6" gutterBottom>
                    {task.title}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    {task.description}
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Chip
                      label={task.status}
                      color={task.status === 'completed' ? 'success' : 'default'}
                      size="small"
                    />
                    <Chip
                      label={task.priority}
                      color={
                        task.priority === 'high' ? 'error' :
                        task.priority === 'medium' ? 'warning' : 'default'
                      }
                      size="small"
                    />
                  </Box>
                </Box>
                <Box>
                  <IconButton
                    size="small"
                    onClick={() => handleEdit(task.id)}
                    aria-label="Edit task"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(task.id)}
                    aria-label="Delete task"
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </div>
      </MemoizedListItem>
    );
  }, [handleEdit, handleDelete]);

  return (
    <Box>
      <Box mb={2}>
        <TextField
          fullWidth
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      <VirtualList
        items={filteredTasks}
        itemHeight={200}
        renderItem={renderTaskItem}
        height={600}
        loading={loading}
        hasNextPage={hasNextPage}
        loadNextPage={loadNextPage}
        overscan={3}
      />
    </Box>
  );
};

export default React.memo(TaskList);