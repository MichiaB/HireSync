const tabButtons = document.querySelectorAll('.tab');
const tabContent = document.getElementById('tab-content');
const hireList = document.getElementById('hire-list');
const backdrop = document.getElementById('modal-backdrop');
const closeModalBtn = document.getElementById('close-modal');
const cancelBtn = document.getElementById('cancel-btn');
const form = document.getElementById('hire-form');
const raidScale = document.getElementById('raidScale');
const raidColorDisplay = document.getElementById('raidColorDisplay');
const raidScaleMarker = document.getElementById('raidScaleMarker');
const raidPieChart = document.getElementById('raidPieChart');
const raidDrilldown = document.getElementById('raidDrilldown');
const raidDrilldownTitle = document.getElementById('raidDrilldownTitle');
const raidDrilldownList = document.getElementById('raidDrilldownList');

const tabs = {
  Homepage: 'Welcome to HireSync. Use this tracker to manage and review all onboarding profiles.',
  Calendar: 'Calendar tab is active. Track onboarding milestones and scheduled check-ins here.',
  'New Hires': 'New Hires tab is active. Click any profile card below to open and edit details.',
  Data: 'Data tab is active. Use this section for onboarding metrics and exports.',
  Trainings: 'Trainings tab is active. Manage training progress and completion tracking here.',
  Settings: 'Settings tab is active. Configure tracker preferences and workflow defaults.',
};

const tabRoutes = {
  Homepage: 'index.html',
  Calendar: 'calendar.html',
  'New Hires': 'newhires.html',
  Data: 'data.html',
  Trainings: 'trainings.html',
  Settings: 'settings.html',
};

const NEW_HIRES_STORAGE_KEY = 'hiresyce_new_hires_v1';
const allowedRaidColors = ['Red', 'Amber', 'Green', 'Blue', 'Purple'];
const defaultHires = [
  {
    id: 1,
    name: 'Avery Thompson',
    employeeNumber: 'E-1042',
    department: 'Engineering',
    raidColor: 'Green',
    status: 'In Progress',
    comment: 'Laptop configured. Waiting on badge activation.',
  },
  {
    id: 2,
    name: 'Jordan Lee',
    employeeNumber: 'E-1043',
    department: 'Marketing',
    raidColor: 'Amber',
    status: 'Onboarding',
    comment: 'Orientation completed. Pending manager intro.',
  },
  {
    id: 3,
    name: 'Casey Patel',
    employeeNumber: 'E-1044',
    department: 'Finance',
    raidColor: 'Red',
    status: 'Blocked',
    comment: 'Awaiting system access from IT.',
  },
  {
    id: 4,
    name: 'Morgan Reyes',
    employeeNumber: 'E-1045',
    department: 'Operations',
    raidColor: 'Blue',
    status: 'In Progress',
    comment: 'Completed safety training and policy sign-off.',
  },
  {
    id: 5,
    name: 'Riley Chen',
    employeeNumber: 'E-1046',
    department: 'HR',
    raidColor: 'Purple',
    status: 'Completed',
    comment: 'All onboarding tasks completed.',
  },
];

function normalizeHireRecord(hire, index) {
  return {
    ...hire,
    id: Number(hire.id ?? index + 1),
    name: String(hire.name ?? ''),
    employeeNumber: String(hire.employeeNumber ?? ''),
    department: String(hire.department ?? ''),
    raidColor: allowedRaidColors.includes(hire.raidColor) ? hire.raidColor : 'Green',
    status: String(hire.status ?? 'Onboarding'),
    comment: String(hire.comment ?? hire.notes ?? ''),
  };
}

function loadHiresFromStorage() {
  const raw = localStorage.getItem(NEW_HIRES_STORAGE_KEY);
  if (!raw) return defaultHires;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultHires;
    return parsed.map(normalizeHireRecord);
  } catch {
    return defaultHires;
  }
}

function saveHiresToStorage() {
  localStorage.setItem(NEW_HIRES_STORAGE_KEY, JSON.stringify(hires));
}

let hires = loadHiresFromStorage();

