import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Conversation, OnlineUser } from '../../models';

@Component({
  selector: 'app-conversation-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="conversation-list">
      @for (conversation of conversations; track conversation.id) {
        <div 
          class="conversation-item"
          [class.selected]="conversation.id === selectedConversationId"
          (click)="selectConversation(conversation)"
        >
          <div class="conversation-avatar" [class.online]="isParticipantOnline(conversation)">
            {{ getOtherParticipantName(conversation).charAt(0).toUpperCase() }}
          </div>
          <div class="conversation-info">
            <div class="conversation-header">
              <span class="conversation-name">{{ getOtherParticipantName(conversation) }}</span>
              @if (conversation.lastMessage) {
                <span class="conversation-time">{{ formatTime(conversation.lastMessage.createdAt) }}</span>
              }
            </div>
            @if (conversation.lastMessage) {
              <div class="last-message">
                {{ conversation.lastMessage.content | slice:0:40 }}{{ conversation.lastMessage.content.length > 40 ? '...' : '' }}
              </div>
            } @else {
              <div class="last-message empty">Sin mensajes</div>
            }
          </div>
        </div>
      } @empty {
        <div class="empty-list">
          <p>No tienes conversaciones</p>
          <p class="hint">Inicia una nueva conversación</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .conversation-list {
      flex: 1;
      overflow-y: auto;
    }
    .conversation-item {
      display: flex;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
      transition: background 0.2s;
    }
    .conversation-item:hover {
      background: #f5f5f5;
    }
    .conversation-item.selected {
      background: #e8e8e8;
    }
    .conversation-avatar {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 1.2rem;
      margin-right: 0.75rem;
      flex-shrink: 0;
      position: relative;
    }
    .conversation-avatar.online::after {
      content: '';
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 12px;
      height: 12px;
      background: #4CAF50;
      border-radius: 50%;
      border: 2px solid white;
    }
    .conversation-info {
      flex: 1;
      min-width: 0;
    }
    .conversation-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.25rem;
    }
    .conversation-name {
      font-weight: 500;
      color: #333;
    }
    .conversation-time {
      font-size: 0.75rem;
      color: #999;
    }
    .last-message {
      font-size: 0.85rem;
      color: #666;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .last-message.empty {
      color: #999;
      font-style: italic;
    }
    .empty-list {
      padding: 2rem;
      text-align: center;
      color: #999;
    }
    .empty-list p {
      margin-bottom: 0.5rem;
    }
    .empty-list .hint {
      font-size: 0.85rem;
    }
  `]
})
export class ConversationListComponent {
  @Input() conversations: Conversation[] = [];
  @Input() selectedConversationId?: string;
  @Input() currentUserId?: string;
  @Input() onlineUsers: OnlineUser[] = [];
  @Output() conversationSelected = new EventEmitter<Conversation>();

  selectConversation(conversation: Conversation): void {
    this.conversationSelected.emit(conversation);
  }

  getOtherParticipantName(conversation: Conversation): string {
    if (conversation.name) return conversation.name;
    
    const otherParticipant = conversation.participants?.find(
      p => p.id !== this.currentUserId
    );
    return otherParticipant?.username || 'Usuario';
  }

  isParticipantOnline(conversation: Conversation): boolean {
    const otherParticipantId = conversation.participantIds.find(
      id => id !== this.currentUserId
    );
    return this.onlineUsers.some(u => u.userId === otherParticipantId);
  }

  formatTime(date: Date | string): string {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Ayer';
    } else if (days < 7) {
      return d.toLocaleDateString('es', { weekday: 'short' });
    } else {
      return d.toLocaleDateString('es', { day: 'numeric', month: 'short' });
    }
  }
}
