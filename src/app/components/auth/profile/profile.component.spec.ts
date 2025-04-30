import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { ProfileComponent } from './profile.component';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  
  // Mock de un usuario para las pruebas
  const mockUser: User = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com'
  };

  beforeEach(async () => {
    // Crear un spy para el AuthService con todos los métodos que necesitamos
    const spy = jasmine.createSpyObj('AuthService', ['updateProfile'], {
      // Propiedades simuladas
      currentUserValue: mockUser
    });

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        ReactiveFormsModule,
        FormsModule
      ],
      providers: [
        { provide: AuthService, useValue: spy }
      ]
    }).compileComponents();

    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with current user data', () => {
    expect(component.currentUser).toEqual(mockUser);
    expect(component.profileForm.get('username')?.value).toBe('testuser');
    expect(component.profileForm.get('email')?.value).toBe('test@example.com');
    expect(component.profileForm.get('currentPassword')?.value).toBe('');
    expect(component.profileForm.get('newPassword')?.value).toBe('');
    expect(component.profileForm.get('confirmPassword')?.value).toBe('');
  });

  it('should mark form as invalid when email is invalid', () => {
    component.profileForm.get('email')?.setValue('invalid-email');
    expect(component.profileForm.get('email')?.valid).toBeFalse();
    expect(component.profileForm.valid).toBeFalse();
  });

  it('should mark form as invalid when username is too short', () => {
    component.profileForm.get('username')?.setValue('usr');
    expect(component.profileForm.get('username')?.valid).toBeFalse();
    expect(component.profileForm.valid).toBeFalse();
  });

  it('should mark form as valid when only updating username and email', () => {
    component.profileForm.get('username')?.setValue('newusername');
    component.profileForm.get('email')?.setValue('new@example.com');
    expect(component.profileForm.valid).toBeTrue();
  });

  it('should require current password when attempting to change password', () => {
    component.profileForm.get('newPassword')?.setValue('NewPass123!');
    component.profileForm.get('confirmPassword')?.setValue('NewPass123!');
    
    // Trigger validation
    component.onSubmit();
    
    expect(component.profileForm.get('currentPassword')?.errors?.['required']).toBeTrue();
    expect(component.profileForm.valid).toBeFalse();
  });

  it('should validate password complexity requirements', () => {
    // Password without special character
    component.profileForm.get('currentPassword')?.setValue('oldpass123');
    component.profileForm.get('newPassword')?.setValue('newpass123');
    component.profileForm.get('confirmPassword')?.setValue('newpass123');
    
    expect(component.profileForm.get('newPassword')?.valid).toBeFalse();
    
    // Password without number
    component.profileForm.get('newPassword')?.setValue('newpass!@#');
    component.profileForm.get('confirmPassword')?.setValue('newpass!@#');
    
    expect(component.profileForm.get('newPassword')?.valid).toBeFalse();
    
    // Password too short
    component.profileForm.get('newPassword')?.setValue('Np1!');
    component.profileForm.get('confirmPassword')?.setValue('Np1!');
    
    expect(component.profileForm.get('newPassword')?.valid).toBeFalse();
    
    // Valid password
    component.profileForm.get('newPassword')?.setValue('NewPass123!');
    component.profileForm.get('confirmPassword')?.setValue('NewPass123!');
    
    expect(component.profileForm.get('newPassword')?.valid).toBeTrue();
  });

  it('should validate password matching', () => {
    component.profileForm.get('currentPassword')?.setValue('oldpass123');
    component.profileForm.get('newPassword')?.setValue('NewPass123!');
    component.profileForm.get('confirmPassword')?.setValue('DifferentPass123!');
    
    // Trigger validation
    component.onSubmit();
    
    expect(component.profileForm.get('confirmPassword')?.errors?.['mustMatch']).toBeTrue();
    
    // Fix the matching passwords
    component.profileForm.get('confirmPassword')?.setValue('NewPass123!');
    
    // Manually trigger the validator since we're not calling onSubmit again
    (component as any).passwordMatchValidator(component.profileForm);
    
    expect(component.profileForm.get('confirmPassword')?.errors?.['mustMatch']).toBeFalsy();
  });

  it('should not submit if form is invalid', () => {
    // Make the form invalid
    component.profileForm.get('email')?.setValue('invalid-email');
    
    component.onSubmit();
    
    expect(component.submitted).toBeTrue();
    expect(authServiceSpy.updateProfile).not.toHaveBeenCalled();
  });

  



  it('should handle error when updating profile', () => {
    // Setup form with new values
    component.profileForm.get('username')?.setValue('newusername');
    component.profileForm.get('email')?.setValue('new@example.com');
    
    // Setup spy to return error
    const errorResponse = { status: 400, error: 'Username already taken' };
    authServiceSpy.updateProfile.and.returnValue(throwError(() => errorResponse));
    
    component.onSubmit();
    
    expect(component.loading).toBeFalse();
    expect(component.errorMessage).toBe('Username already taken');
    expect(component.successMessage).toBe('');
  });

  it('should handle generic error when updating profile', () => {
    // Setup form with new values
    component.profileForm.get('username')?.setValue('newusername');
    component.profileForm.get('email')?.setValue('new@example.com');
    
    // Setup spy to return error without specific message
    authServiceSpy.updateProfile.and.returnValue(throwError(() => ({ status: 500 })));
    
    component.onSubmit();
    
    expect(component.loading).toBeFalse();
    expect(component.errorMessage).toBe('Error al actualizar el perfil');
  });

  it('should provide access to form controls via getter', () => {
    expect(component.f).toBe(component.profileForm.controls);
  });




});