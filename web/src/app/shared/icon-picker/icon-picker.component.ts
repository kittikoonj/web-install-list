import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ICON_PALETTE, ICON_CATEGORIES } from '../../core/constants';

@Component({
  selector: 'app-icon-picker',
  imports: [FormsModule],
  templateUrl: './icon-picker.component.html',
  styleUrl: './icon-picker.component.scss',
})
export class IconPickerComponent {
  @Input() selectedIcon = 'ti-database';
  @Input() selectedBg = ICON_PALETTE[0].bg;
  @Input() selectedFg = ICON_PALETTE[0].fg;
  @Output() iconChange = new EventEmitter<{ icon: string; iconBg: string; iconFg: string }>();

  readonly palette = ICON_PALETTE;
  readonly categories = Object.keys(ICON_CATEGORIES);
  activeCategory = signal('Database');
  search = signal('');

  readonly filteredIcons = computed(() => {
    const cat = this.activeCategory();
    const icons = ICON_CATEGORIES[cat] ?? [];
    const q = this.search().toLowerCase();
    if (!q) return icons;
    return icons.filter((i) => i.toLowerCase().includes(q));
  });

  selectColor(color: (typeof ICON_PALETTE)[0]) {
    this.selectedBg = color.bg;
    this.selectedFg = color.fg;
    this.emit();
  }

  selectIcon(icon: string) {
    this.selectedIcon = icon;
    this.emit();
  }

  private emit() {
    this.iconChange.emit({
      icon: this.selectedIcon,
      iconBg: this.selectedBg,
      iconFg: this.selectedFg,
    });
  }
}
