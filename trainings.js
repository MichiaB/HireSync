const trainingOverviewChart = document.getElementById('trainingOverviewChart');
const trainingList = document.getElementById('trainingList');
const trainingDetailTitle = document.getElementById('trainingDetailTitle');
const trainingSessionDates = document.getElementById('trainingSessionDates');
const trainingDocuments = document.getElementById('trainingDocuments');
const uploadTrainingDocumentsBtn = document.getElementById('uploadTrainingDocumentsBtn');
const trainingDocumentsUploadInput = document.getElementById('trainingDocumentsUploadInput');

const scheduleTrainingForm = document.getElementById('scheduleTrainingForm');
const scheduledTrainingNameInput = document.getElementById('scheduledTrainingName');
const scheduledTrainingDateInput = document.getElementById('scheduledTrainingDate');
const scheduledTrainingStartTimeInput = document.getElementById('scheduledTrainingStartTime');
const scheduledTrainingDurationInput = document.getElementById('scheduledTrainingDuration');
const scheduledTrainingOccurrenceInput = document.getElementById('scheduledTrainingOccurrence');
const scheduledTrainingSessionCountInput = document.getElementById('scheduledTrainingSessionCount');
const scheduledTrainingColorInput = document.getElementById('scheduledTrainingColor');
const scheduledTrainingAttendedInput = document.getElementById('scheduledTrainingAttended');
const scheduledTrainingDocumentsInput = document.getElementById('scheduledTrainingDocuments');
const scheduleTrainingFeedback = document.getElementById('scheduleTrainingFeedback');
const scheduleTrainingSubmitBtn = document.getElementById('scheduleTrainingSubmitBtn');
const cancelScheduledTrainingEditBtn = document.getElementById('cancelScheduledTrainingEditBtn');
const scheduledTrainingManagerList = document.getElementById('scheduledTrainingManagerList');

const attendanceModalBackdrop = document.getElementById('attendanceModalBackdrop');
const closeAttendanceModal = document.getElementById('closeAttendanceModal');
const attendanceSessionInfo = document.getElementById('attendanceSessionInfo');
const attendanceCount = document.getElementById('attendanceCount');
const absenceCount = document.getElementById('absenceCount');

const CALENDAR_STORAGE_KEY = 'hiresyce_calendar_events_v1';
const SCHEDULED_TRAINING_STORAGE_KEY = 'hiresyce_scheduled_trainings_v1';

