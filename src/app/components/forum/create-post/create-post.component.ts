import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TopicService } from '../../../services/topic.service';
import { PostService } from '../../../services/post.service';
import { AuthService } from '../../../services/auth.service';
import { Topic } from '../../../models/topic.model';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './create-post.component.html',
  styleUrls: ['./create-post.component.css']
})
export class CreatePostComponent implements OnInit {
  postForm!: FormGroup;
  topics: Topic[] = [];
  loading = false;
  submitting = false;
  error = '';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private topicService: TopicService,
    private postService: PostService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Redirigir si no está autenticado
    if (!this.authService.currentUserValue) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }

    this.postForm = this.formBuilder.group({
      titulo: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      contenido: ['', [Validators.required, Validators.minLength(20)]],
      topico_id: ['', Validators.required]
    });

    this.loadTopics();
  }

  get f() { return this.postForm.controls; }

  loadTopics(): void {
    this.loading = true;
    this.topicService.getAllTopics().subscribe({
      next: (data) => {
        this.topics = data;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Error al cargar los tópicos';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    this.submitting = true;
    this.error = '';
    
    if (this.postForm.invalid) {
      this.submitting = false;
      return;
    }
    
    const currentUser = this.authService.currentUserValue!;
    
    const newPost = {
      ...this.postForm.value,
      autor: currentUser.username,
      autor_id: currentUser.id
    };
    
    this.postService.createPost(newPost).subscribe({
      next: (post) => {
        this.router.navigate(['/foro/publicacion', post.id]);
      },
      error: (error) => {
        this.error = 'Error al crear la publicación';
        this.submitting = false;
      }
    });
  }
}