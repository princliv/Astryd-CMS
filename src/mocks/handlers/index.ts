import { authHandlers } from './auth';
import { websiteHandlers } from './website';
import { homepageHandlers } from './homepage';
import { mediaHandlers } from './media';
import { menuHandlers } from './menu';
import { addonHandlers } from './addons';
import { offerHandlers } from './offers';
import { auditLogHandlers } from './auditLog';
import { userHandlers } from './users';
import { orderHandlers } from './orders';
import { reservationHandlers } from './reservations';
import { siteHandlers } from './sites';
import { reserveHandlers } from './reserve';
import { pageConfigHandlers } from './pageConfigs';
import { membershipHandlers } from './membership';
import { domainHandlers } from './domains';
import { signupHandlers } from './signup';
import { pageContentHandlers } from './pageContent';

export const handlers = [
  ...authHandlers,
  ...websiteHandlers,
  ...homepageHandlers,
  ...mediaHandlers,
  ...menuHandlers,
  ...addonHandlers,
  ...offerHandlers,
  ...auditLogHandlers,
  ...userHandlers,
  ...orderHandlers,
  ...reservationHandlers,
  ...siteHandlers,
  ...reserveHandlers,
  ...pageConfigHandlers,
  ...membershipHandlers,
  ...domainHandlers,
  ...signupHandlers,
  ...pageContentHandlers,
];
