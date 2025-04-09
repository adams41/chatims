import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SplashScreenComponent } from './shared/splash-screen/splash-screen.component'; // Путь к SplashScreenComponent
import { ChatComponent } from './chat/chat.component'; // Путь к ChatComponent

const routes: Routes = [
  { path: '', component: SplashScreenComponent }, // Путь по умолчанию
  { path: 'chat', component: ChatComponent },     // Путь для компонента чата
];

@NgModule({
  imports: [RouterModule.forRoot(routes)], // Подключение маршрутов
  exports: [RouterModule]                    // Экспорт маршрутов
})
export class AppRoutingModule {}
