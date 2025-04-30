import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { Router } from '@angular/router';

import { CreatePostComponent } from './create-post.component';
import { TopicService } from '../../../services/topic.service';
import { PostService } from '../../../services/post.service';
import { AuthService } from '../../../services/auth.service';
import { Topic } from '../../../models/topic.model';

describe('CreatePostComponent', () => {
  let component: CreatePostComponent;
  let fixture: ComponentFixture<CreatePostComponent>;
  let topicServiceSpy: jasmine.SpyObj<TopicService>;
  let postServiceSpy: jasmine.SpyObj<PostService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  // Mock data
  const mockTopics: Topic[] = [
    { id: 1, nombre: 'Topic 1', descripcion: 'Description 1' },
    { id: 2, nombre: 'Topic 2', descripcion: 'Description 2' },
    { id: 3, nombre: 'Topic 3', descripcion: 'Description 3' }
  ];

  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com'
  };

  const mockPost = {
    id: 1,
    titulo: 'Test Post',
    contenido: 'This is a test post content',
    topico_id: 1,
    autor: 'testuser',
    autor_id: 1
  };

  beforeEach(async () => {
    // Create spies for the services
    const topicSpy = jasmine.createSpyObj('TopicService', ['getAllTopics']);
    const postSpy = jasmine.createSpyObj('PostService', ['createPost']);
    const authSpy = jasmine.createSpyObj('AuthService', [], {
      currentUserValue: mockUser
    });

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        ReactiveFormsModule,
        FormsModule
      ],
      providers: [
        { provide: TopicService, useValue: topicSpy },
        { provide: PostService, useValue: postSpy },
        { provide: AuthService, useValue: authSpy }
      ]
    }).compileComponents();

    // Get the injected services and router
    topicServiceSpy = TestBed.inject(TopicService) as jasmine.SpyObj<TopicService>;
    postServiceSpy = TestBed.inject(PostService) as jasmine.SpyObj<PostService>;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
  });

  beforeEach(() => {
    // Set default behavior for the topic service
    topicServiceSpy.getAllTopics.and.returnValue(of(mockTopics));
    
    fixture = TestBed.createComponent(CreatePostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });


  it('should initialize the form with empty fields', () => {
    expect(component.postForm).toBeDefined();
    expect(component.postForm.get('titulo')?.value).toBe('');
    expect(component.postForm.get('contenido')?.value).toBe('');
    expect(component.postForm.get('topico_id')?.value).toBe('');
  });

  it('should load topics on init', () => {
    expect(topicServiceSpy.getAllTopics).toHaveBeenCalled();
    expect(component.topics).toEqual(mockTopics);
    expect(component.loading).toBeFalse();
  });

  it('should handle error when loading topics', () => {
    // Set up the service to return an error
    topicServiceSpy.getAllTopics.and.returnValue(throwError(() => new Error('Error loading topics')));

    // Re-create the component to trigger ngOnInit
    fixture = TestBed.createComponent(CreatePostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.error).toBe('Error al cargar los tópicos');
    expect(component.loading).toBeFalse();
  });

  it('should validate title as required and with correct length', () => {
    const tituloControl = component.postForm.get('titulo');
    
    // Empty title
    tituloControl?.setValue('');
    expect(tituloControl?.valid).toBeFalse();
    expect(tituloControl?.errors?.['required']).toBeTruthy();
    
    // Title too short
    tituloControl?.setValue('Test');
    expect(tituloControl?.valid).toBeFalse();
    expect(tituloControl?.errors?.['minlength']).toBeTruthy();
    
    // Title too long (101 characters)
    tituloControl?.setValue('A'.repeat(101));
    expect(tituloControl?.valid).toBeFalse();
    expect(tituloControl?.errors?.['maxlength']).toBeTruthy();
    
    // Valid title
    tituloControl?.setValue('Valid Post Title');
    expect(tituloControl?.valid).toBeTrue();
  });

  it('should validate content as required and with minimum length', () => {
    const contenidoControl = component.postForm.get('contenido');
    
    // Empty content
    contenidoControl?.setValue('');
    expect(contenidoControl?.valid).toBeFalse();
    expect(contenidoControl?.errors?.['required']).toBeTruthy();
    
    // Content too short
    contenidoControl?.setValue('Too short content');
    expect(contenidoControl?.valid).toBeFalse();
    expect(contenidoControl?.errors?.['minlength']).toBeTruthy();
    
    // Valid content
    contenidoControl?.setValue('This is a valid content for the post. It has more than twenty characters.');
    expect(contenidoControl?.valid).toBeTrue();
  });

  it('should validate topic as required', () => {
    const topicoControl = component.postForm.get('topico_id');
    
    // Empty topic
    topicoControl?.setValue('');
    expect(topicoControl?.valid).toBeFalse();
    expect(topicoControl?.errors?.['required']).toBeTruthy();
    
    // Valid topic
    topicoControl?.setValue(1);
    expect(topicoControl?.valid).toBeTrue();
  });

  it('should not submit if form is invalid', () => {
    // Keep form invalid
    component.postForm.get('titulo')?.setValue('');
    
    component.onSubmit();
    
    expect(component.submitting).toBeFalse();
    expect(postServiceSpy.createPost).not.toHaveBeenCalled();
  });

  it('should submit post with current user data when form is valid', () => {
    // Fill the form with valid data
    component.postForm.setValue({
      titulo: 'Test Post Title',
      contenido: 'This is a test post content with more than twenty characters.',
      topico_id: 1
    });
    
    // Setup the post service to return success
    postServiceSpy.createPost.and.returnValue(of(mockPost));
    
    // Submit the form
    component.onSubmit();
    
    // Expected data to be sent
    const expectedPostData = {
      titulo: 'Test Post Title',
      contenido: 'This is a test post content with more than twenty characters.',
      topico_id: 1,
      autor: 'testuser',
      autor_id: 1
    };
    
    expect(component.submitting).toBeTrue();
    expect(postServiceSpy.createPost).toHaveBeenCalledWith(expectedPostData);
    expect(router.navigate).toHaveBeenCalledWith(['/foro/publicacion', 1]);
  });

  it('should handle error when creating post', () => {
    // Fill the form with valid data
    component.postForm.setValue({
      titulo: 'Test Post Title',
      contenido: 'This is a test post content with more than twenty characters.',
      topico_id: 1
    });
    
    // Setup the post service to return an error
    postServiceSpy.createPost.and.returnValue(throwError(() => new Error('Error creating post')));
    
    // Submit the form
    component.onSubmit();
    
    expect(component.submitting).toBeFalse();
    expect(component.error).toBe('Error al crear la publicación');
  });

  it('should provide access to form controls via getter', () => {
    expect(component.f).toBe(component.postForm.controls);
  });
});