const defaultTrainingData = [
  {
    id: 1,
    title: 'Security Awareness Training',
    status: 'Completed',
    sessions: [
      { date: '2026-01-14', attended: 22, absent: 3 },
      { date: '2026-03-11', attended: 20, absent: 2 },
      { date: '2026-06-20', attended: 0, absent: 0 },
    ],
    documents: [
      { name: 'Security Deck', type: 'ppt', url: 'https://example.com/trainings/security-deck.pptx' },
      { name: 'Policy Handbook', type: 'pdf', url: 'https://example.com/trainings/security-policy.pdf' },
      { name: 'Session Recording', type: 'video', url: 'https://example.com/trainings/security-recording.mp4' },
    ],
  },
  {
    id: 2,
    title: 'Compliance Fundamentals',
    status: 'In Progress',
    sessions: [
      { date: '2026-02-02', attended: 18, absent: 5 },
      { date: '2026-03-25', attended: 0, absent: 0 },
      { date: '2026-04-18', attended: 0, absent: 0 },
    ],
    documents: [
      { name: 'Compliance Workbook', type: 'excel', url: 'https://example.com/trainings/compliance-workbook.xlsx' },
      { name: 'Instructor Notes', type: 'word', url: 'https://example.com/trainings/compliance-notes.docx' },
      { name: 'Q&A Audio', type: 'audio', url: 'https://example.com/trainings/compliance-audio.mp3' },
    ],
  },
  {
    id: 3,
    title: 'Product Onboarding',
    status: 'Not Completed',
    sessions: [
      { date: '2026-03-30', attended: 0, absent: 0 },
      { date: '2026-04-12', attended: 0, absent: 0 },
    ],
    documents: [
      { name: 'Product Guide', type: 'pdf', url: 'https://example.com/trainings/product-guide.pdf' },
      { name: 'Feature Demo', type: 'video', url: 'https://example.com/trainings/product-demo.mp4' },
    ],
  },
  {
    id: 4,
    title: 'Customer Communication Skills',
    status: 'In Progress',
    sessions: [
      { date: '2026-02-28', attended: 15, absent: 4 },
      { date: '2026-03-19', attended: 12, absent: 2 },
      { date: '2026-05-03', attended: 0, absent: 0 },
    ],
    documents: [
      { name: 'Communication Worksheet', type: 'word', url: 'https://example.com/trainings/communication-sheet.docx' },
      { name: 'Roleplay Script', type: 'pdf', url: 'https://example.com/trainings/roleplay-script.pdf' },
    ],
  },
  {
    id: 5,
    title: 'Tooling & Systems Setup',
    status: 'Completed',
    sessions: [
      { date: '2026-01-22', attended: 24, absent: 1 },
      { date: '2026-03-09', attended: 23, absent: 0 },
    ],
    documents: [
      { name: 'Systems Checklist', type: 'excel', url: 'https://example.com/trainings/systems-checklist.xlsx' },
      { name: 'Setup Walkthrough', type: 'video', url: 'https://example.com/trainings/setup-walkthrough.mp4' },
      { name: 'Reference Audio Brief', type: 'audio', url: 'https://example.com/trainings/setup-brief.mp3' },
    ],
  },
];

const statusOrder = ['Completed', 'In Progress', 'Not Completed'];
const statusColors = {
  Completed: '#58b9ff',
  'In Progress': '#bf8dff',
  'Not Completed': '#ffb347',
};

let selectedStatusFilter = null;
let selectedTrainingId = null;
let chartBars = [];
let editingScheduledTrainingId = null;

const SECURITY_AWARENESS_COMPLETED_TITLE = 'Security Awareness Training';

function normalizeColor(value) {
  const color = String(value || '').trim();
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#bf8dff';
}

function inferDocumentType(file) {
  if (!file) return 'file';

  const mimeType = String(file.type || '').toLowerCase();
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'ppt';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'excel';
  if (mimeType.includes('word')) return 'word';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';

  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (extension === 'pdf') return 'pdf';
  if (['ppt', 'pptx'].includes(extension)) return 'ppt';
  if (['xls', 'xlsx', 'csv'].includes(extension)) return 'excel';
  if (['doc', 'docx'].includes(extension)) return 'word';
  if (['mp4', 'mov', 'avi', 'webm'].includes(extension)) return 'video';
  if (['mp3', 'wav', 'm4a'].includes(extension)) return 'audio';

  return extension || 'file';
}

function isSecurityAwarenessCompleted(training) {
  return training && training.title === SECURITY_AWARENESS_COMPLETED_TITLE && training.status === 'Completed';
}

function toggleSecurityUploadControls(training) {
  if (isSecurityAwarenessCompleted(training)) {
    uploadTrainingDocumentsBtn.classList.remove('hidden');
  } else {
    uploadTrainingDocumentsBtn.classList.add('hidden');
    trainingDocumentsUploadInput.value = '';
  }
}

function loadCalendarEvents() {
  const raw = localStorage.getItem(CALENDAR_STORAGE_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
}

function saveCalendarEvents(calendarEvents) {
  localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(calendarEvents));
}

