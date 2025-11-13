// calendar.js 
// mounts the calendar component onto the DOM.
(async () => {
    const { data: events } = await axios.get("http://localhost:3000/get-ics/upcoming");
    console.log(events);

    const monthMatrix = generateAllMonths();

    // append the data to their proper days 
    // there is def a better way to do this but as a first pass itll work
    for (const event of events) {
        const date = new Date(event.dtstart);
        const key = [date.getFullYear(), date.getMonth() + 1].join("~");
        const day = date.getDate();
        addEventToCalendar(monthMatrix, event, key, day);
    }

    // init calendar state
    let currentMonth = 0;
    const main = document.getElementById("main");

    const calDiv = document.createElement('div');
    calDiv.id = "cal";

    // add buttons to navigate through the months 
    const parent = document.getElementById("main");

    const buttonDiv = document.createElement('div');
    const leftButton = document.createElement('button');
    leftButton.innerText = "Prior";
    leftButton.classList.add("btn");
    leftButton.addEventListener('click', (e) => {
        const cal = document.getElementById("cal");
        if (!monthMatrix?.[currentMonth - 1]) { return }
        else {
            renderMonth(cal, currentMonth - 1, monthMatrix);
            currentMonth -= 1;
        }
    });

    const rightButton = document.createElement('button');
    rightButton.innerText = "Next";
    rightButton.classList.add("btn");
    rightButton.addEventListener('click', (e) => {
        const cal = document.getElementById("cal");
        if (!monthMatrix?.[currentMonth + 1]) { return }
        else {
            renderMonth(cal, currentMonth, monthMatrix);
            currentMonth += 1
        }
    });
    buttonDiv.appendChild(leftButton);
    buttonDiv.appendChild(rightButton);
    buttonDiv.id = "btn-div";
    parent.appendChild(buttonDiv);
    main.appendChild(calDiv);

    // default render
    renderMonth(calDiv, currentMonth, monthMatrix);
})();

/** renderMonth
 * renders a month and its events given the current month offset 
 * so this allows moving through to months and repainting.
 * @param {DOMNode} holder - parent div that holds the children 
 * @param {int} renderMonth - month to render (must be within range of months avail)
 * @param {Array} calendar - the calendar obj 
 */
function renderMonth(holder, renderMonth, calendar) {
    const months = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];

    // cleanup
    while (holder.firstChild) {
        holder.removeChild(holder.lastChild);
    }
    const buttonDiv = document.getElementById('btn-div');
    const oldTitle = document.getElementById("month-title");
    if (buttonDiv && oldTitle) {
        buttonDiv.removeChild(oldTitle);
    }


    // build new calendar 
    const [[key, weeks]] = Object.entries(calendar[renderMonth]);
    const [year, month] = key.split('~');

    const title = document.createElement('h1');
    title.innerText = `Rag Tag Calendar: ${months[month - 1]} ${year}`;
    title.id = "month-title";

    // add title  
    buttonDiv.appendChild(title);

    // add weeks and days
    for (const w of weeks) {
        const week = document.createElement('div');
        week.classList.add("week");
        for (const d of w) {
            const day = document.createElement('div');
            day.classList.add("day");
            if (!d) {
                week.appendChild(day);
                continue
            }
            // day number
            const dayNumber = document.createElement('p');
            dayNumber.innerText = d.day;
            day.appendChild(dayNumber);

            // event details
            if (d?.event) {
                const event = document.createElement('div');
                const eventTitle = document.createElement('p');
                eventTitle.innerText = d.event.summary;
                event.appendChild(eventTitle);
                const eventPrice = document.createElement('p');
                eventPrice.innerText = d.event.price;
                event.appendChild(eventPrice);
                // TODO: START AND END TIME

                day.appendChild(event);
            }
            week.appendChild(day);
        }
        holder.appendChild(week);
    }
}

/** addEventToCalendar
 * inserts an event into its proper position on the calendar 
 * @param {Array<Object>>} calendar - calendar matrix 
 * @param {Object} event - event object to insert 
 * @param {string} eventKey - key of the events month 
 * @param {int} eventDay - events day of the month 
 * @returns {void}
 */
function addEventToCalendar(calendar, event, eventKey, eventDay) {
    for (const month of calendar) {
        const [monthKey] = Object.keys(month);
        if (monthKey === eventKey) {
            // TODO: we can do some math here like Math.floor(eventDay / 7)
            // to just find the index.
            const weeks = month[monthKey];
            for (const week of weeks) {
                for (const day of week) {
                    if (!day) continue;
                    if (day.day === eventDay) {
                        day.event = event;
                    }
                }
            }
        }
    }
}

/** getCalendarMonth
    * generate a single calendar month 
    * @param {int} offset - month offset
    * @returns {Object}
    */
function getCalendarMonth(offset = 0) {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    const year = firstDay.getFullYear();
    const month = firstDay.getMonth();

    const lastDay = new Date(year, month + 1, 0).getDate();
    const startDay = firstDay.getDay();

    const weeks = [];
    let week = new Array(7).fill(null);
    let day = 1;

    for (let i = startDay; i < 7 && day <= lastDay; i++) {
        week[i] = { day };
        day++;
    }
    weeks.push(week);

    while (day <= lastDay) {
        week = new Array(7).fill(null);
        for (let i = 0; i < 7 && day <= lastDay; i++) {
            week[i] = { day };
            day++;
        }
        weeks.push(week);
    }

    const key = [year, month + 1];
    return { [key.join("~")]: weeks };
}

/** generateAllMonths
 * gets a full calendar set of the next x months (inclusive of current)
 * @param {int} months - number of months to generate 
 * @returns {Object} all months 
 */
function generateAllMonths(months = 5) {
    const m = [];
    for (let i = 0; i < months; i++) {
        m.push(getCalendarMonth(i));
    }
    return m;
}
