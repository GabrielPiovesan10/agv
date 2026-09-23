document.addEventListener('DOMContentLoaded', () => {
    // ---- DOM Elements ----
    const form = document.getElementById('booking-form');
    const dateInput = document.getElementById('date');
    const timeSelect = document.getElementById('time');
    const btnMinus = document.getElementById('btn-minus');
    const btnPlus = document.getElementById('btn-plus');
    const guestsInput = document.getElementById('guests');
    const formMessage = document.getElementById('form-message');
    const eventsList = document.getElementById('events-list');
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();

    // ---- State ----
    let reservations = JSON.parse(localStorage.getItem('restaurantEvents')) || [];
    let currentFilter = 'all';

    // ---- Setup Date Input ----
    // Set min date to today
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const formattedToday = `${yyyy}-${mm}-${dd}`;
    
    dateInput.min = formattedToday;

    // ---- Handlers ----
    
    // Date Change - Generate Time Slots
    dateInput.addEventListener('change', (e) => {
        const selectedDate = e.target.value;
        if (!selectedDate) {
            timeSelect.innerHTML = '<option value="" disabled selected>Selecione uma data primeiro</option>';
            timeSelect.disabled = true;
            return;
        }

        generateTimeSlots(selectedDate);
    });

    // Guests Plus/Minus
    btnMinus.addEventListener('click', () => {
        let val = parseInt(guestsInput.value);
        if (val > 1) guestsInput.value = val - 1;
    });

    btnPlus.addEventListener('click', () => {
        let val = parseInt(guestsInput.value);
        if (val < 20) guestsInput.value = val + 1;
    });

    // Form Submit
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Get values
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const date = document.getElementById('date').value;
        const time = document.getElementById('time').value;
        const guests = document.getElementById('guests').value;
        const notes = document.getElementById('notes').value.trim();

        // Validate
        if (!name || !email || !phone || !date || !time) {
            showMessage('Por favor, preencha todos os campos obrigatórios.', 'error');
            return;
        }

        // Create reservation object
        const newReservation = {
            id: Date.now().toString(),
            name,
            email,
            phone,
            date,
            time,
            guests: parseInt(guests),
            notes,
            createdAt: new Date().toISOString()
        };

        // Save
        reservations.push(newReservation);
        // Sort by date and time
        reservations.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateA - dateB;
        });
        
        saveReservations();
        
        // Update UI
        renderEvents();
        showMessage('Reserva confirmada com sucesso! ✨', 'success');
        
        // Reset form
        form.reset();
        guestsInput.value = 2;
        timeSelect.innerHTML = '<option value="" disabled selected>Selecione uma data primeiro</option>';
        timeSelect.disabled = true;
    });

    // Filters
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderEvents();
        });
    });

    // ---- Functions ----
    
    function generateTimeSlots(dateString) {
        // Restaurant hours: 19:00 to 23:00, slots every 30 mins
        timeSelect.innerHTML = '<option value="" disabled selected>Escolha o horário</option>';
        timeSelect.disabled = false;

        const startTime = 19; // 19:00
        const endTime = 23;   // 23:00
        
        const isToday = dateString === formattedToday;
        const currentHour = today.getHours();
        const currentMinute = today.getMinutes();

        for (let i = startTime; i <= endTime; i++) {
            for (let j = 0; j < 60; j += 30) {
                // If closing time, only allow exact hour (23:00) not 23:30
                if (i === endTime && j > 0) continue;

                // If date is today, block past times (+ 1 hour buffer)
                if (isToday) {
                    if (i < currentHour + 1 || (i === currentHour + 1 && j < currentMinute)) {
                        continue; // Skip past slots
                    }
                }

                const hourStr = String(i).padStart(2, '0');
                const minStr = String(j).padStart(2, '0');
                const timeStr = `${hourStr}:${minStr}`;
                
                // Check if slot is fully booked (mock logic: max 5 tables per slot)
                const bookingsInSlot = reservations.filter(r => r.date === dateString && r.time === timeStr).length;
                if (bookingsInSlot >= 5) continue; // Slot full

                const option = document.createElement('option');
                option.value = timeStr;
                option.textContent = timeStr;
                timeSelect.appendChild(option);
            }
        }
        
        if (timeSelect.options.length === 1) {
            timeSelect.innerHTML = '<option value="" disabled selected>Nenhum horário disponível nesta data</option>';
            timeSelect.disabled = true;
        }
    }

    function saveReservations() {
        localStorage.setItem('restaurantEvents', JSON.stringify(reservations));
    }

    function renderEvents() {
        eventsList.innerHTML = '';
        
        let filtered = reservations;
        
        if (currentFilter === 'today') {
            filtered = reservations.filter(r => r.date === formattedToday);
        } else if (currentFilter === 'upcoming') {
            filtered = reservations.filter(r => r.date >= formattedToday);
        }

        if (filtered.length === 0) {
            eventsList.innerHTML = `
                <div class="empty-state slide-in">
                    <p>Nenhuma reserva encontrada para este filtro.</p>
                </div>
            `;
            return;
        }

        filtered.forEach((r, index) => {
            // Format date for BR format
            const [y, m, d] = r.date.split('-');
            const formattedDateBR = `${d}/${m}/${y}`;
            
            const card = document.createElement('div');
            card.className = 'event-card slide-in';
            card.style.animationDelay = `${index * 0.05}s`;
            
            card.innerHTML = `
                <div class="event-header">
                    <span class="event-date">📅 ${formattedDateBR}</span>
                    <span class="event-time">⏰ ${r.time}</span>
                </div>
                <h3 class="event-name">${r.name}</h3>
                <div class="event-details">
                    <span>👥 ${r.guests} ${r.guests > 1 ? 'pessoas' : 'pessoa'}</span>
                    <span>📞 ${r.phone}</span>
                </div>
                ${r.notes ? `<div class="event-notes">"${r.notes}"</div>` : ''}
                <button class="delete-btn" onclick="deleteReservation('${r.id}')">Cancelar</button>
            `;
            
            eventsList.appendChild(card);
        });
    }

    function showMessage(text, type) {
        formMessage.textContent = text;
        formMessage.className = `message ${type}`;
        formMessage.classList.remove('hidden');
        
        setTimeout(() => {
            formMessage.classList.add('hidden');
        }, 5000);
    }

    // Expose delete function to global scope so inline onclick works
    window.deleteReservation = function(id) {
        if(confirm('Tem certeza que deseja cancelar esta reserva?')) {
            reservations = reservations.filter(r => r.id !== id);
            saveReservations();
            renderEvents();
            
            // if currently selected date is the same as deleted, regenerate slots to free it up
            if (dateInput.value) {
                generateTimeSlots(dateInput.value);
            }
        }
    };

    // Initial render
    renderEvents();
});