let currentHireId = null;
const raidScaleValues = ['Red', 'Amber', 'Green', 'Blue', 'Purple'];
const raidColors = {
  Red: '#ff3d3d',
  Amber: '#ffb347',
  Green: '#6de06d',
  Blue: '#58b9ff',
  Purple: '#bf8dff',
};
let pieSegments = [];
const chartMetrics = {
  cssSize: 420,
  centerX: 210,
  centerY: 210,
  radius: 150,
  innerRadius: 74,
};

function colorToScaleValue(color) {
  const index = raidScaleValues.indexOf(color);
  return index >= 0 ? index + 1 : 3;
}

function scaleValueToColor(value) {
  const numericValue = Number(value);
  return raidScaleValues[numericValue - 1] ?? 'Green';
}

function colorToPercent(color) {
  const numericValue = colorToScaleValue(color);
  return ((numericValue - 1) / 4) * 100;
}

function updateRaidColorDisplay() {
  const selectedColor = scaleValueToColor(raidScale.value);
  raidColorDisplay.textContent = `Selected: ${selectedColor}`;
  raidScaleMarker.style.left = `${colorToPercent(selectedColor)}%`;
}

function setActiveTab(name) {
  tabButtons.forEach((button) => {
    const isActive = button.dataset.tab === name;
    button.classList.toggle('active', isActive);
  });

  tabContent.textContent = tabs[name] ?? tabs.Homepage;
}

function getRaidCounts() {
  return raidScaleValues.reduce((counts, color) => {
    counts[color] = hires.filter((hire) => hire.raidColor === color).length;
    return counts;
  }, {});
}

function drawRaidPieChart() {
  const ctx = raidPieChart.getContext('2d');
  if (!ctx) return;

  const cssSize = chartMetrics.cssSize;
  const dpr = window.devicePixelRatio || 1;
  raidPieChart.width = cssSize * dpr;
  raidPieChart.height = cssSize * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const centerX = cssSize / 2;
  const centerY = cssSize / 2;
  const radius = 150;
  const innerRadius = 74;
  chartMetrics.centerX = centerX;
  chartMetrics.centerY = centerY;
  chartMetrics.radius = radius;
  chartMetrics.innerRadius = innerRadius;
  const total = hires.length;
  const counts = getRaidCounts();

  ctx.clearRect(0, 0, cssSize, cssSize);
  pieSegments = [];

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + 16, 0, Math.PI * 2);
  const halo = ctx.createRadialGradient(centerX, centerY, radius - 10, centerX, centerY, radius + 18);
  halo.addColorStop(0, 'rgba(74, 198, 255, 0.02)');
  halo.addColorStop(1, 'rgba(74, 198, 255, 0.28)');
  ctx.fillStyle = halo;
  ctx.fill();

  let startAngle = -Math.PI / 2;

  if (total > 0) {
    raidScaleValues.forEach((color) => {
      const count = counts[color];
      if (!count) return;

      const sliceAngle = (count / total) * Math.PI * 2;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = raidColors[color];
      ctx.fill();
      ctx.strokeStyle = 'rgba(8, 20, 37, 0.88)';
      ctx.lineWidth = 2;
      ctx.stroke();

      pieSegments.push({ color, startAngle, endAngle, count, radius, centerX, centerY });
      startAngle = endAngle;
    });
  } else {
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(154, 177, 216, 0.25)';
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(8, 20, 37, 0.95)';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(centerX, centerY, innerRadius - 4, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(74, 198, 255, 0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#e8f1ff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 30px Segoe UI';
  ctx.fillText(String(total), centerX, centerY - 8);
  ctx.font = '12px Segoe UI';
  ctx.fillStyle = '#9ab1d8';
  ctx.fillText('New Hires', centerX, centerY + 16);
}

