import { ConfirmationActions } from './ConfirmationActions';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getPublicAvailability, createPublicReservation, createReservationCheckout } from '../../services/reservations';
import { PaidCheckout } from '../PaidCheckout';
import type { CheckoutSession } from '../../types';
import { useRestaurant } from '../../context/RestaurantContext';
import { usePageContent } from '../../context/usePageContent';
import { Header } from '../Header';
import { Footer } from '../Footer';
import type { PublicAvailability, PublicReservationConfirmation } from '../../types';
import type { BookingViewProps } from './VariantA';
import { useReserveHandoff } from './useReserveHandoff';

function toIsoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Appointment layout; retains existing service selection and paid checkout. */
export const BookingVariantC = ({ onNavigateLanding, onNavigateMenu, onToast, cartUniqueCount = 0, onOpenCart }: BookingViewProps) => {
  const { restaurantId } = useRestaurant();
  const { handoff, apply: applyHandoff, error: handoffError } = useReserveHandoff(restaurantId);
  const c = usePageContent('booking');
  const services = c.list('c_services');
  const [serviceId, setServiceId] = useState<string | null>(null);
  // Falls back to the first listed service (also covers the owner removing the selected one).
  const selectedService = services.find((s) => s.id === serviceId) ?? services[0] ?? null;
  const service = selectedService?.name ?? '';
  const [dateInput, setDateInput] = useState(() => handoff?.date ?? toIsoDate(new Date()));
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [availability, setAvailability] = useState<PublicAvailability['slots']>({ afternoon: [], evening: [] });
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<PublicReservationConfirmation | null>(null);
  const [checkout, setCheckout] = useState<CheckoutSession | null>(null);

  const allSlots = [...availability.afternoon, ...availability.evening];

  useEffect(() => {
    if (!dateInput) return;
    let active = true;
    setIsLoadingSlots(true);
    setSelectedTimeSlot(null);
    getPublicAvailability(restaurantId, dateInput, 1, 'Indoor')
      .then((result) => {
        if (active) {
          setAvailability(result.slots);
          const time = applyHandoff(result, dateInput, 1);
          if (time) setSelectedTimeSlot(time);
        }
      })
      .catch(() => {
        if (active) setAvailability({ afternoon: [], evening: [] });
      })
      .finally(() => {
        if (active) setIsLoadingSlots(false);
      });
    return () => {
      active = false;
    };
  }, [restaurantId, dateInput, applyHandoff]);

  const handleSubmit = async () => {
    if (!selectedTimeSlot || !fullName.trim() || !email.trim() || !phone.trim() || !service) return;
    setIsSubmitting(true);
    try {
      const input = {
        date: dateInput,
        timeSlot: selectedTimeSlot,
        partySize: 1,
        seatingPreference: 'Indoor',
        guestName: fullName,
        guestEmail: email,
        guestPhone: phone,
        specialRequests: `Appointment: ${service}. ${notes}`,
        newsletterOptIn: false,
      };
      if (import.meta.env.VITE_USE_MOCKS !== 'true') {
        setCheckout(await createReservationCheckout(restaurantId, input));
        return;
      }
      const result = await createPublicReservation(restaurantId, input);
      setConfirmation(result);
      onToast(c.text('c_toast_booked', { code: result.confirmationCode }));
    } catch (error: unknown) {
      onToast(error instanceof Error ? error.message : c.text('c_toast_failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (confirmation) {
    return (
      <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans">
        <Header currentPage="reservations" onNavigateLanding={onNavigateLanding} onNavigateMenu={onNavigateMenu} onNavigateReservations={() => {}} onToast={onToast} cartUniqueCount={cartUniqueCount} onOpenCart={onOpenCart} />
        <main className="flex-grow flex flex-col items-center justify-center pt-28 pb-24 px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-4xl text-primary filled">check_circle</span>
          </div>
          <h2 className="font-serif text-3xl font-semibold mb-2">{c.text('c_success_heading')}</h2>
          <p className="text-secondary max-w-md mb-1">
            {c.text('c_success_when', {
              service,
              time: confirmation.timeDisplay,
              date: new Date(confirmation.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }),
            })}
          </p>
          <p className="text-secondary text-sm mb-8">{c.text('c_success_code_label')} <span className="font-bold text-on-surface">{confirmation.confirmationCode}</span></p>
          <ConfirmationActions confirmation={confirmation} />
          <button onClick={onNavigateLanding} className="px-8 py-3.5 bg-primary text-on-primary rounded-full font-semibold text-sm uppercase tracking-wide">
            {c.text('c_back_website')}
          </button>
        </main>
        <Footer onNavigateLanding={onNavigateLanding} onNavigateMenu={onNavigateMenu} onNavigateReservations={() => {}} onToast={onToast} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans">
      <Header currentPage="reservations" onNavigateLanding={onNavigateLanding} onNavigateMenu={onNavigateMenu} onNavigateReservations={() => {}} onToast={onToast} cartUniqueCount={cartUniqueCount} onOpenCart={onOpenCart} />

      <main className="flex-grow pt-28 pb-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full max-w-3xl">
        {checkout ? <PaidCheckout key={checkout.id} initialSession={checkout} onSuccess={(session) => { if (session.reservation) { setConfirmation(session.reservation); onToast('Appointment confirmed after successful payment.'); } }} /> : <>
        <div className="mb-8">
          {handoffError && <p role="alert" className="text-sm text-secondary">{handoffError}</p>}
          <span className="text-primary uppercase tracking-[0.2em] font-bold text-xs">{c.text('c_eyebrow')}</span>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold mt-1">{c.text('c_heading')}</h1>
        </div>

        <section className="bg-surface p-6 rounded-2xl border border-outline-variant/20 shadow-sm mb-6">
          <h3 className="font-semibold mb-4">{c.text('c_service_heading')}</h3>
          {services.length === 0 ? (
            <p className="text-sm text-secondary py-4">{c.text('c_no_services')}</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {services.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setServiceId(opt.id)}
                  className={`p-4 rounded-xl text-left text-sm font-semibold border transition-all ${
                    selectedService?.id === opt.id ? 'border-2 border-primary bg-primary/10 text-primary' : 'border-outline-variant/30 hover:border-primary/50'
                  }`}
                >
                  {opt.name}
                  {opt.duration && <span className="block text-xs font-normal opacity-70 mt-0.5">{opt.duration}</span>}
                  {opt.description && <span className="block text-xs font-normal text-secondary mt-1">{opt.description}</span>}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="bg-surface p-6 rounded-2xl border border-outline-variant/20 shadow-sm mb-6">
          <h3 className="font-semibold mb-4">{c.text('c_datetime_heading')}</h3>
          <input
            type="date"
            value={dateInput}
            min={toIsoDate(new Date())}
            onChange={(e) => setDateInput(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/40 text-sm outline-none focus:border-primary mb-4"
          />

          {isLoadingSlots ? (
            <div className="flex items-center gap-2 text-sm text-secondary py-4">
              <Loader2 className="h-4 w-4 animate-spin" /> {c.text('c_loading')}
            </div>
          ) : allSlots.length === 0 ? (
            <p className="text-sm text-secondary py-4">{c.text('c_empty')}</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {allSlots.map((slot) => (
                <button
                  key={slot.time24}
                  disabled={!slot.available}
                  onClick={() => setSelectedTimeSlot(slot.time24)}
                  className={`py-2.5 rounded-lg text-sm font-medium transition-all ${
                    !slot.available
                      ? 'bg-surface-container text-secondary/40 cursor-not-allowed'
                      : selectedTimeSlot === slot.time24
                        ? 'bg-primary text-on-primary font-bold'
                        : 'border border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-white'
                  }`}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="bg-surface p-6 rounded-2xl border border-outline-variant/20 shadow-sm space-y-3">
          <h3 className="font-semibold mb-1">{c.text('c_details_heading')}</h3>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={c.text('c_placeholder_name')} className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/40 text-sm outline-none focus:border-primary" />
          <div className="grid grid-cols-2 gap-3">
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder={c.text('c_placeholder_email')} className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/40 text-sm outline-none focus:border-primary" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder={c.text('c_placeholder_phone')} className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/40 text-sm outline-none focus:border-primary" />
          </div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={c.text('c_placeholder_notes')} rows={3} className="w-full px-3 py-2.5 rounded-xl border border-outline-variant/40 text-sm outline-none focus:border-primary resize-none" />
          <button
            disabled={!selectedTimeSlot || !fullName.trim() || !email.trim() || !phone.trim() || !service || isSubmitting}
            onClick={handleSubmit}
            className="w-full py-3.5 bg-on-surface text-on-primary rounded-xl font-bold text-sm uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {c.text('c_submit')}
          </button>
        </section>
        </>}
      </main>

      <Footer onNavigateLanding={onNavigateLanding} onNavigateMenu={onNavigateMenu} onNavigateReservations={() => {}} onToast={onToast} />
    </div>
  );
};
