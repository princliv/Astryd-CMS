import { ConfirmationActions } from './ConfirmationActions';
import type { PublicReservationConfirmation } from '../../types';
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { ApiError } from "../../services/http";
import { createReservationCheckout, getPublicAvailability } from "../../services/reservations";
import { parseReserveHandoff, clearReserveHandoff } from '../../services/reserveHandoff';
import { getPayment, retryPayment, submitCard, waitForPayment } from "../../services/payments";
import { useRestaurant } from "../../context/RestaurantContext";
import { usePublicData } from "../../context/PublicDataContext";
import { supportsSeating } from "../../services/bookingPolicy";
import { usePageContent } from "../../context/usePageContent";
import { Header } from "../Header";
import { Footer } from "../Footer";
import { FinixCardForm } from "../FinixCardForm";
import type { CheckoutSession, PublicAvailability } from "../../types";

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toIsoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatReservationDate(d: Date) {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

interface CalendarCell {
  date: Date;
  inMonth: boolean;
}

/** Monday-first grid (matches the Mo/Tu/We/.../Su header), padded with adjacent-month days so every row is full. */
function getCalendarCells(displayMonth: Date): CalendarCell[] {
  const year = displayMonth.getFullYear();
  const month = displayMonth.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const firstWeekdayMonFirst = (firstOfMonth.getDay() + 6) % 7;

  const cells: CalendarCell[] = [];
  for (let i = firstWeekdayMonFirst; i > 0; i--) {
    cells.push({ date: new Date(year, month - 1, prevMonthDays - i + 1), inMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ date: new Date(year, month, day), inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), inMonth: false });
  }
  return cells;
}

export interface BookingViewProps {
  onNavigateLanding: () => void;
  onNavigateMenu: () => void;
  onToast: (msg: string) => void;
  cartUniqueCount?: number;
  onOpenCart?: () => void;
}

