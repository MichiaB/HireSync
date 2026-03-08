const newHireRows = document.getElementById('newHireRows');
const addNewHireBtn = document.getElementById('addNewHireBtn');
const newHireModalBackdrop = document.getElementById('newHireModalBackdrop');
const closeNewHireModalBtn = document.getElementById('closeNewHireModal');
const cancelNewHireBtn = document.getElementById('cancelNewHireBtn');
const newHireForm = document.getElementById('newHireForm');
const modalTitle = document.getElementById('modal-title');

const hireNameInput = document.getElementById('hireName');
const hireEmployeeNumberInput = document.getElementById('hireEmployeeNumber');
const hireDepartmentInput = document.getElementById('hireDepartment');
const hirePersonalPhoneInput = document.getElementById('hirePersonalPhone');
const hirePersonalEmailInput = document.getElementById('hirePersonalEmail');
const hireTrainingCompletedInput = document.getElementById('hireTrainingCompleted');
const hireRaidScaleInput = document.getElementById('hireRaidScale');
const hireRaidScaleMarker = document.getElementById('hireRaidScaleMarker');
const hireRaidColorDisplay = document.getElementById('hireRaidColorDisplay');

const hireResumeUrlInput = document.getElementById('hireResumeUrl');
const hireResumePreview = document.getElementById('hireResumePreview');
const hireNotesInput = document.getElementById('hireNotes');
const hireAssessmentsInput = document.getElementById('hireAssessments');

const documentNameInput = document.getElementById('documentName');
const documentUrlInput = document.getElementById('documentUrl');
const documentFileInput = document.getElementById('documentFile');
const addDocumentBtn = document.getElementById('addDocumentBtn');
const uploadDocumentBtn = document.getElementById('uploadDocumentBtn');
const documentList = document.getElementById('documentList');
const profileHistoryList = document.getElementById('profileHistoryList');

const NEW_HIRES_STORAGE_KEY = 'hiresyce_new_hires_v1';
const raidScaleValues = ['Red', 'Amber', 'Green', 'Blue', 'Purple'];

let selectedHireId = null;
let draftHire = null;
let originalHire = null;

const defaultHires = [
  {
    id: 1,
    name: 'Avery Thompson',
    employeeNumber: 'E-1042',
    department: 'Engineering',
    personalPhone: '(555) 010-1042',
    personalEmail: 'avery.thompson.personal@example.com',
    mandatoryTrainingCompleted: true,
    raidColor: 'Green',
    resumeUrl: 'https://example.com/resumes/avery-thompson.pdf',
    notes: 'Strong collaboration during onboarding check-ins.',
    assessments: 'Technical readiness: Meets expectations.',
    documents: [{ id: crypto.randomUUID(), name: 'Offer Letter', url: 'https://example.com/docs/avery-offer' }],
    history: [
      {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        action: 'Profile created',
        detail: 'Initial profile generated.',
      },
    ],
  },
  {
    id: 2,
    name: 'Jordan Lee',
    employeeNumber: 'E-1043',
    department: 'Marketing',
    personalPhone: '(555) 010-1043',
    personalEmail: 'jordan.lee.personal@example.com',
    mandatoryTrainingCompleted: false,
    raidColor: 'Amber',
    resumeUrl: 'https://example.com/resumes/jordan-lee.pdf',
    notes: 'Needs additional tool access for campaign platform.',
    assessments: 'Role readiness: In progress.',
    documents: [{ id: crypto.randomUUID(), name: 'Portfolio', url: 'https://example.com/docs/jordan-portfolio' }],
    history: [
      {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        action: 'Profile created',
        detail: 'Initial profile generated.',
      },
    ],
  },
  {
    id: 3,
    name: 'Casey Patel',
    employeeNumber: 'E-1044',
    department: 'Finance',
    personalPhone: '(555) 010-1044',
    personalEmail: 'casey.patel.personal@example.com',
    mandatoryTrainingCompleted: false,
    raidColor: 'Red',
    resumeUrl: 'https://example.com/resumes/casey-patel.pdf',
    notes: 'Awaiting system permission approvals.',
    assessments: 'Compliance training pending.',
    documents: [],
    history: [
      {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        action: 'Profile created',
        detail: 'Initial profile generated.',
      },
    ],
  },
];