function loadScheduledTrainings() {
  const raw = localStorage.getItem(SCHEDULED_TRAINING_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((training) => training && typeof training === 'object')
      .map((training) => ({
        id: String(training.id || `scheduled-${crypto.randomUUID()}`),
        title: String(training.title || '').trim(),
        status: statusOrder.includes(training.status) ? training.status : 'In Progress',
        occurrence: String(training.occurrence || 'once'),
        startTime: String(training.startTime || '09:00'),
        durationHours: Number.isFinite(Number(training.durationHours)) ? Number(training.durationHours) : 1,
        sessionCount: Number.isFinite(Number(training.sessionCount)) ? Number(training.sessionCount) : 1,
        attended: Number.isFinite(Number(training.attended)) ? Number(training.attended) : 0,
        colorCode: normalizeColor(training.colorCode),
        sessions: Array.isArray(training.sessions)
          ? training.sessions
              .filter((session) => session && typeof session === 'object' && session.date)
              .map((session) => ({
                date: String(session.date),
                attended: Number.isFinite(Number(session.attended)) ? Number(session.attended) : 0,
                absent: Number.isFinite(Number(session.absent)) ? Number(session.absent) : 0,
              }))
          : [],
        documents: Array.isArray(training.documents)
          ? training.documents
              .filter((document) => document && typeof document === 'object' && document.name)
              .map((document) => ({
                name: String(document.name),
                type: String(document.type || 'file'),
                url: String(document.url || '#'),
              }))
          : [],
      }))
      .filter((training) => training.title.length > 0);
  } catch {
    return [];
  }
}

function saveScheduledTrainings(trainings) {
  localStorage.setItem(SCHEDULED_TRAINING_STORAGE_KEY, JSON.stringify(trainings));
}

function dedupeSessions(sessions) {
  const unique = [];
  const seen = new Set();

  sessions.forEach((session) => {
    const key = String(session.date);
    if (seen.has(key)) return;
    seen.add(key);
    unique.push(session);
  });

  unique.sort((left, right) => new Date(left.date) - new Date(right.date));
  return unique;
}

function deriveTrainingsFromCalendarEvents() {
  const calendarEvents = loadCalendarEvents();
  const byTitle = new Map();

  Object.entries(calendarEvents).forEach(([dateKey, events]) => {
    if (!Array.isArray(events)) return;

    events.forEach((event) => {
      const title = String(event.eventName ?? '').trim();
      if (!title) return;

      const titleKey = title.toLowerCase();
      if (!byTitle.has(titleKey)) {
        byTitle.set(titleKey, {
          id: `calendar-${titleKey.replace(/[^a-z0-9]+/gi, '-')}`,
          title,
          status: 'In Progress',
          sessions: [],
          documents: [],
        });
      }

      const training = byTitle.get(titleKey);
      training.sessions.push({
        date: String(event.startDate ?? dateKey),
        attended: 0,
        absent: 0,
      });
    });
  });

  return Array.from(byTitle.values()).map((training) => ({
    ...training,
    sessions: dedupeSessions(training.sessions),
  }));
}

function mergeTrainingData(baseTrainings, calendarDerivedTrainings) {
  const merged = baseTrainings.map((training) => ({ ...training, sessions: [...training.sessions] }));
  const byTitle = new Map(merged.map((training, index) => [training.title.toLowerCase(), index]));

  calendarDerivedTrainings.forEach((calendarTraining) => {
    const key = calendarTraining.title.toLowerCase();
    const existingIndex = byTitle.get(key);

    if (existingIndex === undefined) {
      merged.push(calendarTraining);
      byTitle.set(key, merged.length - 1);
      return;
    }

    const existing = merged[existingIndex];
    existing.sessions = dedupeSessions([...existing.sessions, ...calendarTraining.sessions]);
    if (existing.status !== 'Completed') {
      existing.status = 'In Progress';
    }
  });

  return merged;
}

let scheduledTrainingData = loadScheduledTrainings();
let trainingData = [];

