(() => {
const $=id=>document.getElementById(id), TARGET=.75, DAYS=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
let timetable=[], attendance=[];
function status(id,msg,bad=false){const e=$(id);e.textContent=msg;e.classList.toggle('is-error',bad)}
function csv(text){const lines=[];let row=[],field='',q=false;text=text.replace(/^\uFEFF/,'');for(let i=0;i<text.length;i++){let c=text[i],n=text[i+1];if(c==='"'&&q&&n==='"'){field+='"';i++}else if(c==='"')q=!q;else if(c===','&&!q){row.push(field.trim());field=''}else if((c==='\n'||c==='\r')&&!q){if(c==='\r'&&n==='\n')i++;row.push(field.trim());field='';if(row.some(x=>x))lines.push(row);row=[]}else field+=c}row.push(field.trim());if(row.some(x=>x))lines.push(row);if(!lines.length)return[];let h=lines.shift().map(x=>x.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,''));return lines.map(r=>Object.fromEntries(h.map((k,i)=>[k,(r[i]||'').trim()])))}
function val(r,keys){for(const k of keys)if(r[k]!=null&&String(r[k]).trim())return String(r[k]).trim();return''}
function day(v){let s=(v||'').toLowerCase();let m={sun:'Sunday',mon:'Monday',tue:'Tuesday',tues:'Tuesday',wed:'Wednesday',thu:'Thursday',thur:'Thursday',thurs:'Thursday',fri:'Friday',sat:'Saturday'};for(let k in m)if(s===k||s.startsWith(k))return m[k];return DAYS.find(d=>d.toLowerCase()===s)||v||'Unspecified day'}
function parseTT(t){return csv(t).map((r,i)=>({id:i,day:canonicalDay(val(r,['day','weekday','day_of_week'])),start:val(r,['start','start_time','from']),end:val(r,['end','end_time','to']),subject:val(r,['subject','course','course_name','class','title']),room:val(r,['room','room_number','classroom','location']),faculty:val(r,['faculty','teacher','instructor'])})).filter(x=>x.subject)}
function parseICS(text) {
  const lines = text.replaceAll(String.fromCharCode(13), '').split(String.fromCharCode(10));
  const events = [];
  let event = null;
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') { event = {}; continue; }
    if (line === 'END:VEVENT' && event) { events.push(event); event = null; continue; }
    if (!event) continue;
    const colon = line.indexOf(':');
    if (colon < 0) continue;
    const key = line.slice(0, colon).split(';')[0].toUpperCase();
    event[key] = line.slice(colon + 1);
  }
  return events.map((item, index) => {
    const rawStart = item.DTSTART || '';
    const date = rawStart.slice(0, 8);
    const dt = date.length === 8
      ? new Date(Date.UTC(Number(date.slice(0,4)), Number(date.slice(4,6))-1, Number(date.slice(6,8))))
      : null;
    const time = raw => raw && raw.length >= 13 ? raw.slice(9,11) + ':' + raw.slice(11,13) : '';
    return {
      id: index,
      day: dt ? day(dt.toLocaleDateString('en-US', {weekday:'long', timeZone:'UTC'})) : 'Unspecified day',
      start: time(item.DTSTART || ''),
      end: time(item.DTEND || ''),
      subject: item.SUMMARY || 'Class',
      room: item.LOCATION || '',
      faculty: ''
    };
  });
}
function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function mins(s){let m=(s||'').match(/(\d{1,2}):(\d{2})/);return m?+m[1]*60+ +m[2]:9999}
function canonicalDay(value){const s=String(value||'').trim().toLowerCase().replace(/[^a-z]/g,'');const aliases={sun:'Sunday',sunday:'Sunday',mon:'Monday',monday:'Monday',tue:'Tuesday',tues:'Tuesday',tuesday:'Tuesday',wed:'Wednesday',weds:'Wednesday',wednesday:'Wednesday',thu:'Thursday',thur:'Thursday',thurs:'Thursday',thursday:'Thursday',fri:'Friday',friday:'Friday',sat:'Saturday',saturday:'Saturday'};return aliases[s]||'Unspecified day'}
function renderTT(){const host=$('timetable-display');if(!host)return;const filter=$('timetable-day-filter')?.value||'Today';const today=DAYS[new Date().getDay()];const target=filter==='Today'?today:filter;const normalized=timetable.map(c=>({...c,day:canonicalDay(c.day)}));const shown=filter==='All'?normalized:normalized.filter(c=>c.day===target);$('class-count').textContent=`${shown.length} class${shown.length===1?'':'es'}${filter==='All'?' total':` · ${target}`}`;if(!timetable.length){host.innerHTML='<p class="student-empty">Upload your timetable to display your classes here.</p>';return}if(!shown.length){host.innerHTML=`<p class="student-empty">No classes found for ${esc(target)}. Check the reviewed timetable rows: each class must start with its weekday, for example Monday,09:00,10:00,Data Structures,AB1-204,Faculty Name. Or choose All days.</p>`;return}const groups={};shown.forEach(c=>(groups[c.day] ||= []).push(c));const days=filter==='All'?[...DAYS,'Unspecified day'].filter(d=>groups[d]):[target];host.innerHTML=days.filter(d=>groups[d]).map(d=>{let lectureNo=0,lastStart=null;return `<div class="timetable-day"><h4>${esc(d)}</h4>${groups[d].slice().sort((a,b)=>mins(a.start)-mins(b.start)).map(c=>{const br=/^(break|lunch|recess|free period)$/i.test(String(c.subject).trim());if(br){lastStart=null;return `<article class="class-entry timetable-break"><div class="class-time">BREAK</div><div class="class-main"><strong>Break</strong></div></article>`}if(c.start!==lastStart){lectureNo++;lastStart=c.start}const suffix=lectureNo===1?'st':lectureNo===2?'nd':lectureNo===3?'rd':'th';return `<article class="class-entry"><div class="class-time">${lectureNo}${suffix} lecture</div><div class="class-main"><strong>${esc(c.subject)}</strong><span>${esc(c.room||'Room not detected — review this row')}${c.faculty?' · '+esc(c.faculty):''}</span></div></article>`}).join('')}</div>`}).join('')}
function calc(a,c){if(c<=0)return{pct:null,miss:0,recover:0};let p=a/c;if(p>=TARGET-1e-9)return{pct:p,miss:Math.max(0,Math.floor(a/TARGET-c+1e-9)),recover:0};return{pct:p,miss:0,recover:Math.max(0,Math.ceil((TARGET*c-a)/(1-TARGET)-1e-9))}}
function renderAtt(){let body=$('attendance-rows'),sum=$('attendance-summary');if(!attendance.length){body.innerHTML='<tr><td colspan="5">No attendance data yet.</td></tr>';sum.innerHTML='<p class="student-empty">Upload attendance to calculate your percentages and absence allowance.</p>';return}let ta=0,tc=0;body.innerHTML=attendance.map(s=>{ta+=s.attended;tc+=s.conducted;let x=calc(s.attended,s.conducted),p=x.pct==null?'—':(x.pct*100).toFixed(1)+'%',allow=x.pct==null?'—':x.pct>=TARGET?`${x.miss} class${x.miss===1?'':'es'}`:`Attend ${x.recover} in a row`;return`<tr><td>${esc(s.subject)}</td><td>${s.attended}</td><td>${s.conducted}</td><td><span class="${x.pct>=TARGET?'attendance-good':'attendance-low'}">${p}</span></td><td>${allow}</td></tr>`}).join('');let x=calc(ta,tc),p=x.pct==null?'—':(x.pct*100).toFixed(1)+'%';sum.innerHTML=`<div class="attendance-stat"><span>Overall attendance</span><strong class="${x.pct>=TARGET?'attendance-good':'attendance-low'}">${p}</strong></div><div class="attendance-stat"><span>Classes attended</span><strong>${ta} / ${tc}</strong></div><div class="attendance-stat"><span>${x.pct>=TARGET?'Can miss (overall)':'To recover to 75%'}</span><strong>${x.pct==null?'—':x.pct>=TARGET?x.miss+' classes':x.recover+' classes in a row'}</strong></div>`}
$('timetable-day-filter')?.addEventListener('change',renderTT);
function parseOCRTimetable(text){
  const lines=text.split(/\r?\n/).map(x=>x.replace(/\s+/g,' ').trim()).filter(Boolean);
  const out=[]; let activeDay=''; let id=0;
  const dayRe=/\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Mon|Tue|Tues|Wed|Thu|Thur|Thurs|Fri|Sat|Sun)\b/i;
  const timeRe=/\b(\d{1,2}(?::|\.)(?:\d{2})\s*(?:am|pm)?|\d{1,2}\s*(?:am|pm))\b/ig;
  const normTime=x=>{let s=x.toLowerCase().replace('.',':').replace(/\s+/g,'');let m=s.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)?$/);if(!m)return '';let h=+m[1],mi=m[2]||'00';if(m[3]==='pm'&&h<12)h+=12;if(m[3]==='am'&&h===12)h=0;return String(h).padStart(2,'0')+':'+mi};
  for(const line of lines){
    const dm=line.match(dayRe); if(dm) activeDay=canonicalDay(dm[1]);
    const matches=[...line.matchAll(timeRe)];
    if(!matches.length) continue;
    const times=matches.map(m=>normTime(m[0])).filter(Boolean); if(!times.length)continue;
    let day=dm?canonicalDay(dm[1]):activeDay;
    const roomMatch=line.match(/\b([A-Z]{1,5}\s*[- ]?\d{2,5})\b/i);
    let cleaned=line.replace(dayRe,' ').replace(timeRe,' ').replace(/\b(mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)\b/ig,' ').replace(/\s+/g,' ').trim();
    if(roomMatch) cleaned=cleaned.replace(roomMatch[0],' ').replace(/\s+/g,' ').trim();
    cleaned=cleaned.replace(/[|:;,\-]+$/,'').trim();
    if(!cleaned || /^(timetable|subject|course|room|time|day|section|semester|session)$/i.test(cleaned))continue;
    let subject=cleaned; if(/\bbreak\b|\blunch\b|\brecess\b/i.test(cleaned))subject='BREAK';
    out.push({id:id++,day:day||'Unspecified day',start:times[0],end:times[1]||'',subject,room:roomMatch?roomMatch[1].replace(/\s+/g,'').toUpperCase():'',faculty:''});
  }
  // Fallback for common university grid timetables: use OCR word coordinates to
  // associate day labels with horizontal bands and time-header labels with columns.
  return out;
}
function parseOCRGrid(data){
  const words=(data?.words||[]).filter(w=>String(w.text||'').trim()&&w.bbox);
  if(words.length<12)return [];
  const center=w=>({x:(w.bbox.x0+w.bbox.x1)/2,y:(w.bbox.y0+w.bbox.y1)/2});
  const norm=s=>String(s||'').toLowerCase().replace(/[^a-z]/g,'');
  const dayNames={monday:'Monday',tuesday:'Tuesday',wednesday:'Wednesday',thursday:'Thursday',friday:'Friday',saturday:'Saturday',sunday:'Sunday',mon:'Monday',tue:'Tuesday',tues:'Tuesday',wed:'Wednesday',thu:'Thursday',thur:'Thursday',thurs:'Thursday',fri:'Friday',sat:'Saturday',sun:'Sunday'};
  const dayWords=words.filter(w=>dayNames[norm(w.text)]);
  if(dayWords.length<2)return [];
  const anchors=dayWords.map(w=>({day:dayNames[norm(w.text)],...center(w)})).sort((a,b)=>a.y-b.y);
  const unique=[]; for(const a of anchors){if(!unique.some(u=>u.day===a.day&&Math.abs(u.y-a.y)<12))unique.push(a)}
  if(unique.length<2)return [];
  const firstY=Math.min(...unique.map(a=>a.y));
  const headerWords=words.filter(w=>center(w).y<firstY-8&&/\d/.test(w.text));
  // Cluster time-header words by horizontal proximity; one cluster per period.
  const xs=headerWords.map(w=>({x:center(w).x,y:center(w).y,text:w.text})).sort((a,b)=>a.x-b.x);
  const clusters=[];for(const w of xs){let c=clusters[clusters.length-1];if(!c||w.x-c.lastX>28){clusters.push({items:[w],lastX:w.x})}else{c.items.push(w);c.lastX=w.x}}
  let cols=clusters.map(c=>({x:c.items.reduce((s,w)=>s+w.x,0)/c.items.length,label:c.items.map(w=>w.text).join(' ')})).filter(c=>/\d/.test(c.label));
  if(cols.length<3)return [];
  const periodRe=/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/ig;
  const to24=s=>{let m=s.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);if(!m)return '';let h=+m[1],mi=m[2]||'00',ap=(m[3]||'').toLowerCase();if(ap==='pm'&&h<12)h+=12;if(ap==='am'&&h===12)h=0;return String(h).padStart(2,'0')+':'+mi};
  cols=cols.map(c=>{const ms=[...c.label.matchAll(periodRe)];return {...c,start:ms[0]?to24(ms[0][0]):'',end:ms[1]?to24(ms[1][0]):''}}).filter(c=>c.start);
  if(cols.length<3)return [];
  const output=[];let id=0;
  for(let di=0;di<unique.length;di++){
    const a=unique[di],prev=di?((unique[di-1].y+a.y)/2):-Infinity,next=di<unique.length-1?((a.y+unique[di+1].y)/2):Infinity;
    const rowWords=words.filter(w=>{const p=center(w);return p.y>=prev&&p.y<next&&!dayNames[norm(w.text)]&&p.y>firstY+8});
    const byCol=new Map();for(const w of rowWords){const p=center(w);let nearest=cols.reduce((best,c)=>Math.abs(c.x-p.x)<Math.abs(best.x-p.x)?c:best,cols[0]);if(!byCol.has(nearest))byCol.set(nearest,[]);byCol.get(nearest).push({...w,...p})}
    for(const c of cols){const cell=(byCol.get(c)||[]).sort((u,v)=>u.y-v.y||u.x-v.x).map(w=>w.text).join(' ').replace(/\s+/g,' ').trim();if(!cell||!/[A-Za-z]{2,}/.test(cell)||/^(day time|09 am|10 am|11 am|12 pm|01 pm|02 pm|03 pm|04 pm|05 pm)$/i.test(cell))continue;
      const room=cell.match(/\b([A-Z]{1,5}\s*[- ]?\d{2,5})\b/i);let subject=cell.replace(room?.[0]||'',' ').replace(/\b(Mr|Mrs|Ms|Dr)\.?\s+[A-Z][A-Za-z.]+(?:\s+[A-Z][A-Za-z.]+){0,2}/g,' ').replace(/\s+/g,' ').trim();
      subject=subject.replace(/\b(CSC|MAS|RHL|BATCH)[A-Z0-9-]*\b/gi,' ').replace(/\s+/g,' ').trim();if(!subject)subject=cell.split(/\s+/).slice(0,3).join(' ');
      if(subject.length<2)continue;
      output.push({id:id++,day:a.day,start:c.start,end:c.end,subject,room:room?room[1].replace(/\s+/g,'').toUpperCase():'',faculty:''});
    }
  }
  return output;
}
$('timetable-file').addEventListener('change',async e=>{let f=e.target.files?.[0];if(!f)return;try{let d=[],name=f.name.toLowerCase();if(/\.(png|jpe?g|webp)$/.test(name)||f.type.startsWith('image/')){if(!window.Tesseract)throw Error('OCR engine could not load. Check your internet connection and try again, or use CSV/ICS.');status('timetable-upload-status','Reading timetable image with OCR… please wait.');const result=await Tesseract.recognize(f,'eng',{logger:m=>{if(m.status==='recognizing text')status('timetable-upload-status',`Reading image… ${Math.round((m.progress||0)*100)}%`)}});const raw=result.data.text||'';d=parseOCRGrid(result.data);if(!d.length)d=parseOCRTimetable(raw);if(!d.length)throw Error('Text was detected, but timetable rows could not be identified reliably. Try a clearer, straight-on image or import CSV.');const credible=d.filter(x=>x.day!=='Unspecified day'&&x.start&&/[A-Za-z]{2,}/.test(x.subject));if(credible.length<2)throw Error('The image was uploaded, but I could not reliably read its timetable grid. Please upload a sharper, tightly cropped timetable image; the portal has not saved these uncertain results.');const uncertain=d.filter(x=>x.day==='Unspecified day'||!x.start||!x.room);timetable=d;localStorage.setItem('campusiq-timetable-v1',JSON.stringify(d));const dayFilter=$('timetable-day-filter');if(dayFilter)dayFilter.value='All';renderTT();status('timetable-upload-status',`OCR extracted ${d.length} possible entries from ${f.name}. ${uncertain.length} need review (missing weekday, time or room). Showing all extracted entries below, including entries with an unspecified weekday. Please review them before relying on them.`)}else{let t=await f.text();d=name.endsWith('.ics')?parseICS(t):parseTT(t);if(!d.length)throw Error('No classes found. Use CSV headers day,start,end,subject,room,faculty or an ICS file.');timetable=d;localStorage.setItem('campusiq-timetable-v1',JSON.stringify(d));renderTT();status('timetable-upload-status',`Loaded ${d.length} classes from ${f.name}. Saved in this browser.`)}}catch(err){status('timetable-upload-status',err.message||'Could not read this timetable image.',true)}});
$('attendance-file')?.addEventListener('change',async e=>{let f=e.target.files?.[0];if(!f)return;try{let d=csv(await f.text()).map(r=>({subject:val(r,['subject','course','course_name','class']),attended:Number(val(r,['attended','classes_attended','present'])),conducted:Number(val(r,['conducted','total','classes_conducted','total_classes','held']))})).filter(r=>r.subject&&Number.isFinite(r.attended)&&Number.isFinite(r.conducted)&&r.conducted>0&&r.attended>=0&&r.attended<=r.conducted);if(!d.length)throw Error('No valid rows. Use columns subject,attended,conducted.');attendance=d;localStorage.setItem('campusiq-attendance-v1',JSON.stringify(d));renderAtt();status('attendance-upload-status',`Loaded attendance for ${d.length} subjects. Saved in this browser.`)}catch(err){status('attendance-upload-status',err.message,true)}e.target.value=''});
$('clear-timetable').addEventListener('click',()=>{timetable=[];localStorage.removeItem('campusiq-timetable-v1');renderTT();status('timetable-upload-status','Timetable cleared.')});
$('clear-attendance')?.addEventListener('click',()=>{attendance=[];localStorage.removeItem('campusiq-attendance-v1');renderAtt();status('attendance-upload-status','Attendance cleared.')});
function dl(name,text){let u=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=u;a.download=name;a.click();URL.revokeObjectURL(u)}
$('download-timetable-template').addEventListener('click',()=>dl('campusiq-timetable-template.csv','day,start,end,subject,room,faculty\nMonday,09:00,10:00,Data Structures,AB1-204,Faculty Name\nTuesday,10:00,11:00,DBMS,AB2-101,Faculty Name\n'));
$('download-attendance-template')?.addEventListener('click',()=>dl('campusiq-attendance-template.csv','subject,attended,conducted\nData Structures,18,22\nDBMS,16,20\n'));
try{timetable=JSON.parse(localStorage.getItem('campusiq-timetable-v1')||'[]')}catch{}try{attendance=JSON.parse(localStorage.getItem('campusiq-attendance-v1')||'[]')}catch{}renderTT();renderAtt();
})();