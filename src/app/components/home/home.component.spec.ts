import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { HomeComponent } from './home.component';
import { PostService } from '../../services/post.service';
import { TopicService } from '../../services/topic.service';
import { Post } from '../../models/post.model';
import { Topic } from '../../models/topic.model';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let postServiceSpy: jasmine.SpyObj<PostService>;
  let topicServiceSpy: jasmine.SpyObj<TopicService>;

  // Datos de prueba
  const mockTopics: Topic[] = [
    { id: 1, nombre: 'Topic 1', descripcion: 'Description 1' },
    { id: 2, nombre: 'Topic 2', descripcion: 'Description 2' },
    { id: 3, nombre: 'Topic 3', descripcion: 'Description 3' }
  ];

  const mockPosts: Post[] = [
    { id: 5, titulo: 'Post 5', contenido: 'Content 5', autor: 'User 1', autor_id: 1, topico_id: 1 },
    { id: 4, titulo: 'Post 4', contenido: 'Content 4', autor: 'User 2', autor_id: 2, topico_id: 2 },
    { id: 3, titulo: 'Post 3', contenido: 'Content 3', autor: 'User 1', autor_id: 1, topico_id: 1 },
    { id: 2, titulo: 'Post 2', contenido: 'Content 2', autor: 'User 3', autor_id: 3, topico_id: 3 },
    { id: 1, titulo: 'Post 1', contenido: 'Content 1', autor: 'User 2', autor_id: 2, topico_id: 2 },
    { id: 0, titulo: 'Post 0', contenido: 'Content 0', autor: 'User 1', autor_id: 1, topico_id: 1 }
  ];

  beforeEach(async () => {
    // Crear spies para los servicios
    const postSpy = jasmine.createSpyObj('PostService', ['getAllPosts']);
    const topicSpy = jasmine.createSpyObj('TopicService', ['getAllTopics']);

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        { provide: PostService, useValue: postSpy },
        { provide: TopicService, useValue: topicSpy }
      ]
    }).compileComponents();

    postServiceSpy = TestBed.inject(PostService) as jasmine.SpyObj<PostService>;
    topicServiceSpy = TestBed.inject(TopicService) as jasmine.SpyObj<TopicService>;
  });

  beforeEach(() => {
    // Configurar el comportamiento predeterminado de los spies
    topicServiceSpy.getAllTopics.and.returnValue(of(mockTopics));
    postServiceSpy.getAllPosts.and.returnValue(of(mockPosts));
    
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load topics on init', () => {
    expect(topicServiceSpy.getAllTopics).toHaveBeenCalled();
    expect(component.topics).toEqual(mockTopics);
    expect(component.error).toBe('');
  });

  it('should load recent posts on init', () => {
    expect(postServiceSpy.getAllPosts).toHaveBeenCalled();
    
    // Verificar que obtenemos los 5 posts más recientes por ID
    expect(component.recentPosts.length).toBe(5);
    expect(component.recentPosts[0].id).toBe(5); // El post con ID más alto debería ser el primero
    expect(component.recentPosts[4].id).toBe(1); // El post con ID más bajo entre los 5 seleccionados
    expect(component.loading).toBeFalse();
    expect(component.error).toBe('');
  });

  it('should handle error when loading topics', () => {
    // Configurar el spy para devolver un error
    topicServiceSpy.getAllTopics.and.returnValue(throwError(() => new Error('Error loading topics')));
    
    // Recrear el componente para activar ngOnInit
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    expect(component.error).toBe('Error al cargar los tópicos');
  });

  it('should handle error when loading posts', () => {
    // Configurar el spy para devolver un error
    postServiceSpy.getAllPosts.and.returnValue(throwError(() => new Error('Error loading posts')));
    
    // Recrear el componente para activar ngOnInit
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    expect(component.error).toBe('Error al cargar las publicaciones recientes');
    expect(component.loading).toBeFalse();
  });

  it('should handle posts with undefined id', () => {
    // Preparar posts con un id undefined
    const postsWithUndefinedId = [
      ...mockPosts.slice(0, 2),
      { titulo: 'Post sin ID', contenido: 'Content', autor: 'User 1', autor_id: 1, topico_id: 1 }, // Sin ID
      ...mockPosts.slice(2)
    ];
    
    // Configurar el spy
    postServiceSpy.getAllPosts.and.returnValue(of(postsWithUndefinedId));
    
    // Recrear el componente
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    // Verificar que el componente maneje correctamente los undefined
    expect(component.recentPosts.length).toBe(5);
    expect(component.loading).toBeFalse();
  });

  it('should sort posts by id in descending order', () => {
    // Preparar posts con IDs desordenados
    const unsortedPosts = [
      { id: 1, titulo: 'Post 1', contenido: 'Content 1', autor: 'User 1', autor_id: 1, topico_id: 1 },
      { id: 5, titulo: 'Post 5', contenido: 'Content 5', autor: 'User 1', autor_id: 1, topico_id: 1 },
      { id: 3, titulo: 'Post 3', contenido: 'Content 3', autor: 'User 1', autor_id: 1, topico_id: 1 },
      { id: 2, titulo: 'Post 2', contenido: 'Content 2', autor: 'User 1', autor_id: 1, topico_id: 1 },
      { id: 4, titulo: 'Post 4', contenido: 'Content 4', autor: 'User 1', autor_id: 1, topico_id: 1 },
      { id: 6, titulo: 'Post 6', contenido: 'Content 6', autor: 'User 1', autor_id: 1, topico_id: 1 }
    ];
    
    // Configurar el spy
    postServiceSpy.getAllPosts.and.returnValue(of(unsortedPosts));
    
    // Recrear el componente
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    // Verificar que estén ordenados por ID descendente
    expect(component.recentPosts.map(post => post.id)).toEqual([6, 5, 4, 3, 2]);
  });

  it('should limit the number of posts to 5', () => {
    expect(component.recentPosts.length).toBe(5);
    // Asegurarse de que tenemos más de 5 posts en los datos de prueba
    expect(mockPosts.length).toBeGreaterThan(5);
  });

  it('should handle empty posts array', () => {
    // Configurar para que no haya posts
    postServiceSpy.getAllPosts.and.returnValue(of([]));
    
    // Recrear el componente
    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    expect(component.recentPosts.length).toBe(0);
    expect(component.loading).toBeFalse();
  });

  it('should initialize with loading state true', () => {
    // Comprobar el estado inicial antes de que los observables se completen
    const newComponent = new HomeComponent(postServiceSpy, topicServiceSpy);
    expect(newComponent.loading).toBeTrue();
  });

  it('should not change error message if both services succeed', () => {
    expect(component.error).toBe('');
  });

 
});