import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TopicService } from '../../../services/topic.service';
import { PostService } from '../../../services/post.service';
import { Topic } from '../../../models/topic.model';
import { Post } from '../../../models/post.model';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-forum-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './forum-list.component.html',
  styleUrl: './forum-list.component.css'
})
export class ForumListComponent implements OnInit {
  topics: Topic[] = [];
  posts: Post[] = [];
  filteredPosts: Post[] = [];
  selectedTopic: Topic | null = null;
  loading = true;
  error = '';

  constructor(
    private topicService: TopicService,
    private postService: PostService
  ) { }

  ngOnInit(): void {
    this.loadTopics();
    this.loadPosts();
  }

  loadTopics(): void {
    this.topicService.getAllTopics().subscribe({
      next: (data) => {
        this.topics = data;
      },
      error: (error) => {
        this.error = 'Error al cargar los tópicos';
        this.loading = false;
      }
    });
  }

  loadPosts(): void {
    this.postService.getAllPosts().subscribe({
      next: (data) => {
        this.posts = data;
        this.filteredPosts = data;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Error al cargar las publicaciones';
        this.loading = false;
      }
    });
  }

  filterByTopic(topic: Topic | null): void {
    this.selectedTopic = topic;
    
    if (topic) {
      this.filteredPosts = this.posts.filter(post => post.topico_id === topic.id);
    } else {
      this.filteredPosts = this.posts;
    }
  }
}