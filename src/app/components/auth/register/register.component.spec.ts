import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';

import { RegisterComponent } from './register.component';
import { AuthService } from '../../../services/auth.service';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    // Crear un spy para AuthService con todos los métodos que necesitamos
    const spy = jasmine.createSpyObj('AuthService', ['register', 'checkUsernameExists', 'checkEmailExists']);

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

    // Obtener instancias
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with empty fields and role.id = 2', () => {
    expect(component.registerForm).toBeDefined();
    expect(component.registerForm.get('username')?.value).toBe('');
    expect(component.registerForm.get('email')?.value).toBe('');
    expect(component.registerForm.get('password')?.value).toBe('');
    expect(component.registerForm.get('confirmPassword')?.value).toBe('');
    expect(component.registerForm.get('role.id')?.value).toBe(2);
  });

  it('should mark form as invalid when empty', () => {
    expect(component.registerForm.valid).toBeFalse();
  });

  it('should validate username as required and minLength', () => {
    const usernameControl = component.registerForm.get('username');
    
    // Empty username
    usernameControl?.setValue('');
    expect(usernameControl?.valid).toBeFalse();
    expect(usernameControl?.errors?.['required']).toBeTruthy();
    
    // Too short username
    usernameControl?.setValue('abc');
    expect(usernameControl?.valid).toBeFalse();
    expect(usernameControl?.errors?.['minlength']).toBeTruthy();
    
    // Valid username
    usernameControl?.setValue('validuser');
    expect(usernameControl?.valid).toBeTrue();
  });

  it('should validate email as required and with correct format', () => {
    const emailControl = component.registerForm.get('email');
    
    // Empty email
    emailControl?.setValue('');
    expect(emailControl?.valid).toBeFalse();
    expect(emailControl?.errors?.['required']).toBeTruthy();
    
    // Invalid email format
    emailControl?.setValue('invalid-email');
    expect(emailControl?.valid).toBeFalse();
    expect(emailControl?.errors?.['email']).toBeTruthy();
    
    // Valid email
    emailControl?.setValue('valid@example.com');
    expect(emailControl?.valid).toBeTrue();
  });

  it('should validate password with required constraints', () => {
    const passwordControl = component.registerForm.get('password');
    
    // Empty password
    passwordControl?.setValue('');
    expect(passwordControl?.valid).toBeFalse();
    expect(passwordControl?.errors?.['required']).toBeTruthy();
    
    // Too short password
    passwordControl?.setValue('short1!');
    expect(passwordControl?.valid).toBeFalse();
    expect(passwordControl?.errors?.['minlength']).toBeTruthy();
    
    // No numbers
    passwordControl?.setValue('Password!');
    expect(passwordControl?.valid).toBeFalse();
    expect(passwordControl?.errors?.['pattern']).toBeTruthy();
    
    // No special characters
    passwordControl?.setValue('Password123');
    expect(passwordControl?.valid).toBeFalse();
    expect(passwordControl?.errors?.['pattern']).toBeTruthy();
    
    // No letters
    passwordControl?.setValue('12345678!');
    expect(passwordControl?.valid).toBeFalse();
    expect(passwordControl?.errors?.['pattern']).toBeTruthy();
    
    // Valid password
    passwordControl?.setValue('ValidPass123!');
    expect(passwordControl?.valid).toBeTrue();
  });

  it('should validate password matching', () => {
    const passwordControl = component.registerForm.get('password');
    const confirmPasswordControl = component.registerForm.get('confirmPassword');
    
    // Set password
    passwordControl?.setValue('ValidPass123!');
    
    // Different confirm password
    confirmPasswordControl?.setValue('DifferentPass123!');
    
    // Trigger validation (normally this happens on form submission)
    component.onSubmit();
    
    expect(confirmPasswordControl?.errors?.['mustMatch']).toBeTrue();
    
    // Matching passwords
    confirmPasswordControl?.setValue('ValidPass123!');
    
    // Re-trigger validation
    component.onSubmit();
    
    expect(confirmPasswordControl?.errors).toBeNull();
  });

  it('should not submit if form is invalid', () => {
    // Keep form invalid
    component.registerForm.get('username')?.setValue('');
    
    component.onSubmit();
    
    expect(component.submitted).toBeTrue();
    expect(component.loading).toBeFalse();
    expect(authServiceSpy.checkUsernameExists).not.toHaveBeenCalled();
  });

  it('should check if username exists when form is valid', () => {
    // Set valid form values
    fillValidForm();
    
    // Mock username doesn't exist
    authServiceSpy.checkUsernameExists.and.returnValue(of(false));
    authServiceSpy.checkEmailExists.and.returnValue(of(false));
    authServiceSpy.register.and.returnValue(of({ success: true }));
    
    component.onSubmit();
    
    expect(component.submitted).toBeTrue();
    expect(component.loading).toBeTrue();
    expect(authServiceSpy.checkUsernameExists).toHaveBeenCalledWith('testuser');
  });

  it('should show error if username already exists', () => {
    // Set valid form values
    fillValidForm();
    
    // Mock username exists
    authServiceSpy.checkUsernameExists.and.returnValue(of(true));
    
    component.onSubmit();
    
    expect(component.loading).toBeFalse();
    expect(component.errorMessage).toBe('Este nombre de usuario ya está en uso');
    expect(authServiceSpy.checkEmailExists).not.toHaveBeenCalled();
  });

  it('should check if email exists when username check passes', () => {
    // Set valid form values
    fillValidForm();
    
    // Mock username doesn't exist but email check will happen
    authServiceSpy.checkUsernameExists.and.returnValue(of(false));
    authServiceSpy.checkEmailExists.and.returnValue(of(false));
    authServiceSpy.register.and.returnValue(of({ success: true }));
    
    component.onSubmit();
    
    expect(authServiceSpy.checkEmailExists).toHaveBeenCalledWith('test@example.com');
  });

  it('should show error if email already exists', () => {
    // Set valid form values
    fillValidForm();
    
    // Mock username doesn't exist but email exists
    authServiceSpy.checkUsernameExists.and.returnValue(of(false));
    authServiceSpy.checkEmailExists.and.returnValue(of(true));
    
    component.onSubmit();
    
    expect(component.loading).toBeFalse();
    expect(component.errorMessage).toBe('Este correo electrónico ya está en uso');
    expect(authServiceSpy.register).not.toHaveBeenCalled();
  });

  it('should register user when all validations pass', () => {
    // Set valid form values
    fillValidForm();
    
    // Mock all checks pass
    authServiceSpy.checkUsernameExists.and.returnValue(of(false));
    authServiceSpy.checkEmailExists.and.returnValue(of(false));
    authServiceSpy.register.and.returnValue(of({ success: true }));
    
    component.onSubmit();
    
    // Expected data to register (confirmPassword should be removed)
    const expectedRegisterData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!',
      role: { id: 2 }
    };
    
    expect(authServiceSpy.register).toHaveBeenCalledWith(expectedRegisterData);
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login'], { queryParams: { registered: true } });
  });

  it('should handle username check error', () => {
    // Set valid form values
    fillValidForm();
    
    // Mock username check error
    authServiceSpy.checkUsernameExists.and.returnValue(throwError(() => new Error('Error')));
    
    component.onSubmit();
    
    expect(component.loading).toBeFalse();
    expect(component.errorMessage).toBe('Error al verificar el nombre de usuario');
  });

  it('should handle email check error', () => {
    // Set valid form values
    fillValidForm();
    
    // Mock username check passes but email check fails
    authServiceSpy.checkUsernameExists.and.returnValue(of(false));
    authServiceSpy.checkEmailExists.and.returnValue(throwError(() => new Error('Error')));
    
    component.onSubmit();
    
    expect(component.loading).toBeFalse();
    expect(component.errorMessage).toBe('Error al verificar el correo electrónico');
  });

  it('should handle registration error', () => {
    // Set valid form values
    fillValidForm();
    
    // Mock checks pass but registration fails
    authServiceSpy.checkUsernameExists.and.returnValue(of(false));
    authServiceSpy.checkEmailExists.and.returnValue(of(false));
    authServiceSpy.register.and.returnValue(throwError(() => ({ error: 'Registration failed' })));
    
    component.onSubmit();
    
    expect(component.loading).toBeFalse();
    expect(component.errorMessage).toBe('Registration failed');
  });

  it('should handle registration error with no specific message', () => {
    // Set valid form values
    fillValidForm();
    
    // Mock checks pass but registration fails with no specific error
    authServiceSpy.checkUsernameExists.and.returnValue(of(false));
    authServiceSpy.checkEmailExists.and.returnValue(of(false));
    authServiceSpy.register.and.returnValue(throwError(() => ({})));
    
    component.onSubmit();
    
    expect(component.loading).toBeFalse();
    expect(component.errorMessage).toBe('Error al registrar el usuario');
  });

  it('should provide access to form controls via getter', () => {
    expect(component.f).toBe(component.registerForm.controls);
  });

  // Helper function to fill form with valid values
  function fillValidForm() {
    component.registerForm.get('username')?.setValue('testuser');
    component.registerForm.get('email')?.setValue('test@example.com');
    component.registerForm.get('password')?.setValue('Password123!');
    component.registerForm.get('confirmPassword')?.setValue('Password123!');
  }
});