scheduledTrainingData = scheduledTrainingData.map((training) => {
  const sessionDates = (training.sessions || []).map((session) => session.date);
  return {
    ...training,
    status: deriveDefaultStatus(training.occurrence, sessionDates),
  };
});
saveScheduledTrainings(scheduledTrainingData);

function rebuildTrainingData() {
  trainingData = mergeTrainingData(
    mergeTrainingData(defaultTrainingData, scheduledTrainingData),
    deriveTrainingsFromCalendarEvents()
  );
}

syncScheduledTrainingsToCalendar();
rebuildTrainingData();

function parseTimeToMinutes(timeValue) {
  const [hours, minutes] = String(timeValue || '09:00').split(':').map(Number);
  return hours * 60 + minutes;
}

function formatMinutesToTime(totalMinutes) {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = String(Math.floor(normalized / 60)).padStart(2, '0');
  const minutes = String(normalized % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date, months) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function createRecurringSessionDates(startDateString, occurrence, sessionCount) {
  const startDate = new Date(`${startDateString}T00:00:00`);
  if (Number.isNaN(startDate.getTime())) return [];

  const dates = [];
  for (let index = 0; index < sessionCount; index += 1) {
    let date;

    if (occurrence === 'weekly') {
      date = addDays(startDate, index * 7);
    } else if (occurrence === 'biweekly') {
      date = addDays(startDate, index * 14);
    } else if (occurrence === 'monthly') {
      date = addMonths(startDate, index);
    } else {
      date = addDays(startDate, index);
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
  }

  return dates;
}

function deriveTrainingStatusFromSessions(sessionDates) {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const hasFuture = sessionDates.some((dateString) => new Date(`${dateString}T00:00:00`) >= todayStart);
  return hasFuture ? 'In Progress' : 'Completed';
}

function deriveDefaultStatus(occurrence, sessionDates) {
  if (occurrence === 'once' && sessionDates.length === 1) {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const oneTimeDate = new Date(`${sessionDates[0]}T00:00:00`);
    return oneTimeDate < todayStart ? 'Completed' : 'Not Completed';
  }

  return deriveTrainingStatusFromSessions(sessionDates);
}

function buildScheduledTrainingPayload(formValues, existingTraining = null) {
  const sessionDates = createRecurringSessionDates(formValues.date, formValues.occurrence, formValues.sessionCount);
  const sessions = sessionDates.map((sessionDate) => ({
    date: sessionDate,
    attended: formValues.attended,
    absent: 0,
  }));

  const existingDocuments = existingTraining?.documents || [];
  const documents = [
    ...existingDocuments,
    ...formValues.uploadedFiles.map((file) => ({
      name: file.name,
      type: inferDocumentType(file),
      url: URL.createObjectURL(file),
    })),
  ];

  return {
    id: existingTraining?.id || `scheduled-${crypto.randomUUID()}`,
    title: formValues.title,
    status: deriveDefaultStatus(formValues.occurrence, sessionDates),
    occurrence: formValues.occurrence,
    startTime: formValues.startTime,
    durationHours: formValues.durationHours,
    sessionCount: formValues.sessionCount,
    attended: formValues.attended,
    colorCode: normalizeColor(formValues.colorCode),
    sessions,
    documents,
  };
}

function getEndTimeFromDuration(startTime, durationHours) {
  return formatMinutesToTime(parseTimeToMinutes(startTime) + Math.round(durationHours * 60));
}

function syncScheduledTrainingsToCalendar() {
  const calendarEvents = loadCalendarEvents();

  Object.keys(calendarEvents).forEach((dateKey) => {
    const filtered = (calendarEvents[dateKey] || []).filter(
      (event) => String(event.sourceType || '') !== 'scheduled-training'
    );

    if (filtered.length === 0) {
      delete calendarEvents[dateKey];
      return;
    }

    calendarEvents[dateKey] = filtered;
  });

  scheduledTrainingData.forEach((training) => {
    const endTime = getEndTimeFromDuration(training.startTime, training.durationHours);
    const sessionDates = (training.sessions || []).map((session) => session.date);

    sessionDates.forEach((dateKey, index) => {
      if (!Array.isArray(calendarEvents[dateKey])) {
        calendarEvents[dateKey] = [];
      }

      const notePrefix =
        training.occurrence === 'once' ? 'One-time training session' : `Recurring training (${training.occurrence})`;
      calendarEvents[dateKey].push({
        id: crypto.randomUUID(),
        eventName: training.title,
        startDate: dateKey,
        endDate: dateKey,
        startTime: training.startTime,
        endTime,
        colorCode: normalizeColor(training.colorCode),
        note: `${notePrefix} • Session ${index + 1} • Attended: ${training.attended}`,
        sourceType: 'scheduled-training',
        sourceTrainingId: training.id,
      });
    });
  });

  saveCalendarEvents(calendarEvents);
}

function renderScheduledTrainingManager() {
  scheduledTrainingManagerList.innerHTML = '';

  if (scheduledTrainingData.length === 0) {
    scheduledTrainingManagerList.innerHTML =
      '<li class="scheduled-training-empty">No scheduled trainings yet. Use the form above to create one.</li>';
    return;
  }

  const sorted = [...scheduledTrainingData].sort((left, right) => {
    const leftDate = left.sessions?.[0]?.date || '';
    const rightDate = right.sessions?.[0]?.date || '';
    return leftDate.localeCompare(rightDate);
  });

  sorted.forEach((training) => {
    const firstDate = training.sessions?.[0]?.date || 'n/a';
    const listItem = document.createElement('li');
    listItem.className = 'scheduled-training-item';

    listItem.innerHTML = `
      <div class="scheduled-training-main">
        <span class="scheduled-training-dot" style="background:${normalizeColor(training.colorCode)}"></span>
        <div>
          <strong>${training.title}</strong>
          <div class="scheduled-training-meta">${firstDate} • ${training.occurrence} • ${training.sessionCount} session(s)</div>
        </div>
      </div>
      <div class="scheduled-training-actions">
        <button type="button" class="secondary" data-action="edit" data-training-id="${training.id}">Edit</button>
        <button type="button" class="secondary" data-action="delete" data-training-id="${training.id}">Delete</button>
      </div>
    `;

    scheduledTrainingManagerList.appendChild(listItem);
  });
}

function setEditingMode(training = null) {
  if (!training) {
    editingScheduledTrainingId = null;
    scheduleTrainingSubmitBtn.textContent = 'Schedule Training';
    cancelScheduledTrainingEditBtn.classList.add('hidden');
    return;
  }

  editingScheduledTrainingId = training.id;
  scheduleTrainingSubmitBtn.textContent = 'Update Training';
  cancelScheduledTrainingEditBtn.classList.remove('hidden');
}

function fillScheduleFormFromTraining(training) {
  const firstDate = training.sessions?.[0]?.date || '';
  scheduledTrainingNameInput.value = training.title;
  scheduledTrainingDateInput.value = firstDate;
  scheduledTrainingStartTimeInput.value = training.startTime;
  scheduledTrainingDurationInput.value = String(training.durationHours);
  scheduledTrainingOccurrenceInput.value = training.occurrence;
  scheduledTrainingSessionCountInput.value = String(training.sessionCount);
  scheduledTrainingColorInput.value = normalizeColor(training.colorCode);
  scheduledTrainingAttendedInput.value = String(training.attended);
}

function removeScheduledTraining(trainingId) {
  scheduledTrainingData = scheduledTrainingData.filter((training) => training.id !== trainingId);
  saveScheduledTrainings(scheduledTrainingData);
  syncScheduledTrainingsToCalendar();
  rebuildTrainingData();

  if (editingScheduledTrainingId === trainingId) {
    resetScheduleTrainingForm();
  }
}

function resetScheduleTrainingForm() {
  scheduleTrainingForm.reset();
  scheduledTrainingStartTimeInput.value = '09:00';
  scheduledTrainingDurationInput.value = '1';
  scheduledTrainingSessionCountInput.value = '1';
  scheduledTrainingOccurrenceInput.value = 'once';
  scheduledTrainingColorInput.value = '#bf8dff';
  scheduledTrainingAttendedInput.value = '0';
  setEditingMode(null);
}

function setScheduleFeedback(message, isError = false) {
  scheduleTrainingFeedback.textContent = message;
  scheduleTrainingFeedback.classList.toggle('error', isError);
}

function handleScheduledTrainingManagerClick(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const action = button.getAttribute('data-action');
  const trainingId = button.getAttribute('data-training-id');
  if (!action || !trainingId) return;

  if (action === 'edit') {
    const selected = scheduledTrainingData.find((training) => training.id === trainingId);
    if (!selected) return;

    fillScheduleFormFromTraining(selected);
    setEditingMode(selected);
    setScheduleFeedback(`Editing ${selected.title}. Update fields and click Update Training.`);
    return;
  }

  if (action === 'delete') {
    const selected = scheduledTrainingData.find((training) => training.id === trainingId);
    if (!selected) return;

    removeScheduledTraining(trainingId);

    if (selectedTrainingId === trainingId) {
      selectedTrainingId = null;
    }

    renderStatusChart();
    renderTrainingList();
    renderScheduledTrainingManager();
    setScheduleFeedback(`Deleted scheduled training: ${selected.title}.`);
  }
}

function handleCancelScheduledTrainingEdit() {
  resetScheduleTrainingForm();
  setScheduleFeedback('Edit cancelled. You can schedule a new training.');
}

function handleScheduleTrainingSubmit(event) {
  event.preventDefault();

  const title = String(scheduledTrainingNameInput.value || '').trim();
  const date = String(scheduledTrainingDateInput.value || '');
  const startTime = String(scheduledTrainingStartTimeInput.value || '09:00');
  const durationHours = Number(scheduledTrainingDurationInput.value || 0);
  const occurrence = String(scheduledTrainingOccurrenceInput.value || 'once');
  const sessionCount = Math.max(1, Number(scheduledTrainingSessionCountInput.value || 1));
  const attended = Math.max(0, Number(scheduledTrainingAttendedInput.value || 0));
  const colorCode = normalizeColor(scheduledTrainingColorInput.value);
  const uploadedFiles = Array.from(scheduledTrainingDocumentsInput.files || []);

  if (!title || !date || !startTime || !Number.isFinite(durationHours) || durationHours <= 0) {
    setScheduleFeedback('Please complete all required schedule fields.', true);
    return;
  }

  const existingTraining = scheduledTrainingData.find((training) => training.id === editingScheduledTrainingId) || null;
  const payload = buildScheduledTrainingPayload(
    { title, date, startTime, durationHours, occurrence, sessionCount, attended, colorCode, uploadedFiles },
    existingTraining
  );

  if (payload.sessions.length === 0) {
    setScheduleFeedback('Unable to schedule this training. Check the selected date.', true);
    return;
  }

  const existingIndex = scheduledTrainingData.findIndex((training) => training.id === payload.id);
  if (existingIndex === -1) {
    scheduledTrainingData.push(payload);
  } else {
    scheduledTrainingData.splice(existingIndex, 1, payload);
  }

  saveScheduledTrainings(scheduledTrainingData);
  syncScheduledTrainingsToCalendar();
  rebuildTrainingData();

  selectedStatusFilter = null;
  selectedTrainingId = null;
  const selectedTraining = trainingData.find((training) => training.title.toLowerCase() === payload.title.toLowerCase());
  if (selectedTraining) {
    selectedTrainingId = selectedTraining.id;
  }

  renderStatusChart();
  renderTrainingList();
  renderScheduledTrainingManager();

  const modeLabel = editingScheduledTrainingId ? 'Updated' : 'Scheduled';
  resetScheduleTrainingForm();
  setScheduleFeedback(`${modeLabel} ${payload.title} and synced it to Calendar.`);
}

function getStatusCounts() {
  return statusOrder.map((status) => ({
    status,
    count: trainingData.filter((training) => training.status === status).length,
  }));
}

function setupCanvas(canvas, size = { width: 380, height: 320 }) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = size.width * dpr;
  canvas.height = size.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size.width, size.height);
  return { ctx, width: size.width, height: size.height };
}

