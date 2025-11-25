// ===== CONFIGURACIÓN =====
const HORARIOS_DISPONIBLES = ["09:00", "10:30", "12:00", "18:00", "19:30"];
const API_URL = "https://script.google.com/macros/s/AKfycbx8UepmVuMoihB4SijznGn_R1u0VK7fO-NGAF14ehxIwVeLtFQpNByuIXIHQ4Ss3VyKBg/exec";

let reservasGlobales = {};
let fechaSeleccionadaGlobal = null;

// ===== CARGAR RESERVAS =====
async function cargarReservas() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        const reservas = {};
        if (Array.isArray(data)) {
            data.forEach(item => {
                const fecha = item.fecha;
                const hora = item.hora;
                if (fecha && hora) {
                    if (!reservas[fecha]) reservas[fecha] = [];
                    reservas[fecha].push(hora);
                }
            });
        }
        reservasGlobales = reservas;
        actualizarSelectHoras();
    } catch (error) {
        console.error("Error al cargar reservas:", error);
        reservasGlobales = {};
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

// ===== SELECTOR DE HORAS =====
function actualizarSelectHoras() {
    const select = document.getElementById("time");
    const fecha = fechaSeleccionadaGlobal;

    if (!select) return;

    select.innerHTML = "<option value=''>Selecciona hora</option>";

    if (!fecha) return;

    const ocupadas = reservasGlobales[fecha] || [];

    HORARIOS_DISPONIBLES.forEach(hora => {
        const option = document.createElement("option");
        option.value = hora;
        option.textContent = hora;

        if (ocupadas.includes(hora)) {
            option.disabled = true;
            option.textContent += " (ocupado)";
        }

        select.appendChild(option);
    });
}

// ===== CALENDARIO =====
function renderCalendar(mes, anio, fechaSeleccionada = null) {
    const primerDia = new Date(anio, mes, 1);
    const ultimoDia = new Date(anio, mes + 1, 0);
    const hoy = new Date();

    const nombresMeses = [
        "Enero","Febrero","Marzo","Abril","Mayo","Junio",
        "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
    ];
    document.getElementById('calendar-month-year').textContent = `${nombresMeses[mes]} ${anio}`;

    const grid = document.getElementById('calendar-days');
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
                document.querySelectorAll('.calendar-day.selected').forEach(el => el.classList.remove('selected'));
                div.classList.add('selected');
                document.getElementById('date').value = fechaStr;
                fechaSeleccionadaGlobal = fechaStr;
                actualizarSelectHoras();
            });
        }

        grid.appendChild(div);
    }
}

// ===== ENVIAR RESERVA =====
async function enviarReserva(formData) {
    const date = formData.get('date')?.trim();
    const time = formData.get('time')?.trim();
    const name = formData.get('name')?.trim();
    const phone = formData.get('phone')?.trim();

    if (!date || !time || !name || !phone) {
        alert("Por favor, completa todos los campos.");
        return false;
    }

    // === VALIDACIÓN EXTRA PARA EVITAR RESERVA DUPLICADA ===
    const ocupadas = reservasGlobales[date] || [];
    if (ocupadas.includes(time)) {
        alert("Esa hora ya está reservada. Actualiza la página.");
        actualizarSelectHoras();
        return false;
    }

    const url = `${API_URL}?` + new URLSearchParams({ date, time, name, phone });

    try {
        const response = await fetch(url, { method: 'POST' });
        const result = await response.json();

        if (result.success) {
            if (!reservasGlobales[date]) reservasGlobales[date] = [];
            reservasGlobales[date].push(time);

            const ahora = new Date();
            renderCalendar(ahora.getMonth(), ahora.getFullYear(), date);
            actualizarSelectHoras();
            return true;
        } else {
            throw new Error(result.error || "Error al guardar.");
        }
    } catch (error) {
        console.error("Error al enviar reserva:", error);
        alert("Hubo un problema. Inténtalo más tarde.");
        return false;
    }
}

// ===== INICIALIZAR =====
document.addEventListener('DOMContentLoaded', async () => {
    const ahora = new Date();
    document.getElementById('date').min = formatearFecha(ahora);

    await cargarReservas();
    renderCalendar(ahora.getMonth(), ahora.getFullYear());

    document.getElementById('bookingForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const exito = await enviarReserva(new FormData(e.target));
        if (exito) {
            document.getElementById('confirmation').style.display = 'block';
            e.target.reset();
            fechaSeleccionadaGlobal = null;
            actualizarSelectHoras();
            document.querySelectorAll('.calendar-day.selected').forEach(el => el.classList.remove('selected'));
        }
    });

    document.getElementById('date').addEventListener('change', (e) => {
        fechaSeleccionadaGlobal = e.target.value;
        const ahora = new Date();
        renderCalendar(ahora.getMonth(), ahora.getFullYear(), fechaSeleccionadaGlobal);
        actualizarSelectHoras();
    });
});





