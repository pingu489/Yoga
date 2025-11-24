// === CONFIGURACIÓN: HORARIOS Y RESERVAS OCUPADAS ===
// Formato: "YYYY-MM-DD": ["HH:MM", ...]
const reservasOcupadas = {
  "2025-11-25": ["09:00", "10:30"],
  "2025-11-26": ["18:00", "19:30"],
  "2025-11-28": ["09:00", "10:30", "12:00", "18:00", "19:30"], // día completo
  "2025-11-30": ["12:00"]
};

const horariosDisponibles = ["09:00", "10:30", "12:00", "18:00", "19:30"];

// === UTILIDADES ===
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function getAvailability(dateStr) {
  const ocupadas = reservasOcupadas[dateStr] || [];
  const disponibles = horariosDisponibles.filter(h => !ocupadas.includes(h));
  if (disponibles.length === 0) return 'unavailable';
  return 'available';
}

// === CALENDARIO ===
function renderCalendar(month, year) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const today = new Date();

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  document.getElementById('calendar-month-year').textContent = `${monthNames[month]} ${year}`;

  const calendarGrid = document.getElementById('calendar-days');
  // Limpiar días anteriores (mantener los 7 headers)
  while (calendarGrid.children.length > 7) {
    calendarGrid.removeChild(calendarGrid.lastChild);
  }

  // Días en blanco antes del primer día (lunes = 1, domingo = 0)
  const startDayIndex = firstDay.getDay();
  const blankDays = (startDayIndex === 0 ? 6 : startDayIndex - 1);
  for (let i = 0; i < blankDays; i++) {
    const blank = document.createElement('div');
    blank.classList.add('calendar-day', 'empty');
    calendarGrid.appendChild(blank);
  }

  // Días del mes
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const dayElement = document.createElement('div');
    const date = new Date(year, month, day);
    const dateStr = formatDate(date);
    const isToday = formatDate(today) === dateStr;
    const status = getAvailability(dateStr);

    dayElement.classList.add('calendar-day', status);
    if (isToday) dayElement.classList.add('today');
    dayElement.textContent = day;

    // Seleccionar fecha en formulario al hacer clic
    if (status === 'available') {
      dayElement.addEventListener('click', () => {
        document.getElementById('date').value = dateStr;
      });
    }

    calendarGrid.appendChild(dayElement);
  }
}

// === INICIALIZAR ===
const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth();

// Establecer fecha mínima en el input
document.getElementById('date').min = formatDate(now);

// Renderizar calendario del mes actual
renderCalendar(currentMonth, currentYear);

// === FORMULARIO ===
document.getElementById('bookingForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const date = document.getElementById('date').value;
  const time = document.getElementById('time').value;

  // Simular "reserva": añadir al objeto (solo en memoria)
  if (!reservasOcupadas[date]) reservasOcupadas[date] = [];
  reservasOcupadas[date].push(time);

  // Actualizar calendario
  renderCalendar(currentMonth, currentYear);

  // Mostrar confirmación
  document.getElementById('confirmation').style.display = 'block';
  this.reset();
  document.getElementById('date').min = formatDate(now);
});