import type { PublicReservationConfirmation } from '../../types';
export function ConfirmationActions({confirmation}: {confirmation: PublicReservationConfirmation}) {
  const delivered = confirmation.emailStatus === 'delivered';
  const accepted = confirmation.emailStatus === 'accepted';
  return <section className="my-6 space-y-3 text-center" aria-label="Confirmation actions">
    <p>{delivered ? 'Confirmation email delivered.' : accepted ? 'Confirmation email submitted for delivery.' : 'Your booking is confirmed. Email delivery has not been verified.'}</p>
    {confirmation.managementUrl && <p><a className="text-primary underline" href={confirmation.managementUrl}>Manage reservation</a>{' | '}<a className="text-primary underline" href={confirmation.managementUrl + '?action=cancel'}>Cancel reservation</a></p>}
    {confirmation.calendarUrl && <p>Add to calendar: <a className="text-primary underline" href={confirmation.calendarUrl}>Apple</a>{' · '}<a className="text-primary underline" href={confirmation.googleCalendarUrl} target="_blank" rel="noreferrer">Google</a>{' · '}<a className="text-primary underline" href={confirmation.calendarUrl}>Outlook</a></p>}
  </section>;
}