/** Variant A - "Table Reservation" (Multi-Vertical Platform Plan §8.3), the original design; suits a Restaurant but any Site can pick it. */
export const BookingVariantA = ({
  onNavigateLanding,
  onNavigateMenu,
  onToast,
  cartUniqueCount = 0,
  onOpenCart,
}: BookingViewProps) => {
  const { restaurantId } = useRestaurant();
  const { vertical } = usePublicData();
  const seatingEnabled = supportsSeating(vertical);
  const [handoff] = useState(() => parseReserveHandoff(new URLSearchParams(window.location.search), restaurantId));
  const handoffApplied = useRef(false);
  const c = usePageContent("booking");
  // Effects/callbacks read copy through a ref so editing content never re-triggers fetches or payment polling.
  const cRef = useRef(c);
  useEffect(() => {
    cRef.current = c;
  }, [c]);
  const [step, setStep] = useState(1);
  const [partySize, setPartySize] = useState(handoff?.partySize ?? 2);
  const today = useMemo(() => startOfDay(new Date()), []);
  const [displayMonth, setDisplayMonth] = useState(() => {
    const initial = handoff ? new Date(`${handoff.date}T12:00:00`) : today;
    return new Date(initial.getFullYear(), initial.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<Date>(() => handoff ? new Date(`${handoff.date}T12:00:00`) : today);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [selectedSeating, setSelectedSeating] = useState<string | null>(
    "Indoor",
  );
  const [isMapVisible, setIsMapVisible] = useState(false);

  // Step 3 Guest Details States
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState("");
  const [confirmedBooking, setConfirmedBooking] = useState<PublicReservationConfirmation | null>(null);
  const [checkoutSession, setCheckoutSession] = useState<CheckoutSession | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [availability, setAvailability] = useState<PublicAvailability["slots"]>({ afternoon: [], evening: [] });
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [liveSeatingOptions, setLiveSeatingOptions] = useState<Array<{ id: string; label: string }> | undefined>();

  const calendarCells = useMemo(() => getCalendarCells(displayMonth), [displayMonth]);
  const isPrevMonthDisabled =
    displayMonth.getFullYear() === today.getFullYear() && displayMonth.getMonth() === today.getMonth();
  const goToPrevMonth = () => {
    if (isPrevMonthDisabled) return;
    setDisplayMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };
  const goToNextMonth = () => setDisplayMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const selectedDateIso = toIsoDate(selectedDate);
  const selectedTimeDisplay = useMemo(
    () => [...availability.afternoon, ...availability.evening].find((slot) => slot.time24 === selectedTimeSlot)?.time ?? c.text("a_time_placeholder"),
    [availability, selectedTimeSlot, c],
  );

  useEffect(() => {
    let active = true;
    setAvailabilityLoading(true);
    setAvailabilityError(null);
    setSelectedTimeSlot(null);
    getPublicAvailability(restaurantId, selectedDateIso, partySize, seatingEnabled ? undefined : 'Indoor')
      .then((result) => {
        if (!active) return;
        setAvailability(result.slots);
        setLiveSeatingOptions(result.seatingOptions);
        if (seatingEnabled && result.seatingOptions?.length) setSelectedSeating((current) => result.seatingOptions!.some((s) => s.id === current) ? current : result.seatingOptions![0].id);
        if (handoff && !handoffApplied.current) {
          handoffApplied.current = true;
          const slot = [...result.slots.afternoon, ...result.slots.evening].find((s) => s.time24 === handoff.time && s.available);
          if (slot && selectedDateIso === handoff.date && partySize === handoff.partySize) {
            setSelectedTimeSlot(slot.time24);
            setStep(seatingEnabled ? 2 : 3);
          } else {
            setAvailabilityError('The time selected on Astryd Reserve is no longer available. Please choose another time.');
          }
          clearReserveHandoff();
        }
        if (!result.available) setAvailabilityError(seatingEnabled ? cRef.current.text("a_no_tables") : 'No booking times are available for these choices.');
      })
      .catch((error: unknown) => {
        if (!active) return;
        setAvailability({ afternoon: [], evening: [] });
        setAvailabilityError(!seatingEnabled && error instanceof ApiError && error.status === 400 ? 'Booking is unavailable because no compatible resource is configured. Please contact the business.' : error instanceof Error ? error.message : cRef.current.text("a_availability_error"));
      })
      .finally(() => {
        if (active) setAvailabilityLoading(false);
      });
    return () => { active = false; };
  }, [partySize, restaurantId, selectedDateIso, handoff, seatingEnabled]);

  useEffect(() => {
    if (!checkoutSession || !["pending", "provider_unknown"].includes(checkoutSession.status)) return;
    let active = true;
    const timer = window.setInterval(async () => {
      try {
        const result = await getPayment(checkoutSession);
        if (!active) return;
        setCheckoutSession(result);
        if (result.status === "succeeded" && result.fulfillmentStatus === "completed" && result.reservation) {
          window.clearInterval(timer);
          setConfirmationCode(result.reservation.confirmationCode);
          setConfirmedBooking(result.reservation);
          setStep(5);
          onToast(cRef.current.text("a_toast_confirmed", { code: result.reservation.confirmationCode }));
        } else if (result.fulfillmentStatus === "action_required") {
          window.clearInterval(timer);
          setPaymentError(cRef.current.text("a_pay_table_unavailable"));
        } else if (result.status === "failed") {
          window.clearInterval(timer);
          setPaymentError(result.failure?.message ?? cRef.current.text("a_pay_declined"));
        }
      } catch {
        // Keep polling transient status failures while this checkout remains open.
      }
    }, 3000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [checkoutSession, onToast]);

  const configuredSeatingOptions = c.list("a_seating_options");
  const seatingOptions = liveSeatingOptions ? liveSeatingOptions.map((area) => {
    const existing = configuredSeatingOptions.find((option) => option.id === area.id);
    return { id: area.id, title: area.label, image: existing?.image ?? '', description: existing?.description ?? '', badge: existing?.badge ?? '' };
  }) : configuredSeatingOptions;
  const selectedSeatingTitle = selectedSeating
    ? seatingOptions.find((opt) => opt.id === selectedSeating)?.title || selectedSeating
    : null;
  const peopleLabel = (count: number) => c.text(count === 1 ? "a_people_one" : "a_people_many", { count });

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAgreed) {
      onToast(c.text("a_toast_terms"));
      return;
    }
    setCheckoutSession(null);
    setPaymentError(null);
    setStep(4);
  };

  const handleFinalConfirm = async () => {
    setIsProcessing(true);
    try {
      if (!selectedTimeSlot) {
        onToast(c.text("a_toast_select_time"));
        return;
      }
      const session = await createReservationCheckout(restaurantId, {
        date: selectedDateIso,
        timeSlot: selectedTimeSlot,
        partySize,
        seatingPreference: seatingEnabled ? selectedSeating || "Indoor" : "Indoor",
        guestName: fullName,
        guestEmail: email,
        guestPhone: phone,
        specialRequests,
        newsletterOptIn,
      });
      setCheckoutSession(session);
      setPaymentError(null);
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 409) {
        onToast(c.text("a_toast_slot_taken"));
        setStep(1);
      } else if (error instanceof ApiError && error.status === 400) {
        onToast(error.message || c.text("a_toast_invalid"));
      } else if (error instanceof ApiError && error.status >= 500) {
        onToast(c.text("a_toast_unavailable"));
      } else {
        onToast(error instanceof Error ? error.message : c.text("a_toast_confirm_failed"));
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentError = useCallback((message: string) => {
    setPaymentError(message);
    setIsProcessing(false);
  }, []);

  const handleCardToken = useCallback(async (token: string) => {
    if (!checkoutSession) return;
    setIsProcessing(true);
    setPaymentError(null);
    try {
      let result = await submitCard(checkoutSession, token);
      result = await waitForPayment(result);
      setCheckoutSession(result);
      if (result.status === "succeeded" && result.fulfillmentStatus === "completed" && result.reservation) {
        setConfirmationCode(result.reservation.confirmationCode);
          setConfirmedBooking(result.reservation);
        setStep(5);
        onToast(cRef.current.text("a_toast_confirmed", { code: result.reservation.confirmationCode }));
      } else if (result.fulfillmentStatus === "action_required") {
        setPaymentError(cRef.current.text("a_pay_table_unavailable"));
      } else if (result.status === "failed") {
        setPaymentError(result.failure?.message ?? cRef.current.text("a_pay_declined"));
      } else {
        setPaymentError(cRef.current.text("a_pay_still_processing"));
      }
    } catch (error: unknown) {
      try {
        setCheckoutSession(await getPayment(checkoutSession));
      } catch {
        // Preserve the provider error below if status refresh is unavailable.
      }
      setPaymentError(error instanceof Error ? error.message : cRef.current.text("a_pay_failed"));
    } finally {
      setIsProcessing(false);
    }
  }, [checkoutSession, onToast]);

  const handlePaymentRetry = async () => {
    if (!checkoutSession) return;
    setIsProcessing(true);
    try {
      setCheckoutSession(await retryPayment(checkoutSession));
      setPaymentError(null);
    } catch (error: unknown) {
      setPaymentError(error instanceof Error ? error.message : c.text("a_pay_retry_failed"));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans">
      <Header
        currentPage="reservations"
        onNavigateLanding={onNavigateLanding}
        onNavigateMenu={onNavigateMenu}
        onNavigateReservations={() => {}}
        onToast={onToast}
        cartUniqueCount={cartUniqueCount}
        onOpenCart={onOpenCart}
      />

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center pt-28 pb-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto w-full">
        {step < 5 && (
          <div className="w-full max-w-2xl mb-10 fade-in">
            <div className="flex justify-between items-center mb-3">
              <span className="font-label-sm text-xs font-bold text-primary uppercase tracking-[0.2em]">
                {c.text("a_step_counter", { step: seatingEnabled || step === 1 ? step : step - 1, total: seatingEnabled ? 4 : 3 })}
              </span>
              <span className="font-label-sm text-xs text-on-surface/70 uppercase font-semibold">
                {step === 1 && c.text("a_step1_name")}
                {step === 2 && c.text("a_step2_name")}
                {step === 3 && c.text("a_step3_name")}
                {step === 4 && c.text("a_step4_name")}
              </span>
            </div>
            <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700 ease-in-out"
                style={{ width: `${((seatingEnabled || step === 1 ? step : step - 1) / (seatingEnabled ? 4 : 3)) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* STEP 1: Select Details */}
        {step === 1 && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              {/* Party Size */}
              <section className="bg-surface p-6 md:p-8 rounded-2xl shadow-sm border border-outline-variant/20">
                <h3 className="font-serif text-2xl font-semibold mb-6 flex items-center gap-3 text-on-surface">
                  <span className="material-symbols-outlined text-primary text-2.5xl">
                    groups
                  </span>
                  <span>{c.text("a_party_heading")}</span>
                </h3>
                <div className="flex flex-wrap gap-3 font-sans">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <button
                      key={num}
                      onClick={() => setPartySize(num)}
                      className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
                        partySize === num
                          ? "border-2 border-primary bg-primary/10 text-primary shadow-sm font-bold scale-105"
                          : "border border-outline-variant/40 text-on-surface hover:border-primary hover:text-primary bg-surface-container-low"
                      }`}
                    >
                      {c.text(num === 1 ? "a_party_one" : "a_party_many", { count: num })}
                    </button>
                  ))}
                  <button
                    onClick={() => setPartySize(9)}
                    className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
                      partySize >= 9
                        ? "border-2 border-primary bg-primary/10 text-primary shadow-sm font-bold scale-105"
                        : "border border-outline-variant/40 text-on-surface hover:border-primary hover:text-primary bg-surface-container-low"
                    }`}
                  >
                    {c.text("a_large_group")}
                  </button>
                </div>
              </section>

              {/* Date & Time Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Date Picker */}
                <section className="bg-surface p-6 md:p-8 rounded-2xl shadow-sm border border-outline-variant/20">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-serif text-2xl font-semibold flex items-center gap-3 text-on-surface">
                      <span className="material-symbols-outlined text-primary text-2.5xl">
                        calendar_month
                      </span>
                      <span>{c.text("a_date_heading")}</span>
                    </h3>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={goToPrevMonth}
                        disabled={isPrevMonthDisabled}
                        aria-label={c.text("a_prev_month_aria")}
                        className="p-2 hover:bg-surface-container rounded-full text-secondary disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined text-sm">
                          chevron_left
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={goToNextMonth}
                        aria-label={c.text("a_next_month_aria")}
                        className="p-2 hover:bg-surface-container rounded-full text-secondary"
                      >
                        <span className="material-symbols-outlined text-sm">
                          chevron_right
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className="text-center font-bold font-sans text-sm mb-4 text-on-surface">
                    {displayMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </div>
                  <div className="grid grid-cols-7 gap-y-2 text-center text-xs font-bold text-secondary uppercase tracking-wider mb-3">
                    <div>{c.text("a_weekday_mo")}</div>
                    <div>{c.text("a_weekday_tu")}</div>
                    <div>{c.text("a_weekday_we")}</div>
                    <div>{c.text("a_weekday_th")}</div>
                    <div>{c.text("a_weekday_fr")}</div>
                    <div>{c.text("a_weekday_sa")}</div>
                    <div>{c.text("a_weekday_su")}</div>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5 font-sans">
                    {calendarCells.map((cell, idx) => {
                      const isPast = cell.date < today;
                      const isSelected = isSameDay(cell.date, selectedDate);
                      const disabled = isPast;
                      return (
                        <button
                          key={idx}
                          type="button"
                          disabled={disabled}
                          onClick={() => {
                            if (!cell.inMonth) {
                              setDisplayMonth(new Date(cell.date.getFullYear(), cell.date.getMonth(), 1));
                            }
                            setSelectedDate(cell.date);
                          }}
                          className={`aspect-square flex items-center justify-center rounded-xl text-sm font-semibold transition-all ${
                            disabled
                              ? "text-secondary cursor-not-allowed"
                              : isSelected
                                ? "bg-primary text-on-primary font-bold shadow-md scale-105"
                                : !cell.inMonth
                                  ? "text-secondary hover:bg-surface-container hover:text-on-surface"
                                  : "hover:bg-surface-container text-on-surface"
                          }`}
                        >
                          {cell.date.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Time Slot Picker */}
                <section className="bg-surface p-6 md:p-8 rounded-2xl shadow-sm border border-outline-variant/20 overflow-hidden">
                  <h3 className="font-serif text-2xl font-semibold mb-6 flex items-center gap-3 text-on-surface">
                    <span className="material-symbols-outlined text-primary text-2.5xl">
                      schedule
                    </span>
                    <span>{c.text("a_time_heading")}</span>
                  </h3>
                  <div className="space-y-6 max-h-[380px] overflow-y-auto pr-1 font-sans">
                    {availabilityLoading && (
                      <div className="flex items-center gap-2 text-sm text-secondary py-4">
                        <Loader2 className="h-4 w-4 animate-spin" /> {c.text("a_loading_times")}
                      </div>
                    )}
                    {availabilityError && !availabilityLoading && (
                      <p className="text-sm text-secondary py-4">{availabilityError}</p>
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-secondary uppercase tracking-widest mb-3">
                        {c.text("a_afternoon_label")}
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {availability.afternoon.map((t) => (
                          <button
                            key={t.time24}
                            disabled={!t.available}
                            onClick={() => setSelectedTimeSlot(t.time24)}
                            className={`py-3 px-4 rounded-xl font-medium text-sm transition-all ${
                              !t.available
                                ? "bg-surface-container text-secondary/40 cursor-not-allowed border border-transparent"
                                : selectedTimeSlot === t.time24
                                  ? "border-2 border-primary bg-primary text-on-primary font-bold shadow-md scale-105"
                                  : "border border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-white"
                            }`}
                          >
                            {t.time}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-secondary uppercase tracking-widest mb-3">
                        {c.text("a_evening_label")}
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        {availability.evening.map((t) => (
                          <button
                            key={t.time24}
                            disabled={!t.available}
                            onClick={() => setSelectedTimeSlot(t.time24)}
                            className={`py-3 px-4 rounded-xl font-medium text-sm transition-all ${
                              !t.available
                                ? "bg-surface-container text-secondary/40 cursor-not-allowed border border-transparent"
                                : selectedTimeSlot === t.time24
                                  ? "border-2 border-primary bg-primary text-on-primary font-bold shadow-md scale-105"
                                  : "border border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-white"
                            }`}
                          >
                            {t.time}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            {/* Summary Sidebar */}
            <div className="lg:col-span-4">
              <div className="sticky top-44 space-y-6">
                <section className="bg-surface rounded-2xl overflow-hidden shadow-lg border border-outline-variant/20">
                  <div className="h-48 relative">
                    <img
                      className="w-full h-full object-cover"
                      src={c.image("a_sidebar_image")}
                      alt={c.text("a_sidebar_image_alt")}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6">
                      <h2 className="text-white font-serif text-2xl font-bold">
                        {c.text("a_sidebar_title")}
                      </h2>
                    </div>
                  </div>

                  <div className="p-6 space-y-6 font-sans">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-secondary">{c.text("a_sidebar_guests_label")}</span>
                        <span className="font-bold text-on-surface">
                          {peopleLabel(partySize)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-secondary">{c.text("a_sidebar_date_label")}</span>
                        <span className="font-bold text-on-surface">
                          {formatReservationDate(selectedDate)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-secondary">{c.text("a_sidebar_time_label")}</span>
                        <span className="font-bold text-on-surface">
                          {selectedTimeDisplay}
                        </span>
                      </div>
                    </div>

                    <hr className="border-outline-variant/20" />

                    <div className="flex items-start gap-3 bg-tertiary-fixed/20 p-4 rounded-xl border border-tertiary/20">
                      <span className="material-symbols-outlined text-tertiary text-[20px] mt-0.5 filled">
                        stars
                      </span>
                      <div>
                        <p className="text-xs font-bold text-tertiary uppercase tracking-wider mb-0.5">
                          {c.text("a_rare_badge")}
                        </p>
                        <p className="text-xs text-on-tertiary-fixed-variant leading-relaxed">
                          {c.text("a_rare_text")}
                        </p>
                      </div>
                    </div>

                    <button
                      disabled={!selectedTimeSlot || availabilityLoading}
                      onClick={() => setStep(seatingEnabled ? 2 : 3)}
                      className="w-full py-4 bg-on-surface text-surface rounded-xl font-bold text-sm tracking-wide uppercase hover:bg-on-surface/90 transition-all duration-300 shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>{seatingEnabled ? c.text("a_continue_seating") : c.text("a_continue_info")}</span>
                      <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">
                        arrow_forward
                      </span>
                    </button>
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Seating Preference Screen */}
        {seatingEnabled && step === 2 && (
          <div className="w-full max-w-6xl space-y-12 animate-fadeIn">
            <div className="text-center mb-10">
              <h2 className="font-serif text-4xl md:text-5xl font-semibold text-on-surface mb-3">
                {c.text("a_seating_heading")}
              </h2>
              <p className="text-secondary font-sans text-base md:text-lg max-w-xl mx-auto">
                {c.text("a_seating_subheading")}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full mb-12">
              {seatingOptions.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setSelectedSeating(opt.id)}
                  className={`group relative bg-surface-container-lowest rounded-2xl p-4 border cursor-pointer transition-all duration-300 hover:shadow-xl active:scale-[0.98] ${
                    selectedSeating === opt.id
                      ? "border-primary ring-2 ring-primary bg-primary/5 shadow-md"
                      : "border-outline-variant/40 hover:border-primary/50"
                  }`}
                >
                  {opt.image && <div className="relative h-60 w-full rounded-xl overflow-hidden mb-4 border border-outline-variant/20">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      src={opt.image}
                      alt={opt.title}
                    />
                    {opt.badge && (
                      <div className="absolute bottom-4 left-4 z-20">
                        <span className="text-xs font-bold text-white bg-primary py-1 px-3 rounded-full uppercase shadow">
                          {opt.badge}
                        </span>
                      </div>
                    )}
                  </div>}
                  <h3 className="font-serif text-xl font-bold text-on-surface mb-1">
                    {opt.title}
                  </h3>
                  <p className="text-secondary text-sm font-sans leading-relaxed">
                    {opt.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="w-full max-w-4xl mx-auto font-sans">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-2xl">
                    map
                  </span>
                  <h4 className="font-serif text-xl font-semibold text-on-surface">
                    {c.text("a_map_heading")}
                  </h4>
                </div>
                <button
                  onClick={() => setIsMapVisible(!isMapVisible)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border border-outline-variant/40 hover:bg-surface-container-low transition-colors text-xs font-bold uppercase tracking-wider"
                >
                  <span>{isMapVisible ? c.text("a_map_hide") : c.text("a_map_show")}</span>
                  <span
                    className={`material-symbols-outlined text-base transition-transform ${isMapVisible ? "rotate-180" : ""}`}
                  >
                    expand_more
                  </span>
                </button>
              </div>

              {isMapVisible && (
                <div className="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/30 relative min-h-[360px] flex items-center justify-center animate-fadeIn">
                  <div className="relative z-10 w-full max-w-2xl aspect-video bg-white/80 backdrop-blur-md rounded-2xl border border-outline-variant/30 p-8 shadow-md flex flex-col justify-center items-center gap-6">
                    <div className="flex gap-8 w-full justify-center">
                      <div
                        className={`w-36 h-28 border-2 border-dashed rounded-xl flex items-center justify-center font-bold text-xs ${selectedSeating === "Outdoor" ? "border-primary bg-primary/10 text-primary" : "border-outline-variant text-secondary"}`}
                      >
                        {c.text("a_map_outdoor")}
                      </div>
                      <div
                        className={`w-48 h-28 rounded-xl border-2 flex flex-col items-center justify-center gap-2 font-bold text-xs ${selectedSeating === "Indoor" ? "border-primary bg-primary/10 text-primary" : "border-outline-variant text-secondary"}`}
                      >
                        <span className="material-symbols-outlined text-lg">
                          restaurant
                        </span>
                        <span>{c.text("a_map_indoor")}</span>
                      </div>
                    </div>

                    <div className="flex gap-8 w-full justify-center">
                      <div
                        className={`w-48 h-16 rounded-full border-2 flex items-center justify-center font-bold text-xs ${selectedSeating === "The Bar" ? "border-primary bg-primary/10 text-primary" : "border-outline-variant text-secondary"}`}
                      >
                        {c.text("a_map_bar")}
                      </div>
                      <div
                        className={`w-36 h-16 rounded-xl border-2 flex items-center justify-center font-bold text-xs ${selectedSeating === "Private" ? "border-primary bg-primary/10 text-primary" : "border-outline-variant text-secondary"}`}
                      >
                        {c.text("a_map_private")}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-md border-t border-outline-variant/20 py-5 px-margin-mobile md:px-margin-desktop z-40">
              <div className="max-w-container-max mx-auto flex justify-between items-center font-sans">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-secondary hover:text-on-surface transition-colors font-bold text-xs uppercase tracking-widest"
                >
                  <span className="material-symbols-outlined text-base">
                    arrow_back
                  </span>
                  <span>{c.text("a_back_bar")}</span>
                </button>

                <div className="flex items-center gap-8">
                  <div className="hidden md:flex flex-col items-end">
                    <span className="text-secondary text-[11px] font-bold uppercase tracking-widest">
                      {c.text("a_preference_label")}
                    </span>
                    <span className="text-primary font-bold text-sm">
                      {selectedSeatingTitle || c.text("a_preference_empty")}
                    </span>
                  </div>

                  <button
                    disabled={!selectedSeating}
                    onClick={() => setStep(3)}
                    className={`px-10 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-md ${
                      selectedSeating
                        ? "bg-on-surface text-on-primary hover:bg-on-surface/90 active:scale-95 cursor-pointer"
                        : "bg-secondary text-white/50 cursor-not-allowed"
                    }`}
                  >
                    {c.text("a_continue_info")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Guest Details Screen */}
        {step === 3 && (
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn max-w-5xl">
            <div className="lg:col-span-8">
              <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 p-6 md:p-10 space-y-8 font-sans">
                <div>
                  <h2 className="font-serif text-3xl font-bold text-on-surface mb-2">
                    {c.text("a_form_heading")}
                  </h2>
                  <p className="text-secondary text-sm">
                    {c.text("a_form_subheading")}
                  </p>
                </div>

                <form onSubmit={handleGuestSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block font-label-sm text-xs text-on-surface-variant font-bold uppercase tracking-wider">
                        {c.text("a_label_name")}
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={c.text("a_placeholder_name")}
                        className="w-full bg-surface p-4 rounded-xl border border-outline-variant/50 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block font-label-sm text-xs text-on-surface-variant font-bold uppercase tracking-wider">
                        {c.text("a_label_phone")}
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={c.text("a_placeholder_phone")}
                        className="w-full bg-surface p-4 rounded-xl border border-outline-variant/50 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block font-label-sm text-xs text-on-surface-variant font-bold uppercase tracking-wider">
                      {c.text("a_label_email")}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={c.text("a_placeholder_email")}
                      className="w-full bg-surface p-4 rounded-xl border border-outline-variant/50 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block font-label-sm text-xs text-on-surface-variant font-bold uppercase tracking-wider">
                      {c.text("a_label_requests")}
                    </label>
                    <textarea
                      rows={4}
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder={c.text("a_placeholder_requests")}
                      className="w-full bg-surface p-4 rounded-xl border border-outline-variant/50 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                    />
                  </div>

                  <div className="space-y-4 pt-2">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={newsletterOptIn}
                        onChange={(e) => setNewsletterOptIn(e.target.checked)}
                        className="h-5 w-5 rounded border-outline-variant text-primary focus:ring-primary/20 transition-all cursor-pointer mt-0.5"
                      />
                      <span className="text-secondary text-sm group-hover:text-on-surface transition-colors">
                        {c.text("a_newsletter")}
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={termsAgreed}
                        onChange={(e) => setTermsAgreed(e.target.checked)}
                        className="h-5 w-5 rounded border-outline-variant text-primary focus:ring-primary/20 transition-all cursor-pointer mt-0.5"
                        required
                      />
                      <span className="text-secondary text-sm group-hover:text-on-surface transition-colors">
                        {c.text("a_terms_before")}{" "}
                        <a
                          href="#"
                          className="text-primary font-bold underline"
                        >
                          {c.text("a_terms_link")}
                        </a>{" "}
                        {c.text("a_terms_middle")}{" "}
                        <a
                          href="#"
                          className="text-primary font-bold underline"
                        >
                          {c.text("a_policy_link")}
                        </a>
                        {c.text("a_terms_after")}
                      </span>
                    </label>
                  </div>

                  <div className="pt-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(seatingEnabled ? 2 : 1)}
                      className="px-6 py-3 rounded-xl border border-outline text-on-surface text-sm font-semibold hover:bg-surface-container-low transition-colors"
                    >
                      {c.text("a_back")}
                    </button>
                    <button
                      type="submit"
                      className="px-10 py-4 bg-on-surface text-on-primary rounded-xl font-bold text-sm tracking-wide uppercase hover:bg-on-surface-variant shadow-lg active:scale-[0.98] transition-all"
                    >
                      {c.text("a_review_button")}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="sticky top-28 space-y-6 font-sans">
                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm overflow-hidden">
                  <div className="h-36 w-full overflow-hidden">
                    <img
                      className="w-full h-full object-cover"
                      src={c.image("a_summary_image")}
                      alt={c.text("a_summary_image_alt")}
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="font-serif text-xl font-bold text-on-surface mb-4">
                      {c.text("a_summary_heading")}
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-xl">
                          calendar_today
                        </span>
                        <div>
                          <p className="font-label-sm text-[10px] text-secondary uppercase font-bold tracking-wider">
                            {c.text("a_summary_datetime_label")}
                          </p>
                          <p className="text-on-surface font-semibold text-sm">
                            {formatReservationDate(selectedDate)} • {selectedTimeDisplay}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-xl">
                          group
                        </span>
                        <div>
                          <p className="font-label-sm text-[10px] text-secondary uppercase font-bold tracking-wider">
                            {c.text("a_summary_guests_label")}
                          </p>
                          <p className="text-on-surface font-semibold text-sm">
                            {peopleLabel(partySize)}
                          </p>
                        </div>
                      </div>

                      {seatingEnabled && <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-xl">
                          grid_view
                        </span>
                        <div>
                          <p className="font-label-sm text-[10px] text-secondary uppercase font-bold tracking-wider">
                            {c.text("a_summary_table_label")}
                          </p>
                          <p className="text-on-surface font-semibold text-sm">
                            {selectedSeatingTitle || c.text("a_table_default")}
                          </p>
                        </div>
                      </div>}
                    </div>
                  </div>
                </div>

                <div className="bg-primary-fixed/20 p-5 rounded-2xl border border-primary-fixed/40">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-primary filled text-xl">
                      verified
                    </span>
                    <h4 className="font-label-sm text-xs text-primary-fixed-dim font-bold uppercase tracking-wider">
                      {c.text("a_instant_heading")}
                    </h4>
                  </div>
                  <p className="text-xs text-on-primary-fixed-variant leading-relaxed">
                    {c.text("a_instant_text")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Review & Confirm Screen */}
        {step === 4 && (
          <div className="w-full max-w-4xl space-y-10 animate-fadeIn">
            <div className="text-center mb-8">
              <h2 className="font-serif text-4xl md:text-5xl font-semibold text-on-surface mb-2">
                {c.text("a_review_heading")}
              </h2>
              <p className="font-sans text-base md:text-lg text-secondary">
                {c.text("a_review_subheading")}
              </p>
            </div>

            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-6">
                <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-sm overflow-hidden transition-all hover:shadow-md">
                  <div className="relative h-48 w-full">
                    <img
                      className="w-full h-full object-cover"
                      src={c.image("a_review_image")}
                      alt={c.text("a_review_image_alt")}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-on-surface/75 via-on-surface/20 to-transparent"></div>
                    <div className="absolute bottom-6 left-6 text-white">
                      <span className="font-label-sm text-xs font-bold tracking-widest text-primary-fixed bg-on-surface/40 backdrop-blur-md px-3 py-1 rounded-full mb-2 inline-block">
                        {c.text("a_review_badge")}
                      </span>
                      <h3 className="font-serif text-3xl font-bold">{c.text("a_review_title")}</h3>
                    </div>
                  </div>

                  <div className="p-8 font-sans">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <span className="material-symbols-outlined text-2xl">
                            calendar_today
                          </span>
                        </div>
                        <div>
                          <p className="font-label-sm text-xs text-secondary uppercase font-bold tracking-wider mb-1">
                            {c.text("a_review_datetime_label")}
                          </p>
                          <p className="font-serif text-xl font-bold text-on-surface">
                            {formatReservationDate(selectedDate)}
                          </p>
                          <p className="text-sm text-on-surface/70">
                            {c.text("a_review_time", { time: selectedTimeDisplay })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <span className="material-symbols-outlined text-2xl">
                            group
                          </span>
                        </div>
                        <div>
                          <p className="font-label-sm text-xs text-secondary uppercase font-bold tracking-wider mb-1">
                            {c.text("a_review_party_label")}
                          </p>
                          <p className="font-serif text-xl font-bold text-on-surface">
                            {peopleLabel(partySize)}
                          </p>
                          {seatingEnabled && <p className="text-sm text-on-surface/70">
                            {selectedSeatingTitle || c.text("a_table_default")}
                          </p>}
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-outline-variant/20 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary filled text-xl">
                          verified
                        </span>
                        <span className="text-sm font-semibold text-on-surface">
                          {c.text("a_review_guaranteed")}
                        </span>
                      </div>
                      <button
                        onClick={() => setStep(1)}
                        className="text-primary hover:underline font-label-sm text-xs font-bold uppercase tracking-widest transition-all"
                      >
                        {c.text("a_edit_details")}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-container-low/60 border border-outline-variant/20 rounded-2xl p-8 space-y-4 font-sans">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-secondary text-2xl">
                      info
                    </span>
                    <h4 className="font-serif text-xl font-semibold text-on-surface">
                      {c.text("a_policy_heading")}
                    </h4>
                  </div>
                  <p className="text-sm text-secondary leading-relaxed">
                    {c.text("a_policy_text")}
                  </p>
                  <div className="flex items-center gap-3 text-on-tertiary-fixed-variant bg-tertiary-fixed/20 p-4 rounded-xl border border-tertiary/20">
                    <span className="material-symbols-outlined text-xl">
                      notifications_active
                    </span>
                    <p className="font-label-sm text-xs">
                      {c.text("a_reminder_text")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col gap-6 font-sans">
                <div className="sticky top-28 bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-8 shadow-xl">
                  <h4 className="font-serif text-2xl font-bold text-on-surface mb-6">
                    {c.text("a_totals_heading")}
                  </h4>
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between text-sm">
                      <span className="text-secondary">{c.text("a_booking_fee_label")}</span>
                      <span className="text-on-surface font-semibold">
                        {c.text("a_booking_fee_value")}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-secondary">{c.text("a_deposit_label")}</span>
                      <span className="text-on-surface font-semibold">
                        {checkoutSession ? `$${(checkoutSession.amountCents / 100).toFixed(2)}` : c.text("a_deposit_pending")}
                      </span>
                    </div>
                    <div className="h-px bg-outline-variant/20 my-2"></div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>{c.text("a_total_label")}</span>
                      <span className="text-primary font-serif text-xl font-bold">
                        {checkoutSession ? `$${(checkoutSession.amountCents / 100).toFixed(2)}` : c.text("a_total_pending")}
                      </span>
                    </div>
                  </div>

                  {!checkoutSession && <button
                    disabled={isProcessing}
                    onClick={handleFinalConfirm}
                    className="w-full bg-[#1A1A1A] hover:bg-on-surface-variant text-white py-5 rounded-2xl font-sans font-bold text-base transition-all active:scale-95 shadow-lg mb-4 flex items-center justify-center gap-2 group cursor-pointer tracking-wider uppercase"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>{c.text("a_processing")}</span>
                      </>
                    ) : (
                      <>
                        <span>{c.text("a_pay_button")}</span>
                        <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                          arrow_forward
                        </span>
                      </>
                    )}
                  </button>}

                  {checkoutSession && checkoutSession.fulfillmentStatus !== "action_required" && (
                    <div className="mb-5 space-y-3">
                      {checkoutSession.status === "failed" ? (
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={handlePaymentRetry}
                          className="w-full bg-[#1A1A1A] text-white py-4 rounded-2xl font-bold"
                        >
                          {c.text("a_retry_button")}
                        </button>
                      ) : checkoutSession.status === "created" ? (
                        <FinixCardForm
                          key={checkoutSession.id}
                          amountCents={checkoutSession.amountCents}
                          disabled={isProcessing}
                          onToken={handleCardToken}
                          onError={handlePaymentError}
                        />
                      ) : (
                        <p className="text-sm text-secondary">{c.text("a_deposit_processing")}</p>
                      )}
                    </div>
                  )}
                  {paymentError && <p className="mb-5 text-sm text-error" role="alert">{paymentError}</p>}

                  <button
                    onClick={() => { setCheckoutSession(null); setPaymentError(null); setStep(3); }}
                    className="w-full bg-transparent hover:bg-surface-container border border-outline-variant/50 text-on-surface py-3.5 rounded-2xl text-sm font-semibold transition-all active:scale-95 mb-6"
                  >
                    {c.text("a_edit_details")}
                  </button>

                  <p className="text-center font-label-sm text-xs text-secondary/70">
                    {c.text("a_confirm_terms_before")}{" "}
                    <a className="underline hover:text-primary" href="#">
                      {c.text("a_confirm_terms_link")}
                    </a>
                    {c.text("a_confirm_terms_after")}
                  </p>
                </div>

                <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6 flex items-center gap-4">
                  <div className="p-3 bg-tertiary-fixed/30 rounded-full text-tertiary shrink-0">
                    <span className="material-symbols-outlined filled text-2xl">
                      stars
                    </span>
                  </div>
                  <div>
                    <p className="font-label-sm text-xs font-bold text-on-surface mb-0.5">
                      {c.text("a_vip_heading")}
                    </p>
                    <p className="text-xs text-secondary">
                      {c.text("a_vip_text")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Success Confirmation Screen */}
        {step === 5 && (
          <div className="relative w-full max-w-3xl text-center flex flex-col items-center animate-fadeIn">
            {/* Ambient background glow & image */}
            <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
              <div
                className="w-full h-full bg-cover bg-center blur-3xl opacity-20"
                style={{
                  backgroundImage: `url("${c.image("a_success_image")}")`,
                }}
              ></div>
            </div>

            {/* Icon Cluster */}
            <div className="mb-8 relative group z-10">
              <div className="absolute inset-0 bg-tertiary-fixed-dim rounded-full blur-2xl opacity-25 scale-150 transition-transform group-hover:scale-110"></div>
              <div className="relative w-24 h-24 bg-surface-container-lowest rounded-full flex items-center justify-center shadow-lg border border-outline-variant/30">
                <span className="material-symbols-outlined text-6xl text-primary filled">
                  check_circle
                </span>
              </div>
            </div>

            {/* Header Content */}
            <div className="z-10 space-y-3 mb-10">
              <h2 className="font-serif text-4xl md:text-5xl font-semibold text-on-surface">
                {c.text("a_success_heading")}
              </h2>
              <div className="inline-block bg-surface-container-low px-4 py-1.5 rounded-full border border-outline-variant/20 shadow-sm font-sans">
                <span className="font-label-sm text-xs uppercase text-secondary tracking-widest font-medium">
                  {c.text("a_success_code_label")}{" "}
                  <span className="text-on-surface font-bold">
                    #{confirmationCode}
                  </span>
                </span>
              </div>
              <p className="font-sans text-base md:text-lg text-secondary">Your booking details are ready below.</p>
            </div>

            {confirmedBooking && <ConfirmationActions confirmation={confirmedBooking} />}

            {/* Footer Back Button */}
            <button
              onClick={onNavigateLanding}
              className="inline-flex items-center gap-2 px-10 py-4 bg-primary text-on-primary rounded-full font-sans font-semibold text-sm tracking-wide uppercase shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all z-10 cursor-pointer"
            >
              <span>{c.text("a_back_website")}</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        )}
      </main>

      <Footer
        onNavigateLanding={onNavigateLanding}
        onNavigateMenu={onNavigateMenu}
        onNavigateReservations={() => {}}
        onToast={onToast}
      />
    </div>
  );
};
