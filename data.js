const NEW_HIRES_STORAGE_KEY = 'hiresyce_new_hires_v1';

const performanceDonut = document.getElementById('performanceDonut');
const raidBarChart = document.getElementById('raidBarChart');
const departmentRiskChart = document.getElementById('departmentRiskChart');
const trainingStatusChart = document.getElementById('trainingStatusChart');
const exportDataTopBtn = document.getElementById('exportDataTopBtn');
const exportModalBackdrop = document.getElementById('exportModalBackdrop');
const closeExportModal = document.getElementById('closeExportModal');
const dataDrilldownTitle = document.getElementById('dataDrilldownTitle');
const dataDrilldownList = document.getElementById('dataDrilldownList');
const kpiGrid = document.getElementById('kpiGrid');
const exportForm = document.getElementById('exportForm');
const exportDepartment = document.getElementById('exportDepartment');
const exportTrainingStatus = document.getElementById('exportTrainingStatus');
const exportPerformance = document.getElementById('exportPerformance');
const exportFormat = document.getElementById('exportFormat');
const exportRaidColorCheckboxes = Array.from(document.querySelectorAll('.exportRaidColor'));
const raidSelectAll = document.getElementById('raidSelectAll');
const raidClearAll = document.getElementById('raidClearAll');
const exportMatchCount = document.getElementById('exportMatchCount');

const raidScaleValues = ['Red', 'Amber', 'Green', 'Blue', 'Purple'];
const raidColors = {
  Red: '#ff3d3d',
  Amber: '#ffb347',
  Green: '#6de06d',
  Blue: '#58b9ff',
  Purple: '#bf8dff',
};

const goodRaidColors = ['Green', 'Blue', 'Purple'];
const riskRaidColors = ['Red', 'Amber'];

const fallbackHires = [
  { name: 'Avery Thompson', department: 'Engineering', raidColor: 'Green', mandatoryTrainingCompleted: true },
  { name: 'Jordan Lee', department: 'Marketing', raidColor: 'Amber', mandatoryTrainingCompleted: false },
  { name: 'Casey Patel', department: 'Finance', raidColor: 'Red', mandatoryTrainingCompleted: false },
  { name: 'Morgan Reyes', department: 'Operations', raidColor: 'Blue', mandatoryTrainingCompleted: true },
  { name: 'Riley Chen', department: 'HR', raidColor: 'Purple', mandatoryTrainingCompleted: true },
];

const chartState = {
  donutSegments: [],
  raidBars: [],
  deptBars: [],
  trainingBars: [],
};

function loadHires() {
  const raw = localStorage.getItem(NEW_HIRES_STORAGE_KEY);
  if (!raw) return fallbackHires;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return fallbackHires;

    return parsed.map((hire) => ({
      name: String(hire.name ?? 'Unknown Hire'),
      department: String(hire.department ?? 'Unassigned'),
      raidColor: raidScaleValues.includes(hire.raidColor) ? hire.raidColor : 'Green',
      mandatoryTrainingCompleted: Boolean(hire.mandatoryTrainingCompleted),
    }));
  } catch {
    return fallbackHires;
  }
}

const hires = loadHires();

function renderKpis() {
  const total = hires.length;
  const good = hires.filter((hire) => goodRaidColors.includes(hire.raidColor)).length;
  const risk = hires.filter((hire) => riskRaidColors.includes(hire.raidColor)).length;
  const trainingCompleted = hires.filter((hire) => hire.mandatoryTrainingCompleted).length;
  const trainingNotCompleted = total - trainingCompleted;
  const goodPercent = total ? Math.round((good / total) * 100) : 0;

  kpiGrid.innerHTML = '';
  [
    { label: 'Total New Hires', value: total },
    { label: 'Doing Well', value: good },
    { label: 'Need Support', value: risk },
    { label: 'Training Completed', value: trainingCompleted },
    { label: 'Training Not Completed', value: trainingNotCompleted },
    { label: 'Health Score', value: `${goodPercent}%` },
  ].forEach((kpi) => {
    const card = document.createElement('div');
    card.className = 'kpi-card';
    card.innerHTML = `<div class="kpi-label">${kpi.label}</div><div class="kpi-value">${kpi.value}</div>`;
    kpiGrid.appendChild(card);
  });
}

