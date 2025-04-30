import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';

import { RecoverPasswordComponent } from './recover-password.component';

describe('RecoverPasswordComponent', () => {
  let component: RecoverPasswordComponent;
  let fixture: ComponentFixture<RecoverPasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        ReactiveFormsModule,
        FormsModule
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RecoverPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form correctly', () => {
    expect(component.recoverForm).toBeDefined();
    expect(component.recoverForm.get('email')).toBeDefined();
    expect(component.recoverForm.get('email')?.value).toBe('');
    expect(component.recoverForm.get('email')?.validator).toBeTruthy();
  });

  it('should initialize component properties correctly', () => {
    expect(component.submitted).toBeFalse();
    expect(component.loading).toBeFalse();
    expect(component.successMessage).toBe('');
    expect(component.errorMessage).toBe('');
  });

  it('should validate email as required', () => {
    const emailControl = component.recoverForm.get('email');
    
    // Email vacío debe ser inválido
    emailControl?.setValue('');
    expect(emailControl?.valid).toBeFalse();
    expect(emailControl?.errors?.['required']).toBeTruthy();
  });

  it('should validate email format', () => {
    const emailControl = component.recoverForm.get('email');
    
    // Email con formato inválido
    emailControl?.setValue('invalid-email');
    expect(emailControl?.valid).toBeFalse();
    expect(emailControl?.errors?.['email']).toBeTruthy();
    
    // Email con formato válido
    emailControl?.setValue('valid@example.com');
    expect(emailControl?.valid).toBeTrue();
    expect(emailControl?.errors).toBeNull();
  });

  it('should not submit if form is invalid', () => {
    // Make the form invalid with empty email
    component.recoverForm.get('email')?.setValue('');
    
    // Spy on the setTimeout function
    spyOn(window, 'setTimeout');
    
    component.onSubmit();
    
    expect(component.submitted).toBeTrue();
    expect(component.loading).toBeFalse();
    expect(window.setTimeout).not.toHaveBeenCalled();
  });

  it('should show loading state and then success message on submit with valid form', fakeAsync(() => {
    // Set a valid email
    component.recoverForm.get('email')?.setValue('test@example.com');
    
    // Submit form
    component.onSubmit();
    
    // Check initial state after submission
    expect(component.submitted).toBeTrue();
    expect(component.loading).toBeTrue();
    expect(component.errorMessage).toBe('');
    expect(component.successMessage).toBe('');
    
    // Fast-forward time to complete the timeout
    tick(1500);
    
    // Check final state
    expect(component.loading).toBeFalse();
    expect(component.successMessage).toBe('Se ha enviado un correo con instrucciones para restablecer su contraseña');
  }));

  it('should provide access to form controls via getter', () => {
    expect(component.f).toBe(component.recoverForm.controls);
  });

  it('should handle form submission with valid email', fakeAsync(() => {
    // Set a valid email
    component.recoverForm.get('email')?.setValue('test@example.com');
    
    // Find the form element
    const formElement = fixture.debugElement.query(By.css('form'));
    
    // Submit the form
    formElement.triggerEventHandler('submit', null);
    fixture.detectChanges();
    
    // Check initial state
    expect(component.submitted).toBeTrue();
    expect(component.loading).toBeTrue();
    
    // Fast-forward time
    tick(1500);
    fixture.detectChanges();
    
    // Check the UI for success message
    const successElement = fixture.debugElement.query(By.css('.alert-success'));
    expect(successElement).toBeTruthy();
    expect(component.successMessage).toBe('Se ha enviado un correo con instrucciones para restablecer su contraseña');
  }));

  it('should reset success and error messages before submitting', fakeAsync(() => {
    // Set initial messages
    component.successMessage = 'Previous success';
    component.errorMessage = 'Previous error';
    
    // Set a valid email
    component.recoverForm.get('email')?.setValue('test@example.com');
    
    // Submit form
    component.onSubmit();
    
    // Check that messages were reset
    expect(component.successMessage).toBe('');
    expect(component.errorMessage).toBe('');
    
    // Fast-forward time
    tick(1500);
    
    // Check final state
    expect(component.successMessage).toBe('Se ha enviado un correo con instrucciones para restablecer su contraseña');
    expect(component.errorMessage).toBe('');
  }));

  it('should keep form in invalid state with invalid email', () => {
    // Set an invalid email
    component.recoverForm.get('email')?.setValue('invalid-email');
    
    // Check form validity
    expect(component.recoverForm.valid).toBeFalse();
    
    // Submit form
    component.onSubmit();
    
    // Should be submitted but not loading
    expect(component.submitted).toBeTrue();
    expect(component.loading).toBeFalse();
  });

  it('should keep form in invalid state with empty email', () => {
    // Keep email empty
    component.recoverForm.get('email')?.setValue('');
    
    // Check form validity
    expect(component.recoverForm.valid).toBeFalse();
    
    // Submit form
    component.onSubmit();
    
    // Should be submitted but not loading
    expect(component.submitted).toBeTrue();
    expect(component.loading).toBeFalse();
  });
});