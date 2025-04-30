import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { HeaderComponent } from './header.component';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;
  let currentUserSubject: BehaviorSubject<User | null>;

  // Datos de prueba
  const mockRegularUser: User = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    role: { id: 2 } // Regular user
  };

  const mockAdminUser: User = {
    id: 2,
    username: 'admin',
    email: 'admin@example.com',
    role: { id: 1 } // Admin user
  };

  beforeEach(async () => {
    // Crear un BehaviorSubject para simular el observable de currentUser
    currentUserSubject = new BehaviorSubject<User | null>(mockRegularUser);

    // Crear un spy para el AuthService
    const authSpy = jasmine.createSpyObj('AuthService', ['logout'], {
      currentUser: currentUserSubject.asObservable()
    });

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authSpy }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get current user on init', () => {
    expect(component.currentUser).toEqual(mockRegularUser);
  });

  it('should update currentUser when auth service emits new value', () => {
    // Cambiar el valor en el subject
    currentUserSubject.next(mockAdminUser);
    
    // Verificar que el componente actualiza su propiedad
    expect(component.currentUser).toEqual(mockAdminUser);
  });

  it('should handle null user from auth service', () => {
    // Establecer usuario como null
    currentUserSubject.next(null);
    
    // Verificar que el componente maneja correctamente el valor null
    expect(component.currentUser).toBeNull();
  });

  it('should call logout and navigate to login on logout', () => {
    // Llamar al método logout
    component.logout();
    
    // Verificar que se llamó al servicio y se navegó a la página de login
    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('should identify admin user correctly', () => {
    // Establecer un usuario admin
    currentUserSubject.next(mockAdminUser);
    
    // Verificar que isAdmin devuelve true
    expect(component.isAdmin()).toBeTrue();
  });

  it('should identify non-admin user correctly', () => {
    // Ya tenemos un usuario regular establecido por defecto
    expect(component.isAdmin()).toBeFalse();
  });

  it('should handle user without role property', () => {
    // Usuario sin propiedad role
    const userWithoutRole: User = {
      id: 3,
      username: 'norolesuser',
      email: 'noroles@example.com'
    };
    
    currentUserSubject.next(userWithoutRole);
    
    // isAdmin debería manejar el caso sin error
    expect(component.isAdmin()).toBeFalse();
  });

  it('should handle null currentUser in isAdmin method', () => {
    // Establecer usuario como null
    currentUserSubject.next(null);
    
    // isAdmin debería manejar el caso null sin error
    expect(component.isAdmin()).toBeFalse();
  });


});