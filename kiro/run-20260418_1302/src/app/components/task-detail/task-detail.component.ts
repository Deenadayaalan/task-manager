// src/app/components/task-detail/task-detail.component.ts (Angular - Reference)
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Task, TaskStatus, TaskPriority } from '../../models/task.model';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-task-detail',
  templateUrl: './task-detail.component.html',
  styleUrls: ['./task-detail.component.scss']
})
export class TaskDetailComponent implements OnInit {
  @Input() task: Task | null = null;
  @Input() isEditing: boolean = false;
  @Output() taskUpdated = new EventEmitter<Task>();
  @Output() taskDeleted = new EventEmitter<string>();
  @Output() closeDetail = new EventEmitter<void>();

  editForm: Task = {} as Task;
  isLoading = false;
  error: string | null = null;

  constructor(private taskService: TaskService) {}

  ngOnInit() {
    if (this.task) {
      this.editForm = { ...this.task };
    }
  }

  onEdit() {
    this.isEditing = true;
    this.editForm = { ...this.task! };
  }

  onSave() {
    if (this.editForm && this.task) {
      this.isLoading = true;
      this.taskService.updateTask(this.task.id, this.editForm).subscribe({
        next: (updatedTask) => {
          this.task = updatedTask;
          this.isEditing = false;
          this.isLoading = false;
          this.taskUpdated.emit(updatedTask);
        },
        error: (error) => {
          this.error = error.message;
          this.isLoading = false;
        }
      });
    }
  }

  onDelete() {
    if (this.task && confirm('Are you sure you want to delete this task?')) {
      this.isLoading = true;
      this.taskService.deleteTask(this.task.id).subscribe({
        next: () => {
          this.taskDeleted.emit(this.task!.id);
          this.isLoading = false;
        },
        error: (error) => {
          this.error = error.message;
          this.isLoading = false;
        }
      });
    }
  }

  onCancel() {
    this.isEditing = false;
    this.editForm = { ...this.task! };
    this.error = null;
  }

  onClose() {
    this.closeDetail.emit();
  }
}