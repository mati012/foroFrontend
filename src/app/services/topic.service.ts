import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Topic } from '../models/topic.model';

@Injectable({
  providedIn: 'root'
})
export class TopicService {
  private apiUrl = 'http://localhost:8080/topicos';

  constructor(private http: HttpClient) { }

  getAllTopics(): Observable<Topic[]> {
    return this.http.get<Topic[]>(this.apiUrl);
  }

  getTopicById(id: number): Observable<Topic> {
    return this.http.get<Topic>(`${this.apiUrl}/${id}`);
  }
}