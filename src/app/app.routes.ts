import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { RecoverPasswordComponent } from './components/auth/recover-password/recover-password.component';
import { ProfileComponent } from './components/auth/profile/profile.component';
import { ForumListComponent } from './components/forum/forum-list/forum-list.component';
import { PostDetailComponent } from './components/forum/post-detail/post-detail.component';
import { CreatePostComponent } from './components/forum/create-post/create-post.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'auth',
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'registro', component: RegisterComponent },
      { path: 'recuperar-password', component: RecoverPasswordComponent },
      { path: 'perfil', component: ProfileComponent, canActivate: [AuthGuard] }
    ]
  },
  {
    path: 'foro',
    children: [
      { path: '', component: ForumListComponent },
      { 
        path: 'publicacion/:id', 
        component: PostDetailComponent 
      },
      { path: 'crear', component: CreatePostComponent, canActivate: [AuthGuard] }
    ]
  },
  { path: '**', redirectTo: '' }
];