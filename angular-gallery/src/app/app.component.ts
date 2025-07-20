import { CommonModule } from '@angular/common';
import { Component, AfterViewInit, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SwiperContainer } from 'swiper/element';
import { register } from 'swiper/element/bundle';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],

})
export class AppComponent implements AfterViewInit {
  @ViewChild('swiperRef') swiperRef!: ElementRef<SwiperContainer>;
  images = [
    'assets/5l.png',
    'assets/6l.png',
    'assets/7l.png',
  ];
  currentIndex = 0;

  ngAfterViewInit() {
    register();
    const swiper = this.swiperRef.nativeElement;
    const config = {
      slidesPerView: 1,
      spaceBetween: 10,
      loop: true,
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
        renderBullet: (index: number, className: string) => {
          return `<span class="${className}"></span>`;
        }
      },
      on: {
        slideChange: () => {
          this.currentIndex = swiper.swiper.realIndex;
        },
      },
    };
    Object.assign(swiper, config);
    swiper.initialize();
  }
}

