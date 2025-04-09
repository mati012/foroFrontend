import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterModule, FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  submitted = false;
  loading = false;
  errorMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.registerForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(4)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,20}$/)
      ]],
      confirmPassword: ['', Validators.required],
      role_id: [2] // Por defecto: rol de usuario normal
    }, {
      validator: this.mustMatch('password', 'confirmPassword')
    });
  }

  // Validador personalizado para hacer coincidir contraseña y confirmación
  mustMatch(controlName: string, matchingControlName: string) {
    return (formGroup: FormGroup) => {
      const control = formGroup.controls[controlName];
      const matchingControl = formGroup.controls[matchingControlName];

      if (matchingControl.errors && !matchingControl.errors['mustMatch']) {
        return;
      }

      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ mustMatch: true });
      } else {
        matchingControl.setErrors(null);
      }
    };
  }

  get f() { return this.registerForm.controls; }

  onSubmit(): void {
    this.submitted = true;

    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;

    // Verificar si el nombre de usuario ya existe
    this.authService.checkUsernameExists(this.f['username'].value).subscribe({
      next: exists => {
        if (exists) {
          this.errorMessage = 'Este nombre de usuario ya está en uso';
          this.loading = false;
          return;
        }

        // Verificar si el email ya existe
        this.authService.checkEmailExists(this.f['email'].value).subscribe({
          next: exists => {
            if (exists) {
              this.errorMessage = 'Este correo electrónico ya está en uso';
              this.loading = false;
              return;
            }

            // Si las validaciones pasan, registrar al usuario
            this.registerUser();
          },
          error: error => {
            this.errorMessage = 'Error al verificar el correo electrónico';
            this.loading = false;
          }
        });
      },
      error: error => {
        this.errorMessage = 'Error al verificar el nombre de usuario';
        this.loading = false;
      }
    });
  }

  private registerUser(): void {
    const { confirmPassword, ...userToRegister } = this.registerForm.value;
    
    this.authService.register(userToRegister).subscribe({
      next: response => {
        // Registro exitoso, redirigir a login
        this.router.navigate(['/auth/login'], { queryParams: { registered: true } });
      },
      error: error => {
        this.errorMessage = error.error || 'Error al registrar el usuario';
        this.loading = false;
      }
    });
  }
}