import { http, HttpResponse } from 'msw';
import { db, nextId, nowIso } from '../db';
import { issueToken } from './auth';
import { provisionSite } from '../provisionSite';
import type { SignupRequest, User } from '../../types';

function uniqueOrgCode(name: string): string {
  const base = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16) || 'ORG';
  let code = base;
  let n = 2;
  while (db.data.organizations.some((o) => o.code === code)) {
    code = `${base}${n}`;
    n += 1;
  }
  return code;
}

/** Multi-Vertical Platform Plan §14 Phase 6 / §6A - public, unauthenticated: creates the Organization + Owner User + first Site in one transaction, then signs the new Owner straight in (same session shape as /auth/login). */
export const signupHandlers = [
  http.post('*/api/v1/auth/signup', async ({ request }) => {
    const body = (await request.json()) as SignupRequest;
    const organizationName = body.organizationName?.trim();
    const siteName = body.siteName?.trim();
    const slug = body.slug?.trim().toLowerCase();
    const ownerName = body.ownerName?.trim();
    const ownerEmail = body.ownerEmail?.trim().toLowerCase();

    if (!organizationName || !siteName || !slug || !ownerName || !ownerEmail || !body.modules?.length) {
      return HttpResponse.json({ error: { code: 'invalid_body', message: 'All fields are required.' } }, { status: 400 });
    }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
      return HttpResponse.json(
        { error: { code: 'invalid_slug', message: 'Use lowercase letters, numbers, and hyphens only.' } },
        { status: 400 },
      );
    }
    if (db.data.restaurants.some((r) => r.slug === slug)) {
      return HttpResponse.json({ error: { code: 'duplicate_slug', message: 'That subdomain is already taken.' } }, { status: 409 });
    }

    const now = nowIso();
    const orgId = nextId('org');
    const orgCode = uniqueOrgCode(organizationName);
    const userId = nextId('user');

    db.data.organizations.push({ id: orgId, code: orgCode, name: organizationName, createdAt: now, updatedAt: now });

    const site = provisionSite({
      organizationId: orgId,
      ownerUserId: userId,
      ownerEmail,
      name: siteName,
      slug,
      vertical: body.vertical,
      modules: body.modules,
      branding: body.branding,
    });

    const owner: User = {
      id: userId,
      organizationId: orgId,
      email: ownerEmail,
      name: ownerName,
      role: 'owner',
      restaurantId: site.id,
      siteAccess: 'all',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    db.data.users.push(owner);

    db.save();

    return HttpResponse.json(
      {
        user: owner,
        token: issueToken(userId),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(),
        orgCode,
      },
      { status: 201 },
    );
  }),
];
