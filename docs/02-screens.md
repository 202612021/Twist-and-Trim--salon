# Salon Queue Management System — Screens & Features

## Screen 1: Home (/)
- Header: Salon name ("Royal Crown Salon"), Logo, 'Open · Closes 9 PM' status badge, EN/GU language toggle
- Live Queue Card: e.g. "6 people waiting · about 50 min"
- Barber Status Chips: Ravi (busy) · Amit (free) · Imran (on break)
- Main Action: Large prominent gold button `[ Join Queue ]` linking to `/join`
- Staff navigation links in subtle footer/header (`/reception`, `/barber/Ravi`, `/display`, `/admin`)

## Screen 2: Join Queue (/join)
- Input: Customer Name (required)
- Input: Phone number (10 digits, validated, Indian phone format e.g. 9876543210)
- Service cards (multi-select, max 3 services):
  * Haircut (30 min · ₹150)
  * Beard Trim (15 min · ₹80)
  * Hair Spa (45 min · ₹400)
  * Head Massage (20 min · ₹120)
  * Shave (15 min · ₹70)
  * Hair Color (40 min · ₹350)
- Barber picker:
  * "Any barber (fastest)"
  * Specific barber cards: Ravi, Amit, Imran (with status indicator if on break)
- Live summary sticky/bottom card:
  * "Total {total_duration} min · ₹{total_price} · Expected wait ~{estimated_wait} min"
- Button: `[ Confirm ]` (disabled if name missing, invalid phone, or 0 services selected) -> transitions to `/status/:id`

## Screen 3: My Status (/status/:id)
- Prominent large token display (e.g. "S-14")
- Current queue position (e.g. "4th in line")
- Circular or bar countdown: estimated wait (e.g. "about 35 min", recalculates automatically)
- State alerts:
  * Normal Waiting: Shows position and wait time
  * 2nd in line: Prominent banner "Start coming to the salon!"
  * When Called: Full-screen golden overlay "It's your turn! Go to {barber_name}" with animated pulse and pleasant sound chime
  * In chair: "Currently being served by {barber_name}"
  * Done: "Service completed! Thank you for visiting."
- Action: `[ Cancel my spot ]` button with confirmation popup (only enabled while status is Waiting)

## Screen 4: Reception Dashboard (/reception) — Tablet / Desktop
- Header with live stats and quick button `[ + Add Walk-in ]` (opens modal)
- Left column (Barber Stations):
  * Card per barber on duty: Barber name, current customer token + name + service, elapsed time / time remaining progress bar
  * Action button: `[ Call Next ]` (automatically selects the next valid customer for this barber or 'Any')
- Right column (Waiting List):
  * Sequential list: Token, Name, Phone, Services, Preferred Barber, Elapsed Wait Time
  * Highlight warning in amber if waiting > 60 min
  * Row actions: `[ No-Show ]` (for called customers not showing up) and `[ Cancel ]`
- Walk-in Modal: Fast entry for Name, Phone, Services (max 3), Preferred Barber

## Screen 5: Barber View (/barber/:name) — Mobile / Tablet
- Header: Barber Name, status toggle `[ Available / On Break ]`
- Active Customer Card:
  * Customer Name, Token, Services, Total duration
  * Running timer since service started
  * Action buttons: `[ Start ]` (moves from Called -> In chair) and `[ Done ]` (moves In chair -> Done)
- Next in Line Preview:
  * "Next for you: S-15 Kunal (Haircut, 30 min)"

## Screen 6: Waiting Area TV (/display) — TV / Full-screen 1080p
- Dark charcoal theme with high-contrast gold and green typography readable from 5 meters
- Barber Stations Grid:
  * Card for each barber with photo/avatar, barber name, and current status:
    - Serving: "Now: S-12 (Rahul)"
    - Available: "Ready for next"
    - On Break: "On Break"
- Up Next List:
  * Next 5 waiting tokens with estimated wait times
- Notification Overlay:
  * Newly called token flashes in radiant gold for 5 seconds with audio chime

## Screen 7: Owner Settings (/admin)
- Today's Summary Metrics:
  * Customers Served Today
  * Average Wait Time (minutes)
  * No-Shows Count
  * Total Revenue Today (₹)
- Queue Control Switch:
  * Online Queue Status: `[ Open / Closed ]` (when closed, prevents remote joining on `/join` with informative banner)
- Barbers On Duty Management:
  * List of barbers: Toggle On Duty / Off Duty, Toggle On Break
- Services Catalog Manager:
  * Add, Edit, Delete, and Toggle Active/Sold-Out for services
  * Fields: English Name, Gujarati Name, Duration (minutes), Price (₹), Category
