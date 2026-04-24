export type Content = {
  header: { brand: string };
  footer: { brand: string; tagline: string };
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    tagline: string;
    sublabel: string;
    signupCta: string;
    aboutCta: string;
    logoUrl: string;
  };
  about: { blocks: AboutBlock[] };
  gallery: {
    heading: string;
    subtitle: string;
    venueCaption: string;
    caption: string;
    venueImage: { url: string; alt: string };
    images: Array<{ url: string; alt: string }>;
  };
  event: {
    eyebrow: string;
    heroLine1: string;
    heroLine2: string;
    heroBody: string;
    tag1: string;
    tag2: string;
    tag3: string;
    rows: EventRow[];
  };
  closing: { eyebrow: string; heading: string; body: string };
  signup: {
    fields: SignupField[];
    submitLabel: string;
    submittingLabel: string;
    successHeading: string;
    successBody: string;
    successButton: string;
    footnote: string;
  };
};

export type BlockAccent = 'coral' | 'sage' | 'mustard' | 'terracotta';

export type AboutBlock = {
  id: string;
  accent: BlockAccent;
  eyebrow: string;
  heading: string;
  body: string;
  link?: { text: string; label: string; url: string };
};

export type EventRow = {
  id: string;
  label: string;
  value: string;
  note?: string;
};

export type EditCtx = {
  canEdit: boolean;
  setField: (path: string[], value: unknown) => void;
  updateDraft: (mutate: (draft: Content) => void) => void;
};

export type SignupFieldKind =
  | 'text'
  | 'multiline'
  | 'email'
  | 'phone'
  | 'checkbox'
  | 'radio';

export type SignupRadioOption = { id: string; label: string };

export type SignupField = {
  id: string;
  kind: SignupFieldKind;
  label: string;
  note?: string;
  required?: boolean;
  options?: SignupRadioOption[];
};

export type Me = {
  user: { sub: string; email: string; name: string; picture: string | null; isAdmin: boolean } | null;
  oidcConfigured: boolean;
};

export type Signup = {
  id: number;
  ts: string;
  data: Record<string, string | boolean>;
};

export async function fetchMe(): Promise<Me> {
  const r = await fetch('/me', { credentials: 'same-origin' });
  if (!r.ok) return { user: null, oidcConfigured: false };
  return r.json();
}

export async function fetchContent(): Promise<Content> {
  const r = await fetch('/api/content');
  if (!r.ok) throw new Error('failed to load content');
  return r.json();
}

export async function saveContent(next: Content): Promise<void> {
  const r = await fetch('/api/content', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(next),
  });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'save failed');
}

export async function uploadImage(file: File): Promise<{ url: string }> {
  const r = await fetch('/api/uploads', {
    method: 'POST',
    headers: { 'content-type': file.type || 'application/octet-stream' },
    credentials: 'same-origin',
    body: file,
  });
  if (!r.ok) {
    const msg = (await r.json().catch(() => ({}))).error || 'upload failed';
    throw new Error(msg);
  }
  return r.json();
}

export async function submitSignup(payload: {
  data: Record<string, string | boolean>;
  hp: string;
  token: string;
}): Promise<void> {
  const r = await fetch('/api/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const msg = (await r.json().catch(() => ({}))).error || 'signup failed';
    throw new Error(msg);
  }
}

export async function fetchChallenge(): Promise<{ token: string }> {
  const r = await fetch('/api/challenge');
  if (!r.ok) throw new Error('challenge failed');
  return r.json();
}

export async function fetchSignups(): Promise<{
  count: number;
  fields: SignupField[];
  rows: Signup[];
}> {
  const r = await fetch('/api/signups', { credentials: 'same-origin' });
  if (!r.ok) throw new Error('failed to load signups');
  return r.json();
}

export async function deleteSignup(id: number): Promise<void> {
  const r = await fetch(`/api/signups/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });
  if (!r.ok) throw new Error('delete failed');
}
