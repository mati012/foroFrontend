import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { User } from '../models/user.model';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8081/user';
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    
    let userData: User | null = null;
    if (this.isBrowser) {
      userData = JSON.parse(localStorage.getItem('currentUser') || 'null');
    }
    
    this.currentUserSubject = new BehaviorSubject<User | null>(userData);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  register(user: User): Observable<any> {
    return this.http.post(`${this.apiUrl}`, user);
  }
  login(username: string, password: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/username/${username}`).pipe(
      tap(response => {
        console.log('Respuesta original:', response);
        
        // Extraer el usuario del Optional de Java
        let user;
        if (response && response.present === true) {
          // Si viene como un Optional de Java
          user = response.value;
        } else if (response && typeof response === 'object') {
          // Si el Optional ya fue desenvuelto por Spring
          user = response;
        }
        
        console.log('Usuario extraído:', user);
        
        if (user && user.password === password) {
          // Eliminar la contraseña antes de almacenar
          const { password, ...userWithoutPassword } = user;
          
          if (this.isBrowser) {
            localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
          }
          
          this.currentUserSubject.next(userWithoutPassword);
        } else {
          throw new Error('Credenciales inválidas');
        }
      }),
      catchError(error => {
        console.error('Error en login:', error);
        return throwError(() => new Error('Credenciales inválidas o usuario no encontrado'));
      })
    );
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(null);
  }

  checkUsernameExists(username: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/exists/username/${username}`);
  }

  checkEmailExists(email: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/exists/email/${email}`);
  }

  updateProfile(id: number, userData: User): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, userData).pipe(
      tap(updatedUser => {
        // Actualizar el usuario en el almacenamiento local si es el usuario actual
        if (this.currentUserValue && this.currentUserValue.id === id) {
          const { password, ...userWithoutPassword } = updatedUser;
          
          if (this.isBrowser) {
            localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
          }
          
          this.currentUserSubject.next(userWithoutPassword);
        }
      })
    );
  }
}