import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '../../models';

@Component({
  selector: 'app-new-chat-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="close.emit()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Nueva Conversación</h3>
          <button class="close-btn" (click)="close.emit()">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p class="subtitle">Selecciona un usuario para chatear</p>
          <div class="user-list">
            @for (user of availableUsers; track user.id) {
              <div 
                class="user-item"
                (click)="selectUser(user)"
              >
                <div class="user-avatar">
                  {{ user.username.charAt(0).toUpperCase() }}
                </div>
                <div class="user-info">
                  <span class="user-name">{{ user.username }}</span>
                  <span class="user-email">{{ user.email }}</span>
                </div>
              </div>
            } @empty {
              <div class="no-users">
                <p>No hay otros usuarios disponibles</p>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal-content {
      background: white;
      border-radius: 10px;
      width: 100%;
      max-width: 400px;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid #e0e0e0;
    }
    .modal-header h3 {
      margin: 0;
      color: #333;
    }
    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #999;
      padding: 0.25rem;
    }
    .close-btn:hover {
      color: #333;
    }
    .modal-body {
      padding: 1rem;
      overflow-y: auto;
    }
    .subtitle {
      color: #666;
      margin-bottom: 1rem;
      text-align: center;
    }
    .user-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .user-item {
      display: flex;
      align-items: center;
      padding: 0.75rem;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .user-item:hover {
      background: #f5f5f5;
    }
    .user-avatar {
      width: 45px;
      height: 45px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 1.1rem;
      margin-right: 0.75rem;
    }
    .user-info {
      display: flex;
      flex-direction: column;
    }
    .user-name {
      font-weight: 500;
      color: #333;
    }
    .user-email {
      font-size: 0.85rem;
      color: #999;
    }
    .no-users {
      text-align: center;
      color: #999;
      padding: 2rem;
    }
  `]
})
export class NewChatModalComponent {
  @Input() users: User[] = [];
  @Input() currentUserId?: string;
  @Output() close = new EventEmitter<void>();
  @Output() userSelected = new EventEmitter<User>();

  get availableUsers(): User[] {
    return this.users.filter(u => u.id !== this.currentUserId);
  }

  selectUser(user: User): void {
    this.userSelected.emit(user);
  }
}
