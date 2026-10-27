(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const TARGET = .75;
  const n = id => Number($(id).value);
  function calculate() {
    const totalRaw = $('quick-total').value, attendedRaw = $('quick-attended').value;
    const host = $('quick-attendance-result');
    if (totalRaw === '' || attendedRaw === '') { host.innerHTML = '<p>Enter both numbers to calculate your attendance.</p>'; return; }
    const total = n('quick-total'), attended = n('quick-attended');
    if (!Number.isInteger(total) || !Number.isInteger(attended) || total < 1 || attended < 0 || attended > total) { host.innerHTML = '<p class="qa-low">Enter whole numbers where total classes is at least 1 and attended classes are between 0 and total.</p>'; return; }
    const pct = attended / total * 100;
    const miss = Math.max(0, Math.floor(attended / TARGET - total + 1e-9));
    const recover = pct < 75 ? Math.max(0, Math.ceil((TARGET * total - attended) / (1 - TARGET) - 1e-9)) : 0;
    const target = pct >= 75 ? `You can miss ${miss} more ${miss === 1 ? 'class' : 'classes'} in a row` : `Attend ${recover} consecutive classes to reach 75%`;
    host.innerHTML = `<div class="qa-stat"><span>Current attendance</span><strong class="${pct >= 75 ? 'qa-good':'qa-low'}">${pct.toFixed(2)}%</strong></div><div class="qa-stat"><span>Classes attended</span><strong>${attended} / ${total}</strong></div><div class="qa-stat"><span>${pct >= 75 ? 'Safe absence allowance':'Recovery target'}</span><strong>${pct >= 75 ? `${miss} class${miss===1?'':'es'}`:`${recover} classes`}</strong></div><p class="qa-result-note">${target} without attending any in between. This is a mathematical estimate, not an official attendance guarantee.</p>`;
  }
  ['quick-total','quick-attended'].forEach(id => { if ($(id)) $(id).addEventListener('input', calculate); });

  function renderHolidays(list) {
    const host=$('holiday-list'); $('holiday-count').textContent=`${list.length} holiday${list.length===1?'':'s'}`;
    if(!list.length){host.innerHTML='<p class="student-empty">The preloaded MUJ calendar has no entries.</p>';return;}
    const today=new Date(); today.setHours(0,0,0,0);
    const sorted=list.slice().sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    host.innerHTML=sorted.map(h=>{const date=new Date(h.date+'T00:00:00');const isPast=!Number.isNaN(+date)&&date<today;return `<article class="holiday-entry"><div class="holiday-date">${esc(h.date)}</div><div><strong>${esc(h.name)}</strong><span>${esc(h.details||'Official calendar entry')}${isPast?' · Past date':''}</span></div></article>`;}).join('');
  }
  // Calendar-listed observances transcribed from the user-provided MUJ Academic Calendar 2026–2027.
  // Some entries are observances/events rather than guaranteed no-class holidays; the UI says to verify.
  const MUJ_CALENDAR_2026_27 = [
    {date:'2026-08-04',name:'Janmashtami',details:'Listed on MUJ Academic Calendar 2026–2027'},
    {date:'2026-08-15',name:'Independence Day',details:'Listed on MUJ Academic Calendar 2026–2027'},
    {date:'2026-08-28',name:'Raksha Bandhan',details:'Listed on MUJ Academic Calendar 2026–2027'},
    {date:'2026-08-29',name:'National Sports Day',details:'Calendar observance; confirm class status'},
    {date:'2026-09-15',name:"Engineers’ Day",details:'Calendar observance; confirm class status'},
    {date:'2026-10-02',name:'Gandhi Jayanti',details:'Listed on MUJ Academic Calendar 2026–2027'},
    {date:'2026-10-20',name:'Dussehra',details:'Listed on MUJ Academic Calendar 2026–2027'},
    {date:'2026-11-08',name:'Diwali',details:'Listed on MUJ Academic Calendar 2026–2027'},
    {date:'2026-11-09',name:'Govardhan Puja',details:'Listed on MUJ Academic Calendar 2026–2027'},
    {date:'2026-11-11',name:'Bhai Dooj',details:'Listed on MUJ Academic Calendar 2026–2027'},
    {date:'2026-12-25',name:'Christmas',details:'Listed on MUJ Academic Calendar 2026–2027'},
    {date:'2027-01-14',name:'Makar Sankranti',details:'Listed on MUJ Academic Calendar 2026–2027'},
    {date:'2027-01-26',name:'Republic Day',details:'Listed on MUJ Academic Calendar 2026–2027'},
    {date:'2027-02-28',name:'National Science Day',details:'Calendar observance; confirm class status'},
    {date:'2027-03-22',name:'Holi',details:'Listed on MUJ Academic Calendar 2026–2027'},
    {date:'2027-06-21',name:'International Yoga Day',details:'Calendar observance; confirm class status'}
  ];
  // The MUJ calendar is universal for all students and is bundled with the app.
  // No per-student academic-calendar upload or clear control is provided.
  const savedHolidays = MUJ_CALENDAR_2026_27.slice();
  renderHolidays(savedHolidays);
  const holidayToggle = $('toggle-holiday-list');
  // Always render the bundled MUJ calendar; the button only controls visibility.
  renderHolidays(MUJ_CALENDAR_2026_27);
  holidayToggle.addEventListener('click', () => {
    const opening = $('holiday-list').hidden;
    $('holiday-list').hidden = !opening;
    holidayToggle.setAttribute('aria-expanded', String(opening));
    holidayToggle.textContent = opening ? 'Hide holiday list' : 'View holiday list';
    if (opening) { renderHolidays(MUJ_CALENDAR_2026_27); $('holiday-status').textContent = `Showing ${MUJ_CALENDAR_2026_27.length} preloaded MUJ academic calendar entries.`; }
  });

  const plannerHost = $('long-weekend-results');
  const dateObj = iso => new Date(`${iso}T00:00:00`);
  const isoDate = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const shiftDate = (d, days) => { const out=new Date(d); out.setDate(out.getDate()+days); return out; };
  const weekdayName = d => d.toLocaleDateString('en-IN',{weekday:'short'});
  function findLongWeekends() {
    const holidays = MUJ_CALENDAR_2026_27.filter(h=>/^\d{4}-\d{2}-\d{2}$/.test(h.date));
    if (!holidays.length) { plannerHost.innerHTML='<p class="student-empty">The MUJ academic calendar is not available in this build.</p>'; return; }
    const holidayDates = new Set(holidays.map(h=>h.date));
    const maxLeave = Number($('long-weekend-leave').value)||2;
    const candidates = new Map();
    for (const h of holidays) {
      const hd = dateObj(h.date);
      for (let length=3; length<=maxLeave+3; length++) {
        for (let offset=-(length-1); offset<=0; offset++) {
          const start=shiftDate(hd,offset), end=shiftDate(start,length-1);
          let leave=[], hasSat=false, hasSun=false, includedHoliday=false;
          for(let i=0;i<length;i++) {
            const d=shiftDate(start,i), iso=isoDate(d), dow=d.getDay();
            if(dow===6) hasSat=true; if(dow===0) hasSun=true;
            if(holidayDates.has(iso)) includedHoliday=true;
            else if(dow!==0&&dow!==6) leave.push(iso);
          }
          if(!hasSat||!hasSun||!includedHoliday||leave.length<1||leave.length>maxLeave) continue;
          const key=`${isoDate(start)}_${isoDate(end)}`;
          if(!candidates.has(key)) candidates.set(key,{start:isoDate(start),end:isoDate(end),length,leave,holidayNames:[]});
          const c=candidates.get(key); if(holidayDates.has(h.date)){const name=holidays.find(x=>x.date===h.date)?.name;if(name&&!c.holidayNames.includes(name))c.holidayNames.push(name);}
        }
      }
    }
    // The chosen number is the exact total length of the consecutive break,
    // not merely a maximum number of class days to miss.
    const lengthChoice = $('long-weekend-leave')?.value ?? '2';
    const selectedLength = lengthChoice === 'all' ? null : Number(lengthChoice);
    const filtered = [...candidates.values()].filter(c =>
      selectedLength === null || c.length === selectedLength
    );
    const sorted=filtered.sort((a,b)=>
      a.start.localeCompare(b.start) || b.length-a.length
    );
    if(!sorted.length){
      plannerHost.innerHTML = selectedLength === null
        ? '<p class="student-empty">No long-weekend options found in the loaded academic calendar.</p>'
        : `<p class="student-empty">No ${selectedLength}-day long-weekend options found in the loaded academic calendar. Try another length or check the calendar dates.</p>`;
      return;
    }
    plannerHost.innerHTML=sorted.map(c=>`<article class="holiday-entry"><div class="holiday-date">${esc(c.start)} → ${esc(c.end)}</div><div><strong>${c.length}-day break · Miss ${c.leave.length} class day${c.leave.length===1?'':'s'}</strong><span>${esc(c.holidayNames.join(', ')||'Calendar-listed holiday')} · Suggested days off: ${esc(c.leave.map(d=>`${d} (${weekdayName(dateObj(d))})`).join(', '))}</span></div></article>`).join('');
  }
  const leavePreference = $('long-weekend-leave');
  if (leavePreference) leavePreference.addEventListener('change', () => {
    if (plannerHost && !$('long-weekend-results').hidden) findLongWeekends();
  });
  const weekendToggle = $('find-long-weekends');
  weekendToggle.addEventListener('click', () => {
    const results = $('long-weekend-results');
    if (results.hidden) {
      findLongWeekends();
      results.hidden = false;
      weekendToggle.setAttribute('aria-expanded', 'true');
      weekendToggle.textContent = 'Hide long-weekend options';
    } else {
      results.hidden = true;
      weekendToggle.setAttribute('aria-expanded', 'false');
      weekendToggle.textContent = 'Show all long-weekend options';
    }
  });
})();
