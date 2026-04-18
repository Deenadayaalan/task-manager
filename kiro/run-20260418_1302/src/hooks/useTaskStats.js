// src/hooks/useTaskStats.js
import { useMemo } from 'react';

export const useTaskStats = (tasks = []) => {
  const stats = useMemo(() => {
    const now = new Date();
    
    const total = tasks.length;
    const completed = tasks.filter(task => task.status === 'completed').length;
    const inProgress = tasks.filter(task => task.status === 'in-progress').length;
    const pending = tasks.filter(task => task.status === 'pending').length;
    const cancelled = tasks.filter(task => task.status === 'cancelled').length;
    
    const overdue = tasks.filter(task => {
      if (!task.dueDate || task.status === 'completed') return false;
      return new Date(task.dueDate) < now;
    }).length;
    
    const dueToday = tasks.filter(task => {
      if (!task.dueDate) return false;
      return new Date(task.dueDate).toDateString() === now.toDateString();
    }).length;
    
    const dueThisWeek = tasks.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return dueDate >= now && dueDate <= weekFromNow;
    }).length;
    
    const highPriority = tasks.filter(task => task.priority === 'high').length;
    const mediumPriority = tasks.filter(task => task.priority === 'medium').length;
    const lowPriority = tasks.filter(task => task.priority === 'low').length;
    
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Calculate productivity metrics
    const thisWeekStart = new Date(now.getTime() - (now.getDay() * 24 * 60 * 60 * 1000));
    const thisWeekCompleted = tasks.filter(task => {
      if (task.status !== 'completed' || !task.completedAt) return false;
      return new Date(task.completedAt) >= thisWeekStart;
    }).length;
    
    const lastWeekStart = new Date(thisWeekStart.getTime() - (7 * 24 * 60 * 60 * 1000));
    const lastWeekCompleted = tasks.filter(task => {
      if (task.status !== 'completed' || !task.completedAt) return false;
      const completedDate = new Date(task.completedAt);
      return completedDate >= lastWeekStart && completedDate < thisWeekStart;
    }).length;
    
    const weeklyTrend = lastWeekCompleted > 0 
      ? Math.round(((thisWeekCompleted - lastWeekCompleted) / lastWeekCompleted) * 100)
      : thisWeekCompleted > 0 ? 100 : 0;
    
    return {
      total,
      completed,
      inProgress,
      pending,
      cancelled,
      overdue,
      dueToday,
      dueThisWeek,
      highPriority,
      mediumPriority,
      lowPriority,
      completionRate,
      thisWeekCompleted,
      lastWeekCompleted,
      weeklyTrend
    };
  }, [tasks]);
  
  const chartData = useMemo(() => {
    return {
      statusDistribution: [
        { name: 'Completed', value: stats.completed, color: '#10B981' },
        { name: 'In Progress', value: stats.inProgress, color: '#3B82F6' },
        { name: 'Pending', value: stats.pending, color: '#F59E0B' },
        { name: 'Cancelled', value: stats.cancelled, color: '#EF4444' }
      ].filter(item => item.value > 0),
      
      priorityDistribution: [
        { name: 'High', value: stats.highPriority, color: '#EF4444' },
        { name: 'Medium', value: stats.mediumPriority, color: '#F59E0B' },
        { name: 'Low', value: stats.lowPriority, color: '#10B981' }
      ].filter(item => item.value > 0),
      
      dueDateDistribution: [
        { name: 'Overdue', value: stats.overdue, color: '#EF4444' },
        { name: 'Due Today', value: stats.dueToday, color: '#F59E0B' },
        { name: 'Due This Week', value: stats.dueThisWeek, color: '#3B82F6' }
      ].filter(item => item.value > 0)
    };
  }, [stats]);
  
  return {
    stats,
    chartData
  };
};