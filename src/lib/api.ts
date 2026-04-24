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
  about: {
    eyebrow: string;
    heading: string;
    body: string;
    worldwideText: string;
    worldwideLinkLabel: string;
    worldwideUrl: string;
  };
  what: { eyebrow: string; heading: string; body: string };
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
    date: string;
    talkTime: string;
    danceTime: string;
    danceNote: string;
    venue: string;
    address: string;
    price: string;
    priceNote: string;
    liveMusic: string;
    liveMusicNote: string;
    talkNote: string;
    labelDate: string;
    labelTalk: string;
    labelDance: string;
    labelVenue: string;
    labelPrice: string;
    labelLiveMusic: string;
    tag1: string;
    tag2: string;
    tag3: string;
  };
  closing: { eyebrow: string; heading: string; body: string };
  signup: {
    nameLabel: string;
    emailLabel: string;
    phoneLabel: string;
    phoneOptional: string;
    didBeforeLabel: string;
    didBeforeNote: string;
    hasCiLabel: string;
    noTalkLabel: string;
    noTalkNote: string;
    submitLabel: string;
    submittingLabel: string;
    successHeading: string;
    successBody: string;
    successButton: string;
    footnote: string;
  };
};

export type Me = {
  user: { sub: string; email: string; name: string; picture: string | null; isAdmin: boolean } | null;
  oidcConfigured: boolean;
};

export type Signup = {
  id: number;
  ts: string;
  name: string;
  email: string;
  phone: string;
  didUnderscoreBefore: boolean;
  hasCiExperience: boolean;
  cannotAttendTalk: boolean;
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
  name: string;
  email: string;
  phone: string;
  didUnderscoreBefore: boolean;
  hasCiExperience: boolean;
  cannotAttendTalk: boolean;
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

export async function fetchSignups(): Promise<{ count: number; rows: Signup[] }> {
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
