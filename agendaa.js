document.addEventListener('DOMContentLoaded', () => {
    // ---- DOM Elements ----
    const form = document.getElementById('event-form');
    const formMessage = document.getElementById('form-message');
    const eventsList = document.getElementById('events-list');
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    // ---- State ----
    // Array of event objects
    let adminEvents = JSON.parse(localStorage.getItem('adminEventsAgenda')) || [];
    let currentFilter = 'upcoming'; // 'upcoming', 'past', 'all'

    // Get today at 00:00:00 for comparison
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayStr = today.toISOString().split('T')[0];

    // ---- Handlers ----
    
    // Form Submit
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Get values
        const eventName = document.getElementById('eventName').value.trim();
        const eventDate = document.getElementById('eventDate').value;
        const eventTime = document.getElementById('eventTime').value;
        const couvert = document.getElementById('couvert').value;
        const cache = document.getElementById('cache').value;
        const notes = document.getElementById('notes').value.trim();

        if (!eventName || !eventDate || !eventTime) {
            showMessage('Preencha os campos obrigatórios (Nome, Data, Horário).', 'error');
            return;
        }

        // Create event object
        const newEvent = {
            id: Date.now().toString(),
            name: eventName,
            date: eventDate,
            time: eventTime,
            couvert: couvert ? parseFloat(couvert).toFixed(2) : '0.00',
            cache: cache ? parseFloat(cache).toFixed(2) : '0.00',
            notes: notes,
            createdAt: new Date().toISOString()
        };

        // Save
        adminEvents.push(newEvent);
        saveEvents();
        
        // Update UI
        renderEvents();
        showMessage('Evento agendado com sucesso! 🎉', 'success');
        
        // Reset form
        form.reset();
        document.getElementById('eventName').focus();
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
    
    function saveEvents() {
        // Sort by date and time (ascending) before saving
        adminEvents.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateA - dateB;
        });
        localStorage.setItem('adminEventsAgenda', JSON.stringify(adminEvents));
    }

    function renderEvents() {
        eventsList.innerHTML = '';
        
        // Get today string in YYYY-MM-DD local time format
        const localToday = new Date();
        const yyyy = localToday.getFullYear();
        const mm = String(localToday.getMonth() + 1).padStart(2, '0');
        const dd = String(localToday.getDate()).padStart(2, '0');
        const formattedToday = `${yyyy}-${mm}-${dd}`;

        let filtered = adminEvents;
        
        if (currentFilter === 'upcoming') {
            filtered = adminEvents.filter(e => e.date >= formattedToday);
        } else if (currentFilter === 'past') {
            filtered = adminEvents.filter(e => e.date < formattedToday);
            // Reverse to show most recent past events first
            filtered = [...filtered].reverse();
        } else {
            // all
            filtered = [...adminEvents].reverse(); // newest first
        }

        if (filtered.length === 0) {
            eventsList.innerHTML = `
                <div class="empty-state slide-in">
                    <p>Nenhum evento encontrado nesta categoria.</p>
                </div>
            `;
            return;
        }

        filtered.forEach((ev, index) => {
            // Format date for BR format
            const [y, m, d] = ev.date.split('-');
            const formattedDateBR = `${d}/${m}/${y}`;
            
            const isPast = ev.date < formattedToday;
            
            const card = document.createElement('div');
            card.className = `event-card slide-in ${isPast ? 'past-event' : ''}`;
            card.style.animationDelay = `${index * 0.05}s`;
            
            card.innerHTML = `
                <div class="event-header-info">
                    <h3 class="event-title">${ev.name}</h3>
                    <div class="event-datetime">
                        🗓️ ${formattedDateBR} às ${ev.time}
                    </div>
                </div>
                
                <div class="event-finances">
                    <div class="finance-item">
                        🎫 Couvert: <span>R$ ${ev.couvert}</span>
                    </div>
                    <div class="finance-item">
                        💰 Cachê: <span>R$ ${ev.cache}</span>
                    </div>
                </div>

                ${ev.notes ? `<div class="event-notes">${ev.notes}</div>` : ''}
                
                <button class="delete-btn" onclick="deleteEvent('${ev.id}')">Excluir</button>
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
        }, 4000);
    }

    // Expose delete function
    window.deleteEvent = function(id) {
        if(confirm('Tem certeza que deseja excluir este evento da agenda? Essa ação não pode ser desfeita.')) {
            adminEvents = adminEvents.filter(e => e.id !== id);
            saveEvents();
            renderEvents();
        }
    };

    // Initial render
    renderEvents();
});
