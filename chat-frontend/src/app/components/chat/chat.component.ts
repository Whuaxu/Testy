import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ConversationService } from '../../services/conversation.service';
import { UserService } from '../../services/user.service';
import { WebSocketService } from '../../services/websocket.service';
import { User, Conversation, OnlineUser } from '../../models';
import { ConversationListComponent } from './conversation-list.component';
import { ChatWindowComponent } from './chat-window.component';
import { NewChatModalComponent } from './new-chat-modal.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, ConversationListComponent, ChatWindowComponent, NewChatModalComponent],
  template: `
    <div class="chat-container">
      <div class="sidebar">
        <div class="sidebar-header">
          <div class="user-info">
            <div class="avatar">{{ getUserInitial() }}</div>
            <span class="username">{{ currentUser?.username }}</span>
          </div>
          <div class="header-actions">
            <button class="new-chat-btn" (click)="showNewChatModal = true" title="Nueva conversación">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </button>
            <button class="logout-btn" (click)="logout()" title="Cerrar sesión">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
        <app-conversation-list
          [conversations]="conversations"
          [selectedConversationId]="selectedConversation?.id"
          [currentUserId]="currentUser?.id"
          [onlineUsers]="onlineUsers"
          (conversationSelected)="onConversationSelected($event)"
        />
      </div>
      <div class="main-content">
        @if (selectedConversation) {
          <app-chat-window
            [conversation]="selectedConversation"
            [currentUser]="currentUser"
            [onlineUsers]="onlineUsers"
            (messageSent)="onMessageSent($event)"
          />
        } @else {
          <div class="no-conversation">
            <div class="empty-state">
              <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <h3>Selecciona una conversación</h3>
              <p>O inicia una nueva conversación con el botón +</p>
            </div>
          </div>
        }
      </div>
    </div>

    @if (showNewChatModal) {
      <app-new-chat-modal
        [users]="availableUsers"
        [currentUserId]="currentUser?.id"
        (close)="showNewChatModal = false"
        (userSelected)="startNewChat($event)"
      />
    }
  `,
  styles: [`
    .chat-container {
      display: flex;
      height: 100vh;
      background: #f0f2f5;
    }
    .sidebar {
      width: 350px;
      background: white;
      border-right: 1px solid #e0e0e0;
      display: flex;
      flex-direction: column;
    }
    .sidebar-header {
      padding: 1rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .user-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: white;
      color: #667eea;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 1.2rem;
    }
    .username {
      color: white;
      font-weight: 500;
    }
    .header-actions {
      display: flex;
      gap: 0.5rem;
    }
    .new-chat-btn, .logout-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      border-radius: 50%;
      width: 36px;
      height: 36px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      transition: background 0.3s;
    }
    .new-chat-btn:hover, .logout-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .no-conversation {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .empty-state {
      text-align: center;
      color: #999;
    }
    .empty-state svg {
      opacity: 0.5;
      margin-bottom: 1rem;
    }
    .empty-state h3 {
      margin-bottom: 0.5rem;
      color: #666;
    }
    .empty-state p {
      font-size: 0.9rem;
    }
  `]
})
export class ChatComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  conversations: Conversation[] = [];
  selectedConversation: Conversation | null = null;
  availableUsers: User[] = [];
  onlineUsers: OnlineUser[] = [];
  showNewChatModal = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private conversationService: ConversationService,
    private userService: UserService,
    private wsService: WebSocketService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadConversations();
    this.loadUsers();
    this.setupWebSocket();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.selectedConversation) {
      this.wsService.leaveConversation(this.selectedConversation.id);
    }
    this.wsService.disconnect();
  }

  private setupWebSocket(): void {
    this.wsService.connect();
    
    this.wsService.onlineUsers$
      .pipe(takeUntil(this.destroy$))
      .subscribe(users => {
        this.onlineUsers = users;
      });

    this.wsService.newMessage$
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        // Update conversation list with new message
        const convIndex = this.conversations.findIndex(c => c.id === message.conversationId);
        if (convIndex > -1) {
          this.conversations[convIndex].lastMessage = message;
          this.conversations[convIndex].updatedAt = message.createdAt;
          // Move to top
          const conv = this.conversations.splice(convIndex, 1)[0];
          this.conversations.unshift(conv);
        }
      });

    this.wsService.messageNotification$
      .pipe(takeUntil(this.destroy$))
      .subscribe(({ conversationId, message }) => {
        // Update conversation in list if not currently viewing it
        const convIndex = this.conversations.findIndex(c => c.id === conversationId);
        if (convIndex > -1) {
          this.conversations[convIndex].lastMessage = message;
          this.conversations[convIndex].updatedAt = message.createdAt;
        }
      });
  }

  private loadConversations(): void {
    this.conversationService.getConversations().subscribe({
      next: (conversations) => {
        this.conversations = conversations;
      },
      error: (error) => {
        console.error('Error loading conversations:', error);
      }
    });
  }

  private loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.availableUsers = users;
      },
      error: (error) => {
        console.error('Error loading users:', error);
      }
    });
  }

  onConversationSelected(conversation: Conversation): void {
    if (this.selectedConversation) {
      this.wsService.leaveConversation(this.selectedConversation.id);
    }
    this.selectedConversation = conversation;
    this.wsService.joinConversation(conversation.id);
  }

  onMessageSent(content: string): void {
    if (!this.selectedConversation) return;
    
    this.conversationService.sendMessage(this.selectedConversation.id, content).subscribe({
      next: (message) => {
        // Message will be received via WebSocket
      },
      error: (error) => {
        console.error('Error sending message:', error);
      }
    });
  }

  startNewChat(user: User): void {
    this.showNewChatModal = false;
    
    this.conversationService.createConversation(user.id).subscribe({
      next: (conversation) => {
        // Add to conversations list if not exists
        const exists = this.conversations.find(c => c.id === conversation.id);
        if (!exists) {
          // Enrich with participant info
          conversation.participants = [this.currentUser!, user];
          this.conversations.unshift(conversation);
        }
        // Select the conversation
        this.onConversationSelected(conversation);
      },
      error: (error) => {
        console.error('Error creating conversation:', error);
      }
    });
  }

  getUserInitial(): string {
    return this.currentUser?.username?.charAt(0).toUpperCase() || '?';
  }

  logout(): void {
    this.wsService.disconnect();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
