import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PostService } from '../../../services/post.service';
import { CommentService } from '../../../services/comment.service';
import { AuthService } from '../../../services/auth.service';
import { Post } from '../../../models/post.model';
import { Comment } from '../../../models/comment.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-post-detail',
  standalone: true,

  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './post-detail.component.html',
  styleUrls: ['./post-detail.component.css']
})
export class PostDetailComponent implements OnInit {
  post: Post | null = null;
  comments: Comment[] = [];
  commentForm!: FormGroup;
  loading = true;
  submitting = false;
  error = '';
  success = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private postService: PostService,
    private commentService: CommentService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.commentForm = this.formBuilder.group({
      mensaje: ['', [Validators.required, Validators.minLength(5)]]
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPost(+id);
      this.loadComments();
    } else {
      this.router.navigate(['/foro']);
    }
  }

  get f() { return this.commentForm.controls; }

  loadPost(id: number): void {
    this.postService.getPostById(id).subscribe({
      next: (data) => {
        this.post = data;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Error al cargar la publicación';
        this.loading = false;
      }
    });
  }

  loadComments(): void {
    // En un caso real, deberías tener un endpoint para obtener comentarios por post_id
    this.commentService.getAllComments().subscribe({
      next: (data) => {
        // Filtramos comentarios por post_id
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
          this.comments = data.filter(comment => comment.post_id === +id);
        }
      },
      error: (error) => {
        this.error = 'Error al cargar los comentarios';
      }
    });
  }

  submitComment(): void {
    this.submitting = true;
    this.error = '';
    this.success = '';
    
    if (this.commentForm.invalid || !this.post) {
      this.submitting = false;
      return;
    }
    
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) {
      this.error = 'Debe iniciar sesión para comentar';
      this.submitting = false;
      return;
    }
    
    const newComment: Comment = {
      mensaje: this.f['mensaje'].value,
      post_id: this.post.id!,
      autor: currentUser.username,
      autor_id: currentUser.id!
    };
    
    this.commentService.addComment(newComment).subscribe({
      next: (comment) => {
        this.success = 'Comentario añadido con éxito';
        this.comments.push(comment);
        this.commentForm.reset();
        this.submitting = false;
      },
      error: (error) => {
        this.error = 'Error al añadir el comentario';
        this.submitting = false;
      }
    });
  }

  isLoggedIn(): boolean {
    return !!this.authService.currentUserValue;
  }

  isAdmin(): boolean {
    const currentUser = this.authService.currentUserValue;
    // Suponiendo que el role_id 1 es para administradores
    return currentUser?.role?.id === 1;
  }

  deleteComment(commentId: number): void {
    if (confirm('¿Está seguro de que desea eliminar este comentario?')) {
      this.commentService.deleteComment(commentId).subscribe({
        next: () => {
          this.comments = this.comments.filter(c => c.id !== commentId);
          this.success = 'Comentario eliminado con éxito';
        },
        error: (error) => {
          this.error = 'Error al eliminar el comentario';
        }
      });
    }
  }

  deletePost(): void {
    if (confirm('¿Está seguro de que desea eliminar esta publicación?')) {
      if (this.post) {
        this.postService.deletePost(this.post.id!).subscribe({
          next: () => {
            this.router.navigate(['/foro'], { queryParams: { deleted: 'true' } });
          },
          error: (error) => {
            this.error = 'Error al eliminar la publicación';
          }
        });
      }
    }
  }
}