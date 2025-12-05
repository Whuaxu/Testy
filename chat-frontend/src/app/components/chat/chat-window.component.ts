import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Conversation, Message, User, OnlineUser } from '../../models';
import { ConversationService } from '../../services/conversation.service';
import { WebSocketService } from '../../services/websocket.service';

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-window">
      <div class="chat-header">
        <div class="recipient-info">
          <div class="recipient-avatar" [class.online]="isOnline">
            {{ getOtherParticipantName().charAt(0).toUpperCase() }}
          </div>
          <div class="recipient-details">
            <span class="recipient-name">{{ getOtherParticipantName() }}</span>
            <span class="recipient-status">
              @if (typingUser) {
                {{ typingUser }} está escribiendo...
              } @else if (isOnline) {
                En línea
              } @else {
                Desconectado
              }
            </span>
          </div>
        </div>
      </div>

      <div class="messages-container" #messagesContainer>
        @for (message of messages; track message.id) {
          <div 
            class="message"
            [class.own]="message.senderId === currentUser?.id"
            [class.other]="message.senderId !== currentUser?.id"
          >
            <div class="message-content">
              <p>{{ message.content }}</p>
              <span class="message-time">{{ formatTime(message.createdAt) }}</span>
            </div>
          </div>
        } @empty {
          <div class="no-messages">
            <p>No hay mensajes aún</p>
            <p class="hint">Envía el primer mensaje</p>
          </div>
        }
      </div>

      <div class="message-input-container">
        <input
          type="text"
          [(ngModel)]="newMessage"
          (keyup.enter)="sendMessage()"
          (input)="onTyping()"
          placeholder="Escribe un mensaje..."
          class="message-input"
        >
        <button 
          class="send-button" 
          (click)="sendMessage()"
          [disabled]="!newMessage.trim()"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .chat-window {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .chat-header {
      padding: 1rem;
      background: white;
      border-bottom: 1px solid #e0e0e0;
    }
    .recipient-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .recipient-avatar {
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
      position: relative;
    }
    .recipient-avatar.online::after {
      content: '';
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 10px;
      height: 10px;
      background: #4CAF50;
      border-radius: 50%;
      border: 2px solid white;
    }
    .recipient-details {
      display: flex;
      flex-direction: column;
    }
    .recipient-name {
      font-weight: 500;
      color: #333;
    }
    .recipient-status {
      font-size: 0.8rem;
      color: #999;
    }
    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      background: #e5ddd5;
      background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    }
    .message {
      display: flex;
      margin-bottom: 0.75rem;
    }
    .message.own {
      justify-content: flex-end;
    }
    .message.other {
      justify-content: flex-start;
    }
    .message-content {
      max-width: 65%;
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
      position: relative;
    }
    .own .message-content {
      background: #dcf8c6;
      border-bottom-right-radius: 0;
    }
    .other .message-content {
      background: white;
      border-bottom-left-radius: 0;
    }
    .message-content p {
      margin: 0;
      word-wrap: break-word;
    }
    .message-time {
      display: block;
      font-size: 0.7rem;
      color: #999;
      text-align: right;
      margin-top: 0.25rem;
    }
    .no-messages {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #999;
    }
    .no-messages .hint {
      font-size: 0.85rem;
      margin-top: 0.5rem;
    }
    .message-input-container {
      display: flex;
      padding: 1rem;
      background: #f0f0f0;
      gap: 0.5rem;
    }
    .message-input {
      flex: 1;
      padding: 0.75rem 1rem;
      border: none;
      border-radius: 25px;
      font-size: 1rem;
      outline: none;
    }
    .send-button {
      width: 45px;
      height: 45px;
      border-radius: 50%;
      border: none;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s, opacity 0.2s;
    }
    .send-button:hover:not(:disabled) {
      transform: scale(1.05);
    }
    .send-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class ChatWindowComponent implements OnInit, OnDestroy, AfterViewChecked {
  @Input() conversation!: Conversation;
  @Input() currentUser: User | null = null;
  @Input() onlineUsers: OnlineUser[] = [];
  @Output() messageSent = new EventEmitter<string>();

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  messages: Message[] = [];
  newMessage = '';
  typingUser: string | null = null;
  isOnline = false;
  private shouldScrollToBottom = true;
  private destroy$ = new Subject<void>();
  private typingTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private conversationService: ConversationService,
    private wsService: WebSocketService
  ) {}

  ngOnInit(): void {
    this.loadMessages();
    this.setupWebSocketListeners();
    this.checkOnlineStatus();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
    }
  }

  private loadMessages(): void {
    this.conversationService.getMessages(this.conversation.id).subscribe({
      next: (messages) => {
        this.messages = messages;
        this.shouldScrollToBottom = true;
      },
      error: (error) => {
        console.error('Error loading messages:', error);
      }
    });
  }

  private setupWebSocketListeners(): void {
    this.wsService.newMessage$
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        if (message.conversationId === this.conversation.id) {
          this.messages.push(message);
          this.shouldScrollToBottom = true;
        }
      });

    this.wsService.typing$
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        if (data.conversationId === this.conversation.id && data.userId !== this.currentUser?.id) {
          this.typingUser = data.isTyping ? data.username : null;
        }
      });

    this.wsService.onlineUsers$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.checkOnlineStatus();
      });
  }

  private checkOnlineStatus(): void {
    const otherParticipantId = this.conversation.participantIds.find(
      id => id !== this.currentUser?.id
    );
    this.isOnline = this.onlineUsers.some(u => u.userId === otherParticipantId);
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop = 
        this.messagesContainer.nativeElement.scrollHeight;
      this.shouldScrollToBottom = false;
    } catch (err) {}
  }

  getOtherParticipantName(): string {
    if (this.conversation.name) return this.conversation.name;
    
    const otherParticipant = this.conversation.participants?.find(
      p => p.id !== this.currentUser?.id
    );
    return otherParticipant?.username || 'Usuario';
  }

  formatTime(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  }

  onTyping(): void {
    this.wsService.sendTyping(this.conversation.id, true);
    
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    
    this.typingTimeout = setTimeout(() => {
      this.wsService.sendTyping(this.conversation.id, false);
    }, 2000);
  }

  sendMessage(): void {
    const content = this.newMessage.trim();
    if (!content) return;

    this.messageSent.emit(content);
    this.newMessage = '';
    
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    this.wsService.sendTyping(this.conversation.id, false);
  }
}