function renderStatusChart() {
  const { ctx, width, height } = setupCanvas(trainingOverviewChart, { width: 380, height: 320 });
  const counts = getStatusCounts();
  const maxCount = Math.max(1, ...counts.map((entry) => entry.count));

  const baseY = 270;
  const barWidth = 82;
  const gap = 26;
  const startX = 42;
  const maxBarHeight = 180;

  chartBars = [];

  counts.forEach((entry, index) => {
    const barHeight = (entry.count / maxCount) * maxBarHeight;
    const x = startX + index * (barWidth + gap);
    const y = baseY - barHeight;

    ctx.fillStyle = statusColors[entry.status];
    ctx.fillRect(x, y, barWidth, barHeight);

    if (selectedStatusFilter === entry.status) {
      ctx.strokeStyle = '#e8f1ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 2, y - 2, barWidth + 4, barHeight + 4);
    }

    ctx.fillStyle = '#e8f1ff';
    ctx.font = '12px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText(String(entry.count), x + barWidth / 2, y - 10);

    ctx.fillStyle = '#9ab1d8';
    ctx.fillText(entry.status, x + barWidth / 2, baseY + 18);

    chartBars.push({ status: entry.status, x, y, width: barWidth, height: barHeight });
  });

  ctx.strokeStyle = 'rgba(154, 177, 216, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(30, baseY);
  ctx.lineTo(width - 22, baseY);
  ctx.stroke();
}