function setupCanvas(canvas, size = 360) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size, size);
  return { ctx, size };
}

function renderPerformanceDonut() {
  const { ctx, size } = setupCanvas(performanceDonut, 360);
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = 122;
  const innerRadius = 62;

  const goodCount = hires.filter((hire) => goodRaidColors.includes(hire.raidColor)).length;
  const riskCount = hires.length - goodCount;
  const total = hires.length || 1;

  const segments = [
    { key: 'good', label: 'Doing Well', value: goodCount, color: '#58b9ff' },
    { key: 'risk', label: 'Not Doing Too Well', value: riskCount, color: '#ffb347' },
  ];

  chartState.donutSegments = [];

  let startAngle = -Math.PI / 2;
  segments.forEach((segment) => {
    const slice = (segment.value / total) * Math.PI * 2;
    const endAngle = startAngle + slice;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = segment.color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(8, 20, 37, 0.88)';
    ctx.lineWidth = 2;
    ctx.stroke();

    chartState.donutSegments.push({ ...segment, startAngle, endAngle, radius, innerRadius, centerX, centerY });
    startAngle = endAngle;
  });

  ctx.beginPath();
  ctx.arc(centerX, centerY, innerRadius - 2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(8, 20, 37, 0.95)';
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#e8f1ff';
  ctx.font = '700 28px Segoe UI';
  ctx.fillText(String(hires.length), centerX, centerY - 8);
  ctx.fillStyle = '#9ab1d8';
  ctx.font = '12px Segoe UI';
  ctx.fillText('Total Hires', centerX, centerY + 16);
}

function renderRaidBarChart() {
  const { ctx, size } = setupCanvas(raidBarChart, 360);
  const baseX = 52;
  const baseY = 310;
  const chartHeight = 220;
  const barWidth = 42;
  const gap = 18;

  const counts = raidScaleValues.map((color) => hires.filter((hire) => hire.raidColor === color).length);
  const max = Math.max(1, ...counts);

  chartState.raidBars = [];

  raidScaleValues.forEach((color, index) => {
    const value = counts[index];
    const barHeight = (value / max) * chartHeight;
    const x = baseX + index * (barWidth + gap);
    const y = baseY - barHeight;

    ctx.fillStyle = raidColors[color];
    ctx.fillRect(x, y, barWidth, barHeight);

    ctx.fillStyle = '#e8f1ff';
    ctx.font = '12px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText(String(value), x + barWidth / 2, y - 10);

    ctx.fillStyle = '#9ab1d8';
    ctx.fillText(color, x + barWidth / 2, baseY + 16);

    chartState.raidBars.push({ color, value, x, y, width: barWidth, height: barHeight });
  });

  ctx.strokeStyle = 'rgba(154, 177, 216, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(36, baseY);
  ctx.lineTo(size - 24, baseY);
  ctx.stroke();
}

function getDepartmentBuckets() {
  const buckets = {};
  hires.forEach((hire) => {
    if (!buckets[hire.department]) {
      buckets[hire.department] = { total: 0, risk: 0, good: 0 };
    }

    buckets[hire.department].total += 1;
    if (riskRaidColors.includes(hire.raidColor)) {
      buckets[hire.department].risk += 1;
    } else {
      buckets[hire.department].good += 1;
    }
  });

  return Object.entries(buckets).map(([department, stats]) => ({ department, ...stats }));
}

function renderDepartmentRiskChart() {
  const { ctx, size } = setupCanvas(departmentRiskChart, 360);
  const rows = getDepartmentBuckets();
  const startX = 36;
  const startY = 44;
  const rowHeight = 52;
  const maxWidth = 260;

  chartState.deptBars = [];

  rows.forEach((row, index) => {
    const y = startY + index * rowHeight;
    const riskWidth = row.total ? (row.risk / row.total) * maxWidth : 0;
    const goodWidth = row.total ? (row.good / row.total) * maxWidth : 0;

    ctx.fillStyle = 'rgba(28, 48, 82, 0.8)';
    ctx.fillRect(startX, y, maxWidth, 18);

    ctx.fillStyle = '#ffb347';
    ctx.fillRect(startX, y, riskWidth, 18);

    ctx.fillStyle = '#58b9ff';
    ctx.fillRect(startX + riskWidth, y, goodWidth, 18);

    ctx.fillStyle = '#e8f1ff';
    ctx.font = '12px Segoe UI';
    ctx.textAlign = 'left';
    ctx.fillText(row.department, startX, y - 8);
    ctx.textAlign = 'right';
    ctx.fillText(`${row.risk}/${row.total} risk`, startX + maxWidth + 52, y + 12);

    chartState.deptBars.push({ ...row, x: startX, y, width: maxWidth, height: 18 });
  });
}

function renderTrainingStatusChart() {
  const { ctx } = setupCanvas(trainingStatusChart, 360);
  const baseX = 64;
  const baseY = 300;
  const chartHeight = 220;
  const barWidth = 88;
  const gap = 64;

  const completed = hires.filter((hire) => hire.mandatoryTrainingCompleted).length;
  const notCompleted = hires.length - completed;
  const max = Math.max(1, completed, notCompleted);

  const bars = [
    { key: 'completed', label: 'Completed', value: completed, color: '#58b9ff' },
    { key: 'notCompleted', label: 'Not Completed', value: notCompleted, color: '#ffb347' },
  ];

  chartState.trainingBars = [];

  bars.forEach((bar, index) => {
    const height = (bar.value / max) * chartHeight;
    const x = baseX + index * (barWidth + gap);
    const y = baseY - height;

    ctx.fillStyle = bar.color;
    ctx.fillRect(x, y, barWidth, height);

    ctx.fillStyle = '#e8f1ff';
    ctx.textAlign = 'center';
    ctx.font = '12px Segoe UI';
    ctx.fillText(String(bar.value), x + barWidth / 2, y - 10);

    ctx.fillStyle = '#9ab1d8';
    ctx.fillText(bar.label, x + barWidth / 2, baseY + 18);

    chartState.trainingBars.push({ ...bar, x, y, width: barWidth, height });
  });

  ctx.strokeStyle = 'rgba(154, 177, 216, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(42, baseY);
  ctx.lineTo(336, baseY);
  ctx.stroke();
}

function renderDefaultDrilldown() {
  const total = hires.length;
  const good = hires.filter((hire) => goodRaidColors.includes(hire.raidColor)).length;
  const risk = hires.filter((hire) => riskRaidColors.includes(hire.raidColor)).length;
  const trainingCompleted = hires.filter((hire) => hire.mandatoryTrainingCompleted).length;
  const trainingNotCompleted = total - trainingCompleted;

  dataDrilldownTitle.textContent = 'Dashboard Details';
  dataDrilldownList.innerHTML = '';
  [
    `Total new hires tracked: ${total}`,
    `Doing well (Green/Blue/Purple): ${good}`,
    `Need support (Red/Amber): ${risk}`,
    `Mandatory training completed: ${trainingCompleted}`,
    `Mandatory training not completed: ${trainingNotCompleted}`,
  ].forEach((line) => {
    const item = document.createElement('li');
    item.textContent = line;
    dataDrilldownList.appendChild(item);
  });
}

function populateExportDepartments() {
  const departments = [...new Set(hires.map((hire) => hire.department))].sort();
  departments.forEach((department) => {
    const option = document.createElement('option');
    option.value = department;
    option.textContent = department;
    exportDepartment.appendChild(option);
  });
}

function getFilteredExportRows() {
  const selectedDepartment = exportDepartment.value;
  const selectedTrainingStatus = exportTrainingStatus.value;
  const selectedPerformance = exportPerformance.value;
  const selectedRaidColors = exportRaidColorCheckboxes
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => checkbox.value);

  return hires.filter((hire) => {
    if (selectedDepartment !== 'all' && hire.department !== selectedDepartment) {
      return false;
    }

    if (!selectedRaidColors.includes(hire.raidColor)) {
      return false;
    }

    if (selectedTrainingStatus === 'completed' && !hire.mandatoryTrainingCompleted) {
      return false;
    }

    if (selectedTrainingStatus === 'notCompleted' && hire.mandatoryTrainingCompleted) {
      return false;
    }

    if (selectedPerformance === 'good' && !goodRaidColors.includes(hire.raidColor)) {
      return false;
    }

    if (selectedPerformance === 'risk' && !riskRaidColors.includes(hire.raidColor)) {
      return false;
    }

    return true;
  });
}

