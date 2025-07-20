import { appConfig } from './app/app.config';
import { provideHttpClient } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AppComponent } from './app/app.component';
import { AudioRecorderComponent } from './app/audio-recorder/audio-recorder.component';
import { MatButtonModule } from '@angular/material/button';

bootstrapApplication(AppComponent, {
  providers: [
    provideAnimations(),
    provideHttpClient(),
    { provide: 'audioRecorder', useValue: AudioRecorderComponent }
  ]
}).catch(err => console.error(err));