function getFilteredTrainings() {
  if (!selectedStatusFilter) return trainingData;
  return trainingData.filter((training) => training.status === selectedStatusFilter);
}

function renderTrainingList() {
  const trainings = getFilteredTrainings();
  trainingList.innerHTML = '';

  if (trainings.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'training-empty';
    empty.textContent = 'No trainings match this filter.';
    trainingList.appendChild(empty);
    renderTrainingDetails(null);
    return;
  }

  trainings.forEach((training) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'training-item-btn';

    if (selectedTrainingId === training.id) {
      button.classList.add('active');
    }

    button.innerHTML = `
      <strong>${training.title}</strong>
      <span class="training-status-text">${training.status}</span>
    `;

    button.addEventListener('click', () => {
      selectedTrainingId = training.id;
      renderTrainingList();
      renderTrainingDetails(training.id);
    });

    item.appendChild(button);
    trainingList.appendChild(item);
  });

  const validSelected = trainings.some((training) => training.id === selectedTrainingId);
  if (!validSelected) {
    selectedTrainingId = trainings[0].id;
  }

  renderTrainingDetails(selectedTrainingId);
}

function getSessionTimingLabel(dateString) {
  const sessionDate = new Date(`${dateString}T00:00:00`);
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return sessionDate < todayStart ? 'Past' : 'Upcoming';
}

