# Salon Queue Management System — Flows & Rules

## Main User Flows

### Flow 1: Remote Customer
1. Customer opens Home (`/`) -> taps `[ Join Queue ]` -> lands on `/join`.
2. Enters Name and 10-digit Phone number. Selects 1 to 3 services and chooses either "Any barber" or a preferred barber (e.g. Ravi).
3. System validates input, assigns sequential daily token (e.g., `S-14`), and redirects to `/status/:id`.
4. Customer tracks live queue position and estimated wait time from their phone.
5. When customer reaches 2nd position in line, alert banner displays: "Start coming to the salon!".
6. When receptionist calls next on barber's station, order status transitions to `Called`. Customer's phone shows full-screen gold alert: "It's your turn! Go to {Barber}".
7. Barber taps `Start` -> status becomes `In chair`. Barber finishes and taps `Done` -> status becomes `Done`, customer leaves active queue.

### Flow 2: Walk-in Customer
1. Walk-in customer arrives at salon counter.
2. Receptionist clicks `[ + Add Walk-in ]` on `/reception`.
3. Receptionist enters Name, Phone, selects services, and preferred barber.
4. Customer joins the exact same queue at the end (strict First-Come, First-Served).

---

## Core Business Rules

1. **Strict Forward-Only Status Progression**:
   - `Waiting` -> `Called` -> `In chair` -> `Done`.
   - Never allow backward status transitions.
   - Status `Waiting` can transition to `Cancelled`.
   - Status `Called` can transition to `No-show` (or proceed to `In chair`).

2. **Customer Cancellation**:
   - Customers can only cancel their spot while status is `Waiting`. Once called or in chair, self-cancellation is disabled.

3. **Queue Sorting & Barber Assignment**:
   - Strict First-Come, First-Served (FCFS) by join timestamp.
   - When "Call Next" is invoked for Barber X:
     * System picks the earliest waiting customer whose preference is Barber X OR "Any".
     * A customer who explicitly chose Barber Y is NEVER assigned to Barber X.
   - A barber can only have one customer in the chair at any given time.

4. **Waiting Time Estimation**:
   - Estimated wait time ≈ (Sum of service duration in minutes of all waiting customers ahead eligible for on-duty barbers) ÷ (Number of active on-duty barbers).
   - Dynamically updates as services are completed or queue shifts.

5. **Token Generation & Daily Reset**:
   - Tokens follow format `S-1`, `S-2`, `S-3`, etc.
   - Sequence increments monotonically and resets to 1 each day.

6. **Input Constraints & Validations**:
   - Maximum 3 services per booking.
   - Minimum 1 service per booking.
   - Phone number must be exactly 10 digits.
   - Name must not be blank.
   - Deduplication: One active spot per phone number (if phone number is already active in queue, redirect to existing status instead of creating duplicate).

7. **No-Show Handling**:
   - If a customer is called and does not report within 10 minutes, receptionist can mark as `No-show`.
   - If the customer later arrives, they must be added as a new entry at the very END of the queue with a new token.

8. **Closing Time Restrictions**:
   - Online queue joining closes 30 minutes before salon closing (e.g. 8:30 PM if closing at 9:00 PM), or when Owner toggles online queue switch to "Closed".
   - Walk-ins can still be added by the receptionist until official closing time.

9. **Barber On Break**:
   - If a barber is toggled to "On Break", customers who specifically selected that barber are notified that the barber is on break.

10. **Real-Time Synchronization**:
    - All screens (Customer Status, Reception Dashboard, Barber View, Waiting Area TV, Owner Settings) synchronize state via Socket.IO within 1 second without manual browser refreshes.

---

## Test Checklist

- [ ] Join with 2 services -> displays correct total duration and price.
- [ ] Phone validation -> requires 10 valid digits; empty or invalid inputs rejected.
- [ ] Duplicate phone submission -> detects existing active queue spot and restores status.
- [ ] Maximum 3 services constraint -> prevents selecting more than 3 services.
- [ ] Call Next for Barber Amit -> correctly skips customer who requested Ravi.
- [ ] Customer phone -> updates to "It's your turn!" within 2 seconds when called.
- [ ] Barber Start / Done actions -> update Reception Dashboard and TV screen immediately.
- [ ] Customer cancellation -> allowed only in Waiting state; disabled in Called / In chair.
- [ ] No-show handling -> marking No-show removes from Called; re-adding places customer at queue end.
- [ ] Queue toggle -> closing online queue prevents remote joining with proper feedback.
- [ ] Language toggle -> switches all user-facing labels between English and Gujarati (EN/GU).
- [ ] Waiting Area TV -> displays active barbers, next 5 tokens, and flashes gold on newly called token.
- [ ] Backend persistence -> SQLite maintains tokens, customers, services, and queue states across server restart.