let hires = loadHiresFromStorage();

function loadHiresFromStorage() {
  const raw = localStorage.getItem(NEW_HIRES_STORAGE_KEY);
  if (!raw) return defaultHires;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultHires;

    return parsed.map((hire, index) => ({
      id: Number(hire.id ?? index + 1),
      name: String(hire.name ?? ''),
      employeeNumber: String(hire.employeeNumber ?? ''),
      department: String(hire.department ?? ''),
      personalPhone: String(hire.personalPhone ?? ''),
      personalEmail: String(hire.personalEmail ?? ''),
      mandatoryTrainingCompleted: Boolean(hire.mandatoryTrainingCompleted),
      raidColor: raidScaleValues.includes(hire.raidColor) ? hire.raidColor : 'Green',
      resumeUrl: String(hire.resumeUrl ?? ''),
      notes: String(hire.notes ?? ''),
      assessments: String(hire.assessments ?? ''),
      documents: Array.isArray(hire.documents)
        ? hire.documents
            .filter((doc) => doc && typeof doc === 'object')
            .map((doc) => ({
              id: typeof doc.id === 'string' ? doc.id : crypto.randomUUID(),
              name: String(doc.name ?? '').trim(),
              url: String(doc.url ?? '').trim(),
            }))
            .filter((doc) => doc.name && doc.url)
        : [],
      history: Array.isArray(hire.history)
        ? hire.history
            .filter((entry) => entry && typeof entry === 'object')
            .map((entry) => ({
              id: typeof entry.id === 'string' ? entry.id : crypto.randomUUID(),
              timestamp: String(entry.timestamp ?? new Date().toISOString()),
              action: String(entry.action ?? 'Profile updated'),
              detail: String(entry.detail ?? ''),
            }))
        : [],
    }));
  } catch {
    return defaultHires;
  }
}

function saveHiresToStorage() {
  localStorage.setItem(NEW_HIRES_STORAGE_KEY, JSON.stringify(hires));
}

function getNextHireId() {
  const maxId = hires.reduce((currentMax, hire) => Math.max(currentMax, Number(hire.id) || 0), 0);
  return maxId + 1;
}

function createEmptyHire() {
  return {
    id: getNextHireId(),
    name: '',
    employeeNumber: '',
    department: '',
    personalPhone: '',
    personalEmail: '',
    mandatoryTrainingCompleted: false,
    raidColor: 'Green',
    resumeUrl: '',
    notes: '',
    assessments: '',
    documents: [],
    history: [],
  };
}

function colorToScaleValue(color) {
  const index = raidScaleValues.indexOf(color);
  return index >= 0 ? index + 1 : 3;
}

function scaleValueToColor(value) {
  return raidScaleValues[Number(value) - 1] ?? 'Green';
}

function colorToPercent(color) {
  return ((colorToScaleValue(color) - 1) / 4) * 100;
}

function renderHireTable() {
  newHireRows.innerHTML = '';

  hires.forEach((hire) => {
    const row = document.createElement('tr');

    const nameCell = document.createElement('td');
    const nameWrap = document.createElement('div');
    nameWrap.className = 'name-cell-wrap';

    const nameButton = document.createElement('button');
    nameButton.type = 'button';
    nameButton.className = 'name-link-btn';
    nameButton.textContent = hire.name;
    nameButton.addEventListener('click', () => openHireModal(hire.id));

    const trainingBadge = document.createElement('span');
    trainingBadge.className = hire.mandatoryTrainingCompleted
      ? 'training-badge complete'
      : 'training-badge pending';
    trainingBadge.textContent = hire.mandatoryTrainingCompleted ? 'Training Complete' : 'Training Pending';

    nameWrap.append(nameButton, trainingBadge);
    nameCell.appendChild(nameWrap);

    const employeeCell = document.createElement('td');
    employeeCell.textContent = hire.employeeNumber;

    const departmentCell = document.createElement('td');
    departmentCell.textContent = hire.department;

    row.append(nameCell, employeeCell, departmentCell);
    newHireRows.appendChild(row);
  });
}

