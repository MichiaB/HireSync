const monthLabel = document.getElementById('calendarMonthLabel');
const calendarGrid = document.getElementById('calendarGrid');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const calendarAddBtn = document.getElementById('calendarAddBtn');

const calendarModalBackdrop = document.getElementById('calendarModalBackdrop');
const closeCalendarModalBtn = document.getElementById('closeCalendarModal');
const calendarModalTitle = document.getElementById('calendar-modal-title');
const selectedDayLabel = document.getElementById('selectedDayLabel');
const dayEventsList = document.getElementById('dayEventsList');
const addEventBtn = document.getElementById('addEventBtn');
const sendDayInviteBtn = document.getElementById('sendDayInviteBtn');

const eventModalBackdrop = document.getElementById('eventModalBackdrop');
const closeEventModalBtn = document.getElementById('closeEventModal');
const eventForm = document.getElementById('calendarEventForm');
const sendEventInviteBtn = document.getElementById('sendEventInviteBtn');
const deleteEventBtn = document.getElementById('deleteEventBtn');
const noteWordCount = document.getElementById('noteWordCount');

const eventNameInput = document.getElementById('eventName');
const eventStartTimeInput = document.getElementById('eventStartTime');
const eventEndTimeInput = document.getElementById('eventEndTime');
const eventStartDateInput = document.getElementById('eventStartDate');
const eventEndDateInput = document.getElementById('eventEndDate');
const eventColorCodeInput = document.getElementById('eventColorCode');
const eventNoteInput = document.getElementById('eventNote');

const CALENDAR_STORAGE_KEY = 'hiresyce_calendar_events_v1';

let currentMonthDate = new Date();
currentMonthDate = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), 1);

let selectedDayKey = null;
let selectedEventId = null;
let draftEventDayKey = null;

let eventsByDate = {
  '2026-03-10': [
    {
      id: crypto.randomUUID(),
      eventName: 'Onboarding Orientation',
      startDate: '2026-03-10',
      endDate: '2026-03-10',
      startTime: '09:00',
      endTime: '10:00',
      colorCode: '#58b9ff',
      note: 'Welcome session and HR overview for incoming hires.',
    },
  ],
  '2026-03-12': [
    {
      id: crypto.randomUUID(),
      eventName: 'IT Setup Checkpoint',
      startDate: '2026-03-12',
      endDate: '2026-03-12',
      startTime: '14:30',
      endTime: '15:30',
      colorCode: '#bf8dff',
      note: 'Confirm hardware, account access, and MFA activation.',
    },
  ],
};

function saveEventsToStorage() {
  localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(eventsByDate));
}

function loadEventsFromStorage() {
  const raw = localStorage.getItem(CALENDAR_STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return;

    const normalized = {};
    Object.entries(parsed).forEach(([dateKey, events]) => {
      if (!Array.isArray(events)) return;

      normalized[dateKey] = events
        .filter((event) => event && typeof event === 'object')
        .map((event) => ({
          id: typeof event.id === 'string' ? event.id : crypto.randomUUID(),
          eventName: String(event.eventName ?? '').trim(),
          startDate: String(event.startDate ?? dateKey),
          endDate: String(event.endDate ?? dateKey),
          startTime: String(event.startTime ?? event.time ?? '09:00'),
          endTime: String(event.endTime ?? event.time ?? '10:00'),
          colorCode: normalizeColor(event.colorCode),
          note: String(event.note ?? ''),
        }))
        .filter((event) => event.eventName.length > 0);
    });

    eventsByDate = normalized;
  } catch {
  }
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatHumanDate(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function normalizeColor(value) {
  const color = String(value ?? '').trim();
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#58b9ff';
}

function isDateWithinRange(targetDateKey, startDateKey, endDateKey) {
  return targetDateKey >= startDateKey && targetDateKey <= endDateKey;
}

function clampNoteTo200Words(text) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= 200) return text;
  return words.slice(0, 200).join(' ');
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function updateWordCounter() {
  const words = countWords(eventNoteInput.value);
  noteWordCount.textContent = `${Math.min(words, 200)} / 200 words`;
}

function getEventsForDay(dateKey) {
  return eventsByDate[dateKey] ?? [];
}

function getAllEvents() {
  return Object.values(eventsByDate)
    .flatMap((events) => (Array.isArray(events) ? events : []))
    .filter((event) => event && typeof event === 'object');
}

function getEventsForCalendarDay(dateKey) {
  return getAllEvents().filter((event) =>
    isDateWithinRange(dateKey, String(event.startDate), String(event.endDate))
  );
}

function getSpanningEventsForDate(dateKey) {
  return getEventsForCalendarDay(dateKey).filter((event) => String(event.startDate) !== String(event.endDate));
}

function findEventById(eventId) {
  for (const [dayKey, events] of Object.entries(eventsByDate)) {
    const foundEvent = (events ?? []).find((entry) => entry.id === eventId);
    if (foundEvent) {
      return { sourceDayKey: dayKey, event: foundEvent };
    }
  }

  return null;
}

function ensureDayEvents(dateKey) {
  if (!eventsByDate[dateKey]) {
    eventsByDate[dateKey] = [];
  }
}

function removeEmptyDay(dateKey) {
  if (eventsByDate[dateKey] && eventsByDate[dateKey].length === 0) {
    delete eventsByDate[dateKey];
  }
}

function getNextEventNameForDay(dateKey) {
  const countForDay = getEventsForDay(dateKey).length;
  return `New Event ${countForDay + 1}`;
}

function renderCalendar() {
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  monthLabel.textContent = firstDay.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  calendarGrid.innerHTML = '';

  for (let i = 0; i < startWeekday; i += 1) {
    const spacer = document.createElement('div');
    spacer.className = 'calendar-cell calendar-cell--empty';
    calendarGrid.appendChild(spacer);
  }

  const todayKey = formatDateKey(new Date());

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const dateKey = formatDateKey(date);
    const events = getEventsForCalendarDay(dateKey);
    const spanningEvents = getSpanningEventsForDate(dateKey);
    const spanningLineColor = spanningEvents[0]?.colorCode ?? '#58b9ff';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'calendar-cell';

    if (dateKey === todayKey) {
      button.classList.add('calendar-cell--today');
    }

    button.innerHTML = `
      <span class="calendar-day-number">${day}</span>
      ${
        spanningEvents.length
          ? `<span class="calendar-span-line" style="--line-color: ${spanningLineColor}"></span>`
          : ''
      }
    `;

    button.addEventListener('click', () => openDayModal(dateKey));
    calendarGrid.appendChild(button);
  }
}