function updateExportMatchCount() {
  const filteredRows = getFilteredExportRows();
  exportMatchCount.textContent = `Matching records: ${filteredRows.length}`;
}

function convertRowsToCsv(rows) {
  const headers = ['Name', 'Department', 'RAID Color', 'Mandatory Training Completed'];
  const lines = [headers.join(',')];

  rows.forEach((row) => {
    const values = [
      row.name,
      row.department,
      row.raidColor,
      row.mandatoryTrainingCompleted ? 'Yes' : 'No',
    ].map((value) => `"${String(value).replaceAll('"', '""')}"`);

    lines.push(values.join(','));
  });

  return lines.join('\n');
}

function downloadFile(fileName, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function exportFilteredData(event) {
  event.preventDefault();
  const filteredRows = getFilteredExportRows();
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');

  if (exportFormat.value === 'json') {
    downloadFile(
      `hiresyce-export-${timestamp}.json`,
      JSON.stringify(filteredRows, null, 2),
      'application/json;charset=utf-8'
    );
    return;
  }

  downloadFile(
    `hiresyce-export-${timestamp}.csv`,
    convertRowsToCsv(filteredRows),
    'text/csv;charset=utf-8'
  );
}

function openExportModal() {
  exportModalBackdrop.classList.remove('hidden');
}

function closeExportDataModal() {
  exportModalBackdrop.classList.add('hidden');
}

function setAllRaidFilters(isChecked) {
  exportRaidColorCheckboxes.forEach((checkbox) => {
    checkbox.checked = isChecked;
  });
  updateExportMatchCount();
}

function setDrilldown(title, lines) {
  dataDrilldownTitle.textContent = title;
  dataDrilldownList.innerHTML = '';
  lines.forEach((line) => {
    const item = document.createElement('li');
    item.textContent = line;
    dataDrilldownList.appendChild(item);
  });
}

function handleDonutClick(event) {
  const rect = performanceDonut.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  const dx = x - centerX;
  const dy = y - centerY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  const scaledOuter = (122 / 360) * rect.width;
  const scaledInner = (62 / 360) * rect.width;
  if (distance > scaledOuter || distance < scaledInner) {
    renderDefaultDrilldown();
    return;
  }

  let angle = Math.atan2(dy, dx);
  if (angle < -Math.PI / 2) {
    angle += Math.PI * 2;
  }

  const segment = chartState.donutSegments.find((entry) => angle >= entry.startAngle && angle <= entry.endAngle);
  if (!segment) {
    renderDefaultDrilldown();
    return;
  }

  const matching = hires.filter((hire) =>
    segment.key === 'good' ? goodRaidColors.includes(hire.raidColor) : riskRaidColors.includes(hire.raidColor)
  );

  setDrilldown(
    `${segment.label} (${matching.length})`,
    matching.length
      ? matching.map((hire) => `${hire.name} • ${hire.department} • ${hire.raidColor}`)
      : ['No hires in this segment.']
  );
}

function handleRaidBarClick(event) {
  const rect = raidBarChart.getBoundingClientRect();
  const scaleX = rect.width / 360;
  const scaleY = rect.height / 360;
  const clickX = (event.clientX - rect.left) / scaleX;
  const clickY = (event.clientY - rect.top) / scaleY;

  const bar = chartState.raidBars.find(
    (entry) => clickX >= entry.x && clickX <= entry.x + entry.width && clickY >= entry.y && clickY <= entry.y + entry.height
  );

  if (!bar) {
    renderDefaultDrilldown();
    return;
  }

  const matching = hires.filter((hire) => hire.raidColor === bar.color);
  setDrilldown(
    `${bar.color} RAID (${matching.length})`,
    matching.length
      ? matching.map((hire) => `${hire.name} • ${hire.department}`)
      : [`No hires currently marked ${bar.color}.`]
  );
}

function handleDepartmentChartClick(event) {
  const rect = departmentRiskChart.getBoundingClientRect();
  const scaleX = rect.width / 360;
  const scaleY = rect.height / 360;
  const clickX = (event.clientX - rect.left) / scaleX;
  const clickY = (event.clientY - rect.top) / scaleY;

  const row = chartState.deptBars.find(
    (entry) => clickX >= entry.x && clickX <= entry.x + entry.width && clickY >= entry.y && clickY <= entry.y + entry.height
  );

  if (!row) {
    renderDefaultDrilldown();
    return;
  }

  const departmentHires = hires.filter((hire) => hire.department === row.department);
  setDrilldown(
    `${row.department} Department`,
    departmentHires.map((hire) => `${hire.name} • ${hire.raidColor}`)
  );
}

function handleTrainingChartClick(event) {
  const rect = trainingStatusChart.getBoundingClientRect();
  const scaleX = rect.width / 360;
  const scaleY = rect.height / 360;
  const clickX = (event.clientX - rect.left) / scaleX;
  const clickY = (event.clientY - rect.top) / scaleY;

  const bar = chartState.trainingBars.find(
    (entry) => clickX >= entry.x && clickX <= entry.x + entry.width && clickY >= entry.y && clickY <= entry.y + entry.height
  );

  if (!bar) {
    renderDefaultDrilldown();
    return;
  }

  const matching = hires.filter((hire) =>
    bar.key === 'completed' ? hire.mandatoryTrainingCompleted : !hire.mandatoryTrainingCompleted
  );

  setDrilldown(
    `Mandatory Training ${bar.label} (${matching.length})`,
    matching.length
      ? matching.map((hire) => `${hire.name} • ${hire.department} • ${hire.raidColor}`)
      : ['No hires in this training segment.']
  );
}

performanceDonut.addEventListener('click', handleDonutClick);
raidBarChart.addEventListener('click', handleRaidBarClick);
departmentRiskChart.addEventListener('click', handleDepartmentChartClick);
trainingStatusChart.addEventListener('click', handleTrainingChartClick);
exportForm.addEventListener('submit', exportFilteredData);
raidSelectAll.addEventListener('click', () => setAllRaidFilters(true));
raidClearAll.addEventListener('click', () => setAllRaidFilters(false));
exportDataTopBtn.addEventListener('click', openExportModal);
closeExportModal.addEventListener('click', closeExportDataModal);
exportModalBackdrop.addEventListener('click', (event) => {
  if (event.target === exportModalBackdrop) {
    closeExportDataModal();
  }
});

[exportDepartment, exportTrainingStatus, exportPerformance, exportFormat, ...exportRaidColorCheckboxes].forEach(
  (control) => control.addEventListener('change', updateExportMatchCount)
);

renderPerformanceDonut();
renderRaidBarChart();
renderDepartmentRiskChart();
renderTrainingStatusChart();
renderKpis();
renderDefaultDrilldown();
populateExportDepartments();
updateExportMatchCount();