function renderDrilldown(selectedColor) {
  const counts = getRaidCounts();
  raidDrilldown.classList.remove('hidden');
  raidDrilldownList.innerHTML = '';

  if (selectedColor) {
    const matchingHires = hires.filter((hire) => hire.raidColor === selectedColor);
    raidDrilldownTitle.textContent = `${selectedColor} RAID Details (${matchingHires.length})`;

    if (matchingHires.length === 0) {
      const emptyItem = document.createElement('li');
      emptyItem.textContent = `No new hires currently marked ${selectedColor}.`;
      raidDrilldownList.appendChild(emptyItem);
      return;
    }

    matchingHires.forEach((hire) => {
      const item = document.createElement('li');
      item.textContent = `${hire.name} • ${hire.department} • ${hire.status}`;
      raidDrilldownList.appendChild(item);
    });

    return;
  }

  raidDrilldownTitle.textContent = 'RAID Breakdown Details';
  raidScaleValues.forEach((color) => {
    const item = document.createElement('li');
    item.textContent = `${color}: ${counts[color]} new hire${counts[color] === 1 ? '' : 's'}`;
    raidDrilldownList.appendChild(item);
  });
}

function handlePieChartClick(event) {
  const rect = raidPieChart.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  const scale = rect.width / chartMetrics.cssSize;
  const scaledRadius = chartMetrics.radius * scale;
  const scaledInnerRadius = chartMetrics.innerRadius * scale;
  const dx = x - centerX;
  const dy = y - centerY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance > scaledRadius || distance < scaledInnerRadius) {
    renderDrilldown(null);
    return;
  }

  let angle = Math.atan2(dy, dx);
  if (angle < -Math.PI / 2) {
    angle += Math.PI * 2;
  }

  const selectedSegment = pieSegments.find(
    (segment) => angle >= segment.startAngle && angle <= segment.endAngle
  );

  renderDrilldown(selectedSegment?.color ?? null);
}

function renderHires() {
  hireList.innerHTML = '';

  hires.forEach((hire) => {
    const card = document.createElement('button');
    card.className = 'hire-card';
    card.type = 'button';
    card.dataset.id = String(hire.id);
    card.innerHTML = `
      <div class="hire-name">${hire.name}</div>
      <div class="meta">Employee #: ${hire.employeeNumber}</div>
      <div class="meta">Department: ${hire.department}</div>
      <div class="meta">RAID: ${hire.raidColor}</div>
      <div class="card-raid-bar" aria-hidden="true">
        <div class="card-raid-marker" style="left: ${colorToPercent(hire.raidColor)}%"></div>
      </div>
      <div class="meta">Status: ${hire.status}</div>
    `;

    card.addEventListener('click', () => openModal(hire.id));
    hireList.appendChild(card);
  });
}

function openModal(hireId) {
  const hire = hires.find((h) => h.id === hireId);
  if (!hire) return;

  currentHireId = hireId;
  form.name.value = hire.name;
  form.employeeNumber.value = hire.employeeNumber;
  form.department.value = hire.department;
  raidScale.value = String(colorToScaleValue(hire.raidColor));
  updateRaidColorDisplay();
  form.status.value = hire.status;
  form.comment.value = hire.comment;

  backdrop.classList.remove('hidden');
}

function closeModal() {
  backdrop.classList.add('hidden');
  currentHireId = null;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (currentHireId === null) return;

  hires = hires.map((hire) =>
    hire.id === currentHireId
      ? {
          ...hire,
          name: form.name.value.trim(),
          employeeNumber: form.employeeNumber.value.trim(),
          department: form.department.value.trim(),
          raidColor: scaleValueToColor(raidScale.value),
          status: form.status.value,
          comment: form.comment.value.trim(),
        }
      : hire
  );

  saveHiresToStorage();

  renderHires();
  drawRaidPieChart();
  closeModal();
});

closeModalBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);
backdrop.addEventListener('click', (event) => {
  if (event.target === backdrop) {
    closeModal();
  }
});

raidScale.addEventListener('input', updateRaidColorDisplay);
raidPieChart.addEventListener('click', handlePieChartClick);

tabButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const selectedTab = button.dataset.tab;
    const targetRoute = tabRoutes[selectedTab];

    if (targetRoute) {
      const currentPage = window.location.pathname.split('/').pop() || 'index.html';
      if (currentPage.toLowerCase() !== targetRoute.toLowerCase()) {
        window.location.href = targetRoute;
        return;
      }
    }

    setActiveTab(selectedTab);
  });
});

setActiveTab(document.body.dataset.defaultTab || 'Homepage');
updateRaidColorDisplay();
renderHires();
drawRaidPieChart();
