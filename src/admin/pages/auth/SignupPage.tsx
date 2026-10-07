import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { ApiError } from '../../../services/http';
import { TextField, TextareaField } from '../../components/forms/Field';
import { ToggleField } from '../../components/forms/ToggleField';
import { BrandMark } from '../../components/BrandMark';
import { ModeToggle } from '../../components/ModeToggle';
import { VERTICAL_LABEL, VERTICAL_DESCRIPTION, VERTICAL_MODULE_DEFAULTS, type ModuleDefault } from '../../../data/onboardingDefaults';
import { VERTICALS, THEME_PRESETS } from '../../../types';
import type { Vertical } from '../../../types';

const MODULE_TITLE: Record<string, string> = { items: 'Items', catalog: 'Catalog', booking: 'Booking', membership: 'Membership' };

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const STEP_TITLES = ['Business type', 'Name your site', 'Choose your pages', 'Branding', 'Publish'];

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [vertical, setVertical] = useState<Vertical | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [modules, setModules] = useState<ModuleDefault[]>([]);
  const [themePresetId, setThemePresetId] = useState(THEME_PRESETS[0].id);
  const [tagline, setTagline] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ orgCode: string; emailDeliveryConfigured?: boolean; emailVerificationRequiredForPublish?: boolean } | null>(null);

  const pickVertical = (v: Vertical) => {
    setVertical(v);
    setModules(VERTICAL_MODULE_DEFAULTS[v].map((m) => ({ ...m })));
  };

  const updateModule = (index: number, patch: Partial<ModuleDefault>) => {
    setModules((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  };

  const canContinue = () => {
    if (step === 1) return vertical !== null;
    if (step === 2) return Boolean(name.trim() && slug.trim() && ownerName.trim() && /\S+@\S+\.\S+/.test(ownerEmail) && password.length >= 10 && password.length <= 128 && /[a-z]/i.test(password) && /\d/.test(password) && password === passwordConfirmation);
    return true;
  };

  const handleNext = () => {
    if (!canContinue()) {
      setError(step === 2 ? 'Complete all fields. Your password must contain 10–128 characters, including letters and numbers, and both passwords must match.' : 'Choose a business type to continue.');
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, 5));
  };

  const handleSubmit = async () => {
    if (!vertical) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const { orgCode, emailDeliveryConfigured, emailVerificationRequiredForPublish } = await signup({
        organizationName: name.trim(),
        vertical,
        siteName: name.trim(),
        slug,
        ownerName: ownerName.trim(),
        ownerEmail: ownerEmail.trim(),
        password,
        passwordConfirmation,
        modules,
        branding: { themePresetId, tagline: tagline.trim() },
      });
      setResult({ orgCode, emailDeliveryConfigured, emailVerificationRequiredForPublish });
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong creating your site.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="astryd-bg relative min-h-screen flex items-center justify-center px-4 font-sans">
        <div className="absolute right-4 top-4 z-20"><ModeToggle /></div>
        <div className="relative z-10 w-full max-w-md text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-on-primary">
            <Check className="h-7 w-7" />
          </div>
          <h1 className="text-[24px] font-semibold text-on-surface mt-5 tracking-tight">Your site is ready to edit</h1>
          <p className="text-sm text-secondary mt-2">
            Save your Organization ID below. {result.emailVerificationRequiredForPublish !== false ? 'Verify your email, then edit and publish when ready.' : 'Edit your draft, preview it, then publish when ready. Email verification is deferred.'} Your site address is <span className="font-mono">/s/{slug}</span>.
          </p>

          {result.emailVerificationRequiredForPublish !== false && result.emailDeliveryConfigured === false && (
            <p role="status" className="text-sm text-secondary mt-4">Your account and draft are saved. Email delivery is not configured yet; contact the platform team to enable verification before publishing.</p>
          )}

          <div className="admin-card p-6 mt-6 text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-1">Organization ID</p>
            <p className="text-2xl font-mono font-bold text-primary">{result.orgCode}</p>
            <p className="text-xs text-secondary mt-3">
              Sign in at <span className="font-mono">/login</span> with this Organization ID, {ownerEmail}, and your chosen password.
            </p>
          </div>

          <button
            onClick={() => navigate('/admin', { replace: true })}
            className="w-full mt-6 py-3 rounded-full bg-primary text-on-primary font-bold text-sm hover:bg-primary-container transition-colors"
          >
            Go to your Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="astryd-bg relative min-h-screen flex items-center justify-center px-4 py-10 font-sans">
      <div className="absolute right-4 top-4 z-20"><ModeToggle /></div>
      <div className="relative z-10 w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center"><BrandMark /></div>
          <h1 className="text-[24px] font-semibold text-on-surface mt-4 tracking-tight">Create your site</h1>
          <p className="text-[13px] text-secondary mt-1.5">Five quick steps and you're live.</p>
        </div>

        <div className="flex items-center gap-2 mb-6">
          {STEP_TITLES.map((title, i) => (
            <div key={title} className="flex-1">
              <div className={`h-1.5 rounded-full transition-colors ${i + 1 <= step ? 'bg-primary' : 'bg-outline-variant/30'}`} />
              <p className={`text-[11px] mt-1.5 font-semibold hidden sm:block ${i + 1 === step ? 'text-primary' : 'text-secondary'}`}>{title}</p>
            </div>
          ))}
        </div>

        <div className="astryd-auth-card !max-w-none p-8">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-on-surface">What kind of business is this?</h2>
              <p className="text-sm text-secondary">This only picks sensible defaults below - you can change anything, any time.</p>
              <div className="grid sm:grid-cols-3 gap-3 mt-2">
                {VERTICALS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => pickVertical(v)}
                    className={`text-left p-4 rounded-2xl border-2 transition-all ${
                      vertical === v ? 'border-primary bg-primary/5' : 'border-outline-variant/30 hover:border-primary/40'
                    }`}
                  >
                    <div className="font-bold text-on-surface">{VERTICAL_LABEL[v]}</div>
                    <div className="text-xs text-secondary mt-1 leading-relaxed">{VERTICAL_DESCRIPTION[v]}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-on-surface">Name your site</h2>
              <TextField
                label="Business name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slugTouched) setSlug(slugify(e.target.value));
                }}
                placeholder="Acme Fitness"
                required
              />
              <TextField
                label="Subdomain"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(slugify(e.target.value));
                }}
                hint={slug ? `Site address: /s/${slug}` : 'Lowercase letters, numbers, and hyphens only.'}
                required
              />
              <div className="grid sm:grid-cols-2 gap-4">
                <TextField label="Your name" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} required />
                <TextField
                  label="Your email"
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  hint="Used to sign in - along with the Organization ID we'll give you."
                  required
                />
              </div>
              <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} hint="At least 10 characters, including letters and numbers." required />
              <TextField label="Confirm password" type="password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} required />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-on-surface mb-1">Choose your pages</h2>
              <p className="text-sm text-secondary mb-4">Pre-filled for a {vertical ? VERTICAL_LABEL[vertical] : ''} - rename, enable, or disable anything.</p>
              <div className="divide-y divide-outline-variant/10">
                {modules.map((m, i) => (
                  <div key={m.module} className="py-3 flex items-center gap-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-secondary w-24 shrink-0">
                      {MODULE_TITLE[m.module]}
                    </span>
                    <TextField
                      wrapperClassName="flex-1"
                      value={m.navLabel}
                      onChange={(e) => updateModule(i, { navLabel: e.target.value })}
                    />
                    <ToggleField label="" checked={m.enabled} onChange={(enabled) => updateModule(i, { enabled })} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-on-surface">Branding quickstart</h2>
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">Theme</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {THEME_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setThemePresetId(preset.id)}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${
                        themePresetId === preset.id ? 'border-primary' : 'border-outline-variant/30 hover:border-primary/40'
                      }`}
                    >
                      <span className="block h-8 w-full rounded-lg mb-2" style={{ backgroundColor: preset.colors.primary }} />
                      <span className="text-xs font-semibold text-on-surface">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <TextareaField
                label="Tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                rows={3}
                placeholder="A short line describing what you do - shown on your homepage."
              />
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-on-surface">Review & publish</h2>
              <dl className="text-sm divide-y divide-outline-variant/10">
                <div className="flex justify-between py-2.5"><dt className="text-secondary">Business</dt><dd className="font-semibold text-on-surface">{name}</dd></div>
                <div className="flex justify-between py-2.5"><dt className="text-secondary">Type</dt><dd className="font-semibold text-on-surface">{vertical && VERTICAL_LABEL[vertical]}</dd></div>
                <div className="flex justify-between py-2.5"><dt className="text-secondary">Address</dt><dd className="font-mono text-on-surface">/s/{slug}</dd></div>
                <div className="flex justify-between py-2.5"><dt className="text-secondary">Owner</dt><dd className="font-semibold text-on-surface">{ownerName} ({ownerEmail})</dd></div>
                <div className="flex justify-between py-2.5">
                  <dt className="text-secondary">Pages</dt>
                  <dd className="font-semibold text-on-surface text-right">
                    {modules.filter((m) => m.enabled).map((m) => m.navLabel).join(', ') || 'None enabled'}
                  </dd>
                </div>
              </dl>
              <p className="text-xs text-secondary bg-surface-container-low rounded-xl p-3">
                Your chosen password will be stored securely. Your new site starts as a draft; you can preview it before publishing.
              </p>
            </div>
          )}

          {error && <p role="alert" className="mt-4 text-sm text-error font-medium">{error}</p>}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-outline-variant/10">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-secondary hover:text-on-surface transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            ) : (
              <Link to="/login" className="text-sm text-secondary hover:text-on-surface hover:underline">
                Already have a site? Sign in
              </Link>
            )}

            {step < 5 ? (
              <button
                type="button"
                disabled={step === 1 && !canContinue()}
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-primary text-on-primary font-bold text-sm hover:bg-primary-container transition-colors disabled:opacity-40 shadow-md shadow-primary/20"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-primary text-on-primary font-bold text-sm hover:bg-primary-container transition-colors disabled:opacity-50 shadow-md shadow-primary/20"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? 'Publishing...' : 'Create my site'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
