import React from 'react';
import { Button } from '../common/Button';
import { Icon } from '../common/Icon';
import './AddTaskButton.scss';

interface AddTaskButtonProps {
  onClick: () => void;
  className?: string;
}

export const AddTaskButton: React.FC<AddTaskButtonProps> = ({
  onClick,
  className
}) => {
  return (
    <Button
      variant="dashed"
      onClick={onClick}
      className={`add-task-button ${className || ''}`}
      fullWidth
    >
      <Icon name="plus" size="sm" />
      Add Task
    </Button>
  );
};