import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { ForumListComponent } from './forum-list.component';
import { TopicService } from '../../../services/topic.service';
import { PostService } from '../../../services/post.service';
import { Topic } from '../../../models/topic.model';
import { Post } from '../../../models/post.model';

describe('ForumListComponent', () => {
  let component: ForumListComponent;
  let fixture: ComponentFixture<ForumListComponent>;
  let topicServiceSpy: jasmine.SpyObj<TopicService>;
  let postServiceSpy: jasmine.SpyObj<PostService>;

  // Datos de prueba
  const mockTopics: Topic[] = [
    { id: 1, nombre: 'Topic 1', descripcion: 'Description 1' },
    { id: 2, nombre: 'Topic 2', descripcion: 'Description 2' },
    { id: 3, nombre: 'Topic 3', descripcion: 'Description 3' }
  ];

  const mockPosts: Post[] = [
    { id: 1, titulo: 'Post 1', contenido: 'Content 1', autor: 'User 1', autor_id: 1, topico_id: 1 },
    { id: 2, titulo: 'Post 2', contenido: 'Content 2', autor: 'User 2', autor_id: 2, topico_id: 1 },
    { id: 3, titulo: 'Post 3', contenido: 'Content 3', autor: 'User 1', autor_id: 1, topico_id: 2 },
    { id: 4, titulo: 'Post 4', contenido: 'Content 4', autor: 'User 3', autor_id: 3, topico_id: 2 },
    { id: 5, titulo: 'Post 5', contenido: 'Content 5', autor: 'User 2', autor_id: 2, topico_id: 3 }
  ];

  beforeEach(async () => {
    // Crear spies para los servicios
    const topicSpy = jasmine.createSpyObj('TopicService', ['getAllTopics']);
    const postSpy = jasmine.createSpyObj('PostService', ['getAllPosts']);

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        { provide: TopicService, useValue: topicSpy },
        { provide: PostService, useValue: postSpy }
      ]
    }).compileComponents();

    topicServiceSpy = TestBed.inject(TopicService) as jasmine.SpyObj<TopicService>;
    postServiceSpy = TestBed.inject(PostService) as jasmine.SpyObj<PostService>;
  });

  beforeEach(() => {
    // Configurar el comportamiento predeterminado de los spies
    topicServiceSpy.getAllTopics.and.returnValue(of(mockTopics));
    postServiceSpy.getAllPosts.and.returnValue(of(mockPosts));
    
    fixture = TestBed.createComponent(ForumListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load topics on init', () => {
    expect(topicServiceSpy.getAllTopics).toHaveBeenCalled();
    expect(component.topics).toEqual(mockTopics);
  });

  it('should load posts on init', () => {
    expect(postServiceSpy.getAllPosts).toHaveBeenCalled();
    expect(component.posts).toEqual(mockPosts);
    expect(component.filteredPosts).toEqual(mockPosts);
    expect(component.loading).toBeFalse();
  });

  it('should handle error when loading topics', () => {
    // Configurar el spy para devolver un error
    topicServiceSpy.getAllTopics.and.returnValue(throwError(() => new Error('Error loading topics')));
    postServiceSpy.getAllPosts.and.returnValue(of([]));
    
    // Recrear el componente para activar ngOnInit
    fixture = TestBed.createComponent(ForumListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    expect(component.error).toBe('Error al cargar los tópicos');
    expect(component.loading).toBeFalse();
  });

  it('should handle error when loading posts', () => {
    // Configurar el spy para devolver un error
    topicServiceSpy.getAllTopics.and.returnValue(of([]));
    postServiceSpy.getAllPosts.and.returnValue(throwError(() => new Error('Error loading posts')));
    
    // Recrear el componente para activar ngOnInit
    fixture = TestBed.createComponent(ForumListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    expect(component.error).toBe('Error al cargar las publicaciones');
    expect(component.loading).toBeFalse();
  });

  it('should filter posts by topic', () => {
    // Filtrar por el primer tópico
    component.filterByTopic(mockTopics[0]);
    
    // Deberían mostrarse solo los posts del tópico 1
    expect(component.selectedTopic).toBe(mockTopics[0]);
    expect(component.filteredPosts.length).toBe(2);
    expect(component.filteredPosts.every(post => post.topico_id === 1)).toBeTrue();
  });

  it('should filter posts by another topic', () => {
    // Filtrar por el segundo tópico
    component.filterByTopic(mockTopics[1]);
    
    // Deberían mostrarse solo los posts del tópico 2
    expect(component.selectedTopic).toBe(mockTopics[1]);
    expect(component.filteredPosts.length).toBe(2);
    expect(component.filteredPosts.every(post => post.topico_id === 2)).toBeTrue();
  });

  it('should show all posts when filter is cleared', () => {
    // Primero filtrar por un tópico
    component.filterByTopic(mockTopics[0]);
    
    // Luego limpiar el filtro
    component.filterByTopic(null);
    
    // Deberían mostrarse todos los posts
    expect(component.selectedTopic).toBeNull();
    expect(component.filteredPosts).toEqual(component.posts);
    expect(component.filteredPosts.length).toBe(5);
  });

  it('should handle empty posts array', () => {
    // Configurar para que no haya posts
    postServiceSpy.getAllPosts.and.returnValue(of([]));
    
    // Recrear el componente
    fixture = TestBed.createComponent(ForumListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    // Intentar filtrar
    component.filterByTopic(mockTopics[0]);
    
    // No debería haber posts filtrados
    expect(component.filteredPosts.length).toBe(0);
  });

  it('should handle empty topics array', () => {
    // Configurar para que no haya tópicos
    topicServiceSpy.getAllTopics.and.returnValue(of([]));
    
    // Recrear el componente
    fixture = TestBed.createComponent(ForumListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
    expect(component.topics.length).toBe(0);
  });

  it('should handle both successful loads', () => {
    expect(component.topics).toEqual(mockTopics);
    expect(component.posts).toEqual(mockPosts);
    expect(component.loading).toBeFalse();
    expect(component.error).toBe('');
  });

  it('should handle filtering by non-existent topic id', () => {
    // Crear un tópico que no tiene posts asociados
    const nonExistentTopic: Topic = { id: 999, nombre: 'Non-existent', descripcion: 'No posts' };
    
    // Filtrar por ese tópico
    component.filterByTopic(nonExistentTopic);
    
    // No debería haber posts filtrados
    expect(component.filteredPosts.length).toBe(0);
  });
});