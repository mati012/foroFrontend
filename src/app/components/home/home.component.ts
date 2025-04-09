import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PostService } from '../../services/post.service';
import { TopicService } from '../../services/topic.service';
import { Post } from '../../models/post.model';
import { Topic } from '../../models/topic.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  recentPosts: Post[] = [];
  topics: Topic[] = [];
  loading = true;
  error = '';

  constructor(
    private postService: PostService,
    private topicService: TopicService
  ) { }

  ngOnInit(): void {
    this.loadTopics();
    this.loadRecentPosts();
  }

  loadTopics(): void {
    this.topicService.getAllTopics().subscribe({
      next: (data) => {
        this.topics = data;
      },
      error: (error) => {
        this.error = 'Error al cargar los tópicos';
      }
    });
  }

  loadRecentPosts(): void {
    this.postService.getAllPosts().subscribe({
      next: (data) => {
        // Ordenamos por ID descendente para simular los más recientes
        this.recentPosts = data
          .sort((a, b) => (b.id || 0) - (a.id || 0))
          .slice(0, 5); // Solo los 5 más recientes
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Error al cargar las publicaciones recientes';
        this.loading = false;
      }
    });
  }
}