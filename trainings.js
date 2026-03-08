const trainingOverviewChart = document.getElementById('trainingOverviewChart');
const trainingList = document.getElementById('trainingList');
const trainingDetailTitle = document.getElementById('trainingDetailTitle');
const trainingSessionDates = document.getElementById('trainingSessionDates');
const trainingDocuments = document.getElementById('trainingDocuments');

const attendanceModalBackdrop = document.getElementById('attendanceModalBackdrop');
const closeAttendanceModal = document.getElementById('closeAttendanceModal');
const attendanceSessionInfo = document.getElementById('attendanceSessionInfo');
const attendanceCount = document.getElementById('attendanceCount');
const absenceCount = document.getElementById('absenceCount');

const CALENDAR_STORAGE_KEY = 'hiresyce_calendar_events_v1';

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

function dedupeSessions(sessions) {
  const unique = [];
  const seen = new Set();

  sessions.forEach((session) => {
    const key = `${session.date}-${session.attended}-${session.absent}`;
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

const trainingData = mergeTrainingData(defaultTrainingData, deriveTrainingsFromCalendarEvents());

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
    return;
  }

  trainingDetailTitle.textContent = `${training.title} (${training.status})`;

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
attendanceModalBackdrop.addEventListener('click', (event) => {
  if (event.target === attendanceModalBackdrop) {
    closeAttendancePopup();
  }
});

renderStatusChart();
renderTrainingList();