function renderEventList() {
  const events = getEventsForCalendarDay(selectedDayKey);
  dayEventsList.innerHTML = '';

  if (events.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'day-event-item empty';
    empty.textContent = 'No events yet for this day. Click + Add Another Event.';
    dayEventsList.appendChild(empty);
    return;
  }

  events.forEach((event) => {
    const item = document.createElement('li');
    item.className = 'day-event-item';

    const bulletButton = document.createElement('button');
    bulletButton.type = 'button';
    bulletButton.className = 'day-event-bullet-btn';
    bulletButton.style.borderLeft = `4px solid ${normalizeColor(event.colorCode)}`;
    bulletButton.textContent = `${event.eventName} (${event.startTime} - ${event.endTime})`;

    bulletButton.addEventListener('click', () => openEventDetailModal(event.id));

    item.appendChild(bulletButton);
    dayEventsList.appendChild(item);
  });
}

function clearEventForm(defaultDateKey) {
  eventNameInput.value = getNextEventNameForDay(defaultDateKey);
  eventStartTimeInput.value = '09:00';
  eventEndTimeInput.value = '10:00';
  eventStartDateInput.value = defaultDateKey;
  eventEndDateInput.value = defaultDateKey;
  eventColorCodeInput.value = '#58b9ff';
  eventNoteInput.value = '';
  updateWordCounter();
}

function fillEventForm(event) {
  eventNameInput.value = event.eventName;
  eventStartTimeInput.value = event.startTime;
  eventEndTimeInput.value = event.endTime;
  eventStartDateInput.value = event.startDate;
  eventEndDateInput.value = event.endDate;
  eventColorCodeInput.value = normalizeColor(event.colorCode);
  eventNoteInput.value = event.note;
  updateWordCounter();
}

function openDayModal(dateKey) {
  selectedDayKey = dateKey;
  calendarModalTitle.textContent = formatHumanDate(dateKey);
  selectedDayLabel.textContent = 'Events';
  ensureDayEvents(dateKey);
  renderEventList();
  calendarModalBackdrop.classList.remove('hidden');
}

function closeDayModal() {
  calendarModalBackdrop.classList.add('hidden');
  calendarModalTitle.textContent = 'Day Events';
  selectedDayKey = null;
}

