import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Issue, IssueAttachment, IssueComment, IssueStatus, InstallList } from '../../core/models';
import { ISSUE_STATUS } from '../../core/constants';
import {
  ImageViewerComponent,
  ImageViewItem,
} from '../../shared/image-viewer/image-viewer.component';

@Component({
  selector: 'app-issues',
  imports: [FormsModule, DatePipe, ImageViewerComponent],
  templateUrl: './issues.component.html',
  styleUrl: './issues.component.scss',
})
export class IssuesComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);

  issues = signal<Issue[]>([]);
  installLists = signal<InstallList[]>([]);
  search = '';
  filterListId = '';
  filterStatus = '';
  highlightIssueId: number | null = null;
  commentText = '';
  issueComments = signal<IssueComment[]>([]);
  showModal = signal(false);
  editing = signal<Issue | null>(null);
  saving = signal(false);
  uploading = signal(false);
  pendingFiles = signal<File[]>([]);
  currentAttachments = signal<IssueAttachment[]>([]);
  viewingImage = signal<ImageViewItem | null>(null);
  private blobUrls: string[] = [];

  form = {
    installListId: 0,
    title: '',
    description: '',
    status: 'open' as IssueStatus,
  };

  readonly statusOptions: IssueStatus[] = [
    'open',
    'in_progress',
    'resolved',
    'closed',
  ];
  readonly statusMeta = ISSUE_STATUS;

  ngOnInit() {
    this.loadInstallLists();
    this.route.queryParamMap.subscribe((params) => {
      this.filterListId = params.get('installListId') ?? '';
      const issueId = params.get('issueId');
      this.highlightIssueId = issueId ? +issueId : null;
      this.load();
    });
  }

  loadInstallLists() {
    this.api.getInstallLists(true).subscribe((lists) => {
      this.installLists.set(lists);
    });
  }

  load() {
    const listId = this.filterListId ? +this.filterListId : undefined;
    this.api
      .getIssues(
        this.search.trim() || undefined,
        listId,
        true,
        this.filterStatus || undefined,
      )
      .subscribe((data) => this.issues.set(data));
  }

  openCreate() {
    this.editing.set(null);
    this.pendingFiles.set([]);
    this.currentAttachments.set([]);
    this.form = {
      installListId: this.filterListId
        ? +this.filterListId
        : (this.installLists()[0]?.id ?? 0),
      title: '',
      description: '',
      status: 'open',
    };
    this.showModal.set(true);
  }

  openEdit(issue: Issue) {
    this.editing.set(issue);
    this.pendingFiles.set([]);
    this.currentAttachments.set(issue.attachments ?? []);
    this.form = {
      installListId: issue.installListId,
      title: issue.title,
      description: issue.description ?? '',
      status: issue.status,
    };
    this.showModal.set(true);
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.pendingFiles.update((files) => [...files, ...Array.from(input.files!)]);
    input.value = '';
  }

  removePendingFile(index: number) {
    this.pendingFiles.update((files) => files.filter((_, i) => i !== index));
  }

  deleteAttachment(attachment: IssueAttachment) {
    const issue = this.editing();
    if (!issue || !confirm(`ลบไฟล์ "${attachment.originalName}"?`)) return;
    this.api.deleteIssueAttachment(issue.id, attachment.id).subscribe({
      next: (updated) => {
        this.currentAttachments.set(updated.attachments ?? []);
        this.load();
      },
    });
  }

  private finishSave() {
    this.saving.set(false);
    this.uploading.set(false);
    this.showModal.set(false);
    this.pendingFiles.set([]);
    this.load();
  }

  private uploadPending(issueId: number) {
    const files = this.pendingFiles();
    if (!files.length) {
      this.finishSave();
      return;
    }
    this.uploading.set(true);
    this.api.uploadIssueAttachments(issueId, files).subscribe({
      next: () => this.finishSave(),
      error: () => {
        this.uploading.set(false);
        this.saving.set(false);
      },
    });
  }

  save() {
    if (!this.form.title.trim() || !this.form.installListId) return;
    this.saving.set(true);

    const payload = {
      installListId: this.form.installListId,
      title: this.form.title.trim(),
      description: this.form.description.trim() || undefined,
      status: this.form.status,
    };

    const obs = this.editing()
      ? this.api.updateIssue(this.editing()!.id, payload)
      : this.api.createIssue(payload);

    obs.subscribe({
      next: (issue) => this.uploadPending(issue.id),
      error: () => this.saving.set(false),
    });
  }

  deleteIssue(issue: Issue) {
    if (!confirm(`ลบ issue "${issue.title}"?`)) return;
    this.api.deleteIssue(issue.id).subscribe(() => this.load());
  }

  listName(issue: Issue): string {
    return issue.installList?.name ?? `#${issue.installListId}`;
  }

  statusLabel(status: IssueStatus): string {
    return this.statusMeta[status]?.label ?? status;
  }

  statusStyle(status: IssueStatus) {
    const meta = this.statusMeta[status];
    return meta ? { background: meta.bg, color: meta.fg } : {};
  }

  imageAttachments(issue: Issue): IssueAttachment[] {
    return (issue.attachments ?? []).filter((a) => a.fileType === 'image');
  }

  fileAttachments(issue: Issue): IssueAttachment[] {
    return (issue.attachments ?? []).filter((a) => a.fileType === 'file');
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  isHighlighted(issueId: number): boolean {
    return this.highlightIssueId === issueId;
  }

  viewAttachment(att: IssueAttachment) {
    this.viewingImage.set({ url: att.url, originalName: att.originalName });
  }

  viewPendingFile(file: File) {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    this.blobUrls.push(url);
    this.viewingImage.set({ url, originalName: file.name });
  }

  closeImageView() {
    this.viewingImage.set(null);
  }

  isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  ngOnDestroy() {
    for (const url of this.blobUrls) {
      URL.revokeObjectURL(url);
    }
  }
}
