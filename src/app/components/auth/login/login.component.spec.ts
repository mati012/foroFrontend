import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../services/auth.service';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    // Crear un spy para el AuthService
    const spy = jasmine.createSpyObj('AuthService', ['login']);

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        ReactiveFormsModule,
        FormsModule,
        CommonModule
      ],
      providers: [
        { provide: AuthService, useValue: spy }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with empty fields', () => {
    expect(component.loginForm.get('username')?.value).toBe('');
    expect(component.loginForm.get('password')?.value).toBe('');
    expect(component.submitted).toBeFalse();
    expect(component.loading).toBeFalse();
    expect(component.errorMessage).toBe('');
  });

  it('should mark form as invalid when empty', () => {
    expect(component.loginForm.valid).toBeFalse();
  });

  it('should mark username as invalid when empty', () => {
    const usernameControl = component.loginForm.get('username');
    expect(usernameControl?.valid).toBeFalse();
    expect(usernameControl?.errors?.['required']).toBeTruthy();
  });

  it('should mark password as invalid when empty', () => {
    const passwordControl = component.loginForm.get('password');
    expect(passwordControl?.valid).toBeFalse();
    expect(passwordControl?.errors?.['required']).toBeTruthy();
  });

  it('should mark form as valid when all fields are filled', () => {
    const usernameControl = component.loginForm.get('username');
    const passwordControl = component.loginForm.get('password');
    
    usernameControl?.setValue('testuser');
    passwordControl?.setValue('password123');
    
    expect(component.loginForm.valid).toBeTrue();
  });

  it('should not call auth service when form is invalid on submit', () => {
    component.onSubmit();
    expect(component.submitted).toBeTrue();
    expect(authServiceSpy.login).not.toHaveBeenCalled();
  });

  it('should call auth service and navigate to /foro on successful login', fakeAsync(() => {
    const navigateSpy = spyOn(router, 'navigate');
    authServiceSpy.login.and.returnValue(of(true));
    
    // Completar el formulario
    component.loginForm.get('username')?.setValue('testuser');
    component.loginForm.get('password')?.setValue('password123');
    
    // Enviar el formulario
    component.onSubmit();
    tick();
    
    expect(component.submitted).toBeTrue();
    expect(component.loading).toBeTrue();
    expect(authServiceSpy.login).toHaveBeenCalledWith('testuser', 'password123');
    expect(navigateSpy).toHaveBeenCalledWith(['/foro']);
  }));

  it('should set error message on failed login', fakeAsync(() => {
    authServiceSpy.login.and.returnValue(throwError(() => new Error('Invalid credentials')));
    
    // Completar el formulario
    component.loginForm.get('username')?.setValue('testuser');
    component.loginForm.get('password')?.setValue('wrongpassword');
    
    // Enviar el formulario
    component.onSubmit();
    tick();
    
    expect(component.submitted).toBeTrue();
    expect(component.loading).toBeFalse();
    expect(component.errorMessage).toBe('Credenciales inválidas');
  }));

  it('should provide access to form controls via getter', () => {
    expect(component.f).toBe(component.loginForm.controls);
  });
});