// banner.js
export class BannerSlider {
  constructor(containerId, jsonPath, intervalTime = 4000) {
    this.container = document.getElementById(containerId);
    this.jsonPath = jsonPath;
    this.intervalTime = intervalTime;
    this.bannerImages = [];
    this.currentIndex = 0;
    this.intervalId = null;
    this.track = null;
  }

  async loadBanners() {
    try {
      const res = await fetch(this.jsonPath);
      if (!res.ok) throw new Error('Failed to load banner images JSON');
      this.bannerImages = await res.json();

      if (!Array.isArray(this.bannerImages) || this.bannerImages.length === 0) return;

      this.createTrack();
      this.startSlideRotation();
    } catch (err) {
      console.error('BannerSlider error:', err);
    }
  }

  createTrack() {
    this.track = document.createElement('div');
    this.track.className = 'banner-track';

    this.bannerImages.forEach(src => {
      const img = document.createElement('img');
      img.src = src;
      img.className = 'banner-slide';
      this.track.appendChild(img);
    });

    // Set banner-track width dynamically: number_of_slides * 100%
    this.track.style.width = `${this.bannerImages.length * 100}%`;

    this.container.innerHTML = '';
    this.container.appendChild(this.track);
  }

  startSlideRotation() {
    if (this.intervalId) clearInterval(this.intervalId);
    this.intervalId = setInterval(() => this.nextSlide(), this.intervalTime);
  }

  nextSlide() {
    this.currentIndex = (this.currentIndex + 1) % this.bannerImages.length;
    const offset = -this.currentIndex * 100;
    this.track.style.transform = `translateX(${offset}%)`;
  }

  stop() {
    if (this.intervalId) clearInterval(this.intervalId);
  }
}
