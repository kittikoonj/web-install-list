import { Component, inject, OnInit, signal } from '@angular/core';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit {
  private readonly api = inject(ApiService);

  settings = signal<Record<string, unknown> | null>(null);

  ngOnInit() {
    this.api.getSettings().subscribe((data) => this.settings.set(data));
  }
}