function renderTrainingDetails(trainingId) {
  const training = trainingData.find((entry) => entry.id === trainingId);

  if (!training) {
    trainingDetailTitle.textContent = 'Training Details';
    trainingSessionDates.innerHTML = '<li class="training-empty">Select a training to view details.</li>';
    trainingDocuments.innerHTML = '<li class="training-empty">No documents available.</li>';
    toggleSecurityUploadControls(null);
    return;
  }

  trainingDetailTitle.textContent = `${training.title} (${training.status})`;
  toggleSecurityUploadControls(training);

  trainingSessionDates.innerHTML = '';
  training.sessions.forEach((session) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'session-date-btn';
    button.textContent = `${session.date} • ${getSessionTimingLabel(session.date)}`;

    button.addEventListener('click', () => openAttendanceModal(training.title, session));
    item.appendChild(button);
    trainingSessionDates.appendChild(item);
  });

  trainingDocuments.innerHTML = '';
  training.documents.forEach((document) => {
    const item = document.createElement('li');
    item.className = 'training-document-item';
    item.innerHTML = `
      <span class="doc-type">${document.type.toUpperCase()}</span>
      <a href="${document.url}" target="_blank" rel="noopener noreferrer">${document.name}</a>
    `;
    trainingDocuments.appendChild(item);
  });

  if (training.documents.length === 0) {
    trainingDocuments.innerHTML = '<li class="training-empty">No documents available.</li>';
  }
}

