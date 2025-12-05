import { Routes } from '@angular/router';
import { LoginComponent } from './components/auth/login.component';
import { RegisterComponent } from './components/auth/register.component';
import { ChatComponent } from './components/chat/chat.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/chat', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'chat', component: ChatComponent, canActivate: [AuthGuard] },
  { path: 'chat/user/:userId', component: ChatComponent, canActivate: [AuthGuard] },
  { path: 'chat/conversation/:conversationId', component: ChatComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/chat' }
];
