import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil, of } from 'rxjs';
import { User } from '../../models';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-new-chat-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
          <div class="search-container">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearchChange($event)"
              placeholder="Buscar usuario por nombre o email..."
              class="search-input"
              autocomplete="off"
            >
            @if (isSearching) {
              <div class="search-loading">Buscando...</div>
            }
          </div>
          <div class="user-list">
            @for (user of filteredUsers; track user.id) {
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
                @if (searchQuery.length > 0 && !isSearching) {
                  <p>No se encontraron usuarios</p>
                } @else if (searchQuery.length === 0) {
                  <p>Escribe para buscar usuarios</p>
                }
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
    .search-container {
      margin-bottom: 1rem;
      position: relative;
    }
    .search-input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid #e0e0e0;
      border-radius: 25px;
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
      box-sizing: border-box;
    }
    .search-input:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    .search-input::placeholder {
      color: #999;
    }
    .search-loading {
      position: absolute;
      right: 15px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.8rem;
      color: #667eea;
    }
    .user-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-height: 300px;
      overflow-y: auto;
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
export class NewChatModalComponent implements OnInit, OnDestroy {
  @Input() users: User[] = [];
  @Input() currentUserId?: string;
  @Output() close = new EventEmitter<void>();
  @Output() userSelected = new EventEmitter<User>();

  searchQuery = '';
  filteredUsers: User[] = [];
  isSearching = false;
  
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.setupSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query || query.trim().length === 0) {
          this.isSearching = false;
          return of([]);
        }
        this.isSearching = true;
        return this.userService.searchUsers(query);
      }),
      takeUntil(this.destroy$)
    ).subscribe(users => {
      this.filteredUsers = users.filter(u => u.id !== this.currentUserId);
      this.isSearching = false;
    });
  }

  onSearchChange(query: string): void {
    this.searchSubject.next(query);
  }

  selectUser(user: User): void {
    this.userSelected.emit(user);
  }
}
