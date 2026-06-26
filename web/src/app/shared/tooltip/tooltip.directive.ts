import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  inject,
} from '@angular/core';

@Directive({
  selector: '[appTooltip]',
  standalone: true,
})
export class TooltipDirective implements OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);
  private tipEl: HTMLElement | null = null;

  @Input('appTooltip') text = '';
  @Input() tooltipPos: 'top' | 'bottom' = 'top';

  @HostListener('mouseenter')
  @HostListener('focusin')
  onShow() {
    const label = this.text.trim();
    if (!label) return;
    this.hide();

    const tip = document.createElement('span');
    tip.className = `app-tooltip app-tooltip-${this.tooltipPos}`;
    tip.textContent = label;
    tip.setAttribute('role', 'tooltip');
    document.body.appendChild(tip);
    this.tipEl = tip;

    requestAnimationFrame(() => this.position(tip));
  }

  @HostListener('mouseleave')
  @HostListener('focusout')
  onHide() {
    this.hide();
  }

  ngOnDestroy() {
    this.hide();
  }

  private hide() {
    this.tipEl?.remove();
    this.tipEl = null;
  }

  private position(tip: HTMLElement) {
    const host = this.host.nativeElement;
    const rect = host.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();
    const gap = 8;

    let top =
      this.tooltipPos === 'top'
        ? rect.top - tipRect.height - gap
        : rect.bottom + gap;

    let left = rect.left + rect.width / 2 - tipRect.width / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - tipRect.width - 8));
    top = Math.max(8, Math.min(top, window.innerHeight - tipRect.height - 8));

    tip.style.top = `${top}px`;
    tip.style.left = `${left}px`;
  }
}