function renderDocuments() {
  documentList.innerHTML = '';

  if (!draftHire || draftHire.documents.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'document-empty';
    empty.textContent = 'No documents saved yet.';
    documentList.appendChild(empty);
    return;
  }

  draftHire.documents.forEach((doc) => {
    const item = document.createElement('li');
    item.className = 'document-item';

    const link = document.createElement('a');
    link.href = doc.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = doc.name;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'secondary';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => {
      draftHire.documents = draftHire.documents.filter((entry) => entry.id !== doc.id);
      renderDocuments();
    });

    item.append(link, removeBtn);
    documentList.appendChild(item);
  });
}

function addHistoryEntry(targetHire, action, detail) {
  if (!targetHire.history) {
    targetHire.history = [];
  }

  targetHire.history.push({
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    action,
    detail,
  });
}

function renderHistory() {
  profileHistoryList.innerHTML = '';

  if (!draftHire || !Array.isArray(draftHire.history) || draftHire.history.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'history-empty';
    empty.textContent = 'No profile history yet.';
    profileHistoryList.appendChild(empty);
    return;
  }

  [...draftHire.history]
    .sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp))
    .forEach((entry) => {
      const item = document.createElement('li');
      item.className = 'history-item';

      const title = document.createElement('div');
      title.className = 'history-title';
      title.textContent = `${entry.action}${entry.detail ? ` — ${entry.detail}` : ''}`;

      const meta = document.createElement('div');
      meta.className = 'history-meta';
      meta.textContent = new Date(entry.timestamp).toLocaleString();

      item.append(title, meta);
      profileHistoryList.appendChild(item);
    });
}

function updateRaidDisplay() {
  const selectedColor = scaleValueToColor(hireRaidScaleInput.value);
  hireRaidColorDisplay.textContent = `Selected: ${selectedColor}`;
  hireRaidScaleMarker.style.left = `${colorToPercent(selectedColor)}%`;
}

function updateResumePreview() {
  const value = hireResumeUrlInput.value.trim();
  if (value) {
    hireResumePreview.href = value;
    hireResumePreview.textContent = 'Open most recent resume';
    hireResumePreview.classList.remove('disabled-link');
  } else {
    hireResumePreview.href = '#';
    hireResumePreview.textContent = 'No resume link provided';
    hireResumePreview.classList.add('disabled-link');
  }
}

function fillModal(hire) {
  hireNameInput.value = hire.name;
  hireEmployeeNumberInput.value = hire.employeeNumber;
  hireDepartmentInput.value = hire.department;
  hirePersonalPhoneInput.value = hire.personalPhone ?? '';
  hirePersonalEmailInput.value = hire.personalEmail ?? '';
  hireTrainingCompletedInput.checked = Boolean(hire.mandatoryTrainingCompleted);
  hireRaidScaleInput.value = String(colorToScaleValue(hire.raidColor));
  hireResumeUrlInput.value = hire.resumeUrl;
  hireNotesInput.value = hire.notes;
  hireAssessmentsInput.value = hire.assessments;

  updateRaidDisplay();
  updateResumePreview();
  renderDocuments();
  renderHistory();
}

function openHireModal(hireId) {
  const hire = hires.find((entry) => entry.id === hireId);
  if (!hire) return;

  selectedHireId = hireId;
  draftHire = structuredClone(hire);
  originalHire = structuredClone(hire);
  modalTitle.textContent = 'New Hire Profile';
  fillModal(draftHire);
  newHireModalBackdrop.classList.remove('hidden');
}

function openNewHireModal() {
  selectedHireId = null;
  draftHire = createEmptyHire();
  originalHire = null;
  modalTitle.textContent = 'Add New Hire';
  fillModal(draftHire);
  newHireModalBackdrop.classList.remove('hidden');
}

function closeHireModal() {
  newHireModalBackdrop.classList.add('hidden');
  selectedHireId = null;
  draftHire = null;
  originalHire = null;
  documentNameInput.value = '';
  documentUrlInput.value = '';
  documentFileInput.value = '';
}

