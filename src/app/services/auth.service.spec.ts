import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { AuthService } from './auth.service';
import { User } from '../models/user.model';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  
  // Mock de localStorage para las pruebas
  let localStorageMock: {
    getItem: jasmine.Spy;
    setItem: jasmine.Spy;
    removeItem: jasmine.Spy;
  };
  
  // Datos de prueba
  const mockUser: User = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    role: { id: 2 }
  };
  
  const mockUserWithoutPassword: User = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    role: { id: 2 }
  };

  beforeEach(() => {
    // Crear mock para localStorage
    localStorageMock = {
      getItem: jasmine.createSpy('getItem').and.returnValue(null),
      setItem: jasmine.createSpy('setItem'),
      removeItem: jasmine.createSpy('removeItem')
    };
    
    // Reemplazar localStorage con nuestro mock
    spyOn(localStorage, 'getItem').and.callFake(localStorageMock.getItem);
    spyOn(localStorage, 'setItem').and.callFake(localStorageMock.setItem);
    spyOn(localStorage, 'removeItem').and.callFake(localStorageMock.removeItem);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with null currentUser when localStorage is empty', () => {
    expect(service.currentUserValue).toBeNull();
  });


  describe('register', () => {
    it('should send a POST request to register a user', () => {
      service.register(mockUser).subscribe(response => {
        expect(response).toEqual({ success: true });
      });
      
      const req = httpMock.expectOne('http://localhost:8081/user');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockUser);
      
      req.flush({ success: true });
    });
  });

  describe('login', () => {
    it('should authenticate user with correct credentials from Optional response', () => {
      // API devuelve un Optional de Java con el usuario
      const mockResponse = {
        present: true,
        value: mockUser
      };
      
      service.login('testuser', 'password123').subscribe(response => {
        expect(service.currentUserValue).toEqual(mockUserWithoutPassword);
        expect(localStorage.setItem).toHaveBeenCalledWith('currentUser', JSON.stringify(mockUserWithoutPassword));
      });
      
      const req = httpMock.expectOne('http://localhost:8081/user/username/testuser');
      expect(req.request.method).toBe('GET');
      
      req.flush(mockResponse);
    });
    
    it('should authenticate user with correct credentials from direct object response', () => {
      // API devuelve directamente el objeto usuario
      service.login('testuser', 'password123').subscribe(response => {
        expect(service.currentUserValue).toEqual(mockUserWithoutPassword);
        expect(localStorage.setItem).toHaveBeenCalledWith('currentUser', JSON.stringify(mockUserWithoutPassword));
      });
      
      const req = httpMock.expectOne('http://localhost:8081/user/username/testuser');
      expect(req.request.method).toBe('GET');
      
      req.flush(mockUser);
    });
    
    it('should not authenticate with incorrect password', () => {
      service.login('testuser', 'wrongpassword').subscribe({
        next: () => fail('should have failed with incorrect password'),
        error: error => {
          expect(error.message).toContain('Credenciales inválidas');
          expect(service.currentUserValue).toBeNull();
          expect(localStorage.setItem).not.toHaveBeenCalled();
        }
      });
      
      const req = httpMock.expectOne('http://localhost:8081/user/username/testuser');
      expect(req.request.method).toBe('GET');
      
      // Devolver el usuario pero con otra contraseña
      const userWithDifferentPassword = {
        ...mockUser,
        password: 'different123'
      };
      req.flush(userWithDifferentPassword);
    });
    
    it('should handle user not found', () => {
      service.login('nonexistent', 'password123').subscribe({
        next: () => fail('should have failed with non-existent user'),
        error: error => {
          expect(error.message).toContain('Credenciales inválidas');
          expect(service.currentUserValue).toBeNull();
        }
      });
      
      const req = httpMock.expectOne('http://localhost:8081/user/username/nonexistent');
      expect(req.request.method).toBe('GET');
      
      // Devolver un Optional vacío
      req.flush({ present: false });
    });
    
    it('should handle server error', () => {
      service.login('testuser', 'password123').subscribe({
        next: () => fail('should have failed with server error'),
        error: error => {
          expect(error.message).toContain('Credenciales inválidas o usuario no encontrado');
          expect(service.currentUserValue).toBeNull();
        }
      });
      
      const req = httpMock.expectOne('http://localhost:8081/user/username/testuser');
      expect(req.request.method).toBe('GET');
      
      // Simular error del servidor
      req.error(new ErrorEvent('Network error'));
    });
    

  
  });

  

  describe('checkUsernameExists', () => {
    it('should check if username exists', () => {
      service.checkUsernameExists('testuser').subscribe(exists => {
        expect(exists).toBeTrue();
      });
      
      const req = httpMock.expectOne('http://localhost:8081/user/exists/username/testuser');
      expect(req.request.method).toBe('GET');
      
      req.flush(true);
    });
  });

  describe('checkEmailExists', () => {
    it('should check if email exists', () => {
      service.checkEmailExists('test@example.com').subscribe(exists => {
        expect(exists).toBeTrue();
      });
      
      const req = httpMock.expectOne('http://localhost:8081/user/exists/email/test@example.com');
      expect(req.request.method).toBe('GET');
      
      req.flush(true);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', () => {
      const updatedUser: User = {
        ...mockUser,
        email: 'updated@example.com'
      };
      
      service.updateProfile(1, updatedUser).subscribe(response => {
        expect(response).toEqual(updatedUser);
      });
      
      const req = httpMock.expectOne('http://localhost:8081/user/1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedUser);
      
      req.flush(updatedUser);
    });
    
    it('should update localStorage and currentUser when updating the current user', () => {
      // Establecer un usuario actual primero
      service['currentUserSubject'].next(mockUserWithoutPassword);
      
      const updatedUser: User = {
        ...mockUser,
        email: 'updated@example.com'
      };
      
      const updatedUserWithoutPassword = {
        ...mockUserWithoutPassword,
        email: 'updated@example.com'
      };
      
      service.updateProfile(1, updatedUser).subscribe();
      
      const req = httpMock.expectOne('http://localhost:8081/user/1');
      req.flush(updatedUser);
      
      expect(service.currentUserValue).toEqual(updatedUserWithoutPassword);
      expect(localStorage.setItem).toHaveBeenCalledWith('currentUser', JSON.stringify(updatedUserWithoutPassword));
    });
    
    it('should not update localStorage or currentUser when updating a different user', () => {
      // Establecer un usuario actual primero
      service['currentUserSubject'].next(mockUserWithoutPassword);
      
      const differentUser: User = {
        id: 2,
        username: 'differentuser',
        email: 'different@example.com',
        password: 'password123',
        role: { id: 2 }
      };
      
      service.updateProfile(2, differentUser).subscribe();
      
      const req = httpMock.expectOne('http://localhost:8081/user/2');
      req.flush(differentUser);
      
      // El currentUser no debería cambiar
      expect(service.currentUserValue).toEqual(mockUserWithoutPassword);
      // localStorage.setItem podría haber sido llamado antes, así que no verificamos si no fue llamado
    });
    

  });
});