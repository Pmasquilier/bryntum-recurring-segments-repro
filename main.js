import { SchedulerPro } from '@bryntum/schedulerpro';

const logElement = document.getElementById('log');
const log = message => {
    logElement.textContent += `${message}\n`;
    console.log(message);
};

// Tuesday 14 Apr 2026: a master split in two segments (10:00-14:30 and 18:00-22:30), repeating every Tuesday.
// The master spans 10:00-22:30 and its duration is the worked time (9 h), as the segments add up.
const at = (day, hours, minutes = 0) => new Date(2026, 3, day, hours, minutes);

const scheduler = new SchedulerPro({
    appendTo         : 'container',
    startDate        : at(14, 0),
    endDate          : at(22, 0),
    viewPreset       : 'dayAndWeek',
    features         : { eventSegments : true },
    columns          : [{ text : 'Employee', field : 'name', width : 120 }],
    resources        : [{ id : 1, name : 'Ada' }],
    events           : [{
        id             : 1,
        resourceId     : 1,
        name           : 'Split shift',
        startDate      : at(14, 10),
        endDate        : at(14, 22, 30),
        duration       : 9,
        durationUnit   : 'hour',
        recurrenceRule : 'FREQ=WEEKLY;INTERVAL=1;BYDAY=TU;UNTIL=20260428T235959',
        segments       : [
            { startDate : at(14, 10), endDate : at(14, 14, 30) },
            { startDate : at(14, 18), endDate : at(14, 22, 30) }
        ]
    }]
});

const { project } = scheduler;
const fmt = date => `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

// What the page shows for each Tuesday, read from the model and from the DOM.
window.report = async () => {
    await project.commitAsync();
    scheduler.timeAxis.setTimeSpan(at(14, 0), at(29, 0));
    await project.commitAsync();
    const master = project.eventStore.getById(1);
    const rows = [14, 21, 28].map(day => {
        const occurrence = day === 14 ? master : master.getOccurrencesForDateRange(at(day, 0), at(day, 23, 59))[0];
        return {
            day,
            start    : fmt(occurrence.startDate),
            end      : fmt(occurrence.endDate),
            segments : occurrence.segments?.map(seg => `${fmt(seg.startDate)} - ${fmt(seg.endDate)}`)
        };
    });
    // Bars drawn in each Tuesday's column, read from the DOM.
    const barsPerDay = {};
    [14, 21, 28].forEach(day => {
        const left = scheduler.getCoordinateFromDate(at(day, 0)) + scheduler.timeAxisSubGridElement.getBoundingClientRect().left;
        const right = scheduler.getCoordinateFromDate(at(day + 1, 0)) + scheduler.timeAxisSubGridElement.getBoundingClientRect().left;
        barsPerDay[day] = [...document.querySelectorAll('.b-sch-event')].filter(el => {
            const box = el.getBoundingClientRect();
            return box.width > 0 && box.right > left && box.left < right;
        }).length;
    });
    rows.forEach(row => log(`Tuesday ${row.day} Apr  ${row.start} -> ${row.end}  segments: ${JSON.stringify(row.segments)}  bars drawn that day: ${barsPerDay[row.day]}`));
    return { rows, barsPerDay };
};

window.scheduler = scheduler;
