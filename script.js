// ===== CONFIGURACIÓN =====
const HORARIOS_DISPONIBLES = ["09:00", "10:30", "12:00", "18:00", "19:30"];
const API_URL = "https://script.google.com/macros/s/AKfycbx8UepmVuMoihB4SijznGn_R1u0VK7fO-NGAF14ehxIwVeLtFQpNByuIXIHQ4Ss3VyKBg/exec";

let reservasGlobales = {};

// ===== CARGAR RESERVAS =====
function renderCalendar(mes, anio, fechaSeleccionada = null) {
  const primerDia = new Date(anio, mes, 1);
  const ultimoDia = new Date(anio, mes + 1, 0);
  const hoy = new Date();

  const nombresMeses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  document.getElementById('calendar-month-year').textContent = `${nombresMeses[mes]} ${anio}`;

  const grid = document.getElementById('calendar-days');
  if (!grid) return;
  while (grid.children.length > 7) grid.removeChild(grid.lastChild);

  const inicio = primerDia.getDay();
  const diasEnBlanco = inicio === 0 ? 6 : inicio - 1;
  for (let i = 0; i < diasEnBlanco; i++) {
    const div = document.createElement('div');
    div.classList.add('calendar-day', 'empty');
    grid.appendChild(div);
  }

  for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
    const fecha = new Date(anio, mes, dia);
    const fechaStr = formatearFecha(fecha);
    const esHoy = formatearFecha(hoy) === fechaStr;
    const estado = getDisponibilidad(fechaStr);
    const esSeleccionado = fechaSeleccionada === fechaStr;

    const div = document.createElement('div');
    div.classList.add('calendar-day', estado);
    if (esHoy) div.classList.add('today');
    if (esSeleccionado) div.classList.add('selected');
    div.textContent = dia;

    if (estado === 'available') {
      div.addEventListener('click', () => {
        document.querySelectorAll('.calendar-day.selected').forEach(el => {
          el.classList.remove('selected');
        });
        div.classList.add('selected');
        document.getElementById('date').value = fechaStr;
      });
    }

    grid.appendChild(div);
  }
}

// ===== UTILIDADES =====
function formatearFecha(date) {
  const año = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const día = String(date.getDate()).padStart(2, '0');
  return `${año}-${mes}-${día}`;
}

function getDisponibilidad(fechaStr) {
  const ocupadas = reservasGlobales[fechaStr] || [];
  const disponibles = HORARIOS_DISPONIBLES.filter(h => !ocupadas.includes(h));
  return disponibles.length === 0 ? 'unavailable' : 'available';
}

// ===== CALENDARIO =====
function renderCalendar(mes, anio) {
  const primerDia = new Date(anio, mes, 1);
  const ultimoDia = new Date(anio, mes + 1, 0);
  const hoy = new Date();

  const nombresMeses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  document.getElementById('calendar-month-year').textContent = `${nombresMeses[mes]} ${anio}`;

  const grid = document.getElementById('calendar-days');
  if (!grid) return; 
  while (grid.children.length > 7) grid.removeChild(grid.lastChild);

  const inicio = primerDia.getDay();
  const diasEnBlanco = inicio === 0 ? 6 : inicio - 1;
  for (let i = 0; i < diasEnBlanco; i++) {
    const div = document.createElement('div');
    div.classList.add('calendar-day', 'empty');
    grid.appendChild(div);
  }

  for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
    const fecha = new Date(anio, mes, dia);
    const fechaStr = formatearFecha(fecha);
    const esHoy = formatearFecha(hoy) === fechaStr;
    const estado = getDisponibilidad(fechaStr);

    const div = document.createElement('div');
    div.classList.add('calendar-day', estado);
    if (esHoy) div.classList.add('today');
    div.textContent = dia;

    if (estado === 'available') {
      div.addEventListener('click', () => {
        document.getElementById('date').value = fechaStr;
      });
    }

    grid.appendChild(div);
  }
}

// ===== ENVIAR RESERVA =====
async function enviarReserva(formData) {
  const date = formData.get('date');
  const time = formData.get('time');
  const name = formData.get('name');
  const phone = formData.get('phone');

  if (!date || !time || !name || !phone) {
    alert("Por favor, completa todos los campos.");
    return false;
  }

  const url = `${API_URL}?` + new URLSearchParams({
    date: date,
    time: time,
    name: name,
    phone: phone
  });

  try {
    const response = await fetch(url, { method: 'POST' });
    const result = await response.json();
    
    if (result.success) {
      const fecha = date;
      const hora = time;
      if (!reservasGlobales[fecha]) reservasGlobales[fecha] = [];
      reservasGlobales[fecha].push(hora);
      
      const ahora = new Date();
      renderCalendar(ahora.getMonth(), ahora.getFullYear());
      return true;
    } else {
      throw new Error(result.error || "Error al guardar");
    }
  } catch (error) {
    console.error("Error al enviar reserva:", error);
    alert("Hubo un problema. Inténtalo más tarde.");
    return false;
  }
}

// ===== INICIALIZAR =====
document.addEventListener('DOMContentLoaded', async () => {
  // Asegurar que el calendario se renderice SIEMPRE
  const ahora = new Date();
  document.getElementById('date').min = formatearFecha(ahora);

  // Cargar reservas (pero no bloquear el calendario si falla)
  cargarReservas().catch(err => {
    console.warn("No se cargaron reservas, pero el calendario se mostrará.");
  }).finally(() => {
    renderCalendar(ahora.getMonth(), ahora.getFullYear());
    
  });

  // Formulario
  const form = document.getElementById('bookingForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const exito = await enviarReserva(new FormData(e.target));
      if (exito) {
        document.getElementById('confirmation').style.display = 'block';
        e.target.reset();
      }
    });
  }
});




