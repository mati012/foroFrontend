import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-recover-password',
  standalone: true,
  imports: [RouterModule, FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './recover-password.component.html',
  styleUrls: ['./recover-password.component.css']
})
export class RecoverPasswordComponent implements OnInit {
  recoverForm!: FormGroup;
  submitted = false;
  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(private formBuilder: FormBuilder) { }

  ngOnInit(): void {
    this.recoverForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get f() { return this.recoverForm.controls; }

  onSubmit(): void {
    this.submitted = true;
    
    if (this.recoverForm.invalid) {
      return;
    }
    
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    // Simulación de envío de correo de recuperación
    // En un sistema real, aquí se conectaría con el backend
    setTimeout(() => {
      this.successMessage = 'Se ha enviado un correo con instrucciones para restablecer su contraseña';
      this.loading = false;
    }, 1500);
  }
}