function sendDayInvite() {
  if (!selectedDayKey) return;

  const events = getEventsForCalendarDay(selectedDayKey);
  if (events.length === 0) {
    window.alert('No events available for this day to include in an invite.');
    return;
  }

  const subject = `Meeting Invite - ${formatHumanDate(selectedDayKey)}`;
  const eventLines = events
    .map(
      (event) =>
        `- ${event.eventName} | ${event.startTime}-${event.endTime} | ${event.startDate} to ${event.endDate}${
          event.note ? ` | Note: ${event.note}` : ''
        }`
    )
    .join('\n');

  const body = `Hello,\n\nPlease join the following meeting events:\n\n${eventLines}\n\nRegards,\nHireSync`;
  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function openEventDetailModal(eventId = null, sourceDayKey = null) {
  selectedEventId = eventId;
  draftEventDayKey = sourceDayKey || selectedDayKey || formatDateKey(new Date());

  if (selectedEventId) {
    const located = findEventById(selectedEventId);
    if (located) {
      draftEventDayKey = located.sourceDayKey;
      fillEventForm(located.event);
      deleteEventBtn.disabled = false;
    }
  } else {
    clearEventForm(draftEventDayKey);
    deleteEventBtn.disabled = true;
  }

  eventModalBackdrop.classList.remove('hidden');
}

function closeEventDetailModal() {
  eventModalBackdrop.classList.add('hidden');
  selectedEventId = null;
  draftEventDayKey = null;
}

function addEventForSelectedDay() {
  if (!selectedDayKey) return;
  openEventDetailModal(null, selectedDayKey);
}

function addEventFromCalendarTopRight() {
  const todayKey = formatDateKey(new Date());
  openDayModal(todayKey);
  openEventDetailModal(null, todayKey);
}

function sendEventInvite() {
  const eventName = eventNameInput.value.trim();
  const startDate = eventStartDateInput.value;
  const endDate = eventEndDateInput.value;
  const startTime = eventStartTimeInput.value;
  const endTime = eventEndTimeInput.value;
  const note = eventNoteInput.value.trim();

  if (!eventName || !startDate || !endDate || !startTime || !endTime) {
    window.alert('Please complete event details before sending an invite.');
    return;
  }

  const subject = `Meeting Invite - ${eventName}`;
  const body = `Hello,\n\nYou are invited to:\n\nEvent: ${eventName}\nStart: ${startDate} ${startTime}\nEnd: ${endDate} ${endTime}\n${note ? `Note: ${note}\n` : ''}\nRegards,\nHireSync`;
  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function saveEvent(event) {
  event.preventDefault();
  const baseDayKey = draftEventDayKey || selectedDayKey || formatDateKey(new Date());

  const trimmedNote = clampNoteTo200Words(eventNoteInput.value);
  eventNoteInput.value = trimmedNote;
  updateWordCounter();

  const payload = {
    eventName: eventNameInput.value.trim(),
    startDate: eventStartDateInput.value,
    endDate: eventEndDateInput.value,
    startTime: eventStartTimeInput.value,
    endTime: eventEndTimeInput.value,
    colorCode: normalizeColor(eventColorCodeInput.value),
    note: trimmedNote.trim(),
  };

  if (!payload.eventName || !payload.startDate || !payload.endDate || !payload.startTime || !payload.endTime) {
    return;
  }

  const targetDayKey = payload.startDate;
  ensureDayEvents(targetDayKey);

  if (selectedEventId) {
    const located = findEventById(selectedEventId);
    const sourceDayKey = located?.sourceDayKey ?? baseDayKey;
    const sourceEvents = getEventsForDay(sourceDayKey);
    const index = sourceEvents.findIndex((entry) => entry.id === selectedEventId);

    if (index >= 0) {
      const updatedEvent = { ...sourceEvents[index], ...payload };
      sourceEvents.splice(index, 1);
      removeEmptyDay(sourceDayKey);
      eventsByDate[targetDayKey].push(updatedEvent);
    }
  } else {
    eventsByDate[targetDayKey].push({
      id: crypto.randomUUID(),
      ...payload,
    });
  }

  saveEventsToStorage();

  if (selectedDayKey !== targetDayKey) {
    selectedDayKey = targetDayKey;
    selectedDayLabel.textContent = formatHumanDate(targetDayKey);
  }

  closeEventDetailModal();
  renderEventList();
  renderCalendar();
}

function deleteSelectedEvent() {
  if (!selectedEventId || !draftEventDayKey) return;

  eventsByDate[draftEventDayKey] = getEventsForDay(draftEventDayKey).filter(
    (event) => event.id !== selectedEventId
  );
  removeEmptyDay(draftEventDayKey);
  saveEventsToStorage();

  closeEventDetailModal();
  if (selectedDayKey) {
    renderEventList();
  }
  renderCalendar();
}

prevMonthBtn.addEventListener('click', () => {
  currentMonthDate = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1);
  renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
  currentMonthDate = new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1);
  renderCalendar();
});

calendarAddBtn.addEventListener('click', addEventFromCalendarTopRight);

closeCalendarModalBtn.addEventListener('click', closeDayModal);
calendarModalBackdrop.addEventListener('click', (event) => {
  if (event.target === calendarModalBackdrop) {
    closeDayModal();
  }
});

closeEventModalBtn.addEventListener('click', closeEventDetailModal);
eventModalBackdrop.addEventListener('click', (event) => {
  if (event.target === eventModalBackdrop) {
    closeEventDetailModal();
  }
});

addEventBtn.addEventListener('click', addEventForSelectedDay);
sendDayInviteBtn.addEventListener('click', sendDayInvite);
sendEventInviteBtn.addEventListener('click', sendEventInvite);
eventForm.addEventListener('submit', saveEvent);
deleteEventBtn.addEventListener('click', deleteSelectedEvent);

eventNoteInput.addEventListener('input', () => {
  const clamped = clampNoteTo200Words(eventNoteInput.value);
  if (clamped !== eventNoteInput.value) {
    eventNoteInput.value = clamped;
  }
  updateWordCounter();
});

loadEventsFromStorage();
renderCalendar();
