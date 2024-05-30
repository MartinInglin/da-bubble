import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component } from '@angular/core';

@Component({
  selector: 'app-start-animation',
  standalone: true,
  templateUrl: './start-animation.component.html',
  styleUrls: ['./start-animation.component.scss'],
  animations: [
    trigger('moveLogoLeftAnimation', [
      state('end', style({ transform: 'translateX(-50%)' })),
      transition(':enter', [
        style({ transform: 'translateX(0)' }),
        animate('500ms')
      ])
    ]),
    trigger('moveTextRightAnimation', [
      state('end', style({ transform: 'translateX(110%)' })),
      transition(':enter', [
        style({ transform: 'translateX(0)' }),
        animate('500ms 250ms')
      ])
    ]),
    trigger('moveUpTextAnimation', [
      state('end', style({ transform: 'translate(-110%, -100%)' })),
      transition('* => end', [
        style({ transform: 'translate(0, 0)' }),
        animate('500ms')
      ])
    ]),
    trigger('moveUpLogoAnimation', [
      state('end', style({ transform: 'translate(-70%, -90%)' })),
      transition('* => end', [
        style({ transform: 'translate(0, 0)' }),
        animate('500ms')
      ])
    ]),
    trigger('fadeOutBackgroundHalfAnimation', [
      state('end', style({ opacity: 0 })),
      transition('* => end', [
        style({ opacity: 1 }),
        animate('0ms')
      ])
    ]),
    trigger('fadeOutBackgroundAnimation', [
      state('end', style({ opacity: 0 })),
      transition('* => end', [
        style({ opacity: 1 }),
        animate('500ms')
      ])
    ])
  ]
})
export class StartAnimationComponent {
  logoAnimationState = '';
  textAnimationState = '';
  moveUpTextState = '';
  moveUpLogoState = '';
  fadeOutBackgroundState = '';
  fadeOutBackgroundHalfState = '';
  isVisible = true;

  ngOnInit() {
    this.logoAnimationState = 'end';
    this.textAnimationState = 'end';

    setTimeout(() => {
      this.fadeOutBackgroundHalfState = 'end';
    }, 1000);

    setTimeout(() => {
      this.moveUpTextState = 'end';
      this.moveUpLogoState = 'end';
    }, 1000);

    setTimeout(() => {
      this.fadeOutBackgroundState = 'end';
    }, 1100);

    setTimeout(() => {
      this.isVisible = false;
    }, 2000);
  }
}

