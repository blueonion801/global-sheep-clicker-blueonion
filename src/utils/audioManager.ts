import { Howl, Howler } from 'howler';

class AudioManager {
  private clickSound: Howl | null = null;
  private guiSound: Howl | null = null;
  private tierUpSound: Howl | null = null;
  private enabled: boolean = true;

  constructor() {
    this.enabled = localStorage.getItem('audio_enabled') !== 'false';
    this.loadSounds();
  }

  loadSounds() {
    try {
      this.clickSound = new Howl({
        src: ['/audio/brown-cherry-mx-switch-click.mp3'],
        volume: 0.9,
        preload: true
      });

      this.guiSound = new Howl({
        src: ['/audio/click-buttons-ui-menu-sounds-effects-button-2-203594.mp3'],
        volume: 0.7,
        preload: true
      });

      this.tierUpSound = new Howl({
        src: ['/audio/90s-game-ui-6-185099.mp3'],
        volume: 0.5,
        preload: true
      });
    } catch (error) {
      console.warn('Failed to load audio files:', error);
    }
  }

  playClickSound() {
    if (this.enabled && this.clickSound) {
      this.clickSound.play();
    }
  }

  playGuiSound() {
    if (this.enabled && this.guiSound) {
      this.guiSound.play();
    }
  }

  playTierUpSound() {
    if (this.enabled && this.tierUpSound) {
      this.tierUpSound.play();
    }
  }

  playNotificationSound() {
    if (this.enabled && this.guiSound) {
      // Use a lower volume for notifications to avoid being intrusive
      const originalVolume = this.guiSound.volume();
      this.guiSound.volume(0.2);
      this.guiSound.play();
      // Reset volume after playing
      setTimeout(() => this.guiSound.volume(originalVolume), 100);
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    localStorage.setItem('audio_enabled', enabled.toString());
    Howler.mute(!enabled);
  }

  isAudioEnabled(): boolean {
    return this.enabled;
  }

  setVolume(volume: number) {
    Howler.volume(volume);
  }
}

export const audioManager = new AudioManager();