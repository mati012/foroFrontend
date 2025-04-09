import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [RouterModule, FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  currentUser: User | null = null;
  submitted = false;
  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    
    this.profileForm = this.formBuilder.group({
      username: [this.currentUser?.username, [Validators.required, Validators.minLength(4)]],
      email: [this.currentUser?.email, [Validators.required, Validators.email]],
      // Opcional: cambiar contraseña
      currentPassword: [''],
      newPassword: ['', [
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[0-9])(?=.*[a-zA-Z])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,20}$/)
      ]],
      confirmPassword: ['']
    }, {
      validator: this.passwordMatchValidator
    });
  }

  // Validador personalizado para contraseñas
  passwordMatchValidator(formGroup: FormGroup) {
    const newPassword = formGroup.get('newPassword')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;
    
    // Solo validar si se está intentando cambiar la contraseña
    if (newPassword) {
      // Verificar que la contraseña actual no esté vacía
      if (!formGroup.get('currentPassword')?.value) {
        formGroup.get('currentPassword')?.setErrors({ required: true });
      }
      
      // Verificar que las contraseñas coincidan
      if (newPassword !== confirmPassword) {
        formGroup.get('confirmPassword')?.setErrors({ mustMatch: true });
      } else {
        // Si las contraseñas coinciden, limpiar el error específico de mustMatch
        const errors = formGroup.get('confirmPassword')?.errors;
        if (errors) {
          delete errors['mustMatch'];
          formGroup.get('confirmPassword')?.setErrors(Object.keys(errors).length ? errors : null);
        }
      }
    }
  }

  get f() { return this.profileForm.controls; }

  onSubmit(): void {
    this.submitted = true;
    
    if (this.profileForm.invalid || !this.currentUser) {
      return;
    }
    
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    // Preparar datos para actualizar
    const updateData: User = {
      id: this.currentUser.id,
      username: this.f['username'].value,
      email: this.f['email'].value
    };
    
    // Si se está cambiando la contraseña, incluirla
    if (this.f['newPassword'].value) {
      updateData.password = this.f['newPassword'].value;
    }
    
    // Enviar actualización al servicio
    this.authService.updateProfile(this.currentUser.id!, updateData).subscribe({
      next: updatedUser => {
        this.successMessage = 'Perfil actualizado con éxito';
        this.loading = false;
        
        // Limpiar campos de contraseña
        this.f['currentPassword'].setValue('');
        this.f['newPassword'].setValue('');
        this.f['confirmPassword'].setValue('');
        this.submitted = false;
      },
      error: error => {
        this.errorMessage = error.error || 'Error al actualizar el perfil';
        this.loading = false;
      }
    });
  }
}