function handleUploadTrainingDocumentsClick() {
  const selectedTraining = trainingData.find((entry) => entry.id === selectedTrainingId);
  if (!isSecurityAwarenessCompleted(selectedTraining)) return;
  trainingDocumentsUploadInput.click();
}

function handleTrainingDocumentsUpload(event) {
  const selectedTraining = trainingData.find((entry) => entry.id === selectedTrainingId);
  if (!isSecurityAwarenessCompleted(selectedTraining)) {
    trainingDocumentsUploadInput.value = '';
    return;
  }

  const files = Array.from(event.target.files || []);
  if (files.length === 0) return;

  files.forEach((file) => {
    selectedTraining.documents.push({
      name: file.name,
      type: inferDocumentType(file),
      url: URL.createObjectURL(file),
    });
  });

  trainingDocumentsUploadInput.value = '';
  renderTrainingDetails(selectedTraining.id);
}

function openAttendanceModal(trainingTitle, session) {
  attendanceSessionInfo.textContent = `${trainingTitle} • ${session.date}`;
  attendanceCount.textContent = String(session.attended);
  absenceCount.textContent = String(session.absent);
  attendanceModalBackdrop.classList.remove('hidden');
}

function closeAttendancePopup() {
  attendanceModalBackdrop.classList.add('hidden');
}

function handleStatusChartClick(event) {
  const rect = trainingOverviewChart.getBoundingClientRect();
  const scaleX = rect.width / 380;
  const scaleY = rect.height / 320;
  const clickX = (event.clientX - rect.left) / scaleX;
  const clickY = (event.clientY - rect.top) / scaleY;

  const clickedBar = chartBars.find(
    (bar) => clickX >= bar.x && clickX <= bar.x + bar.width && clickY >= bar.y && clickY <= bar.y + bar.height
  );

  if (!clickedBar) {
    selectedStatusFilter = null;
  } else if (selectedStatusFilter === clickedBar.status) {
    selectedStatusFilter = null;
  } else {
    selectedStatusFilter = clickedBar.status;
  }

  renderStatusChart();
  renderTrainingList();
}

trainingOverviewChart.addEventListener('click', handleStatusChartClick);
closeAttendanceModal.addEventListener('click', closeAttendancePopup);
uploadTrainingDocumentsBtn.addEventListener('click', handleUploadTrainingDocumentsClick);
trainingDocumentsUploadInput.addEventListener('change', handleTrainingDocumentsUpload);
scheduleTrainingForm.addEventListener('submit', handleScheduleTrainingSubmit);
scheduledTrainingManagerList.addEventListener('click', handleScheduledTrainingManagerClick);
cancelScheduledTrainingEditBtn.addEventListener('click', handleCancelScheduledTrainingEdit);
attendanceModalBackdrop.addEventListener('click', (event) => {
  if (event.target === attendanceModalBackdrop) {
    closeAttendancePopup();
  }
});

renderStatusChart();
renderTrainingList();
renderScheduledTrainingManager();
