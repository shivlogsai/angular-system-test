import { Component } from '@angular/core';
import { AudioRecorderComponent } from './audio-recorder/audio-recorder.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AudioRecorderComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
  title = 'audio-recorder';
}
