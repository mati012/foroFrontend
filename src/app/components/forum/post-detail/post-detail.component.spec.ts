import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';

import { PostDetailComponent } from './post-detail.component';
import { PostService } from '../../../services/post.service';
import { CommentService } from '../../../services/comment.service';
import { AuthService } from '../../../services/auth.service';
import { Post } from '../../../models/post.model';
import { Comment } from '../../../models/comment.model';

describe('PostDetailComponent', () => {
  let component: PostDetailComponent;
  let fixture: ComponentFixture<PostDetailComponent>;
  let postServiceSpy: jasmine.SpyObj<PostService>;
  let commentServiceSpy: jasmine.SpyObj<CommentService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;
  let activatedRoute: any;

  // Datos de prueba
  const mockPost: Post = {
    id: 1,
    titulo: 'Test Post',
    contenido: 'Test content',
    autor: 'testuser',
    autor_id: 1,
    topico_id: 1
  };

  const mockComments: Comment[] = [
    { id: 1, mensaje: 'Comment 1', autor: 'user1', autor_id: 1, post_id: 1 },
    { id: 2, mensaje: 'Comment 2', autor: 'user2', autor_id: 2, post_id: 1 },
    { id: 3, mensaje: 'Comment 3', autor: 'user3', autor_id: 3, post_id: 2 } // Este es para otro post
  ];

  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    role: { id: 2 } // Usuario normal
  };

  const mockAdmin = {
    id: 2,
    username: 'admin',
    email: 'admin@example.com',
    role: { id: 1 } // Administrador
  };

  beforeEach(async () => {
    // Crear spies para los servicios
    const postSpy = jasmine.createSpyObj('PostService', ['getPostById', 'deletePost']);
    const commentSpy = jasmine.createSpyObj('CommentService', ['getAllComments', 'addComment', 'deleteComment']);
    const authSpy = jasmine.createSpyObj('AuthService', [], {
      currentUserValue: mockUser
    });

    // Mock para ActivatedRoute
    activatedRoute = {
      snapshot: {
        paramMap: convertToParamMap({ id: '1' })
      }
    };

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        ReactiveFormsModule,
        FormsModule
      ],
      providers: [
        { provide: PostService, useValue: postSpy },
        { provide: CommentService, useValue: commentSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: ActivatedRoute, useValue: activatedRoute }
      ]
    }).compileComponents();

    postServiceSpy = TestBed.inject(PostService) as jasmine.SpyObj<PostService>;
    commentServiceSpy = TestBed.inject(CommentService) as jasmine.SpyObj<CommentService>;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    // Configurar comportamiento de los spies
    postServiceSpy.getPostById.and.returnValue(of(mockPost));
    commentServiceSpy.getAllComments.and.returnValue(of(mockComments));
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PostDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with empty message field', () => {
    expect(component.commentForm).toBeDefined();
    expect(component.commentForm.get('mensaje')?.value).toBe('');
  });

  it('should load post on init', () => {
    expect(postServiceSpy.getPostById).toHaveBeenCalledWith(1);
    expect(component.post).toEqual(mockPost);
    expect(component.loading).toBeFalse();
  });

  it('should load and filter comments on init', () => {
    expect(commentServiceSpy.getAllComments).toHaveBeenCalled();
    expect(component.comments.length).toBe(2); // Solo los comentarios del post 1
    expect(component.comments.every(c => c.post_id === 1)).toBeTrue();
  });

  it('should redirect to forum if no post id is provided', () => {
    // Modificar el mock de ActivatedRoute para que no tenga id
    activatedRoute.snapshot.paramMap = convertToParamMap({});
    
    fixture = TestBed.createComponent(PostDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    expect(router.navigate).toHaveBeenCalledWith(['/foro']);
  });

  it('should handle error when loading post', () => {
    postServiceSpy.getPostById.and.returnValue(throwError(() => new Error('Error loading post')));
    
    fixture = TestBed.createComponent(PostDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    expect(component.error).toBe('Error al cargar la publicación');
    expect(component.loading).toBeFalse();
  });

  it('should handle error when loading comments', () => {
    commentServiceSpy.getAllComments.and.returnValue(throwError(() => new Error('Error loading comments')));
    
    fixture = TestBed.createComponent(PostDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    expect(component.error).toBe('Error al cargar los comentarios');
  });

  it('should validate comment message as required and with minimum length', () => {
    const mensajeControl = component.commentForm.get('mensaje');
    
    // Empty message
    mensajeControl?.setValue('');
    expect(mensajeControl?.valid).toBeFalse();
    expect(mensajeControl?.errors?.['required']).toBeTruthy();
    
    // Message too short
    mensajeControl?.setValue('Test');
    expect(mensajeControl?.valid).toBeFalse();
    expect(mensajeControl?.errors?.['minlength']).toBeTruthy();
    
    // Valid message
    mensajeControl?.setValue('This is a valid comment message');
    expect(mensajeControl?.valid).toBeTrue();
  });

  it('should not submit comment if form is invalid', () => {
    // Keep form invalid
    component.commentForm.get('mensaje')?.setValue('');
    
    component.submitComment();
    
    expect(component.submitting).toBeFalse();
    expect(commentServiceSpy.addComment).not.toHaveBeenCalled();
  });

  it('should not submit comment if post is null', () => {
    // Valid form but null post
    component.commentForm.get('mensaje')?.setValue('This is a valid comment');
    component.post = null;
    
    component.submitComment();
    
    expect(component.submitting).toBeFalse();
    expect(commentServiceSpy.addComment).not.toHaveBeenCalled();
  });

  it('should not submit comment if user is not logged in', () => {
    // Override the auth service to return null for currentUserValue
    Object.defineProperty(authServiceSpy, 'currentUserValue', {
      get: () => null
    });
    
    // Valid form
    component.commentForm.get('mensaje')?.setValue('This is a valid comment');
    
    component.submitComment();
    
    expect(component.error).toBe('Debe iniciar sesión para comentar');
    expect(component.submitting).toBeFalse();
    expect(commentServiceSpy.addComment).not.toHaveBeenCalled();
  });


  it('should handle error when adding comment', () => {
    // Valid form
    component.commentForm.get('mensaje')?.setValue('This is a valid comment');
    
    // Setup comment service to return an error
    commentServiceSpy.addComment.and.returnValue(throwError(() => new Error('Error adding comment')));
    
    component.submitComment();
    
    expect(component.error).toBe('Error al añadir el comentario');
    expect(component.submitting).toBeFalse();
  });

  it('should check if user is logged in', () => {
    // User is logged in
    expect(component.isLoggedIn()).toBeTrue();
    
    // User is not logged in
    Object.defineProperty(authServiceSpy, 'currentUserValue', {
      get: () => null
    });
    expect(component.isLoggedIn()).toBeFalse();
  });

  it('should check if user is admin', () => {
    // Regular user
    expect(component.isAdmin()).toBeFalse();
    
    // Admin user
    Object.defineProperty(authServiceSpy, 'currentUserValue', {
      get: () => mockAdmin
    });
    expect(component.isAdmin()).toBeTrue();
  });

  it('should delete comment after confirmation', () => {
    // Setup window.confirm to return true
    spyOn(window, 'confirm').and.returnValue(true);
    
    // Setup comment service
    commentServiceSpy.deleteComment.and.returnValue(of(void 0));
    
    component.deleteComment(1);
    
    expect(window.confirm).toHaveBeenCalled();
    expect(commentServiceSpy.deleteComment).toHaveBeenCalledWith(1);
    expect(component.comments.length).toBe(1); // Original 2 - 1 deleted
    expect(component.comments.every(c => c.id !== 1)).toBeTrue();
    expect(component.success).toBe('Comentario eliminado con éxito');
  });

  it('should not delete comment if not confirmed', () => {
    // Setup window.confirm to return false
    spyOn(window, 'confirm').and.returnValue(false);
    
    component.deleteComment(1);
    
    expect(window.confirm).toHaveBeenCalled();
    expect(commentServiceSpy.deleteComment).not.toHaveBeenCalled();
  });

  it('should handle error when deleting comment', () => {
    // Setup window.confirm to return true
    spyOn(window, 'confirm').and.returnValue(true);
    
    // Setup comment service to return an error
    commentServiceSpy.deleteComment.and.returnValue(throwError(() => new Error('Error deleting comment')));
    
    component.deleteComment(1);
    
    expect(commentServiceSpy.deleteComment).toHaveBeenCalledWith(1);
    expect(component.error).toBe('Error al eliminar el comentario');
  });

  it('should delete post after confirmation', () => {
    // Setup window.confirm to return true
    spyOn(window, 'confirm').and.returnValue(true);
    
    // Setup post service
    postServiceSpy.deletePost.and.returnValue(of(void 0));
    
    component.deletePost();
    
    expect(window.confirm).toHaveBeenCalled();
    expect(postServiceSpy.deletePost).toHaveBeenCalledWith(1);
    expect(router.navigate).toHaveBeenCalledWith(['/foro'], { queryParams: { deleted: 'true' } });
  });

  it('should not delete post if not confirmed', () => {
    // Setup window.confirm to return false
    spyOn(window, 'confirm').and.returnValue(false);
    
    component.deletePost();
    
    expect(window.confirm).toHaveBeenCalled();
    expect(postServiceSpy.deletePost).not.toHaveBeenCalled();
  });

  it('should not attempt to delete post if post is null', () => {
    // Setup window.confirm to return true
    spyOn(window, 'confirm').and.returnValue(true);
    
    // Set post to null
    component.post = null;
    
    component.deletePost();
    
    expect(window.confirm).toHaveBeenCalled();
    expect(postServiceSpy.deletePost).not.toHaveBeenCalled();
  });

  it('should handle error when deleting post', () => {
    // Setup window.confirm to return true
    spyOn(window, 'confirm').and.returnValue(true);
    
    // Setup post service to return an error
    postServiceSpy.deletePost.and.returnValue(throwError(() => new Error('Error deleting post')));
    
    component.deletePost();
    
    expect(postServiceSpy.deletePost).toHaveBeenCalledWith(1);
    expect(component.error).toBe('Error al eliminar la publicación');
  });

  it('should provide access to form controls via getter', () => {
    expect(component.f).toBe(component.commentForm.controls);
  });
});