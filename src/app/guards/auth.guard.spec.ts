import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { User } from '../models/user.model';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  
  // Mock de un usuario para las pruebas
  const mockUser: User = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    role: { id: 2 }
  };
  
  // Mocks para los parámetros de canActivate
  const mockActivatedRouteSnapshot = {} as ActivatedRouteSnapshot;
  const mockRouterStateSnapshot = {
    url: '/protected-route'
  } as RouterStateSnapshot;

  beforeEach(() => {
    // Crear spies para los servicios
    const authSpy = jasmine.createSpyObj('AuthService', [], {
      // Propiedades mockables, inicialmente con null
      currentUserValue: null
    });
    
    const routSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routSpy }
      ]
    });

    guard = TestBed.inject(AuthGuard);
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow access when user is authenticated', () => {
    // Configurar el AuthService para devolver un usuario autenticado
    Object.defineProperty(authServiceSpy, 'currentUserValue', {
      get: () => mockUser
    });

    const result = guard.canActivate(mockActivatedRouteSnapshot, mockRouterStateSnapshot);
    
    expect(result).toBeTrue();
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to login when user is not authenticated', () => {
    // Configurar el AuthService para devolver null (no autenticado)
    Object.defineProperty(authServiceSpy, 'currentUserValue', {
      get: () => null
    });

    const result = guard.canActivate(mockActivatedRouteSnapshot, mockRouterStateSnapshot);
    
    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(
      ['/auth/login'], 
      { queryParams: { returnUrl: '/protected-route' } }
    );
  });

  it('should handle undefined user value', () => {
    // Configurar el AuthService para devolver undefined
    Object.defineProperty(authServiceSpy, 'currentUserValue', {
      get: () => undefined
    });

    const result = guard.canActivate(mockActivatedRouteSnapshot, mockRouterStateSnapshot);
    
    expect(result).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(
      ['/auth/login'], 
      { queryParams: { returnUrl: '/protected-route' } }
    );
  });

  it('should pass the correct return URL when redirecting', () => {
    // Configurar el AuthService para devolver null
    Object.defineProperty(authServiceSpy, 'currentUserValue', {
      get: () => null
    });
    
    // RouterStateSnapshot con una URL diferente
    const customRouterStateSnapshot = {
      url: '/custom-route'
    } as RouterStateSnapshot;

    guard.canActivate(mockActivatedRouteSnapshot, customRouterStateSnapshot);
    
    expect(routerSpy.navigate).toHaveBeenCalledWith(
      ['/auth/login'], 
      { queryParams: { returnUrl: '/custom-route' } }
    );
  });

  it('should handle malformed user object', () => {
    // Un usuario malformado que no tiene todas las propiedades esperadas
    const malformedUser = { 
      // Sin id, username ni otras propiedades requeridas
    } as User;
    
    Object.defineProperty(authServiceSpy, 'currentUserValue', {
      get: () => malformedUser
    });

    const result = guard.canActivate(mockActivatedRouteSnapshot, mockRouterStateSnapshot);
    
    // Incluso con un usuario malformado, debería permitir el acceso
    // ya que el guard solo verifica si currentUserValue no es null/undefined
    expect(result).toBeTrue();
  });
});