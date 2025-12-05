import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <h2>Crear Cuenta</h2>
        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="username">Nombre de Usuario</label>
            <input 
              type="text" 
              id="username" 
              formControlName="username"
              placeholder="Tu nombre"
            >
            @if (registerForm.get('username')?.touched && registerForm.get('username')?.errors?.['required']) {
              <span class="error">El nombre es requerido</span>
            }
            @if (registerForm.get('username')?.touched && registerForm.get('username')?.errors?.['minlength']) {
              <span class="error">Mínimo 3 caracteres</span>
            }
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input 
              type="email" 
              id="email" 
              formControlName="email"
              placeholder="tu@email.com"
            >
            @if (registerForm.get('email')?.touched && registerForm.get('email')?.errors?.['required']) {
              <span class="error">El email es requerido</span>
            }
            @if (registerForm.get('email')?.touched && registerForm.get('email')?.errors?.['email']) {
              <span class="error">Email inválido</span>
            }
          </div>
          <div class="form-group">
            <label for="password">Contraseña</label>
            <input 
              type="password" 
              id="password" 
              formControlName="password"
              placeholder="••••••••"
            >
            @if (registerForm.get('password')?.touched && registerForm.get('password')?.errors?.['required']) {
              <span class="error">La contraseña es requerida</span>
            }
            @if (registerForm.get('password')?.touched && registerForm.get('password')?.errors?.['minlength']) {
              <span class="error">Mínimo 6 caracteres</span>
            }
          </div>
          @if (errorMessage) {
            <div class="error-message">{{ errorMessage }}</div>
          }
          <button type="submit" [disabled]="registerForm.invalid || loading">
            {{ loading ? 'Cargando...' : 'Registrarse' }}
          </button>
        </form>
        <p class="switch-auth">
          ¿Ya tienes cuenta? <a routerLink="/login">Inicia Sesión</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .auth-card {
      background: white;
      padding: 2rem;
      border-radius: 10px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      width: 100%;
      max-width: 400px;
    }
    h2 {
      text-align: center;
      color: #333;
      margin-bottom: 1.5rem;
    }
    .form-group {
      margin-bottom: 1rem;
    }
    label {
      display: block;
      margin-bottom: 0.5rem;
      color: #555;
      font-weight: 500;
    }
    input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 5px;
      font-size: 1rem;
      transition: border-color 0.3s;
      box-sizing: border-box;
    }
    input:focus {
      outline: none;
      border-color: #667eea;
    }
    .error {
      color: #e74c3c;
      font-size: 0.85rem;
      margin-top: 0.25rem;
      display: block;
    }
    .error-message {
      background: #ffeaea;
      color: #e74c3c;
      padding: 0.75rem;
      border-radius: 5px;
      margin-bottom: 1rem;
      text-align: center;
    }
    button {
      width: 100%;
      padding: 0.75rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 5px;
      font-size: 1rem;
      cursor: pointer;
      transition: transform 0.3s, box-shadow 0.3s;
    }
    button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }
    button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    .switch-auth {
      text-align: center;
      margin-top: 1rem;
      color: #666;
    }
    .switch-auth a {
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
    }
    .switch-auth a:hover {
      text-decoration: underline;
    }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        this.router.navigate(['/chat']);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Error al registrarse';
      }
    });
  }
}