function addDocumentToDraft() {
  if (!draftHire) return;

  const name = documentNameInput.value.trim();
  const url = documentUrlInput.value.trim();
  if (!name || !url) return;

  draftHire.documents.push({
    id: crypto.randomUUID(),
    name,
    url,
  });

  documentNameInput.value = '';
  documentUrlInput.value = '';
  renderDocuments();
}

function uploadDocumentToDraft() {
  if (!draftHire) return;

  const file = documentFileInput.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    draftHire.documents.push({
      id: crypto.randomUUID(),
      name: file.name,
      url: String(reader.result),
    });

    documentFileInput.value = '';
    renderDocuments();
  };

  reader.readAsDataURL(file);
}

newHireForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!draftHire) return;

  draftHire.name = hireNameInput.value.trim();
  draftHire.employeeNumber = hireEmployeeNumberInput.value.trim();
  draftHire.department = hireDepartmentInput.value.trim();
  draftHire.personalPhone = hirePersonalPhoneInput.value.trim();
  draftHire.personalEmail = hirePersonalEmailInput.value.trim();
  draftHire.mandatoryTrainingCompleted = hireTrainingCompletedInput.checked;
  draftHire.raidColor = scaleValueToColor(hireRaidScaleInput.value);
  draftHire.resumeUrl = hireResumeUrlInput.value.trim();
  draftHire.notes = hireNotesInput.value.trim();
  draftHire.assessments = hireAssessmentsInput.value.trim();

  if (selectedHireId === null) {
    addHistoryEntry(draftHire, 'Profile created', 'New hire profile added.');
    draftHire.documents.forEach((doc) => addHistoryEntry(draftHire, 'Document uploaded', doc.name));
    hires.push(draftHire);
  } else {
    const changedFields = [];
    if (draftHire.name !== originalHire.name) changedFields.push('Name');
    if (draftHire.employeeNumber !== originalHire.employeeNumber) changedFields.push('Employee Number');
    if (draftHire.department !== originalHire.department) changedFields.push('Department');
    if (draftHire.personalPhone !== originalHire.personalPhone) changedFields.push('Personal Phone');
    if (draftHire.personalEmail !== originalHire.personalEmail) changedFields.push('Personal Email');
    if (draftHire.mandatoryTrainingCompleted !== originalHire.mandatoryTrainingCompleted) {
      changedFields.push('Mandatory Training');
    }
    if (draftHire.raidColor !== originalHire.raidColor) changedFields.push('RAID Color');
    if (draftHire.resumeUrl !== originalHire.resumeUrl) changedFields.push('Resume Link');
    if (draftHire.notes !== originalHire.notes) changedFields.push('Notes');
    if (draftHire.assessments !== originalHire.assessments) changedFields.push('Assessments');

    if (changedFields.length > 0) {
      addHistoryEntry(draftHire, 'Profile edited', `Updated: ${changedFields.join(', ')}`);
    }

    const originalDocsById = new Map(originalHire.documents.map((doc) => [doc.id, doc]));
    const draftDocsById = new Map(draftHire.documents.map((doc) => [doc.id, doc]));

    draftHire.documents
      .filter((doc) => !originalDocsById.has(doc.id))
      .forEach((doc) => addHistoryEntry(draftHire, 'Document uploaded', doc.name));

    originalHire.documents
      .filter((doc) => !draftDocsById.has(doc.id))
      .forEach((doc) => addHistoryEntry(draftHire, 'Document removed', doc.name));

    hires = hires.map((hire) => (hire.id === selectedHireId ? draftHire : hire));
  }

  saveHiresToStorage();
  renderHireTable();
  closeHireModal();
});

closeNewHireModalBtn.addEventListener('click', closeHireModal);
cancelNewHireBtn.addEventListener('click', closeHireModal);
newHireModalBackdrop.addEventListener('click', (event) => {
  if (event.target === newHireModalBackdrop) {
    closeHireModal();
  }
});

hireRaidScaleInput.addEventListener('input', updateRaidDisplay);
hireResumeUrlInput.addEventListener('input', updateResumePreview);
addDocumentBtn.addEventListener('click', addDocumentToDraft);
uploadDocumentBtn.addEventListener('click', uploadDocumentToDraft);
addNewHireBtn.addEventListener('click', openNewHireModal);

renderHireTable();
