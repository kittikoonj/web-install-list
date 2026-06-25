import { Component, input, output } from '@angular/core';

export interface ImageViewItem {
  url: string;
  originalName: string;
}

@Component({
  selector: 'app-image-viewer',
  template: `
    @if (image()) {
      <div class="image-viewer-overlay" (click)="close()">
        <div class="image-viewer" (click)="$event.stopPropagation()">
          <div class="image-viewer-header">
            <span class="image-name">{{ image()!.originalName }}</span>
            <button type="button" class="icon-btn" (click)="close()" aria-label="ปิด">
              <i class="ti ti-x"></i>
            </button>
          </div>
          <div class="image-viewer-body">
            <img [src]="image()!.url" [alt]="image()!.originalName" />
          </div>
          <div class="image-viewer-footer">
            <a
              [href]="image()!.url"
              target="_blank"
              rel="noopener"
              class="btn btn-sm"
            >
              <i class="ti ti-external-link"></i> เปิดในแท็บใหม่
            </a>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .image-viewer-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      padding: 20px;
    }

    .image-viewer {
      background: #fff;
      border-radius: 12px;
      max-width: min(920px, 96vw);
      max-height: 92vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
    }

    .image-viewer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 16px;
      border-bottom: 1px solid var(--color-border);
    }

    .image-name {
      font-size: 14px;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .image-viewer-body {
      padding: 16px;
      overflow: auto;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fafaf9;

      img {
        max-width: 100%;
        max-height: calc(92vh - 140px);
        object-fit: contain;
        border-radius: 8px;
      }
    }

    .image-viewer-footer {
      display: flex;
      justify-content: flex-end;
      padding: 12px 16px;
      border-top: 1px solid var(--color-border);
    }
  `,
})
export class ImageViewerComponent {
  image = input<ImageViewItem | null>(null);
  closed = output<void>();

  close() {
    this.closed.emit();
  }
}
